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

import { PIEntry, MappingCell, MappingDecision, COLabel, POAttainmentRow } from "@/types";
import {
    processText,
    buildIDF,
    buildTFIDF,
    cosineSimilarity,
    jaccardSimilarity,
    getMatchedWords,
    SYNONYMS,
} from "./textProcessor";

const CO_KEYS: COLabel[] = ["co1", "co2", "co3", "co4", "co5", "co6"];

function getMappingLevel(score: number): MappingDecision {
    if (score >= 0.30) return 3;
    if (score >= 0.18) return 2;
    if (score >= 0.10) return 1;
    return null;
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

    // Minimum match safety: prevent false positives when there is no keyword overlap
    if (jaccard === 0 && cosine < 0.1) {
        return {
            value: null,
            confidence: 0,
            matchedWords: [],
            overridden: false,
            boost: 0,
        };
    }

    // Weighted final score: academic text is short, keyword overlap (with synonyms) > semantic
    let baseScore = parseFloat(((jaccard * 0.6) + (cosine * 0.4)).toFixed(4));
    let rawBoost = 0;
    let boost = 0;

    // Auto-boost for core concept overlaps (matching raw lowercase text to bypass stemming artifacts)
    const IMPORTANT = Object.keys(SYNONYMS);
    const coRaw = coText.toLowerCase();
    const piRaw = piText.toLowerCase();

    IMPORTANT.forEach(word => {
        if (coRaw.includes(word) && piRaw.includes(word)) {
            rawBoost += 0.15;
        }
    });

    // Min token match rule: strong confidence bump if >=2 non-trivial stemmed words match AND base meaning is present
    const commonTokens = coTokens.filter(t => piTokens.includes(t));
    if (commonTokens.length >= 2 && baseScore > 0.08) {
        rawBoost += 0.20;
    }

    // Smart Filter + Cap: Only apply boost if base signal exists, and hard cap it to prevent over-mapping inflation
    if (baseScore > 0.05) {
        boost = Math.min(rawBoost, 0.20);
    }

    // Edge Case 1: Short CO logic compensation
    // If faculty enter severely brief descriptions, the Euclidean similarity vector shrinks. Softly compensate.
    if (coText.length > 0 && coText.length < 25) {
        boost += 0.05;
    }

    // Edge Case 2: Broad/Generic suppression
    // If the intersection is purely generic words, artificially suppress the match to demand higher academic specificity
    const GENERIC_WORDS = ["system", "model", "process", "method", "basic", "concept"];
    const containsMostlyGeneric = commonTokens.length > 0 && commonTokens.every(t => GENERIC_WORDS.includes(t));
    if (containsMostlyGeneric && baseScore < 0.15) {
        boost -= 0.05;
    }

    let finalScore = parseFloat((baseScore + boost).toFixed(4));
    if (finalScore < 0) finalScore = 0;

    // Matched raw words for tooltip (before stemming)
    const matchedWords = getMatchedWords(coText, piText);

    // TEMP DEBUG LOG to console for user to verify similarity engine performance
    console.log({
        coText,
        piText,
        keywordScore: jaccard,
        semanticScore: cosine,
        baseScore,
        boost,
        finalScore
    });

    return {
        value: getMappingLevel(finalScore),
        confidence: finalScore,
        matchedWords,
        overridden: false,
        boost,
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
                // Empty CO description → always null
                matrix[co][pi.id] = {
                    value: null,
                    confidence: 0,
                    matchedWords: [],
                    overridden: false,
                    boost: 0,
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

// ── PO Attainment Computation ───────────────────────────────────

function computePILevel(piRow: (number | null)[]): number | null {
    const valid = piRow.filter(v => v !== null);
    if (valid.length === 0) return null;

    const attained = valid.filter((v: any) => v >= 1).length;
    const pct = (attained / valid.length) * 100;

    if (pct >= 70) return 3;
    if (pct >= 60) return 2;
    if (pct >= 50) return 1;
    return 0;
}

/**
 * Computes the final PO levels by aggressively averaging the derived PI levels.
 */
export function computePOAttainment(
    matrix: Record<COLabel, Record<string, MappingCell>>,
    piList: PIEntry[],
    filledCOsCount: number
): POAttainmentRow[] {
    const rows: POAttainmentRow[] = [];
    if (filledCOsCount === 0) return rows;

    // Group logic to match standard PIs to POs
    const pisByPO: Record<number, PIEntry[]> = {};
    for (const pi of piList) {
        if (!pisByPO[pi.poNumber]) pisByPO[pi.poNumber] = [];
        pisByPO[pi.poNumber].push(pi);
    }

    const poNumbers = Object.keys(pisByPO).map(Number).sort((a, b) => a - b);

    for (const poId of poNumbers) {
        const pis = pisByPO[poId];
        const piLevels = pis.map(pi => {
            const piRow = CO_KEYS.map(co => matrix[co]?.[pi.id]?.value ?? null);
            return computePILevel(piRow);
        });

        const valid = piLevels.filter(v => v !== null);
        if (valid.length === 0) {
            rows.push({
                poId: poId.toString(),
                level: null,
            });
        } else {
            const avg = valid.reduce((a: any, b: any) => a + b, 0) / valid.length;
            rows.push({
                poId: poId.toString(),
                level: Math.round(avg),
            });
        }
    }

    return rows;
}

// ── Manual Override ─────────────────────────────────────────────
/**
 * Toggle a single cell's decision and mark it as overridden.
 * Cycling: 3 → 2 → 1 → null → 3
 */
export function toggleCell(
    matrix: Record<COLabel, Record<string, MappingCell>>,
    co: COLabel,
    piId: string
): Record<COLabel, Record<string, MappingCell>> {
    const cell = matrix[co]?.[piId];
    if (!cell) return matrix;

    const cycleOrder: MappingDecision[] = [3, 2, 1, null];
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
