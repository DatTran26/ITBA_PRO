import type { QuestionType } from "@/components/question-bank/question-bank-types";

// Question-type matrix presets + role/level distribution logic for the create-test
// workbench. Pure functions — split out of create-test-workbench.tsx.

export const emptyMatrix = {
    "Single Choice": 0, "Multiple Choice": 0, "True / False": 0,
    "Matching": 0, "Fill in the Blank": 0, "Scenario-based": 0,
    "Ordering / Sequence": 0, "Reading Comprehension": 0,
    "Priority / Severity": 0, "Short Case Study": 0,
    "Image / Diagram Based": 0, "Communication / Response": 0,
    "Short Answer": 0, "SQL / Logic / Code": 0,
};

export const MATRIX_TYPE_MAP: Record<string, QuestionType> = {
    "Single Choice": "single_choice",
    "Multiple Choice": "multiple_choice",
    "True / False": "true_false",
    "Matching": "matching",
    "Fill in the Blank": "fill_blank",
    "Scenario-based": "scenario",
    "Ordering / Sequence": "ordering",
    "Reading Comprehension": "reading_comprehension",
    "Priority / Severity": "priority_severity",
    "Short Case Study": "short_case_study",
    "Image / Diagram Based": "image_diagram",
    "Communication / Response": "communication_response",
    "Short Answer": "short_answer",
    "SQL / Logic / Code": "sql_logic_code",
};

export const getRoleSpecificMatrix = (role: string, level: string, v: number): Record<string, number> => {
    const m: Record<string, number> = { ...emptyMatrix };
    const r = role.toLowerCase();
    const l = level.toLowerCase();

    // base distribution
    const dist: Record<string, number> = {
        "Single Choice": 0.2, "Multiple Choice": 0.2, "Scenario-based": 0.2,
        "Reading Comprehension": 0.1, "Ordering / Sequence": 0.1,
    };

    if (r.includes("backend")) {
        dist["SQL / Logic / Code"] = 0.2; dist["Reading Comprehension"] = 0;
    } else if (r.includes("frontend") || r.includes("ui") || r.includes("ux") || r.includes("designer")) {
        dist["Image / Diagram Based"] = 0.2; dist["Scenario-based"] = 0.2; dist["Reading Comprehension"] = 0;
    } else if (r.includes("qa")) {
        dist["Priority / Severity"] = 0.15; dist["Image / Diagram Based"] = 0.1;
    } else if (r.includes("data")) {
        dist["SQL / Logic / Code"] = 0.25; dist["Short Case Study"] = 0.1; dist["Ordering / Sequence"] = 0; dist["Reading Comprehension"] = 0.05;
    } else if (r.includes("business analyst") || r.includes("ba") || r.includes("project manager") || r.includes("pm")) {
        dist["Communication / Response"] = 0.15; dist["Matching"] = 0.1; dist["Scenario-based"] = 0.25; dist["Ordering / Sequence"] = 0.1;
    } else if (r.includes("devops") || r.includes("full-stack") || r.includes("full stack")) {
        dist["Scenario-based"] = 0.25; dist["SQL / Logic / Code"] = 0.15; dist["Short Case Study"] = 0.1;
    } else if (r.includes("mobile")) {
        dist["Scenario-based"] = 0.25; dist["Image / Diagram Based"] = 0.1;
    }

    if (l.includes("junior") || l.includes("fresher")) {
        dist["Single Choice"] = (dist["Single Choice"] || 0) + 0.2;
        dist["Scenario-based"] = Math.max(0, (dist["Scenario-based"] || 0) - 0.1);
    } else if (l.includes("senior") || l.includes("lead") || l.includes("principal")) {
        dist["Single Choice"] = Math.max(0, (dist["Single Choice"] || 0) - 0.15);
        dist["Scenario-based"] = (dist["Scenario-based"] || 0) + 0.15;
        dist["Short Case Study"] = (dist["Short Case Study"] || 0) + 0.1;
    }

    const totalWeight = Object.values(dist).reduce((a: number, b: number) => a + b, 0);
    Object.keys(dist).forEach(k => { dist[k] = dist[k] / totalWeight; });

    let currentTotal = 0;
    Object.keys(dist).forEach(k => {
        const count = Math.round(dist[k] * v);
        m[k] = count;
        currentTotal += count;
    });

    if (currentTotal < v) {
        m["Scenario-based"] += (v - currentTotal);
    } else if (currentTotal > v) {
        let diff = currentTotal - v;
        for (const k of Object.keys(m)) {
            if (m[k] >= diff && k !== "Scenario-based") { m[k] -= diff; diff = 0; break; }
        }
        if (diff > 0) m["Single Choice"] = Math.max(0, m["Single Choice"] - diff);
    }
    return m;
};

export const getBalancedMatrix = (v: number): Record<string, number> => {
    const m: Record<string, number> = { ...emptyMatrix };
    m["Single Choice"] = Math.round(v * 0.4);
    m["Multiple Choice"] = Math.round(v * 0.2);
    m["Scenario-based"] = Math.round(v * 0.2);
    m["Ordering / Sequence"] = Math.round(v * 0.1);
    m["Reading Comprehension"] = Math.max(0, v - (m["Single Choice"] + m["Multiple Choice"] + m["Scenario-based"] + m["Ordering / Sequence"]));
    const totalNow = Object.values(m).reduce((a, b) => a + b, 0);
    if (totalNow < v) m["Single Choice"] += (v - totalNow);
    else if (totalNow > v) m["Single Choice"] = Math.max(0, m["Single Choice"] - (totalNow - v));
    return m;
};

export const getPracticalMatrix = (v: number): Record<string, number> => {
    const m: Record<string, number> = { ...emptyMatrix };
    m["Scenario-based"] = Math.round(v * 0.4);
    m["Short Case Study"] = Math.round(v * 0.2);
    m["SQL / Logic / Code"] = Math.round(v * 0.2);
    m["Communication / Response"] = Math.round(v * 0.1);
    m["Reading Comprehension"] = Math.max(0, v - (m["Scenario-based"] + m["Short Case Study"] + m["SQL / Logic / Code"] + m["Communication / Response"]));
    const totalNow = Object.values(m).reduce((a, b) => a + b, 0);
    if (totalNow < v) m["Scenario-based"] += (v - totalNow);
    else if (totalNow > v) m["Scenario-based"] = Math.max(0, m["Scenario-based"] - (totalNow - v));
    return m;
};
