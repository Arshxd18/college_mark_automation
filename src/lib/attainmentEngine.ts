import { AssessmentDoc, COScores, AttainmentResult, TestType, Student, QuestionConfig, COLabel } from "@/types";
import { calculateCOAttainment, calculateCOMaxMarks } from "./calculations";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const THRESHOLD = 60; // Min student CO% to count as "passed"

// ── Types ──────────────────────────────────────────────────────

export interface COAttainmentStats {
    attended: number;
    scoring60: number;
    pct: number | null;   // null if CO has no questions mapped
    level: number | "N/A";
}

export interface ComputedAssessment {
    coMax: Partial<Record<COLabel, number>>;
    studentCO: Record<COLabel, number>[]; // per-student CO percentage
    attainment: Record<COLabel, COAttainmentStats>;
}

// ── Level Thresholds ────────────────────────────────────────────
/**
 * Threshold based on % of students scoring ≥60%:
 *   > 70%  → Level 3
 *   ≥ 60%  → Level 2
 *   ≥ 50%  → Level 1
 *   else   → Level 0
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
 * Returns per-student CO %, CO max marks, and aggregated attainment stats
 * including level (0-3) for each CO.
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
            attainment[co] = { attended: 0, scoring60: 0, pct: null, level: "N/A" };
        } else {
            const vals = totals[co];
            const attended = vals.length;
            const scoring60 = vals.filter(v => v >= THRESHOLD).length;
            // pct = % of students who scored >= 60% for this CO
            const pct = attended > 0 ? parseFloat(((scoring60 / attended) * 100).toFixed(2)) : 0;
            attainment[co] = { attended, scoring60, pct, level: getAttainmentLevel(pct) };
        }
    }

    return { coMax, studentCO, attainment };
}

// ── Average Level per CO across multiple docs ──────────────────
/**
 * Averages the computed LEVEL (0–3) per CO across a set of assessment documents.
 * This matches the Excel formula where each assessment type contributes its level,
 * not its raw percentage.
 */
function avgCoLevel(docs: AssessmentDoc[]): Record<COLabel, number> {
    const totals: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const counts: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    for (const doc of docs) {
        const att = doc.computed?.attainment;
        if (!att) continue;
        for (const co of CO_KEYS) {
            const lvl = att[co]?.level;
            if (lvl !== null && lvl !== undefined && lvl !== "N/A") {
                totals[co] += lvl as number;
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
/**
 * Computes the full attainment chain (Internal → Direct → Final) for a subject.
 *
 * KEY: All intermediate values (coIA, coUT, coAS, coSEM) are LEVELS (0–3),
 * matching the Excel reference sheet exactly:
 *
 *   Internal = IA_Level×0.60 + UT_Level×0.15 + AS_Level×0.25
 *   Direct   = SEE_Level×0.60 + Internal×0.40
 *   Final    = Direct×0.90 + Indirect×0.10
 *
 * Indirect attainment (from course-end survey) is entered by the user as 0–3.
 */
export function computeAttainment(
    docs: AssessmentDoc[],
    indirectAttainment: COScores
): {
    coAttainmentAvg: COScores;      // IA level per CO (avg of Int1 & Int2)
    unitTestLevel: COScores;         // Unit Test level per CO
    assignmentLevel: COScores;       // Assignment level per CO
    semesterLevel: COScores;         // Semester level per CO
    internalAttainment: COScores;
    directAttainment: COScores;
    finalAttainment: COScores;
    levels: Record<COLabel, number | "N/A">;
    missing: string[];
} {
    const zero = (): Record<COLabel, number> => ({ co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 });

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

    // Collect LEVEL per CO from each assessment type
    const coIA = avgCoLevel(internalDocs);
    const coUT = byType["Unit Test"] ? avgCoLevel([byType["Unit Test"]!]) : zero();
    const coAS = byType["Assignment"] ? avgCoLevel([byType["Assignment"]!]) : zero();
    const coSEM = byType["Semester"] ? avgCoLevel([byType["Semester"]!]) : zero();

    const internal: COScores = zero() as COScores;
    const direct: COScores = zero() as COScores;
    const final_: COScores = zero() as COScores;
    const levels: Record<COLabel, number | "N/A"> = {
        co1: "N/A", co2: "N/A", co3: "N/A", co4: "N/A", co5: "N/A", co6: "N/A",
    };

    // Determine which COs have no mapped questions across all uploads
    const allDocs = Object.values(byType).filter(Boolean) as AssessmentDoc[];
    const coIsNA: Record<COLabel, boolean> = {
        co1: false, co2: false, co3: false, co4: false, co5: false, co6: false,
    };
    for (const co of CO_KEYS) {
        coIsNA[co] = allDocs.length > 0 &&
            allDocs.every(d => d.computed?.attainment?.[co]?.level === "N/A");
    }

    for (const co of CO_KEYS) {
        if (coIsNA[co]) {
            levels[co] = "N/A";
            continue;
        }

        // Formula: Level arithmetic (0–3 scale throughout)
        internal[co] = parseFloat((coIA[co] * 0.60 + coUT[co] * 0.15 + coAS[co] * 0.25).toFixed(4));
        direct[co] = parseFloat((coSEM[co] * 0.60 + internal[co] * 0.40).toFixed(4));
        const ind = indirectAttainment[co] ?? 0;
        final_[co] = parseFloat((direct[co] * 0.90 + ind * 0.10).toFixed(4));

        // Convert final score (0-3 scale) back to % for level classification
        const finalPct = (final_[co] / 3) * 100;
        levels[co] = getAttainmentLevel(finalPct);
    }

    return {
        coAttainmentAvg: coIA as COScores,
        unitTestLevel: coUT as COScores,
        assignmentLevel: coAS as COScores,
        semesterLevel: coSEM as COScores,
        internalAttainment: internal,
        directAttainment: direct,
        finalAttainment: final_,
        levels,
        missing,
    };
}
