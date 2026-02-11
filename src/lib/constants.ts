import { QuestionId } from "@/types";

export const QUESTION_ORDER: QuestionId[] = [
    "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
    "q11a", "q11b", "q12a", "q12b", "q13a", "q13b", "q14a", "q14b", "q15a", "q15b", "q16a", "q16b"
];

export const PART_A_QUESTIONS = QUESTION_ORDER.slice(0, 10);
export const PART_B_QUESTIONS = QUESTION_ORDER.slice(10);
