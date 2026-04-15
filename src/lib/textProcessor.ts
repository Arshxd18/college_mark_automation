/**
 * textProcessor.ts
 * Preprocessing pipeline for NLP text matching.
 * Used by coPiMatcher.ts and MappingTable.tsx.
 */

// Porter stemmer from 'natural' library
import { PorterStemmer } from "natural";

// Common English + academic stopwords to filter out
const STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "but", "if", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "as", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall", "can",
    "that", "this", "these", "those", "it", "its", "they", "their",
    "we", "our", "you", "your", "he", "she", "his", "her", "them",
    "which", "who", "what", "when", "where", "how", "not", "no", "nor",
    "so", "yet", "both", "either", "neither", "each", "such", "than",
    "too", "very", "just", "also", "more", "most", "other", "into",
    "about", "above", "after", "before", "between", "through", "during",
    "while", "although", "because", "since", "until", "whether",
    "student", "students", "course", "courses", "ability", "understand",
    "understanding", "knowledge", "use", "using", "used", "apply", "applying",
    "various", "different", "appropriate", "effectively", "efficiently",
    "given", "based", "related", "relevant", "specific", "complex",
    "simple", "basic", "advanced", "modern", "new", "real", "world",
]);

/**
 * Tokenize a string into individual words (lowercase, alpha only).
 */
export function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

/**
 * Remove stopwords AND tokens shorter than 3 characters.
 */
export function removeStopwords(tokens: string[]): string[] {
    return tokens.filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * Apply Porter stemming to reduce words to their root form.
 */
export function stem(tokens: string[]): string[] {
    return tokens.map(t => PorterStemmer.stem(t));
}

/**
 * Deduplicate a token array (preserving order).
 */
export function deduplicate(tokens: string[]): string[] {
    return [...new Set(tokens)];
}

/**
 * Full preprocessing pipeline:
 * tokenize → removeStopwords → stem → deduplicate
 */
export function processText(text: string): string[] {
    if (!text || text.trim() === "") return [];
    return deduplicate(stem(removeStopwords(tokenize(text))));
}

/**
 * Build a term-frequency vector from a token array.
 * Returns a Record<token, frequency>.
 */
export function buildTFVector(tokens: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    for (const t of tokens) {
        tf[t] = (tf[t] ?? 0) + 1;
    }
    return tf;
}

/**
 * Compute inverse document frequency weights from a corpus of token arrays.
 * Returns a Record<token, idf>.
 */
export function buildIDF(corpus: string[][]): Record<string, number> {
    const docCount = corpus.length;
    const docFreq: Record<string, number> = {};

    for (const doc of corpus) {
        const unique = new Set(doc);
        for (const t of unique) {
            docFreq[t] = (docFreq[t] ?? 0) + 1;
        }
    }

    const idf: Record<string, number> = {};
    for (const [t, df] of Object.entries(docFreq)) {
        idf[t] = Math.log((docCount + 1) / (df + 1)) + 1; // smooth IDF
    }
    return idf;
}

/**
 * Build a TF-IDF vector for a token array using pre-computed IDF weights.
 */
export function buildTFIDF(tokens: string[], idf: Record<string, number>): Record<string, number> {
    const tf = buildTFVector(tokens);
    const tfidf: Record<string, number> = {};
    for (const [t, freq] of Object.entries(tf)) {
        tfidf[t] = freq * (idf[t] ?? 1);
    }
    return tfidf;
}

/**
 * Cosine similarity between two TF-IDF vectors.
 * Returns value 0–1.
 */
export function cosineSimilarity(
    vecA: Record<string, number>,
    vecB: Record<string, number>
): number {
    const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dot = 0, magA = 0, magB = 0;

    for (const t of allTerms) {
        const a = vecA[t] ?? 0;
        const b = vecB[t] ?? 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
    }

    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Jaccard similarity on two unique token sets.
 * Returns value 0–1.
 */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    const intersection = [...setA].filter(t => setB.has(t));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.length / union.size;
}

/**
 * Get the raw intersecting words (before stemming) from two texts.
 * Used to populate matchedWords in the tooltip.
 */
export function getMatchedWords(textA: string, textB: string): string[] {
    const rawA = new Set(removeStopwords(tokenize(textA)));
    const rawB = new Set(removeStopwords(tokenize(textB)));
    return [...rawA].filter(t => rawB.has(t));
}
