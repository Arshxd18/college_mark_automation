import { PIEntry } from "@/types";

export interface ExtendedPIEntry extends PIEntry {
    defaultYes?: {
        co1?: boolean;
        co2?: boolean;
        co3?: boolean;
        co4?: boolean;
        co5?: boolean;
        co6?: boolean;
    };
    /** Brief rationale explaining why this PI maps to the default COs */
    justification?: string;
}

export const COMPETENCY_DEFINITIONS: Record<string, string> = {
    "1.1": "1.1 Demonstrate competence in mathematical modeling",
    "1.2": "1.2 Demonstrate competence in basic sciences",
    "1.3": "1.3 Demonstrate competence in engineering fundamentals",
    "1.4": "1.4 Demonstrate competence in specialized engineering knowledge to the program",

    "2.1": "2.1 Demonstrate an ability to identify and formulate complex engineering problems",
    "2.2": "2.2 Demonstrate an ability to formulate a solution plan and methodology",
    "2.3": "2.3 Demonstrate an ability to formulate and interpret a model",
    "2.4": "2.4 Demonstrate an ability to execute a solution process and analyze results",

    "3.1": "3.1 Demonstrate an ability to define a complex open-ended problem in engineering terms",
    "3.2": "3.2 Demonstrate an ability to generate a diverse set of alternative design solutions",
    "3.3": "3.3 Demonstrate an ability to select optimal design scheme for further development",
    "3.4": "3.4 Demonstrate an ability to advance an engineering design to defined end state",

    "4.1": "4.1 Demonstrate an ability to conduct investigations of technical issues consistent with technical domain",
    "4.2": "4.2 Demonstrate an ability to design experiments to solve open-ended problems",
    "4.3": "4.3 Demonstrate an ability to analyze data and reach valid conclusions",

    "5.1": "5.1 Demonstrate an ability to identify/create modern engineering tools, techniques and resources",
    "5.2": "5.2 Demonstrate an ability to select and apply discipline-specific tools, techniques and resources",
    "5.3": "5.3 Demonstrate an ability to evaluate the suitability and limitations of tools",

    "6.1": "6.1 Demonstrate an ability to describe the engineering roles in a broader context pertaining to protection of the public and public interest, regulations, and safety",
    "6.2": "6.2 Demonstrate an understanding of professional engineering regulations, legislation, and standards relevant to the discipline and explain its importance",
    "6.3": "6.3 Demonstrate an understanding of the impact of engineering and industrial practices on society and environment",
    "6.4": "6.4 Demonstrate an ability to apply principles of sustainable design and development",

    "7.1": "7.1 Demonstrate an ability to recognize ethical dilemmas",
    "7.2": "7.2 Demonstrate an ability to apply the Code of Ethics",

    "8.1": "8.1 Demonstrate an ability to form a team and define a role for each member",
    "8.2": "8.2 Demonstrate effective individual and team operations - communications, problem-solving, conflict resolution and leadership",
    "8.3": "8.3 Demonstrate success in a team-based project",

    "9.1": "9.1 Demonstrate an ability to comprehend technical literature and document preparation",
    "9.2": "9.2 Demonstrate competence in listening, speaking, and presentation",
    "9.3": "9.3 Demonstrate the ability to integrate different modes of communication",

    "10.1": "10.1 Demonstrate an ability to evaluate the economic and financial performance of an engineering activity",
    "10.2": "10.2 Demonstrate an ability to compare and contrast the costs/benefits of alternate approaches",
    "10.3": "10.3 Demonstrate an ability to plan/manage an engineering activity within time and budget constraints",

    "11.1": "11.1 Demonstrate an ability to identify gaps in knowledge and a strategy to close these",
    "11.2": "11.2 Demonstrate an ability to identify changing trends in engineering knowledge and practice",
    "11.3": "11.3 Demonstrate an ability to identify and access sources for new information",

    "12.1": "12.1 Recognize the need for, and have the preparation and ability to engage in independent and life-long learning",

    "13": "to develop, adapt and apply AI-based/domain-specific processes to enhance efficiency",
    "14": "to extract hindsight, insight, and foresight from data using analytical and AI-driven methods",
    "15": "to create, adapt, and apply AI and Data Analytics theories and industrial tools to manage and solve wicked problems",
};

export function getCompetencyForPI(pi: PIEntry): string {
    if (pi.competency) return pi.competency;
    if (pi.poNumber >= 13) {
        return COMPETENCY_DEFINITIONS[String(pi.poNumber)] || "Domain specific competency";
    }
    const parts = pi.id.split(".");
    if (parts.length >= 2) {
        const key = `${parts[0]}.${parts[1]}`;
        if (COMPETENCY_DEFINITIONS[key]) return COMPETENCY_DEFINITIONS[key];
    }
    return COMPETENCY_DEFINITIONS[String(pi.poNumber)] || `Competency ${pi.id}`;
}

/**
 * Returns a short justification explaining why this PI is mapped to the
 * course's COs by default. The rationale is derived from the PO domain,
 * the competency sub-category, and the PI descriptor keywords.
 */
export function getJustificationForPI(pi: ExtendedPIEntry): string {
    if (pi.justification) return pi.justification;

    const desc = pi.descriptor.toLowerCase();
    const poNum = pi.poNumber;
    const parts = pi.id.split(".");
    const compKey = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : "";

    // PSO specific
    if (poNum >= 13) {
        if (poNum === 13) return "This course directly develops AI/ML processes applicable to real-world engineering efficiency problems.";
        if (poNum === 14) return "The subject deals with data analysis and AI-driven insight extraction relevant to business and engineering decision-making.";
        if (poNum === 15) return "The course applies AI & Data Analytics theories and tools (ML frameworks, analytics pipelines) to address complex societal challenges.";
    }

    // PO1: Engineering Knowledge
    if (poNum === 1) {
        if (desc.includes("discrete") || desc.includes("linear algebra") || desc.includes("statistics")) return "The course requires mathematical foundations (linear algebra, statistics, discrete structures) that directly underpin AI/ML algorithms taught.";
        if (desc.includes("natural science")) return "Not directly addressed; natural science laws are not a primary focus of this AI/Data Science curriculum.";
        if (desc.includes("engineering fundamentals")) return "Core CS and engineering fundamentals (algorithms, data structures, systems) are prerequisite knowledge applied throughout the course.";
        if (desc.includes("computer science") || desc.includes("information technology")) return "The course directly applies CS/IT principles including algorithms, data modeling, and computational thinking to engineering problems.";
        return "This PI aligns with the foundational knowledge domains required to understand and apply the subject content.";
    }

    // PO2: Problem Analysis
    if (poNum === 2) {
        if (compKey === "2.1") return "The course trains students to clearly define AI/data problems, set objectives (e.g., accuracy targets), and scope the analysis.";
        if (compKey === "2.2") return "Students learn structured methodologies to decompose complex AI problems and plan solution pipelines (data → model → evaluation).";
        if (compKey === "2.3") return "Model formulation is central — students build mathematical and statistical models of datasets and system behaviors.";
        if (compKey === "2.4") return "Students execute solution pipelines, validate model outputs against benchmarks, and interpret error metrics to draw conclusions.";
        return "Problem analysis skills are exercised when students identify, model, and solve data/AI engineering challenges.";
    }

    // PO3: Design/Development of Solutions
    if (poNum === 3) {
        if (compKey === "3.1") return "Students define requirements for AI systems (input data, output format, performance thresholds) before designing solutions.";
        if (compKey === "3.2") return "Multiple AI architectures and algorithms are explored, compared, and prototyped to produce diverse candidate solutions.";
        if (compKey === "3.3") return "Students apply structured evaluation criteria (F1 score, AUC, RMSE) to select the optimal model or design.";
        if (compKey === "3.4") return "Solutions are refined through hyperparameter tuning, architectural improvements, and iterative testing against constraints.";
        return "Design skills are applied when engineering end-to-end AI/data pipelines from requirement to deployed solution.";
    }

    // PO4: Investigation
    if (poNum === 4) {
        if (compKey === "4.1") return "Students investigate complex AI/data problems by scoping the question, selecting tools, and collecting/validating data.";
        if (compKey === "4.2") return "Experimental design (train/test splits, cross-validation, ablation studies) is a core part of the course.";
        if (compKey === "4.3") return "Students analyze model outputs, interpret confusion matrices, and reach valid conclusions about model performance.";
        return "Investigation skills are exercised through empirical experiments on datasets and comparative model studies.";
    }

    // PO5: Modern Tools
    if (poNum === 5) {
        if (compKey === "5.1") return "Students identify and learn modern AI/ML tools (TensorFlow, PyTorch, scikit-learn, Pandas) applicable to their domain.";
        if (compKey === "5.2") return "Domain-specific tools and frameworks are applied hands-on during lab sessions and project work.";
        if (compKey === "5.3") return "Students critically evaluate tool limitations (scalability, interpretability, latency) when choosing the appropriate framework.";
        return "Tool proficiency is built through practical exercises using industry-standard AI/data engineering tools.";
    }

    // PO6: Engineer & Society
    if (poNum === 6) {
        if (compKey === "6.1") return "Students understand professional responsibilities in deploying AI systems that affect public safety and welfare.";
        if (compKey === "6.2") return "Students learn about relevant engineering and data governance regulations (GDPR, IEEE Ethics) that impact AI deployment.";
        if (compKey === "6.3") return "The societal impact of AI automation and data-driven decisions (bias, fairness, displacement) is examined in the course.";
        if (compKey === "6.4") return "Sustainable AI principles (energy-efficient models, green computing) are highlighted in the curriculum.";
        return "The course addresses responsible engineering by situating AI solutions within societal and regulatory contexts.";
    }

    // PO7: Ethics
    if (poNum === 7) {
        return "AI Ethics — including algorithmic bias, data privacy, and fairness — is a key discussion topic woven throughout the course.";
    }

    // PO8: Individual & Team
    if (poNum === 8) {
        if (compKey === "8.1") return "Project work involves forming groups, assigning roles (data engineer, model developer, evaluator), and collaborating effectively.";
        if (compKey === "8.2") return "Students engage in team-based problem solving, peer reviews, and collaborative code reviews for AI project deliverables.";
        if (compKey === "8.3") return "End-of-semester team projects demonstrate coordinated execution, integration of individual contributions, and project success.";
        return "Team collaboration is exercised through group assignments and project-based learning activities.";
    }

    // PO9: Communication
    if (poNum === 9) {
        if (compKey === "9.1") return "Students read research papers, write technical reports, and document AI system designs clearly for academic and professional audiences.";
        if (compKey === "9.2") return "Oral presentations of project outcomes and demo sessions build speaking and presentation skills.";
        if (compKey === "9.3") return "Students communicate findings through multiple formats — reports, presentations, code notebooks, and dashboards.";
        return "Communication skills are developed through documentation, presentations, and written reports of AI project outcomes.";
    }

    // PO10: Project Mgmt
    if (poNum === 10) {
        return "AI project planning — resource estimation, timeline, cost of computation — is discussed in the context of real-world project management.";
    }

    // PO11: Life-Long Learning
    if (poNum === 11) {
        return "AI is a fast-evolving field; the course cultivates habits of self-directed learning, following research trends, and adapting to new frameworks.";
    }

    // PO12
    if (poNum === 12) {
        return "Students are encouraged to engage with emerging AI research, online courses, and self-study to sustain lifelong professional development.";
    }

    return "This PI is mapped based on alignment between the course learning outcomes and the NBA performance indicator descriptor.";
}

export const DEFAULT_PI_LIST: ExtendedPIEntry[] = [
    // ── PO1   Engineering Knowledge ─────────────────────────────
    {
        id: "1.1.1",
        poNumber: 1,
        competency: undefined,
        descriptor: "Apply the knowledge of discrete structures, linear algebra, statistics, numerical techniques and theoretical computer science to solve problems",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "1.1.2",
        poNumber: 1,
        competency: undefined,
        descriptor: "Apply the concepts of probability, statistics and queuing theory in modeling of computer based system, data and network protocols.",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "1.2.1",
        poNumber: 1,
        competency: undefined,
        descriptor: "Apply laws of natural science to an engineering problem",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    {
        id: "1.3.1",
        poNumber: 1,
        competency: undefined,
        descriptor: "Apply engineering fundamentals",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "1.4.1",
        poNumber: 1,
        competency: undefined,
        descriptor: "Apply theory and principles of computer science and information technology to solve an engineering problem.",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 2 Problem Analysis ─────────────────────────────
    {
        id: "2.1.1",
        poNumber: 2,
        competency: undefined,
        descriptor: "Articulate problem statements and identify objectives",
        defaultYes: {"co1":false,"co2":true,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.1.2",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify engineering systems, variables, and parameters to solve problems",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.1.3",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify the mathematical, engineering and other relevant knowledge that applies to a given problem",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "2.2.1",
        poNumber: 2,
        competency: undefined,
        descriptor: "Reframe complex problems into interconnected sub-problems",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.2.2",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify, assemble and evaluate information and resources",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":false},
    },
    {
        id: "2.2.3",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify existing processes/solution methods for solving the problem, including forming justified approximations and assumptions",
        defaultYes: {"co1":false,"co2":true,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "2.2.4",
        poNumber: 2,
        competency: undefined,
        descriptor: "Compare and contrast alternative solution processes to select the best process",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.3.1",
        poNumber: 2,
        competency: undefined,
        descriptor: "Combine scientific principles and engineering concepts to formulate models (mathematical or otherwise) of a system or process",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":false},
    },
    {
        id: "2.3.2",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify assumptions necessary to allow modeling at the required level of accuracy",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.4.1",
        poNumber: 2,
        competency: undefined,
        descriptor: "Apply engineering mathematics and computations to solve mathematical models",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.4.2",
        poNumber: 2,
        competency: undefined,
        descriptor: "Produce and validate results through skilful use of contemporary engineering tools",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.4.3",
        poNumber: 2,
        competency: undefined,
        descriptor: "Identify sources of error in the solution process and limitations of the solution",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "2.4.4",
        poNumber: 2,
        competency: undefined,
        descriptor: "Extract desired understanding and conclusions consistent with objectives and limitations",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    // ── PO3  Design/Development of Solutions ─────────────────────────────
    {
        id: "3.1.1",
        poNumber: 3,
        competency: undefined,
        descriptor: "Recognize that need analysis is key to good problem definition",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.1.2",
        poNumber: 3,
        competency: undefined,
        descriptor: "Elicit and document engineering requirements from stakeholders",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.1.3",
        poNumber: 3,
        competency: undefined,
        descriptor: "Synthesize engineering requirements from a review of the state-of-the-art",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.1.4",
        poNumber: 3,
        competency: undefined,
        descriptor: "Extract engineering requirements from relevant engineering codes and standards",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.1.5",
        poNumber: 3,
        competency: undefined,
        descriptor: "Explore and synthesize requirements considering health, safety, environmental, cultural and societal issues",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.1.6",
        poNumber: 3,
        competency: undefined,
        descriptor: "Determine design objectives, functional requirements and arrive at specifications",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.2.1",
        poNumber: 3,
        competency: undefined,
        descriptor: "Apply formal idea generation tools to develop multiple engineering design solutions",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.2.2",
        poNumber: 3,
        competency: undefined,
        descriptor: "Build models/prototypes/algorithms to develop a diverse set of design solutions",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.2.3",
        poNumber: 3,
        competency: undefined,
        descriptor: "Identify suitable criteria for the evaluation of alternate design solutions",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.3.1",
        poNumber: 3,
        competency: undefined,
        descriptor: "Apply formal decision-making tools to select optimal engineering design solutions",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.3.2",
        poNumber: 3,
        competency: undefined,
        descriptor: "Consult with domain experts and stakeholders to select candidate design solution for further development",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.4.1",
        poNumber: 3,
        competency: undefined,
        descriptor: "Refine a conceptual design into a detailed design within the existing constraints",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "3.4.2",
        poNumber: 3,
        competency: undefined,
        descriptor: "Generate information through appropriate tests to improve or revise the design",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 4  Conduct Investigations of Complex Problems ─────────────────────────────
    {
        id: "4.1.1",
        poNumber: 4,
        competency: undefined,
        descriptor: "Define a problem, its scope and importance for purposes of investigation",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "4.1.2",
        poNumber: 4,
        competency: undefined,
        descriptor: "Examine the relevant methods, tools and techniques of experiment design, system calibration, data acquisition, analysis and presentation",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "4.1.3",
        poNumber: 4,
        competency: undefined,
        descriptor: "Apply appropriate instrumentation and/or software tools to make measurements",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "4.1.4",
        poNumber: 4,
        competency: undefined,
        descriptor: "Establish a relationship between measured data and underlying principles",
        defaultYes: {"co1":false,"co2":true,"co3":false,"co4":true,"co5":true,"co6":false},
    },
    {
        id: "4.2.1",
        poNumber: 4,
        competency: undefined,
        descriptor: "Design and develop an experimental approach, specify appropriate equipment and procedures",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":false,"co5":false,"co6":true},
    },
    {
        id: "4.2.2",
        poNumber: 4,
        competency: undefined,
        descriptor: "Understand the importance of statistical design of experiments and choose an appropriate experimental design plan",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "4.3.1",
        poNumber: 4,
        competency: undefined,
        descriptor: "Use appropriate procedures, tools and techniques to conduct experiments and collect data",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "4.3.2",
        poNumber: 4,
        competency: undefined,
        descriptor: "Analyze data for trends and correlations, stating possible errors and limitations",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "4.3.3",
        poNumber: 4,
        competency: undefined,
        descriptor: "Represent data (in tabular and/or graphical forms) to facilitate analysis and explanation",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "4.3.4",
        poNumber: 4,
        competency: undefined,
        descriptor: "Synthesize information and knowledge from raw data to reach appropriate conclusions",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 5  Engineering Tool Usage ─────────────────────────────
    {
        id: "5.1.1",
        poNumber: 5,
        competency: undefined,
        descriptor: "Identify modern engineering tools such as AI/ML frameworks, data analytics platforms, modeling tools, techniques and resources",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":true},
    },
    {
        id: "5.1.2",
        poNumber: 5,
        competency: undefined,
        descriptor: "Create/adapt/modify/extend tools and techniques to solve engineering problems",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "5.2.1",
        poNumber: 5,
        competency: undefined,
        descriptor: "Identify the strengths and limitations of tools for (i) acquiring information, (ii) modeling and simulating, (iii) monitoring system performance, and (iv) creating engineering designs",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "5.2.2",
        poNumber: 5,
        competency: undefined,
        descriptor: "Demonstrate proficiency in using discipline-specific tools",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":false,"co5":true,"co6":false},
    },
    {
        id: "5.3.1",
        poNumber: 5,
        competency: undefined,
        descriptor: "Discuss limitations and validate tools, techniques and resources",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "5.3.2",
        poNumber: 5,
        competency: undefined,
        descriptor: "Verify the credibility of results from tool use with reference to accuracy, limitations, and assumptions",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 6  The Engineer and the World ─────────────────────────────
    {
        id: "6.1.1",
        poNumber: 6,
        competency: undefined,
        descriptor: "Identify and describe various engineering roles particularly as pertains to protection of the public and public interest at global, regional and local levels",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "6.2.1",
        poNumber: 6,
        competency: undefined,
        descriptor: "Interpret legislation, regulations, codes, and standards relevant to the discipline and explain its contribution to the protection of the public",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "6.3.1",
        poNumber: 6,
        competency: undefined,
        descriptor: "Identify risks/impacts in the life-cycle of an engineering product or activity",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "6.3.2",
        poNumber: 6,
        competency: undefined,
        descriptor: "Understand the relationship between technical, socio-economic and environmental dimensions of sustainability",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    {
        id: "6.4.1",
        poNumber: 6,
        competency: undefined,
        descriptor: "Describe management techniques for sustainable development",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    {
        id: "6.4.2",
        poNumber: 6,
        competency: undefined,
        descriptor: "Apply principles of preventive engineering and sustainable development to engineering activities or products",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    // ── PO 7 Ethics ─────────────────────────────
    {
        id: "7.1.1",
        poNumber: 7,
        competency: undefined,
        descriptor: "Identify situations of unethical professional conduct and propose ethical alternatives",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "7.2.1",
        poNumber: 7,
        competency: undefined,
        descriptor: "Identify tenets of professional code of ethics",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    {
        id: "7.2.2",
        poNumber: 7,
        competency: undefined,
        descriptor: "Examine and apply moral & ethical principles to known case studies",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":true},
    },
    {
        id: "7.2.3",
        poNumber: 7,
        competency: undefined,
        descriptor: "Demonstrate commitment to human values, diversity and inclusion",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    // ── PO 8  Individual and Collaborative Team Work ─────────────────────────────
    {
        id: "8.1.1",
        poNumber: 8,
        competency: undefined,
        descriptor: "Recognize a variety of working and learning preferences; appreciate the value of diversity on a team",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "8.1.2",
        poNumber: 8,
        competency: undefined,
        descriptor: "Implement the norms of practice (e.g. rules, roles, charters, agendas, etc.) of effective team work to accomplish a goal",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "8.2.1",
        poNumber: 8,
        competency: undefined,
        descriptor: "Demonstrate effective communication, problem-solving, conflict resolution and leadership skills",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "8.2.2",
        poNumber: 8,
        competency: undefined,
        descriptor: "Treat other team members respectfully",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "8.2.3",
        poNumber: 8,
        competency: undefined,
        descriptor: "Listen to other members",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":false},
    },
    {
        id: "8.2.4",
        poNumber: 8,
        competency: undefined,
        descriptor: "Maintain composure in difficult situations",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "8.3.1",
        poNumber: 8,
        competency: undefined,
        descriptor: "Present results as a team, with smooth integration of contributions from all individual efforts",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 9  Communication ─────────────────────────────
    {
        id: "9.1.1",
        poNumber: 9,
        competency: undefined,
        descriptor: "Read, understand and interpret technical and non-technical information",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.1.2",
        poNumber: 9,
        competency: undefined,
        descriptor: "Produce clear, well-constructed, and well-supported written engineering documents",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.1.3",
        poNumber: 9,
        competency: undefined,
        descriptor: "Create flow in a document or presentation - a logical progression of ideas so that the main point is clear",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.2.1",
        poNumber: 9,
        competency: undefined,
        descriptor: "Listen to and comprehend information, instructions, and viewpoints of others",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.2.2",
        poNumber: 9,
        competency: undefined,
        descriptor: "Deliver effective oral presentations to technical and non-technical audiences",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.3.1",
        poNumber: 9,
        competency: undefined,
        descriptor: "Create engineering-standard figures, reports and drawings to complement writing and presentations",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.3.2",
        poNumber: 9,
        competency: undefined,
        descriptor: "Use a variety of media effectively to convey a message in a document or presentation",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "9.3.3",
        poNumber: 9,
        competency: undefined,
        descriptor: "Communicate inclusively considering cultural, language and learning differences",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    // ── PO 10  Project Management and Finance ─────────────────────────────
    {
        id: "10.1.1",
        poNumber: 10,
        competency: undefined,
        descriptor: "Describe various economic and financial costs/benefits of an engineering activity",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":true,"co6":false},
    },
    {
        id: "10.1.2",
        poNumber: 10,
        competency: undefined,
        descriptor: "Analyze different forms of financial statements to evaluate the financial status of an engineering project",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":false},
    },
    {
        id: "10.2.1",
        poNumber: 10,
        competency: undefined,
        descriptor: "Analyze and select the most appropriate proposal based on economic and financial considerations",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":false,"co6":true},
    },
    {
        id: "10.3.1",
        poNumber: 10,
        competency: undefined,
        descriptor: "Identify the tasks required to complete an engineering activity and the resources required to complete the tasks",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    {
        id: "10.3.2",
        poNumber: 10,
        competency: undefined,
        descriptor: "Use project management tools to schedule an engineering project so it is completed on time and on budget",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    // ── PO 11  Life-Long Learning ─────────────────────────────
    {
        id: "11.1.1",
        poNumber: 11,
        competency: undefined,
        descriptor: "Describe the rationale for the requirement for continuing professional development",
        defaultYes: {"co1":true,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "11.1.2",
        poNumber: 11,
        competency: undefined,
        descriptor: "Identify deficiencies or gaps in knowledge and demonstrate an ability to source information to close this gap",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "11.2.1",
        poNumber: 11,
        competency: undefined,
        descriptor: "Identify historic points of technological advance in engineering that required practitioners to seek education to stay current",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "11.2.2",
        poNumber: 11,
        competency: undefined,
        descriptor: "Recognize the need and be able to clearly explain why it is vitally important to keep current regarding new developments in the field",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "11.3.1",
        poNumber: 11,
        competency: undefined,
        descriptor: "Source and comprehend technical literature and other credible sources of information",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "11.3.2",
        poNumber: 11,
        competency: undefined,
        descriptor: "Analyze sourced technical and popular information for feasibility, viability, sustainability, etc.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    // ── PSO 1 AI Graduates should be able to evolve AI based efficient domain specific processes for effective decision making ─────────────────────────────
    {
        id: "PSO.1",
        poNumber: 13,
        competency: undefined,
        descriptor: "design and implement AI-based, domain-specific process models",
        defaultYes: {"co1":true,"co2":true,"co3":false,"co4":true,"co5":true,"co6":false},
    },
    {
        id: "PSO.2",
        poNumber: 13,
        competency: undefined,
        descriptor: "apply appropriate AI techniques (e.g., ML, analytics, optimization) to improve efficiency and effectiveness of domain-specific processes.",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":false,"co6":true},
    },
    {
        id: "PSO.3",
        poNumber: 13,
        competency: undefined,
        descriptor: "evaluate AI-driven solutions using relevant performance metrics to justify decisions and recommendations.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":false,"co5":true,"co6":true},
    },
    // ── PSO 2 Graduates should be able to arrive at actionable foresight, insight, hindsight from data for solving business and engineering problems ─────────────────────────────
    {
        id: "PSO.1",
        poNumber: 14,
        competency: undefined,
        descriptor: "Apply descriptive analytics to derive hindsight from historical data.",
        defaultYes: {"co1":true,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.2",
        poNumber: 14,
        competency: undefined,
        descriptor: "Use diagnostic and predictive analytics to generate insight into patterns, trends, and root causes.",
        defaultYes: {"co1":false,"co2":true,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.3",
        poNumber: 14,
        competency: undefined,
        descriptor: "Develop predictive and prescriptive models to produce foresight for future-oriented decisions.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.4",
        poNumber: 14,
        competency: undefined,
        descriptor: "Translate analytical results into actionable recommendations addressing real-world business and engineering challenges.",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.5",
        poNumber: 14,
        competency: undefined,
        descriptor: "Validate decisions using appropriate metrics, visualizations, and domain constraints.",
        defaultYes: {"co1":false,"co2":true,"co3":false,"co4":false,"co5":true,"co6":true},
    },
    // ── PSO 3 Graduates should be able to create, select and apply theoretical knowledge of AI and Data Analytics along with practical industrial tools to manage and solve wicked societal problems ─────────────────────────────
    {
        id: "PSO.1",
        poNumber: 15,
        competency: undefined,
        descriptor: "Identify and formulate wicked societal problems considering technical, social, ethical, and environmental dimensions.",
        defaultYes: {"co1":false,"co2":false,"co3":false,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.2",
        poNumber: 15,
        competency: undefined,
        descriptor: "Select and apply appropriate AI and Data Analytics theories to address problem complexity and uncertainty.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.3",
        poNumber: 15,
        competency: undefined,
        descriptor: "Use industry-standard tools and platforms (e.g., analytics frameworks, ML platforms, visualization tools) for solution development.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.4",
        poNumber: 15,
        competency: undefined,
        descriptor: "Design and implement data-driven models that integrate multiple stakeholder perspectives.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
    {
        id: "PSO.5",
        poNumber: 15,
        competency: undefined,
        descriptor: "Evaluate solutions for effectiveness, scalability, ethical impact, and sustainability.",
        defaultYes: {"co1":false,"co2":false,"co3":true,"co4":true,"co5":true,"co6":true},
    },
];

export function getPIsByPO(piList: ExtendedPIEntry[] = DEFAULT_PI_LIST): Record<number, ExtendedPIEntry[]> {
    const map: Record<number, ExtendedPIEntry[]> = {};
    for (const pi of piList) {
        if (!map[pi.poNumber]) map[pi.poNumber] = [];
        map[pi.poNumber].push(pi);
    }
    return map;
}
