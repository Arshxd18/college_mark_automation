import { AssessmentDoc, COScores, AttainmentResult, TestType, Student, QuestionConfig, COLabel } from "@/types";
import { calculateCOAttainment, calculateCOMaxMarks } from "./calculations";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];
const THRESHOLD = 60; // Min student CO% to count as "passed"

// ── Types ──────────────────────────────────────────────────────

export interface COAttainmentStats {
    attended: number;
    scoring60: number;
    pct: number | null;   // % of students scoring ≥60%
    level: number | "N/A";
}

export interface ComputedAssessment {
    coMax: Partial<Record<COLabel, number>>;
    studentCO: Record<COLabel, number>[]; // per-student CO percentage
    attainment: Record<COLabel, COAttainmentStats>;
}

// ── Level Thresholds ────────────────────────────────────────────

/**
 * Standard threshold for Unit Test, Assignment, Semester:
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

/**
 * CO Average (Internal Assessment) threshold: matches Excel formula
 *   =IF(pct>=80, 3, IF(pct>=70, 2, IF(pct>=60, 1, 0)))
 *   ≥ 80% → Level 3
 *   ≥ 70% → Level 2
 *   ≥ 60% → Level 1
 *   else  → Level 0
 */
export function getCOAvgAttainmentLevel(pct: number): number {
    if (pct >= 80) return 3;
    if (pct >= 70) return 2;
    if (pct >= 60) return 1;
    return 0;
}

// ── Per-Assessment CO Computation ─────────────────────────────
/**
 * Compute all CO attainment statistics for a set of students.
 * Returns per-student CO %, CO max marks, and aggregated attainment stats
 * including level (0-3) for each CO.
 *
 * Used for: Unit Test, Assignment, Semester, Internal 1, Internal 2.
 * Level thresholds: >70→L3, ≥60→L2, ≥50→L1, else L0.
 */
export function computeAssessmentCO(
    students: Student[],
    questionConfig: QuestionConfig,
    testType?: TestType
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
            const pct = attended > 0 ? parseFloat(((scoring60 / attended) * 100).toFixed(2)) : 0;
            const level = testType === "CO Average" ? getCOAvgAttainmentLevel(pct) : getAttainmentLevel(pct);
            attainment[co] = { attended, scoring60, pct, level };
        }
    }

    return { coMax, studentCO, attainment };
}

// ── CO Average (IA) ────────────────────────────────────────────
/**
 * Computes the CO Average (Internal Assessment) attainment level per CO
 * by merging Internal 1 and Internal 2 student CO percentages.
 *
 * Excel formula per student:
 *   COavg = IF(AND(Int1>0, Int2>0), (Int1+Int2)/2, Int1+Int2)
 *   (if both internals have a value, average them; if only one, use that value)
 *
 * Then: % students with COavg ≥ 60%
 * Level: =IF(pct>=80,3, IF(pct>=70,2, IF(pct>=60,1, 0)))
 */
function computeCoAvgLevel(
    int1Doc: AssessmentDoc | undefined,
    int2Doc: AssessmentDoc | undefined
): Record<COLabel, number> {
    const zero = (): Record<COLabel, number> => ({ co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 });

    if (!int1Doc && !int2Doc) return zero();

    // Build per-student CO% maps indexed by student identifier (regNo or index)
    // We need to merge student lists from both internals.
    // Strategy: match by student index in same classroom. If only one doc, use it directly.

    const getStudentCO = (doc: AssessmentDoc): Record<COLabel, number>[] => {
        return doc.computed?.studentCO ?? [];
    };

    const int1CO = int1Doc ? getStudentCO(int1Doc) : [];
    const int2CO = int2Doc ? getStudentCO(int2Doc) : [];

    // Build merged list: zip by position if both exist, otherwise use whichever is available
    const studentCount = Math.max(int1CO.length, int2CO.length);
    const avgRows: Record<COLabel, number>[] = [];

    for (let i = 0; i < studentCount; i++) {
        const row1 = int1CO[i] ?? null;
        const row2 = int2CO[i] ?? null;
        const merged: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

        for (const co of CO_KEYS) {
            const v1 = row1 ? (row1[co] ?? 0) : 0;
            const v2 = row2 ? (row2[co] ?? 0) : 0;
            // Excel: IF(AND(v1>0, v2>0), (v1+v2)/2, v1+v2)
            if (v1 > 0 && v2 > 0) {
                merged[co] = (v1 + v2) / 2;
            } else {
                merged[co] = v1 + v2; // If one is 0, use the other
            }
        }
        avgRows.push(merged);
    }

    // Now compute attainment level per CO
    const result: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    // Determine which COs are active (have mapped questions in either internal)
    const checkNA_int1 = int1Doc?.computed?.attainment;
    const checkNA_int2 = int2Doc?.computed?.attainment;

    for (const co of CO_KEYS) {
        const naIn1 = !checkNA_int1 || checkNA_int1[co]?.level === "N/A";
        const naIn2 = !checkNA_int2 || checkNA_int2[co]?.level === "N/A";

        if (naIn1 && naIn2) {
            // CO not mapped in either internal → skip (leave 0, mark N/A later in caller)
            result[co] = 0;
            continue;
        }

        const attended = avgRows.length;
        const scoring60 = avgRows.filter(r => r[co] >= THRESHOLD).length;
        const pct = attended > 0 ? parseFloat(((scoring60 / attended) * 100).toFixed(2)) : 0;
        result[co] = getCOAvgAttainmentLevel(pct);
    }

    return result;
}

// ── Single-doc Level per CO ────────────────────────────────────
/**
 * Returns the attainment level (0–3) per CO for a single assessment document.
 * Returns 0 for N/A COs.
 */
function docCoLevel(doc: AssessmentDoc | undefined): Record<COLabel, number> {
    const result: Record<COLabel, number> = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    if (!doc?.computed?.attainment) return result;
    for (const co of CO_KEYS) {
        const lvl = doc.computed.attainment[co]?.level;
        result[co] = (lvl !== null && lvl !== undefined && lvl !== "N/A") ? (lvl as number) : 0;
    }
    return result;
}

// ── Final Attainment Chain ─────────────────────────────────────
/**
 * Computes the full attainment chain (CO Average → Internal → Direct → Final).
 *
 * Formulas (all values are LEVELS on 0–3 scale):
 *   CO Average = IF(AND(Int1>0,Int2>0),(Int1+Int2)/2,Int1+Int2) per student,
 *                then % students ≥60%, then >=80→L3,>=70→L2,>=60→L1
 *   Internal   = CO_Avg_Level×0.60 + UT_Level×0.15 + Assign_Level×0.25
 *   Direct     = SEE_Level×0.60 + Internal×0.40
 *   Final      = Direct×0.90 + Indirect×0.10
 */
export function computeAttainment(
    docs: AssessmentDoc[],
    indirectAttainment: COScores
): {
    coAttainmentAvg: COScores;       // CO Average level per CO (IA)
    unitTestLevel: COScores;          // Unit Test level per CO
    assignmentLevel: COScores;        // Assignment level per CO
    semesterLevel: COScores;          // Semester level per CO
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
        "CO Average": undefined,
    };
    for (const doc of docs) byType[doc.testType] = doc;

    const missing: string[] = [];
    if (!byType["Internal 1"] && !byType["Internal 2"] && !byType["CO Average"]) missing.push("Internal Assessments / CO Average");
    if (!byType["Unit Test"]) missing.push("Unit Test");
    if (!byType["Assignment"]) missing.push("Assignment");
    if (!byType["Semester"]) missing.push("Semester");

    // ── Compute per-assessment LEVEL (0–3) per CO
    // CO Average: uses uploaded CO Average template, OR merges Int1 + Int2 student-level and uses >=80→L3 threshold
    let coIA = zero() as COScores;
    if (byType["CO Average"]) {
        coIA = docCoLevel(byType["CO Average"]) as COScores;
    } else {
        coIA = computeCoAvgLevel(byType["Internal 1"], byType["Internal 2"]) as COScores;
    }
    // UT, Assignment, Semester: use their own pre-computed level from computeAssessmentCO
    const coUT = docCoLevel(byType["Unit Test"]);
    const coAS = docCoLevel(byType["Assignment"]);
    const coSEM = docCoLevel(byType["Semester"]);

    const internal: COScores = zero() as COScores;
    const direct: COScores = zero() as COScores;
    const final_: COScores = zero() as COScores;
    const levels: Record<COLabel, number | "N/A"> = {
        co1: "N/A", co2: "N/A", co3: "N/A", co4: "N/A", co5: "N/A", co6: "N/A",
    };

    // Determine which COs are unmapped in all uploads
    const allDocs = Object.values(byType).filter(Boolean) as AssessmentDoc[];
    for (const co of CO_KEYS) {
        const allNA = allDocs.length > 0 &&
            allDocs.every(d => d.computed?.attainment?.[co]?.level === "N/A");
        if (allNA) {
            levels[co] = "N/A";
            continue;
        }

        // Formula: Level arithmetic (0–3 scale throughout)
        internal[co] = parseFloat((coIA[co] * 0.60 + coUT[co] * 0.15 + coAS[co] * 0.25).toFixed(4));
        direct[co] = parseFloat((coSEM[co] * 0.60 + internal[co] * 0.40).toFixed(4));
        const ind = indirectAttainment[co] ?? 0;
        final_[co] = parseFloat((direct[co] * 0.90 + ind * 0.10).toFixed(4));

        // Convert final (0–3 scale) back to % for level classification
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
