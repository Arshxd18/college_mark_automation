import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    writeBatch,
    serverTimestamp,
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
} from "@/types";
import { calculateCOAttainment } from "./calculations";
import { getAttainmentLevel } from "./attainmentEngine";

// ── Helpers ────────────────────────────────────────────────────

const assessmentsCol = collection(db, "assessments");
const attainmentResultsCol = collection(db, "attainmentResults");

// ── Save Assessment ─────────────────────────────────────────────

/**
 * Saves an assessment to Firestore.
 * Deactivates previous docs with the same (batchYear + subjectId + testType).
 */
export async function saveAssessment(
    examConfig: ExamConfig,
    questionConfig: QuestionConfig,
    students: Student[]
): Promise<string> {
    const { batchYear, subjectId, testType } = examConfig;

    // 1. Compute CO attainment for this dataset
    const coScores: COScores = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const coPercentages: COScores = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    if (students.length > 0) {
        const cos = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;
        // Compute per-student percentages
        const studentPercentages: Record<string, number[]> = {
            co1: [], co2: [], co3: [], co4: [], co5: [], co6: [],
        };

        for (const student of students) {
            const result = calculateCOAttainment(student.marks, questionConfig);
            for (const co of cos) {
                studentPercentages[co].push(result.percentage[co]);
            }
        }

        // Average percentage per CO (used for direct attainment calculation)
        for (const co of cos) {
            const vals = studentPercentages[co].filter((v) => v > 0);
            if (vals.length > 0) {
                coPercentages[co] = parseFloat(
                    (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
                );
            }
            coScores[co] = getAttainmentLevel(studentPercentages[co]);
        }
    }

    // 2. Deactivate old docs with same key
    const batchQuery = query(
        assessmentsCol,
        where("batchYear", "==", batchYear),
        where("subjectId", "==", subjectId),
        where("testType", "==", testType),
        where("isActive", "==", true)
    );
    const oldDocs = await getDocs(batchQuery);
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
        coAttainment: coScores,
        coPercentage: coPercentages,
        isActive: true,
        savedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, payload);
    return newDocRef.id;
}

// ── Get Assessments ────────────────────────────────────────────

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

/** Get all unique batch years */
export async function getAllBatchYears(): Promise<string[]> {
    const snap = await getDocs(assessmentsCol);
    const years = new Set<string>();
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.batchYear) years.add(data.batchYear);
    });
    return Array.from(years).sort();
}

/** Get all unique subjects for a batch */
export async function getSubjectsForBatch(batchYear: string): Promise<string[]> {
    const q = query(assessmentsCol, where("batchYear", "==", batchYear), where("isActive", "==", true));
    const snap = await getDocs(q);
    const subjects = new Set<string>();
    snap.docs.forEach((d) => {
        const data = d.data();
        if (data.subjectId) subjects.add(data.subjectId);
    });
    return Array.from(subjects).sort();
}

// ── Attainment Results ─────────────────────────────────────────

const resultId = (batchYear: string, subjectId: string) =>
    `${batchYear}_${subjectId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

export async function saveAttainmentResult(result: AttainmentResult): Promise<void> {
    const id = resultId(result.batchYear, result.subjectId);
    await setDoc(doc(attainmentResultsCol, id), result);
}

export async function getAttainmentResult(
    batchYear: string,
    subjectId: string
): Promise<AttainmentResult | null> {
    const id = resultId(batchYear, subjectId);
    const snap = await getDoc(doc(attainmentResultsCol, id));
    if (snap.exists()) return snap.data() as AttainmentResult;
    return null;
}
