import type { ComputedAssessment } from "@/lib/attainmentEngine";

export interface Student {
  id: string;
  slNo: number;
  regNo: string;
  rollNo: string;
  name: string;
  marks: Marks;
}

export interface Marks {
  [questionId: string]: number;
}

export type QuestionId =
  | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10"
  | "q11a" | "q11b" | "q12a" | "q12b" | "q13a" | "q13b" | "q14a" | "q14b" | "q15a" | "q15b" | "q16a" | "q16b";

export type COLabel = "co1" | "co2" | "co3" | "co4" | "co5" | "co6";

export type TestType =
  | "Internal 1"
  | "Internal 2"
  | "Semester"
  | "Unit Test"
  | "Assignment"
  | "CO Average";

export interface ExamConfig {
  academicYear: string;
  batchYear: string;       // e.g. "2023-2027"
  subjectId: string;       // e.g. "23AD1501"
  testType: TestType;
}

export interface QuestionConfig {
  [key: string]: {
    co: COLabel;
    maxMark: number;
  };
}

export interface COResult {
  co1: number;
  co2: number;
  co3: number;
  co4: number;
  co5: number;
  co6: number;
  total: number;
  percentage: {
    co1: number;
    co2: number;
    co3: number;
    co4: number;
    co5: number;
    co6: number;
  };
}

export interface COScores {
  co1: number;
  co2: number;
  co3: number;
  co4: number;
  co5: number;
  co6: number;
}

// --- Firestore Interfaces ---

export interface AssessmentDoc {
  id?: string;
  batchYear: string;
  subjectId: string;
  testType: TestType;
  examConfig: ExamConfig;
  questionConfig: QuestionConfig;
  students: Student[];
  computed: ComputedAssessment; // full CO stats: coMax, studentCO, attainment
  // Legacy fields kept for backward compat
  coAttainment?: COScores;
  coPercentage?: COScores;
  isActive: boolean;
  savedAt: string;            // ISO string
}

export interface AttainmentResult {
  batchYear: string;
  subjectId: string;
  coDescriptions?: Record<COLabel, string>;

  coAttainmentAvg?: COScores;       // IA (Internal avg) level per CO
  unitTestLevel?: COScores;          // Unit Test level per CO
  assignmentLevel?: COScores;        // Assignment level per CO
  semesterLevel?: COScores;          // Semester (SEE) level per CO
  internalAttainment?: COScores;
  directAttainment?: COScores;
  indirectAttainment?: COScores;
  finalAttainment?: COScores;
  levels?: Record<COLabel, number | "N/A">;
  
  computedAt?: string;
}

// ── CO–PO–PSO Mapping Types ──────────────────────────────────────

export interface PIEntry {
  id: string;           // e.g. "PI-1.1.1"
  competency: string;   // e.g. "Engineering Knowledge"
  descriptor: string;   // Full PI text description
  poNumber: number;     // PO number this PI belongs to (1–12)
}

export type MappingDecision = 3 | 2 | 1 | null;

export interface MappingCell {
  value: MappingDecision;
  confidence: number;       // 0–1 final NLP score
  matchedWords: string[];   // common tokens shown in tooltip
  overridden: boolean;      // true if faculty manually toggled
  boost: number;            // keyword inflation to visualize in UI
  aiSuggestion?: {
    level: 3 | 2 | 1 | 0;
    reason: string;
    confidence: "low" | "medium" | "high";
    status: "idle" | "loading" | "done" | "error";
  };
  aiMeta?: {
    used: boolean;        // true if accepted
    source: "nlp" | "ai";
  };
}

export interface POAttainmentRow {
  poId: string;
  level: number | null;
  coMap: Record<COLabel, number | null>;
}

export interface COMappingDoc {
  id?: string;
  batchYear: string;
  subjectId: string;
  coDescriptions: Record<COLabel, string>;
  matrix: Record<COLabel, Record<string, MappingCell>>;
  poAttainment: POAttainmentRow[];
  mappingLocked?: boolean;
  savedAt: string;
}



// Default values to initialize the system
export const DEFAULT_QUESTION_CONFIG: QuestionConfig = {
  q1: { co: "co2", maxMark: 2 },
  q2: { co: "co1", maxMark: 2 },
  q3: { co: "co2", maxMark: 2 },
  q4: { co: "co2", maxMark: 2 },
  q5: { co: "co3", maxMark: 2 },
  q6: { co: "co2", maxMark: 2 },
  q7: { co: "co1", maxMark: 2 },
  q8: { co: "co1", maxMark: 2 },
  q9: { co: "co3", maxMark: 2 },
  q10: { co: "co2", maxMark: 2 },
  q11a: { co: "co3", maxMark: 13 },
  q11b: { co: "co3", maxMark: 13 },
  q12a: { co: "co3", maxMark: 13 },
  q12b: { co: "co3", maxMark: 13 },
  q13a: { co: "co4", maxMark: 13 },
  q13b: { co: "co4", maxMark: 13 },
  q14a: { co: "co2", maxMark: 13 },
  q14b: { co: "co4", maxMark: 13 },
  q15a: { co: "co5", maxMark: 13 },
  q15b: { co: "co5", maxMark: 13 },
  q16a: { co: "co5", maxMark: 15 },
  q16b: { co: "co5", maxMark: 15 },
};
