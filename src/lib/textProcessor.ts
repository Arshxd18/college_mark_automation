/**
 * textProcessor.ts
 * Pure browser-compatible NLP preprocessing pipeline.
 * NO external dependencies — Porter Stemmer implemented inline.
 *
 * Used by coPiMatcher.ts which runs entirely in the browser.
 */

// ── Porter Stemmer (browser-safe, no npm required) ────────────────
// Adapted from the original J. Porter (1980) algorithm.
// Reference: https://tartarus.org/martin/PorterStemmer/


const VOWELS = /[aeiou]/;
const CONSONANT = (c: string) => !VOWELS.test(c);

function hasCVC(stem: string): boolean {
    const s = stem;
    const n = s.length;
    if (n < 3) return false;
    return (
        CONSONANT(s[n - 3]) &&
        VOWELS.test(s[n - 2]) &&
        CONSONANT(s[n - 1]) &&
        !/[wxy]/.test(s[n - 1])
    );
}

function containsVowel(stem: string): boolean {
    return VOWELS.test(stem);
}

function measure(stem: string): number {
    let m = 0;
    let inVowelSeq = false;
    for (const ch of stem) {
        if (VOWELS.test(ch)) {
            inVowelSeq = true;
        } else if (inVowelSeq) {
            m++;
            inVowelSeq = false;
        }
    }
    return m;
}

function step1a(word: string): string {
    if (word.endsWith("sses")) return word.slice(0, -2);
    if (word.endsWith("ies")) return word.slice(0, -2);
    if (word.endsWith("ss")) return word;
    if (word.endsWith("s")) return word.slice(0, -1);
    return word;
}

function step1b(word: string): string {
    if (word.endsWith("eed")) {
        const stem = word.slice(0, -3);
        if (measure(stem) > 0) return stem + "ee";
        return word;
    }
    if (word.endsWith("ed")) {
        const stem = word.slice(0, -2);
        if (containsVowel(stem)) return fixup(stem);
        return word;
    }
    if (word.endsWith("ing")) {
        const stem = word.slice(0, -3);
        if (containsVowel(stem)) return fixup(stem);
        return word;
    }
    return word;
}

function fixup(stem: string): string {
    if (stem.endsWith("at") || stem.endsWith("bl") || stem.endsWith("iz")) return stem + "e";
    if (stem.length >= 2 && stem[stem.length - 1] === stem[stem.length - 2] && CONSONANT(stem[stem.length - 1]) && !/[lsz]/.test(stem[stem.length - 1]))
        return stem.slice(0, -1);
    if (measure(stem) === 1 && hasCVC(stem)) return stem + "e";
    return stem;
}

function step1c(word: string): string {
    if (word.endsWith("y") && containsVowel(word.slice(0, -1)))
        return word.slice(0, -1) + "i";
    return word;
}

const STEP2_MAP: [string, string][] = [
    ["ational", "ate"], ["tional", "tion"], ["enci", "ence"], ["anci", "ance"],
    ["izer", "ize"], ["abli", "able"], ["alli", "al"], ["entli", "ent"],
    ["eli", "e"], ["ousli", "ous"], ["ization", "ize"], ["ation", "ate"],
    ["ator", "ate"], ["alism", "al"], ["iveness", "ive"], ["fulness", "ful"],
    ["ousness", "ous"], ["aliti", "al"], ["iviti", "ive"], ["biliti", "ble"],
];

function step2(word: string): string {
    for (const [suffix, replacement] of STEP2_MAP) {
        if (word.endsWith(suffix)) {
            const stem = word.slice(0, -suffix.length);
            if (measure(stem) > 0) return stem + replacement;
        }
    }
    return word;
}

const STEP3_MAP: [string, string][] = [
    ["icate", "ic"], ["ative", ""], ["alize", "al"], ["iciti", "ic"],
    ["ical", "ic"], ["ful", ""], ["ness", ""],
];

function step3(word: string): string {
    for (const [suffix, replacement] of STEP3_MAP) {
        if (word.endsWith(suffix)) {
            const stem = word.slice(0, -suffix.length);
            if (measure(stem) > 0) return stem + replacement;
        }
    }
    return word;
}

const STEP4_SUFFIXES = [
    "al", "ance", "ence", "er", "ic", "able", "ible", "ant", "ement",
    "ment", "ent", "ion", "ou", "ism", "ate", "iti", "ous", "ive", "ize",
];

function step4(word: string): string {
    for (const suffix of STEP4_SUFFIXES) {
        if (word.endsWith(suffix)) {
            const stem = word.slice(0, -suffix.length);
            if (suffix === "ion") {
                if (measure(stem) > 1 && /[st]$/.test(stem)) return stem;
            } else if (measure(stem) > 1) {
                return stem;
            }
        }
    }
    return word;
}

function step5a(word: string): string {
    if (word.endsWith("e")) {
        const stem = word.slice(0, -1);
        if (measure(stem) > 1) return stem;
        if (measure(stem) === 1 && !hasCVC(stem)) return stem;
    }
    return word;
}

function step5b(word: string): string {
    if (measure(word) > 1 && word.endsWith("ll")) return word.slice(0, -1);
    return word;
}

export function porterStem(word: string): string {
    if (word.length <= 2) return word;
    word = step1a(word);
    word = step1b(word);
    word = step1c(word);
    word = step2(word);
    word = step3(word);
    word = step4(word);
    word = step5a(word);
    word = step5b(word);
    return word;
}

// ── Stopwords ─────────────────────────────────────────────────────
// Standard English + domain-specific academic stopwords
const STOPWORDS = new Set([
    // Common English
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
    // Domain-specific: appear in nearly every CO/PI, so they add no signal
    "student", "students", "ability", "able",
    "understand", "understanding", "use", "using", "used",
    "apply", "applying", "analyze", "evaluate", "demonstrate",
    "various", "different", "appropriate", "effectively", "efficiently",
    "given", "based", "related", "relevant", "specific", "complex",
    "simple", "basic", "advanced", "modern", "real", "world",
    "course", "courses", "knowledge", "skill", "skills",
]);

// ── Pipeline ──────────────────────────────────────────────────────

/** Tokenize a string (lowercase, alpha-only). */
export function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

/** Remove stopwords AND tokens shorter than 3 characters. */
export function removeStopwords(tokens: string[]): string[] {
    return tokens.filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

/** Deduplicate (preserving order). */
export function deduplicate(tokens: string[]): string[] {
    return [...new Set(tokens)];
}

/**
 * Full pipeline: tokenize → removeStopwords → expand synonyms → stem → deduplicate
 */
export function processText(text: string): string[] {
    if (!text || text.trim() === "") return [];
    const baseTokens = removeStopwords(tokenize(text));
    const expanded = expandTokens(baseTokens);
    return deduplicate(expanded.map(porterStem));
}

// ── Synonyms (Domain Vocabulary Bridge) ───────────────────────────
export const SYNONYMS: Record<string, string[]> = {
    automata: ["machine", "computation", "system"],
    grammar: ["language", "syntax"],
    language: ["communication", "representation"],
    design: ["develop", "create", "build", "formulate", "construct"],
    analysis: ["analyze", "evaluate", "study", "investigate", "assess"],
    theory: ["concept", "principle", "fundamental"],
    algorithm: ["method", "procedure", "logic", "computation"],
    software: ["program", "application", "system", "code"],
    hardware: ["circuit", "device", "equipment", "component"],
    network: ["communication", "connection", "protocol"],
    data: ["information", "dataset", "database"],
    model: ["simulate", "representation", "prototype"],
    test: ["verify", "validate", "evaluate", "examine"],
    security: ["protect", "safe", "privacy", "defense"],
    deploy: ["implement", "install", "publish"],
};

export function expandTokens(tokens: string[]): string[] {
    const expanded = [...tokens];
    tokens.forEach((token) => {
        if (SYNONYMS[token]) {
            expanded.push(...SYNONYMS[token]);
        }
    });
    return expanded;
}

// ── TF-IDF ────────────────────────────────────────────────────────

export function buildTFVector(tokens: string[]): Record<string, number> {
    const tf: Record<string, number> = {};
    for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
    return tf;
}

/** Build IDF weights from a corpus of processed token arrays. Call ONCE per corpus. */
export function buildIDF(corpus: string[][]): Record<string, number> {
    const docCount = corpus.length;
    const docFreq: Record<string, number> = {};
    for (const doc of corpus) {
        for (const t of new Set(doc)) {
            docFreq[t] = (docFreq[t] ?? 0) + 1;
        }
    }
    const idf: Record<string, number> = {};
    for (const [t, df] of Object.entries(docFreq)) {
        idf[t] = Math.log((docCount + 1) / (df + 1)) + 1; // smoothed IDF
    }
    return idf;
}

/** Build TF-IDF vector for a token array using pre-computed IDF. */
export function buildTFIDF(tokens: string[], idf: Record<string, number>): Record<string, number> {
    const tf = buildTFVector(tokens);
    const tfidf: Record<string, number> = {};
    for (const [t, freq] of Object.entries(tf)) {
        tfidf[t] = freq * (idf[t] ?? 1);
    }
    return tfidf;
}

// ── Similarity ────────────────────────────────────────────────────

/** Cosine similarity between two TF-IDF vectors (0–1). */
export function cosineSimilarity(
    vecA: Record<string, number>,
    vecB: Record<string, number>
): number {
    const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dot = 0, magA = 0, magB = 0;
    for (const t of terms) {
        const a = vecA[t] ?? 0;
        const b = vecB[t] ?? 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Jaccard similarity on unique stemmed token sets (0–1). */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    if (setA.size === 0 && setB.size === 0) return 0;
    const intersection = [...setA].filter(t => setB.has(t)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}

/**
 * Get raw (pre-stem) intersecting words for the tooltip "Matched words" display.
 */
export function getMatchedWords(textA: string, textB: string): string[] {
    const rawA = new Set(removeStopwords(tokenize(textA)));
    const rawB = new Set(removeStopwords(tokenize(textB)));
    return [...rawA].filter(t => rawB.has(t)).slice(0, 6);
}

/**
 * Returns a warning if the processed token count is below the useful threshold.
 */
export function getCOWarning(text: string): string | null {
    const tokens = removeStopwords(tokenize(text));
    if (tokens.length === 0) return "CO description is empty.";
    if (tokens.length < 3) return "CO description is too short — add more detail for accurate matching.";
    return null;
}
