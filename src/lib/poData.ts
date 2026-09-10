export interface PODefinition {
    id: number;           // 1..11 for PO1..PO11, 13..15 for PSO1..PSO3
    code: string;         // "PO1", "PO2", ..., "PSO1", "PSO2", "PSO3"
    shortCode: string;    // "P1", "P2", ..., "PSO1", "PSO2", "PSO3"
    attribute: string;    // "Knowledge", "Analysis", "Design", etc.
    title: string;        // "Engineering Knowledge", etc.
    description: string;
}

export const DEFAULT_PO_DEFINITIONS: PODefinition[] = [
    {
        id: 1,
        code: "PO1",
        shortCode: "P1",
        attribute: "Knowledge",
        title: "Engineering Knowledge",
        description: "Apply knowledge of mathematics, natural science, computing, engineering fundamentals and an engineering specialization as specified in WK1 to WK4 respectively to develop to the solution of complex engineering problems."
    },
    {
        id: 2,
        code: "PO2",
        shortCode: "P2",
        attribute: "Analysis",
        title: "Problem Analysis",
        description: "Identify, formulate, review research literature and analyze complex engineering problems reaching substantiated conclusions with consideration for sustainable development. (WK1 to WK4)"
    },
    {
        id: 3,
        code: "PO3",
        shortCode: "P3",
        attribute: "Design",
        title: "Design/Development of Solutions",
        description: "Design creative solutions for complex engineering problems and design/develop systems/components/processes to meet identified needs with consideration for the public health and safety, whole-life cost, net zero carbon, culture, society and environment as required. (WK5)"
    },
    {
        id: 4,
        code: "PO4",
        shortCode: "P4",
        attribute: "Develop",
        title: "Conduct Investigations of Complex Problems",
        description: "Conduct investigations of complex engineering problems using research-based knowledge including design of experiments, modelling, analysis & interpretation of data to provide valid conclusions. (WK8)."
    },
    {
        id: 5,
        code: "PO5",
        shortCode: "P5",
        attribute: "Modern Tools",
        title: "Engineering Tool Usage",
        description: "Create, select and apply appropriate techniques, resources and modern engineering & IT tools, including prediction and modelling recognizing their limitations to solve complex engineering problems. (WK2 and WK6)"
    },
    {
        id: 6,
        code: "PO6",
        shortCode: "P6",
        attribute: "Engineer & Society",
        title: "The Engineer and the World",
        description: "Analyze and evaluate societal and environmental aspects while solving complex engineering problems for its impact on sustainability with reference to economy, health, safety, legal framework, culture and environment. (WK1, WK5 and WK8)."
    },
    {
        id: 7,
        code: "PO7",
        shortCode: "P7",
        attribute: "Ethics",
        title: "Ethics",
        description: "Apply ethical principles and commit to professional ethics, human values, diversity and inclusion; adhere to national & international laws. (WK9)."
    },
    {
        id: 8,
        code: "PO8",
        shortCode: "P8",
        attribute: "TeamWork",
        title: "Individual and Collaborative Team Work",
        description: "Function effectively as an individual, and as a member or leader in diverse/multi-disciplinary teams."
    },
    {
        id: 9,
        code: "PO9",
        shortCode: "P9",
        attribute: "Communication",
        title: "Communication",
        description: "Communicate effectively and inclusively within the engineering community and society at large, such as being able to comprehend and write effective reports and design documentation, make effective presentations considering cultural, language, and learning differences."
    },
    {
        id: 10,
        code: "PO10",
        shortCode: "P10",
        attribute: "Proj Mgt & Finance",
        title: "Project Management and Finance",
        description: "Apply knowledge and understanding of engineering management principles and economic decision-making and apply these to one’s own work, as a member and leader in a team, and to manage projects and in multidisciplinary environments."
    },
    {
        id: 11,
        code: "PO11",
        shortCode: "P11",
        attribute: "Life Long Learning",
        title: "Life-Long Learning",
        description: "Recognize the need for, and have the preparation and ability for i) independent and life-long learning ii) adaptability to new and emerging technologies and iii) critical thinking in the broadest context of technological change. (WK8) ."
    },
    {
        id: 13,
        code: "PSO1",
        shortCode: "PSO1",
        attribute: "AI",
        title: "AI Driven Innovation",
        description: "Graduates should be able to evolve AI based efficient domain specific processes for effective decision making in several domains such as business and governance domains."
    },
    {
        id: 14,
        code: "PSO2",
        shortCode: "PSO2",
        attribute: "DATA",
        title: "Data-Driven Decision Making Insight",
        description: "Graduates should be able to arrive at actionable fore sight, insight, hind sight from data for solving business and engineering problems."
    },
    {
        id: 15,
        code: "PSO3",
        shortCode: "PSO3",
        attribute: "RESEARCH",
        title: "Societal Intelligence Solutions",
        description: "Graduates should be able to create, select and apply the theoretical knowledge of AI and Data Analytics along with practical industrial tools and techniques to manage and solve wicked societal problems."
    }
];
