/**
 * piData.ts
 * Default NBA/ABET Programme Indicator (PI) dataset.
 * Faculty can override these values in the UI.
 *
 * Structure: 12 Programme Outcomes (PO1–PO12), each with 3 PIs.
 * Total: 36 PIs.
 */

import { PIEntry } from "@/types";

export const DEFAULT_PI_LIST: PIEntry[] = [
    // PO1 — Engineering Knowledge
    { id: "PI-1.1.1", poNumber: 1, competency: "Engineering Knowledge", descriptor: "Ability to recall and describe fundamental principles of mathematics and engineering sciences" },
    { id: "PI-1.2.1", poNumber: 1, competency: "Engineering Knowledge", descriptor: "Ability to apply core engineering concepts to formulate and solve computational and analytical problems" },
    { id: "PI-1.3.1", poNumber: 1, competency: "Engineering Knowledge", descriptor: "Ability to integrate knowledge from mathematics, science and engineering to solve complex problems" },

    // PO2 — Problem Analysis
    { id: "PI-2.1.1", poNumber: 2, competency: "Problem Analysis", descriptor: "Ability to identify engineering problems by gathering data, defining boundaries and system requirements" },
    { id: "PI-2.2.1", poNumber: 2, competency: "Problem Analysis", descriptor: "Ability to formulate and model engineering problems using mathematical and simulation techniques" },
    { id: "PI-2.3.1", poNumber: 2, competency: "Problem Analysis", descriptor: "Ability to analyze engineering problems and interpret results using critical thinking and inference" },

    // PO3 — Design/Development of Solutions
    { id: "PI-3.1.1", poNumber: 3, competency: "Design/Development", descriptor: "Ability to design systems, components or processes to meet desired specifications and constraints" },
    { id: "PI-3.2.1", poNumber: 3, competency: "Design/Development", descriptor: "Ability to develop algorithms, software, circuits or systems addressing complex engineering problems" },
    { id: "PI-3.3.1", poNumber: 3, competency: "Design/Development", descriptor: "Ability to evaluate design alternatives considering safety, societal, economic and environmental factors" },

    // PO4 — Conduct Investigations of Complex Problems
    { id: "PI-4.1.1", poNumber: 4, competency: "Investigation", descriptor: "Ability to design and conduct experiments relevant to engineering problems" },
    { id: "PI-4.2.1", poNumber: 4, competency: "Investigation", descriptor: "Ability to collect, process and analyze experimental data using statistical methods" },
    { id: "PI-4.3.1", poNumber: 4, competency: "Investigation", descriptor: "Ability to draw valid conclusions from experimental results and experimental investigations" },

    // PO5 — Modern Tool Usage
    { id: "PI-5.1.1", poNumber: 5, competency: "Modern Tool Usage", descriptor: "Ability to select and use appropriate modern engineering software tools, techniques and resources" },
    { id: "PI-5.2.1", poNumber: 5, competency: "Modern Tool Usage", descriptor: "Ability to apply computational tools for simulation, modeling and data analysis" },
    { id: "PI-5.3.1", poNumber: 5, competency: "Modern Tool Usage", descriptor: "Ability to understand the limitations of modern engineering tools in practical applications" },

    // PO6 — The Engineer and Society
    { id: "PI-6.1.1", poNumber: 6, competency: "Engineer and Society", descriptor: "Ability to understand the social, cultural and legal responsibilities of engineering practice" },
    { id: "PI-6.2.1", poNumber: 6, competency: "Engineer and Society", descriptor: "Ability to assess the impact of engineering solutions on society and demonstrate awareness of health and safety risks" },
    { id: "PI-6.3.1", poNumber: 6, competency: "Engineer and Society", descriptor: "Ability to apply engineering design decisions while considering societal needs and welfare" },

    // PO7 — Environment and Sustainability
    { id: "PI-7.1.1", poNumber: 7, competency: "Environment & Sustainability", descriptor: "Ability to understand the impact of engineering solutions on the environment and ecosystem" },
    { id: "PI-7.2.1", poNumber: 7, competency: "Environment & Sustainability", descriptor: "Ability to apply principles of sustainable development in engineering design and practice" },
    { id: "PI-7.3.1", poNumber: 7, competency: "Environment & Sustainability", descriptor: "Ability to propose environmentally responsible solutions and evaluate their sustainability" },

    // PO8 — Ethics
    { id: "PI-8.1.1", poNumber: 8, competency: "Ethics", descriptor: "Ability to demonstrate professional and ethical responsibility in engineering practice" },
    { id: "PI-8.2.1", poNumber: 8, competency: "Ethics", descriptor: "Ability to recognize ethical issues in engineering and apply appropriate professional standards" },
    { id: "PI-8.3.1", poNumber: 8, competency: "Ethics", descriptor: "Ability to commit to professional code of ethics and understand intellectual property and confidentiality" },

    // PO9 — Individual and Team Work
    { id: "PI-9.1.1", poNumber: 9, competency: "Individual & Team Work", descriptor: "Ability to work effectively as an individual and contribute to multi-disciplinary team tasks" },
    { id: "PI-9.2.1", poNumber: 9, competency: "Individual & Team Work", descriptor: "Ability to collaborate, coordinate and communicate within a team to achieve project objectives" },
    { id: "PI-9.3.1", poNumber: 9, competency: "Individual & Team Work", descriptor: "Ability to lead and support teams in completing technical and engineering tasks" },

    // PO10 — Communication
    { id: "PI-10.1.1", poNumber: 10, competency: "Communication", descriptor: "Ability to communicate technical information clearly through written reports and documentation" },
    { id: "PI-10.2.1", poNumber: 10, competency: "Communication", descriptor: "Ability to present engineering results effectively through oral presentations and visual aids" },
    { id: "PI-10.3.1", poNumber: 10, competency: "Communication", descriptor: "Ability to understand and use technical communication in professional engineering contexts" },

    // PO11 — Project Management and Finance
    { id: "PI-11.1.1", poNumber: 11, competency: "Project Management", descriptor: "Ability to plan, execute and manage engineering projects within budget and time constraints" },
    { id: "PI-11.2.1", poNumber: 11, competency: "Project Management", descriptor: "Ability to apply project management principles to multidisciplinary engineering projects" },
    { id: "PI-11.3.1", poNumber: 11, competency: "Project Management", descriptor: "Ability to understand entrepreneurship, financial planning and management in engineering projects" },

    // PO12 — Life-long Learning
    { id: "PI-12.1.1", poNumber: 12, competency: "Life-long Learning", descriptor: "Ability to identify knowledge gaps and independently pursue self-learning through resources and research" },
    { id: "PI-12.2.1", poNumber: 12, competency: "Life-long Learning", descriptor: "Ability to engage in continuing professional development and keep pace with emerging technologies" },
    { id: "PI-12.3.1", poNumber: 12, competency: "Life-long Learning", descriptor: "Ability to adapt to changing engineering disciplines and contribute to knowledge creation" },
];

/** Group PIs by PO number */
export function getPIsByPO(piList: PIEntry[]): Record<number, PIEntry[]> {
    const grouped: Record<number, PIEntry[]> = {};
    for (const pi of piList) {
        if (!grouped[pi.poNumber]) grouped[pi.poNumber] = [];
        grouped[pi.poNumber].push(pi);
    }
    return grouped;
}
