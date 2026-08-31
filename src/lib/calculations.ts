import { COResult, Marks, QuestionConfig, COLabel } from "@/types";

export const UT_DEFINITIONS = [
    { id: 1, label: "UT1", keys: ["u1_co1", "u1_co2", "u1_co3", "u1_co4", "u1_co5", "u1_co6"] },
    { id: 2, label: "UT2", keys: ["u2_co1", "u2_co2", "u2_co3", "u2_co4", "u2_co5", "u2_co6"] },
    { id: 3, label: "UT3", keys: ["u3_co1", "u3_co2", "u3_co3", "u3_co4", "u3_co5", "u3_co6"] },
    { id: 4, label: "UT4", keys: ["u4_co1", "u4_co2", "u4_co3", "u4_co4", "u4_co5", "u4_co6"] },
    { id: 5, label: "UT5", keys: ["u5_co1", "u5_co2", "u5_co3", "u5_co4", "u5_co5", "u5_co6"] },
];

/** Natural sort for question keys (e.g. q1, q2, ... q10, q11a, q11b ... q16b, or u1..u5) */
export const sortQuestionKeys = (keys: string[]): string[] => {
    return [...keys].sort((a, b) => {
        const prefixA = a.match(/^[a-zA-Z_]+/)?.[0] || '';
        const prefixB = b.match(/^[a-zA-Z_]+/)?.[0] || '';

        if (prefixA !== prefixB) {
            return prefixA.localeCompare(prefixB);
        }

        const matchA = a.match(/\d+/);
        const matchB = b.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : 0;
        const numB = matchB ? parseInt(matchB[0], 10) : 0;

        if (numA !== numB) {
            return numA - numB;
        }

        return a.localeCompare(b, undefined, { numeric: true });
    });
};

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

    // ── Excel Formula (matching NEWEXCEL.xlsx exactly) ──────────────────────
    // NUMERATOR: For each question, add student's mark to its CO total.
    //   - Part A: always included (regardless of score).
    //   - Part B (q<n>a / q<n>b): add mark only if mark > 0.
    //     Both sides of a choice pair can contribute independently
    //     (student may have partial credit on both sides).
    // ─────────────────────────────────────────────────────────────────────────
    Object.keys(currentConfig).forEach((qId) => {
        const mark = currentMarks[qId] || 0;
        const isPartB = /^q\d+[ab]$/i.test(qId);

        // For Part B: only count if student actually scored > 0
        if (isPartB && mark <= 0) return;

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

    // Calculate percentages using the same mark>0 rule for the denominator
    const coMaxMarks = calculateCOMaxMarks(currentConfig, currentMarks);

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

    // ── Excel Formula denominator (matching NEWEXCEL.xlsx exactly) ───────────
    // Part A (q1..q10): ALWAYS include max mark (SUMIF on Part A columns)
    // Part B (q<n>a/q<n>b): Include max mark ONLY if student's mark > 0
    //   (SUMPRODUCT with mark > 0 condition on Part B columns)
    // If no marks provided (static view): include everything (both sides)
    // ────────────────────────────────────────────────────────────────────────
    Object.keys(currentConfig).forEach((qId) => {
        const { co, maxMark } = currentConfig[qId];
        if (!co) return;

        const isPartB = /^q\d+[ab]$/i.test(qId);

        if (isPartB && marks) {
            // Part B with marks: only count if student scored > 0 (Excel: mark > 0)
            const studentMark = marks[qId] || 0;
            if (studentMark <= 0) return;
        }
        // Part A (always), or Part B without marks (static view): include
        maxMarks[co] += maxMark;
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
