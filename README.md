**CO Marks Automation System – Next.js**

A Comprehensive Course Outcome (CO) Attainment Automation System designed to replace manual Excel-based Internal assessment calculations with a dynamic, web-based solution.

This project focuses on automated CO computation, flexible question-to-CO mapping, part-wise breakdown analysis, performance visualization, and structured Excel report generation — all deployed as a single application on Vercel.

⸻

Project Overview

Designed a real-world Internal Assessment CO Management System with the following highlights:

• Supports both Manual Entry Mode and Upload & Auto-Analyze Mode
• Allows dynamic configuration of Maximum Marks and CO Mapping per Question
• Automatically computes CO-wise totals, percentages, and part-wise analysis
• Generates structured “INT TOTAL” style reports used in academic institutions
• Provides performance visualization using interactive charts
• Exports fully formatted Excel reports with conditional highlighting
• Deployed as a single unified application on Vercel (no external backend hosting)

⸻

System Design

The application is structured into two primary operational modes:

1️⃣ Manual Entry Mode

• Faculty defines Academic Year and Test Type (Internal 1 / 2 / 3)
• Configure maximum marks per question
• Assign CO1–CO6 dynamically for each question
• Enter student marks in a spreadsheet-style interface
• Automatic validation and instant recalculation

2️⃣ Upload & Auto-Analyze Mode

• Upload Excel template (.xlsx)
• Automatically detects:
• Question columns
• Maximum marks row
• CO mapping row
• Student data
• Generates complete CO summary instantly
• Applies automatic performance-based highlighting
• Exports analyzed results in formatted Excel

⸻

Calculation Logic
CO Attainment Value

CO_Value = Sum of marks obtained in all questions mapped to that CO

CO Attainment Percentage

CO% = (CO_Value / CO_Max_Marks) × 100

• If CO_Max_Marks = 0 → percentage displayed as “-” (no divide-by-zero errors)

Part-Wise Breakdown

• Part A → Q1–Q10
• Part B (a) → Q11a–Q16a
• Part B (b) → Q11b–Q16b

Average %

AVG% = Average of available CO% values (excluding COs with 0 max)

Total Examination Marks = 180 (default configuration)

⸻

Performance Highlighting

The system automatically applies visual indicators:

• 🟢 ≥ 60% → Good Attainment
• 🟡 40%–59% → Moderate Attainment
• 🔴 < 40% → Needs Improvement
• ⚪ CO with 0 maximum → Not Applicable

Highlights are applied both in the web interface and exported Excel reports.

⸻

Visualization Dashboard

Interactive charts provide academic insights:

• CO-wise class average percentage
• Student total marks distribution
• CO percentage breakdown per student

Designed for clarity and academic reporting.

⸻

Excel Export System

• Generates formatted .xlsx reports
• Includes metadata (Academic Year, Test Type)
• Displays:
• Part-wise CO totals
• Total CO maximum
• Student-wise CO values and percentages
• Conditional formatting applied inside Excel
• Implemented using Next.js Serverless API route

⸻

Technical Architecture

• Framework – Next.js (App Router)
• Styling – Tailwind CSS
• State Management – React Context / Local State
• Excel Parsing – xlsx
• Excel Export – exceljs
• Charts – Recharts / Chart.js
• Animations – Framer Motion
• Deployment – Vercel (Single Deployment)

All data remains client-side with optional localStorage safety. No backend database is used.

⸻

Key Modules

• Academic Setup & Metadata
• Question Configuration & CO Mapping
• Student Marks Entry Grid
• CO Calculation Engine
• Upload Analyzer & Parser
• Visualization Dashboard
• Excel Export Engine

⸻

Key Learnings

• Dynamic CO mapping and academic evaluation logic
• Designing scalable calculation engines for structured reporting
• Excel parsing and generation in serverless environments
• Performance visualization for academic analytics
• Single-deployment architecture using Next.js and Vercel

⸻

Author

Mohamed Arshad M
Engineering Student | Data & Systems Enthusiast
