import { AssessmentDoc, COScores, AttainmentResult, TestType, Student, QuestionConfig, COLabel } from "@/types";
import { calculateCOAttainment, calculateCOMaxMarks } from "./calculations";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const THRESHOLD = 60; // Min student score % to count as "passed"

// ── Types ──────────────────────────────────────────────────────

export interface COAttainmentStats {
    attended: number;
    scoring60: number;
    pct: number | null;   // null if CO has no questions mapped
    level: number | "N/A";
}

export interface ComputedAssessment {
    coMax: Partial<Record<COLabel, number>>;
    studentCO: Record<COLabel, number>[]; // per-student raw scores
    attainment: Record<COLabel, COAttainmentStats>;
}

// ── Level Logic ────────────────────────────────────────────────

/**
 * Level thresholds (per spec):
 *   > 70  → Level 3
 *   ≥ 60  → Level 2
 *   ≥ 50  → Level 1
 *   else  → Level 0
 * (70% exactly → Level 2, matching Excel screenshot behaviour)
 */
export function getAttainmentLevel(pct: number): number {
    if (pct > 70) return 3;
    if (pct >= 60) return 2;
    if (pct >= 50) return 1;
    return 0;
}

// ── Per-Assessment CO Computation ─────────────────────────────

/**
 * Compute all CO attainment statistics for a set of students.
 * Returns ComputedAssessment with per-student scores, coMax, and aggregated stats.
 */
export function computeAssessmentCO(
    students: Student[],
    questionConfig: QuestionConfig
): ComputedAssessment {
    const coMax = calculateCOMaxMarks(questionConfig) as Record<COLabel, number>;

    const studentCO: Record<COLabel, number>[] = [];
    const totals: Record<COLabel, number[]> = {
        co1: [], co2: [], co3: [], co4: [], co5: [], co6: [],
    };

    for (const student of students) {
        const result = calculateCOAttainment(student.marks, questionConfig);
        const row: Record<COLabel, number> = {
            co1: result.percentage.co1,
            co2: result.percentage.co2,
            co3: result.percentage.co3,
            co4: result.percentage.co4,
            co5: result.percentage.co5,
            co6: result.percentage.co6,
        };
        studentCO.push(row);
        CO_KEYS.forEach(co => totals[co].push(row[co]));
    }

    const attainment: Record<COLabel, COAttainmentStats> = {} as any;

    for (const co of CO_KEYS) {
        const maxForCO = coMax[co] ?? 0;
        if (maxForCO === 0) {
            // CO has no mapped questions
            attainment[co] = { attended: 0, scoring60: 0, pct: null, level: "N/A" };
        } else {
            const vals = totals[co];
            const attended = vals.length;
            const scoring60 = vals.filter(v => v >= THRESHOLD).length;
            const pct = attended > 0 ? parseFloat(((scoring60 / attended) * 100).toFixed(2)) : 0;
            attainment[co] = { attended, scoring60, pct, level: getAttainmentLevel(pct) };
        }
    }

    return { coMax, studentCO, attainment };
}

// ── Average CO% across docs ───────────────────────────────────

function avgCoPercent(docs: AssessmentDoc[]): Record<COLabel, number> {
    const totals: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const counts: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    for (const doc of docs) {
        const att = doc.computed?.attainment;
        if (!att) continue;
        for (const co of CO_KEYS) {
            const pct = att[co]?.pct;
            if (pct !== null && pct !== undefined) {
                totals[co] += pct;
                counts[co]++;
            }
        }
    }

    const avg: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    for (const co of CO_KEYS) {
        avg[co] = counts[co] > 0
            ? parseFloat((totals[co] / counts[co]).toFixed(4))
            : 0;
    }
    return avg;
}

// ── Final Attainment Chain ─────────────────────────────────────

export function computeAttainment(
    docs: AssessmentDoc[],
    indirectAttainment: COScores
): {
    internalAttainment: COScores;
    directAttainment: COScores;
    finalAttainment: COScores;
    levels: Record<COLabel, number | "N/A">;
    missing: string[];
} {
    const byType: Record<TestType, AssessmentDoc | undefined> = {
        "Internal 1": undefined,
        "Internal 2": undefined,
        "Semester": undefined,
        "Unit Test": undefined,
        "Assignment": undefined,
    };
    for (const doc of docs) byType[doc.testType] = doc;

    const missing: string[] = [];
    const internalDocs = [byType["Internal 1"], byType["Internal 2"]].filter(Boolean) as AssessmentDoc[];
    if (internalDocs.length === 0) missing.push("Internal 1 or Internal 2");
    if (!byType["Unit Test"]) missing.push("Unit Test");
    if (!byType["Assignment"]) missing.push("Assignment");
    if (!byType["Semester"]) missing.push("Semester");

    const coIA = avgCoPercent(internalDocs);
    const coUT = byType["Unit Test"] ? avgCoPercent([byType["Unit Test"]]) : { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const coAS = byType["Assignment"] ? avgCoPercent([byType["Assignment"]]) : { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const coSEM = byType["Semester"] ? avgCoPercent([byType["Semester"]]) : { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    const internal: COScores = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const direct: COScores = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const final_: COScores = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const levels: Record<COLabel, number | "N/A"> = { co1: "N/A", co2: "N/A", co3: "N/A", co4: "N/A", co5: "N/A", co6: "N/A" };

    // Determine which COs are N/A across ALL uploaded docs
    const allDocs = Object.values(byType).filter(Boolean) as AssessmentDoc[];
    const coIsNA: Record<COLabel, boolean> = { co1: false, co2: false, co3: false, co4: false, co5: false, co6: false };
    for (const co of CO_KEYS) {
        const allNA = allDocs.length > 0 && allDocs.every(d => d.computed?.attainment?.[co]?.pct === null);
        coIsNA[co] = allNA;
    }

    for (const co of CO_KEYS) {
        if (coIsNA[co]) {
            // No questions mapped to this CO — skip entirely
            levels[co] = "N/A";
            continue;
        }

        internal[co] = parseFloat((coIA[co] * 0.60 + coUT[co] * 0.15 + coAS[co] * 0.25).toFixed(4));
        direct[co] = parseFloat((coSEM[co] * 0.60 + internal[co] * 0.40).toFixed(4));
        const ind = indirectAttainment[co] ?? 0;
        final_[co] = parseFloat((direct[co] * 0.90 + ind * 0.10).toFixed(4));

        // Final % for level: treat final_ as a score out of 100 for level classification
        // The level formula uses the raw pct already, so we reuse on the direct% which is already 0-100 scale
        levels[co] = getAttainmentLevel(final_[co]);
    }

    return {
        internalAttainment: internal,
        directAttainment: direct,
        finalAttainment: final_,
        levels,
        missing,
    };
}
