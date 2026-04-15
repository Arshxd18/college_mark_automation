/**
 * coPiMatcher.ts
 * Hybrid NLP engine for CO-to-PI matching.
 *
 * Algorithm:
 *   1. Preprocess CO and PI texts (tokenize → stopwords → stem → deduplicate)
 *   2. Jaccard keyword score on unique stemmed token sets
 *   3. Cosine TF-IDF semantic score (corpus built from ALL COs + PIs together)
 *   4. finalScore = (jaccard × 0.4) + (cosine × 0.6)
 *   5. Decision: ≥0.6 → YES, ≥0.4 → LOW_CONFIDENCE, <0.4 → NO
 */

import { PIEntry, MappingCell, MappingDecision, COLabel, PIAttainmentRow, COMappingDoc, MappingDecision as MD } from "@/types";
import {
    processText,
    buildIDF,
    buildTFIDF,
    cosineSimilarity,
    jaccardSimilarity,
    getMatchedWords,
} from "./textProcessor";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

// ── Thresholds ──────────────────────────────────────────────────
const THRESHOLD_YES = 0.6;
const THRESHOLD_LOW = 0.4;

function decide(score: number): MappingDecision {
    if (score >= THRESHOLD_YES) return "YES";
    if (score >= THRESHOLD_LOW) return "LOW_CONFIDENCE";
    return "NO";
}

// ── Single pair matching ────────────────────────────────────────
function matchPair(
    coText: string,
    piText: string,
    coTokens: string[],
    piTokens: string[],
    idf: Record<string, number>
): MappingCell {
    // Jaccard on unique stemmed tokens
    const jaccard = jaccardSimilarity(coTokens, piTokens);

    // Cosine on TF-IDF vectors built from same corpus IDF
    const coVec = buildTFIDF(coTokens, idf);
    const piVec = buildTFIDF(piTokens, idf);
    const cosine = cosineSimilarity(coVec, piVec);

    // Weighted final score
    const score = parseFloat(((jaccard * 0.4) + (cosine * 0.6)).toFixed(4));

    // Matched raw words for tooltip (before stemming)
    const matchedWords = getMatchedWords(coText, piText);

    return {
        value: decide(score),
        confidence: score,
        matchedWords,
        overridden: false,
    };
}

// ── Full matrix computation ─────────────────────────────────────
/**
 * Matches all 6 COs against all PIs using the hybrid NLP engine.
 * Builds TF-IDF corpus from the full set of texts for accuracy.
 *
 * @param coDescriptions - Record<COLabel, description string>
 * @param piList         - Array of PIEntry
 * @returns Full matching matrix: Record<COLabel, Record<piId, MappingCell>>
 */
export function matchAllCOs(
    coDescriptions: Record<COLabel, string>,
    piList: PIEntry[]
): Record<COLabel, Record<string, MappingCell>> {
    if (piList.length === 0) return {} as any;

    // Step 1: Tokenize all texts
    const coTokensMap: Record<COLabel, string[]> = {} as any;
    for (const co of CO_KEYS) {
        coTokensMap[co] = processText(coDescriptions[co] ?? "");
    }

    const piTokensMap: Record<string, string[]> = {};
    for (const pi of piList) {
        piTokensMap[pi.id] = processText(pi.descriptor);
    }

    // Step 2: Build corpus = all CO tokens + all PI tokens
    const corpus: string[][] = [
        ...CO_KEYS.map(co => coTokensMap[co]),
        ...piList.map(pi => piTokensMap[pi.id]),
    ];
    const idf = buildIDF(corpus);

    // Step 3: Match each CO × each PI
    const matrix: Record<COLabel, Record<string, MappingCell>> = {} as any;

    for (const co of CO_KEYS) {
        matrix[co] = {};
        const coText = coDescriptions[co] ?? "";
        const coTokens = coTokensMap[co];

        for (const pi of piList) {
            if (!coText.trim()) {
                // Empty CO description → always NO
                matrix[co][pi.id] = {
                    value: "NO",
                    confidence: 0,
                    matchedWords: [],
                    overridden: false,
                };
            } else {
                matrix[co][pi.id] = matchPair(
                    coText,
                    pi.descriptor,
                    coTokens,
                    piTokensMap[pi.id],
                    idf
                );
            }
        }
    }

    return matrix;
}

// ── PI Attainment Computation ───────────────────────────────────
/**
 * Compute PI attainment rows from the full matrix.
 * Uses confidence-weighted scoring (Option B):
 *   attainedScore = sum(confidence) for YES cells per PI
 *   pct = (attainedScore / 6) × 100
 *   level: ≥70→3, 60–69→2, 50–59→1, <50→0
 */
export function computePIAttainment(
    matrix: Record<COLabel, Record<string, MappingCell>>,
    piList: PIEntry[]
): PIAttainmentRow[] {
    const rows: PIAttainmentRow[] = [];

    for (const pi of piList) {
        let attainedScore = 0;
        let yesCount = 0;

        for (const co of CO_KEYS) {
            const cell = matrix[co]?.[pi.id];
            if (cell && cell.value === "YES") {
                attainedScore += cell.confidence;
                yesCount++;
            }
        }

        const total = CO_KEYS.length; // 6
        const pct = parseFloat(((attainedScore / total) * 100).toFixed(2));

        let level = 0;
        if (pct >= 70) level = 3;
        else if (pct >= 60) level = 2;
        else if (pct >= 50) level = 1;

        rows.push({
            piId: pi.id,
            competency: pi.competency,
            attainedScore: parseFloat(attainedScore.toFixed(4)),
            total,
            pct,
            level,
        });
    }

    return rows;
}

// ── Manual Override ─────────────────────────────────────────────
/**
 * Toggle a single cell's decision and mark it as overridden.
 * Cycling: YES → NO → LOW_CONFIDENCE → YES
 */
export function toggleCell(
    matrix: Record<COLabel, Record<string, MappingCell>>,
    co: COLabel,
    piId: string
): Record<COLabel, Record<string, MappingCell>> {
    const cell = matrix[co]?.[piId];
    if (!cell) return matrix;

    const cycleOrder: MappingDecision[] = ["YES", "LOW_CONFIDENCE", "NO"];
    const currentIdx = cycleOrder.indexOf(cell.value);
    const nextValue = cycleOrder[(currentIdx + 1) % cycleOrder.length];

    return {
        ...matrix,
        [co]: {
            ...matrix[co],
            [piId]: {
                ...cell,
                value: nextValue,
                overridden: true,
            },
        },
    };
}

/**
 * Reset all overridden cells back to their NLP-computed values.
 * Requires the original NLP run result.
 */
export function resetOverrides(
    currentMatrix: Record<COLabel, Record<string, MappingCell>>,
    originalMatrix: Record<COLabel, Record<string, MappingCell>>
): Record<COLabel, Record<string, MappingCell>> {
    const reset: Record<COLabel, Record<string, MappingCell>> = {} as any;
    for (const co of CO_KEYS) {
        reset[co] = {};
        for (const piId of Object.keys(currentMatrix[co] ?? {})) {
            reset[co][piId] = { ...originalMatrix[co][piId], overridden: false };
        }
    }
    return reset;
}
