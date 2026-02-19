import { AssessmentDoc, COScores, AttainmentResult, TestType } from "@/types";

const THRESHOLD = 60; // % score threshold for a student to "pass" CO

/** Determine attainment level (0-3) from a list of student percentages */
export function getAttainmentLevel(studentPercentages: number[]): number {
    const n = studentPercentages.length;
    if (n === 0) return 0;
    const above = studentPercentages.filter((p) => p >= THRESHOLD).length;
    const pct = (above / n) * 100;
    if (pct >= 70) return 3;
    if (pct >= 60) return 2;
    if (pct >= 50) return 1;
    return 0;
}

const CO_KEYS = ["co1", "co2", "co3", "co4", "co5", "co6"] as const;

function zeroScores(): COScores {
    return { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
}

/**
 * Given all active assessments for a (batch, subject),
 * compute DirectAttainment and FinalAttainment.
 *
 * Formula:
 *   Internal = CO×0.60 + UnitTest×0.15 + Assignment×0.25
 *   Direct   = Semester×0.60 + Internal×0.40
 *   Final    = Direct×0.90 + Indirect×0.10
 */
export function computeAttainment(
    docs: AssessmentDoc[],
    indirectAttainment: COScores
): {
    internalAttainment: COScores;
    directAttainment: COScores;
    finalAttainment: COScores;
    levels: COScores;
    missing: string[];
} {
    const byType: Record<TestType, AssessmentDoc | undefined> = {
        "Internal 1": undefined,
        "Internal 2": undefined,
        "Semester": undefined,
        "Unit Test": undefined,
        "Assignment": undefined,
    };

    for (const doc of docs) {
        byType[doc.testType] = doc;
    }

    const missing: string[] = [];

    // We use average of Internal 1 + Internal 2 for the CO component
    // Collect all Internal docs
    const internalDocs = [byType["Internal 1"], byType["Internal 2"]].filter(Boolean) as AssessmentDoc[];
    const unitTestDoc = byType["Unit Test"];
    const assignmentDoc = byType["Assignment"];
    const semesterDoc = byType["Semester"];

    if (internalDocs.length === 0) missing.push("Internal 1 or Internal 2");
    if (!unitTestDoc) missing.push("Unit Test");
    if (!assignmentDoc) missing.push("Assignment");
    if (!semesterDoc) missing.push("Semester");

    // Helper: average CO% across multiple docs
    function avgScores(docList: AssessmentDoc[]): COScores {
        const total = zeroScores();
        if (docList.length === 0) return total;
        for (const d of docList) {
            for (const co of CO_KEYS) {
                total[co] += d.coPercentage[co] ?? 0;
            }
        }
        for (const co of CO_KEYS) {
            total[co] = parseFloat((total[co] / docList.length).toFixed(4));
        }
        return total;
    }

    const coIA = avgScores(internalDocs);             // CO%  from Internal exams
    const coUT = unitTestDoc ? { ...unitTestDoc.coPercentage } : zeroScores();
    const coAS = assignmentDoc ? { ...assignmentDoc.coPercentage } : zeroScores();
    const coSEM = semesterDoc ? { ...semesterDoc.coPercentage } : zeroScores();

    const internal = zeroScores();
    const direct = zeroScores();
    const final_ = zeroScores();
    const levels = zeroScores();

    for (const co of CO_KEYS) {
        // Internal = CO(60%) + UnitTest(15%) + Assignment(25%)
        internal[co] = parseFloat((coIA[co] * 0.60 + coUT[co] * 0.15 + coAS[co] * 0.25).toFixed(4));

        // Direct = Semester(60%) + Internal(40%)
        direct[co] = parseFloat((coSEM[co] * 0.60 + internal[co] * 0.40).toFixed(4));

        // Final = Direct(90%) + Indirect(10%)
        const ind = indirectAttainment[co] ?? 0;
        final_[co] = parseFloat((direct[co] * 0.90 + ind * 0.10).toFixed(4));

        // Level from final
        if (final_[co] >= 2.67) levels[co] = 3;
        else if (final_[co] >= 1.67) levels[co] = 2;
        else if (final_[co] >= 0.67) levels[co] = 1;
        else levels[co] = 0;
    }

    return {
        internalAttainment: internal,
        directAttainment: direct,
        finalAttainment: final_,
        levels,
        missing,
    };
}
