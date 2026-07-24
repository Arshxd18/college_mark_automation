import { COResult, Marks, QuestionConfig, COLabel } from "@/types";

export const UT_DEFINITIONS = [
    { id: 1, label: "UT1", keys: ["u1_co1", "u1_co2", "u1_co3", "u1_co4", "u1_co5", "u1_co6"] },
    { id: 2, label: "UT2", keys: ["u2_co1", "u2_co2", "u2_co3", "u2_co4", "u2_co5", "u2_co6"] },
    { id: 3, label: "UT3", keys: ["u3_co1", "u3_co2", "u3_co3", "u3_co4", "u3_co5", "u3_co6"] },
    { id: 4, label: "UT4", keys: ["u4_co1", "u4_co2", "u4_co3", "u4_co4", "u4_co5", "u4_co6"] },
    { id: 5, label: "UT5", keys: ["u5_co1", "u5_co2", "u5_co3", "u5_co4", "u5_co5", "u5_co6"] },
];

export const getFilteredUTMarksAndConfig = (
    marks: Marks,
    config: QuestionConfig
): { filteredMarks: Marks; filteredConfig: QuestionConfig; excludedUTs: string[] } => {
    // Score each UT — only count UTs that have at least one configured key present
    const utScores = UT_DEFINITIONS.map(ut => {
        let obtained = 0;
        let max = 0;
        ut.keys.forEach(k => {
            // A UT is "available" if it has a config entry
            if (config[k]) {
                max += config[k].maxMark ?? 0;
                const m = marks[k];
                if (m !== undefined && m !== null) obtained += m;
            }
        });
        const pct = max > 0 ? (obtained / max) * 100 : -1; // -1 = no data
        return { ...ut, obtained, max, pct, hasData: max > 0 };
    });

    // Only consider UTs that actually have data in the config
    const availableUTs = utScores.filter(ut => ut.hasData);

    // Keep top min(3, total available) by percentage — no exclusion if ≤3 UTs present
    const keepCount = Math.min(3, availableUTs.length);
    const sorted = [...availableUTs].sort((a, b) => b.pct - a.pct);
    const keptUTs = sorted.slice(0, keepCount);
    const excludedUTs = sorted.slice(keepCount).map(ut => ut.label);

    const keptKeys = new Set(keptUTs.flatMap(ut => ut.keys));

    const filteredMarks: Marks = {};
    const filteredConfig: QuestionConfig = {};

    Object.keys(config).forEach(k => {
        if (k.startsWith('u')) {
            if (keptKeys.has(k)) {
                filteredConfig[k] = config[k];
                if (marks[k] !== undefined && marks[k] !== null) {
                    filteredMarks[k] = marks[k];
                }
            }
        } else {
            filteredConfig[k] = config[k];
            if (marks[k] !== undefined && marks[k] !== null) {
                filteredMarks[k] = marks[k];
            }
        }
    });

    return { filteredMarks, filteredConfig, excludedUTs };
};

export const calculateCOAttainment = (marks: Marks, config: QuestionConfig): COResult => {
    const hasUTKeys = Object.keys(config).some(k => k.startsWith('u'));
    let currentMarks = marks;
    let currentConfig = config;

    if (hasUTKeys) {
        const filtered = getFilteredUTMarksAndConfig(marks, config);
        currentMarks = filtered.filteredMarks;
        currentConfig = filtered.filteredConfig;
    }

    const result: COResult = {
        co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0,
        total: 0,
        percentage: { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, co6: 0 },
    };

    let totalMarks = 0;

    // Calculate CO totals
    Object.keys(currentMarks).forEach((qId) => {
        let mark = currentMarks[qId] || 0;

        // --- Internal Choice Logic (Part B: 11-15) ---
        // If this is an 'a' or 'b' question, check if its pair exists and if we should count this one.
        const match = qId.match(/^q(\d+)([ab])$/i);
        if (match) {
            const num = match[1];
            const part = match[2].toLowerCase();
            const pairPart = part === 'a' ? 'b' : 'a';
            const pairId = `q${num}${pairPart}`;

            const pairMark = currentMarks[pairId] || 0;

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

        const qConfig = currentConfig[qId];
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
    const coMaxMarks = calculateCOMaxMarks(currentConfig, currentMarks); // Pass marks to determine which max to count

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
    const hasUTKeys = Object.keys(config).some(k => k.startsWith('u'));
    let currentConfig = config;

    if (hasUTKeys && marks) {
        const filtered = getFilteredUTMarksAndConfig(marks, config);
        currentConfig = filtered.filteredConfig;
    }

    Object.keys(currentConfig).forEach((qId) => {
        const { co, maxMark } = currentConfig[qId];

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
