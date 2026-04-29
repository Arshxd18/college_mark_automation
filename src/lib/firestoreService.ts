import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    writeBatch,
    getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import {
    AssessmentDoc,
    AttainmentResult,
    COScores,
    Student,
    QuestionConfig,
    TestType,
    ExamConfig,
    COLabel,
    COMappingDoc,
    POAttainmentRow,
} from "@/types";
import { computeAssessmentCO } from "./attainmentEngine";

// ── Collections ──────────────────────────────────────────────────────────────

const assessmentsCol = collection(db, "assessments");
const attainmentResultsCol = collection(db, "attainmentResults");

// ── Save Assessment ──────────────────────────────────────────────────────────

/**
 * Saves an assessment to Firestore.
 * - Deactivates previous active doc with same (batchYear + subjectId + testType)
 * - Stores full computed CO stats: coMax, studentCO[], attainment{}
 */
export async function saveAssessment(
    examConfig: ExamConfig,
    questionConfig: QuestionConfig,
    students: Student[]
): Promise<string> {
    const { batchYear, subjectId, testType } = examConfig;

    // 1. Compute rich CO stats
    const computed = computeAssessmentCO(students, questionConfig, testType);

    // 2. Deactivate old docs with same key
    const oldQuery = query(
        assessmentsCol,
        where("batchYear", "==", batchYear),
        where("subjectId", "==", subjectId),
        where("testType", "==", testType),
        where("isActive", "==", true)
    );
    const oldDocs = await getDocs(oldQuery);
    const wb = writeBatch(db);
    oldDocs.forEach((d) => wb.update(d.ref, { isActive: false }));
    await wb.commit();

    // 3. Write new doc
    const newDocRef = doc(assessmentsCol);
    const payload: AssessmentDoc = {
        batchYear,
        subjectId,
        testType,
        examConfig,
        questionConfig,
        students,
        computed,
        isActive: true,
        savedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, payload);
    return newDocRef.id;
}

// ── Query Assessments ─────────────────────────────────────────────────────────

export async function getAssessmentsForBatch(
    batchYear: string,
    subjectId?: string
): Promise<AssessmentDoc[]> {
    const constraints = [
        where("batchYear", "==", batchYear),
        where("isActive", "==", true),
    ];
    if (subjectId) constraints.push(where("subjectId", "==", subjectId));

    const q = query(assessmentsCol, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssessmentDoc));
}

/** Get all unique batch years from active assessments */
export async function getAllBatchYears(): Promise<string[]> {
    const q = query(assessmentsCol, where("isActive", "==", true));
    const snap = await getDocs(q);
    const years = new Set<string>();
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.batchYear) years.add(data.batchYear);
    });
    return Array.from(years).sort();
}

/** Get all unique subject IDs for a batch year */
export async function getSubjectsForBatch(batchYear: string): Promise<string[]> {
    const q = query(
        assessmentsCol,
        where("batchYear", "==", batchYear),
        where("isActive", "==", true)
    );
    const snap = await getDocs(q);
    const subjects = new Set<string>();
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.subjectId) subjects.add(data.subjectId);
    });
    return Array.from(subjects).sort();
}

// ── Attainment Results ────────────────────────────────────────────────────────

const resultDocId = (batchYear: string, subjectId: string) =>
    `${batchYear}_${subjectId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

export async function saveAttainmentResult(result: AttainmentResult): Promise<void> {
    const id = resultDocId(result.batchYear, result.subjectId);
    await setDoc(doc(attainmentResultsCol, id), result);
}

export async function updateCODescriptions(batchYear: string, subjectId: string, coDescriptions: Record<COLabel, string>): Promise<void> {
    const id = resultDocId(batchYear, subjectId);
    await setDoc(doc(attainmentResultsCol, id), {
        batchYear,
        subjectId,
        coDescriptions,
        lastUpdated: new Date().toISOString()
    }, { merge: true });
}

export async function getAttainmentResult(
    batchYear: string,
    subjectId: string
): Promise<AttainmentResult | null> {
    const id = resultDocId(batchYear, subjectId);
    const snap = await getDoc(doc(attainmentResultsCol, id));
    if (snap.exists()) return snap.data() as AttainmentResult;
    return null;
}

// ── CO–PO–PSO Mapping ──────────────────────────────────────────

const mappingsCol = collection(db, "mappings");

/**
 * Save a CO mapping. Deactivates any previous active mapping for the same
 * batch+subject (keeps full history). New doc gets isActive:true.
 */
export async function saveCOMapping(mappingDoc: COMappingDoc): Promise<string> {
    // Deactivate previous active mappings for this batch+subject
    const oldQuery = query(
        mappingsCol,
        where("batchYear", "==", mappingDoc.batchYear),
        where("subjectId", "==", mappingDoc.subjectId),
        where("isActive", "==", true)
    );
    const oldDocs = await getDocs(oldQuery);
    const batch = writeBatch(db);
    oldDocs.forEach(d => batch.update(d.ref, { isActive: false }));
    await batch.commit();

    // Write new versioned doc
    const newRef = doc(mappingsCol);
    await setDoc(newRef, {
        ...mappingDoc,
        isActive: true,
        savedAt: new Date().toISOString(),
    });
    return newRef.id;
}

/** Get the latest active CO mapping for a batch+subject. */
export async function getCOMapping(
    batchYear: string,
    subjectId: string
): Promise<COMappingDoc | null> {
    const q = query(
        mappingsCol,
        where("batchYear", "==", batchYear),
        where("subjectId", "==", subjectId),
        where("isActive", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as COMappingDoc;
}
