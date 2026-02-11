import { COResult, Marks, QuestionConfig, COLabel } from "@/types";

export const calculateCOAttainment = (marks: Marks, config: QuestionConfig): COResult => {
    const result: COResult = {
        co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0,
        total: 0,
        percentage: { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 },
    };

    let totalMarks = 0;

    // Calculate CO totals
    Object.keys(marks).forEach((qId) => {
        let mark = marks[qId] || 0;

        // --- Internal Choice Logic (Part B: 11-15) ---
        // If this is an 'a' or 'b' question, check if its pair exists and if we should count this one.
        const match = qId.match(/^q(\d+)([ab])$/i);
        if (match) {
            const num = match[1];
            const part = match[2].toLowerCase();
            const pairPart = part === 'a' ? 'b' : 'a';
            const pairId = `q${num}${pairPart}`;

            const pairMark = marks[pairId] || 0;

            // Rule: Take MAX of the pair.
            // If both present, only add the higher one to the total/CO. 
            // To avoid double counting, we only process if:
            // 1. This mark > pairMark
            // 2. OR (This mark == pairMark AND this is 'a') -> deterministic tie-breaking

            // If this mark is strictly lower, ignore it for calculation.
            if (mark < pairMark) return;
            // If equal, only count 'a' to avoid double counting
            if (mark === pairMark && part === 'b') return;
        }

        const qConfig = config[qId];
        if (qConfig) {
            const coId = qConfig.co;
            if (result[coId] !== undefined) {
                (result[coId] as number) += mark;
            }
        }
        totalMarks += mark;
    });

    result.total = totalMarks;

    // Calculate percentages
    const coMaxMarks = calculateCOMaxMarks(config, marks); // Pass marks to determine which max to count

    (["co1", "co2", "co3", "co4", "co5", "co6"] as const).forEach((co) => {
        const max = coMaxMarks[co];
        if (max > 0) {
            result.percentage[co] = parseFloat(((result[co] / max) * 100).toFixed(2));
        } else {
            result.percentage[co] = 0;
        }
    });

    return result;
};

export const calculateCOMaxMarks = (config: QuestionConfig, marks?: Marks) => {
    const maxMarks = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    Object.keys(config).forEach((qId) => {
        const { co, maxMark } = config[qId];

        // Logic for Max Marks:
        // We need to know WHICH question was attempted to add its max mark to the denominator.
        // If marks are provided, we follow the same "Max Mark attained" logic.
        // If no marks provided (e.g. initial view), we might default to 'a' or validation needed?
        // Standard practice for CO attainment: Denominator attempts usually follow what student attempted?
        // OR is it fixed? Usually for "Internal Choice", the max mark of the *attempted* question counts.

        if (marks) {
            const match = qId.match(/^q(\d+)([ab])$/i);
            if (match) {
                const num = match[1];
                const part = match[2].toLowerCase();
                const pairPart = part === 'a' ? 'b' : 'a';
                const pairId = `q${num}${pairPart}`;

                const myMark = marks[qId] || 0;
                const pairMark = marks[pairId] || 0;

                // Sync with attainment logic: Only count Max Mark if this question was the "chosen" one.
                if (myMark < pairMark) return;
                if (myMark === pairMark && part === 'b') return;
            }
        } else {
            // If no marks (e.g. theoretical max), we can't decide internal choice without assumption.
            // Usually we treat 'a' as default or sum all? 
            // For attainment % calculation, we MUST know what student picked.
            // If this function is called without marks, it likely needs 'All Possible Max' which is wrong for % logic.
            // We will assume marks are passed for accurate % calc.
            // If not, we skip internal choice logic and just add all (which might be duplicate).
            // Let's implement a "Default to A" or "Max of Config" if marks missing?
            // Better: If marks missing, just add everything (Static View).
        }

        if (co) {
            maxMarks[co] += maxMark;
        }
    });

    return maxMarks;
};

export const getPartWiseTotals = (config: QuestionConfig) => {
    const partA_CO = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const partB_a_CO = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };
    const partB_b_CO = { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 };

    Object.keys(config).forEach((qId) => {
        const { co, maxMark } = config[qId];

        if (!co) return;

        if (qId.startsWith('q') && parseInt(qId.substring(1)) <= 10 && !qId.includes('a') && !qId.includes('b')) {
            // Part A Q1-Q10
            partA_CO[co] += maxMark;
        } else if (qId.endsWith('a')) {
            partB_a_CO[co] += maxMark;
        } else if (qId.endsWith('b')) {
            partB_b_CO[co] += maxMark;
        }
    });

    return { partA: partA_CO, partB_a: partB_a_CO, partB_b: partB_b_CO };
};
