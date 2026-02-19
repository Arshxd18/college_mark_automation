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
    const computed = computeAssessmentCO(students, questionConfig);

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

export async function getAttainmentResult(
    batchYear: string,
    subjectId: string
): Promise<AttainmentResult | null> {
    const id = resultDocId(batchYear, subjectId);
    const snap = await getDoc(doc(attainmentResultsCol, id));
    if (snap.exists()) return snap.data() as AttainmentResult;
    return null;
}
