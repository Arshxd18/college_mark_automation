import { supabase } from "./supabase";
import {
    AssessmentDoc,
    AttainmentResult,
    COScores,
    Student,
    QuestionConfig,
    TestType,
    ExamConfig,
    COLabel,
    COMappingDoc,
    POAttainmentRow,
} from "@/types";
import { computeAssessmentCO } from "./attainmentEngine";

// ── Helpers for Casing Mapping ──────────────────────────────────────────────

function mapAssessmentToFrontend(row: any): AssessmentDoc {
    return {
        id: row.id,
        batchYear: row.batch_year,
        subjectId: row.subject_id,
        testType: row.test_type,
        isActive: row.is_active,
        examConfig: row.exam_config,
        questionConfig: row.question_config,
        students: row.students,
        computed: row.computed,
        savedAt: row.saved_at,
    };
}

function mapResultToFrontend(row: any): AttainmentResult {
    return {
        batchYear: row.batch_year,
        subjectId: row.subject_id,
        coDescriptions: row.co_descriptions,
        coAttainmentAvg: row.co_attainment_avg,
        unitTestLevel: row.unit_test_level,
        assignmentLevel: row.assignment_level,
        semesterLevel: row.semester_level,
        internalAttainment: row.internal_attainment,
        directAttainment: row.direct_attainment,
        indirectAttainment: row.indirect_attainment,
        finalAttainment: row.final_attainment,
        levels: row.levels,
        computedAt: row.computed_at,
    };
}

function mapMappingToFrontend(row: any): COMappingDoc {
    return {
        id: row.id,
        batchYear: row.batch_year,
        subjectId: row.subject_id,
        coDescriptions: row.co_descriptions,
        matrix: row.matrix,
        poAttainment: row.po_attainment,
        mappingLocked: row.mapping_locked,
        savedAt: row.saved_at,
    };
}

function cleanTitleCase(str: string): string {
    return str
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

// ── Save Assessment ──────────────────────────────────────────────────────────

export async function saveAssessment(
    examConfig: ExamConfig,
    questionConfig: QuestionConfig,
    students: Student[]
): Promise<string> {
    const { batchYear, subjectId, testType } = examConfig;

    // 1. Compute CO stats
    const computed = computeAssessmentCO(students, questionConfig, testType);

    // 2. Deactivate previous active assessments with same keys
    const { error: updateError } = await supabase
        .from("assessments")
        .update({ is_active: false })
        .eq("batch_year", batchYear)
        .eq("subject_id", subjectId)
        .eq("test_type", testType)
        .eq("is_active", true);

    if (updateError) {
        throw new Error(`Failed to deactivate older assessments: ${updateError.message}`);
    }

    // 3. Insert new active assessment
    const { data, error: insertError } = await supabase
        .from("assessments")
        .insert({
            batch_year: batchYear,
            subject_id: subjectId,
            test_type: testType,
            is_active: true,
            exam_config: examConfig,
            question_config: questionConfig,
            students: students,
            computed: computed,
            saved_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        throw new Error(`Failed to insert assessment: ${insertError.message}`);
    }

    return data.id;
}

// ── Query Assessments ─────────────────────────────────────────────────────────

export async function getAssessmentsForBatch(
    batchYear: string,
    subjectId?: string
): Promise<AssessmentDoc[]> {
    let query = supabase
        .from("assessments")
        .select("*")
        .eq("batch_year", batchYear)
        .eq("is_active", true);

    if (subjectId) {
        query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch assessments: ${error.message}`);
    }

    return (data || []).map(mapAssessmentToFrontend);
}

export async function getAllBatchYears(): Promise<string[]> {
    const { data, error } = await supabase
        .from("assessments")
        .select("batch_year")
        .eq("is_active", true);

    if (error) {
        throw new Error(`Failed to fetch batch years: ${error.message}`);
    }

    const years = new Set<string>();
    (data || []).forEach((row) => {
        if (row.batch_year) years.add(row.batch_year);
    });

    return Array.from(years).sort();
}

export async function getSubjectsForBatch(batchYear: string): Promise<string[]> {
    const { data, error } = await supabase
        .from("assessments")
        .select("subject_id")
        .eq("batch_year", batchYear)
        .eq("is_active", true);

    if (error) {
        throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    const subjects = new Set<string>();
    (data || []).forEach((row) => {
        if (row.subject_id) subjects.add(row.subject_id);
    });

    return Array.from(subjects).sort();
}

// ── Attainment Results ────────────────────────────────────────────────────────

const resultDocId = (batchYear: string, subjectId: string) =>
    `${batchYear}_${subjectId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

export async function saveAttainmentResult(result: AttainmentResult): Promise<void> {
    const id = resultDocId(result.batchYear, result.subjectId);
    const { error } = await supabase.from("attainment_results").upsert({
        id: id,
        batch_year: result.batchYear,
        subject_id: result.subjectId,
        co_descriptions: result.coDescriptions,
        co_attainment_avg: result.coAttainmentAvg,
        unit_test_level: result.unitTestLevel,
        assignment_level: result.assignmentLevel,
        semester_level: result.semesterLevel,
        internal_attainment: result.internalAttainment,
        direct_attainment: result.directAttainment,
        indirect_attainment: result.indirectAttainment,
        final_attainment: result.finalAttainment,
        levels: result.levels,
        computed_at: result.computedAt || new Date().toISOString(),
        last_updated: new Date().toISOString(),
    });

    if (error) {
        throw new Error(`Failed to save attainment result: ${error.message}`);
    }
}

export async function updateCODescriptions(
    batchYear: string,
    subjectId: string,
    coDescriptions: Record<COLabel, string>
): Promise<void> {
    const id = resultDocId(batchYear, subjectId);
    
    // First check if a row exists
    const { data } = await supabase
        .from("attainment_results")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    const { error } = await supabase.from("attainment_results").upsert({
        id: id,
        batch_year: batchYear,
        subject_id: subjectId,
        co_descriptions: coDescriptions,
        last_updated: new Date().toISOString(),
    });

    if (error) {
        throw new Error(`Failed to update CO descriptions: ${error.message}`);
    }
}

export async function getAttainmentResult(
    batchYear: string,
    subjectId: string
): Promise<AttainmentResult | null> {
    const id = resultDocId(batchYear, subjectId);
    const { data, error } = await supabase
        .from("attainment_results")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch attainment result: ${error.message}`);
    }

    return data ? mapResultToFrontend(data) : null;
}

// ── CO–PO–PSO Mapping ──────────────────────────────────────────

export async function saveCOMapping(mappingDoc: COMappingDoc): Promise<string> {
    // 1. Deactivate old mapping docs for this batch+subject
    const { error: updateError } = await supabase
        .from("mappings")
        .update({ is_active: false })
        .eq("batch_year", mappingDoc.batchYear)
        .eq("subject_id", mappingDoc.subjectId)
        .eq("is_active", true);

    if (updateError) {
        throw new Error(`Failed to deactivate old mappings: ${updateError.message}`);
    }

    // 2. Insert new active mapping doc
    const { data, error: insertError } = await supabase
        .from("mappings")
        .insert({
            batch_year: mappingDoc.batchYear,
            subject_id: mappingDoc.subjectId,
            co_descriptions: mappingDoc.coDescriptions,
            matrix: mappingDoc.matrix,
            po_attainment: mappingDoc.poAttainment,
            mapping_locked: mappingDoc.mappingLocked || false,
            is_active: true,
            saved_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        throw new Error(`Failed to save new mapping: ${insertError.message}`);
    }

    return data.id;
}

export async function getCOMapping(
    batchYear: string,
    subjectId: string
): Promise<COMappingDoc | null> {
    const { data, error } = await supabase
        .from("mappings")
        .select("*")
        .eq("batch_year", batchYear)
        .eq("subject_id", subjectId)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch mapping: ${error.message}`);
    }

    return data ? mapMappingToFrontend(data) : null;
}

// ── Admin Analytics Queries ───────────────────────────────────────────────────

export async function getAllAcademicYears(): Promise<string[]> {
    const { data, error } = await supabase
        .from("assessments")
        .select("exam_config")
        .eq("is_active", true);

    if (error) {
        throw new Error(`Failed to fetch academic years: ${error.message}`);
    }

    const years = new Set<string>();
    (data || []).forEach((row) => {
        const ay = row.exam_config?.academicYear;
        if (ay && typeof ay === "string") {
            years.add(ay.trim().replace(/\s+/g, ""));
        }
    });

    return Array.from(years).sort().reverse();
}

export async function getSectionsForBatch(
    batchYear: string,
    subjectId?: string
): Promise<string[]> {
    let query = supabase
        .from("assessments")
        .select("exam_config")
        .eq("batch_year", batchYear)
        .eq("is_active", true);

    if (subjectId) {
        query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch sections: ${error.message}`);
    }

    const sections = new Set<string>();
    (data || []).forEach((row) => {
        const sec = row.exam_config?.section;
        if (sec && typeof sec === "string") {
            sections.add(sec.trim().toUpperCase());
        }
    });

    return Array.from(sections).sort();
}

export async function getAllFacultyNames(): Promise<string[]> {
    const { data, error } = await supabase
        .from("assessments")
        .select("exam_config")
        .eq("is_active", true);

    if (error) {
        throw new Error(`Failed to fetch faculty names: ${error.message}`);
    }

    const names = new Set<string>();
    (data || []).forEach((row) => {
        const name = row.exam_config?.facultyName;
        if (name && typeof name === "string") {
            names.add(cleanTitleCase(name));
        }
    });

    return Array.from(names).sort();
}

export async function getAssessmentsForAdmin(filters: {
    batchYear?: string;
    subjectId?: string;
    section?: string;
    academicYear?: string;
    facultyName?: string;
}): Promise<AssessmentDoc[]> {
    let query = supabase
        .from("assessments")
        .select("*")
        .eq("is_active", true);

    if (filters.batchYear) {
        query = query.eq("batch_year", filters.batchYear);
    }
    if (filters.subjectId) {
        query = query.eq("subject_id", filters.subjectId);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(`Failed to fetch admin assessments: ${error.message}`);
    }

    let docs = (data || []).map(mapAssessmentToFrontend);

    // Apply JSONB filters
    if (filters.section) {
        const targetSec = filters.section.trim().toUpperCase();
        docs = docs.filter((d) => {
            const sec = d.examConfig?.section;
            return sec && typeof sec === "string" && sec.trim().toUpperCase() === targetSec;
        });
    }
    if (filters.academicYear) {
        const targetAy = filters.academicYear.trim().replace(/\s+/g, "");
        docs = docs.filter((d) => {
            const ay = d.examConfig?.academicYear;
            return ay && typeof ay === "string" && ay.trim().replace(/\s+/g, "") === targetAy;
        });
    }
    if (filters.facultyName) {
        const targetFaculty = cleanTitleCase(filters.facultyName);
        docs = docs.filter((d) => {
            const faculty = d.examConfig?.facultyName;
            return faculty && typeof faculty === "string" && cleanTitleCase(faculty) === targetFaculty;
        });
    }

    return docs;
}