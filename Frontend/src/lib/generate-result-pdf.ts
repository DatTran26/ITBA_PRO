import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ── types (mirrors result-detail-client) ── */

interface PdfAnalysis {
    overall_assessment: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
}

interface PdfQuestion {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: number;
    topic: string;
}

interface PdfAnswer {
    question_id: string;
    selected_answer: number;
    is_correct: boolean;
}

interface PdfInterview {
    round: number;
    scheduled_at: string;
    duration_minutes: number;
    location_type: string;
    location_detail: string | null;
    transcript?: string | null;
    ai_summary?: string | null;
    recruiter_note?: string | null;
}

interface PdfResult {
    candidate_name: string;
    candidate_email: string;
    score: number;
    total_questions: number;
    time_taken: number;
    submitted_at: string;
    answers: PdfAnswer[];
    ai_analysis: PdfAnalysis | null;
    note: string | null;
    status: "pass" | "fail" | null;
    interview?: PdfInterview | null;
}

interface PdfTest {
    title?: string;
    job_role: string;
    level: string;
    questions: PdfQuestion[];
}

/* ── constants ── */

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 4.5;
const DEFAULT_COLOR: [number, number, number] = [60, 60, 60];
const FONT_NAME = "Roboto"; // Unicode-supporting font (Arial-like)

/* ── font loader (cached across calls) ── */

let fontCache: { regular: string; bold: string } | null = null;

async function loadFonts(): Promise<{ regular: string; bold: string }> {
    if (fontCache) return fontCache;
    const [regular, bold] = await Promise.all([
        fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
        fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
    ]);
    const toBase64 = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    };
    fontCache = { regular: toBase64(regular), bold: toBase64(bold) };
    return fontCache;
}

function registerFonts(doc: jsPDF, fonts: { regular: string; bold: string }): void {
    doc.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
    doc.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
    doc.addFont("Roboto-Regular.ttf", FONT_NAME, "normal");
    doc.addFont("Roboto-Bold.ttf", FONT_NAME, "bold");
}

/* ── helpers ── */

/** Strip markdown syntax to plain text for PDF rendering */
function stripMarkdown(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, "")           // code blocks
        .replace(/`([^`]+)`/g, "$1")               // inline code
        .replace(/\*\*([^*]+)\*\*/g, "$1")         // bold
        .replace(/__([^_]+)__/g, "$1")             // bold alt
        .replace(/\*([^*]+)\*/g, "$1")             // italic
        .replace(/_([^_]+)_/g, "$1")               // italic alt
        .replace(/^#{1,6}\s+/gm, "")              // headings
        .replace(/^>\s?/gm, "")                   // blockquotes
        .replace(/^\s*[-*+]\s+/gm, "- ")          // unordered list items
        .replace(/^\s*\d+\.\s+/gm, "- ")          // numbered list items
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")  // links
        .replace(/\n{3,}/g, "\n\n")               // collapse excess newlines
        .trim();
}

/** Parse bullet-formatted notes into clean lines */
function parseNoteLines(note: string): string[] {
    return note
        .split("\n")
        .map((line) => line.replace(/^[\s•\-*+]+/, "").trim())
        .filter(Boolean);
}

/** Ensure Y fits on page, add new page if needed */
function ensureSpace(doc: jsPDF, y: number, needed = 10): number {
    if (y + needed > 280) { doc.addPage(); return MARGIN; }
    return y;
}

/** Reset font to default body style */
function resetFont(doc: jsPDF, size = 9.5): void {
    doc.setFontSize(size);
    doc.setFont(FONT_NAME, "normal");
    doc.setTextColor(...DEFAULT_COLOR);
}

/** Add a section heading with underline, return new Y */
function addHeading(doc: jsPDF, y: number, text: string): number {
    y = ensureSpace(doc, y, 15);
    doc.setFontSize(12);
    doc.setFont(FONT_NAME, "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(text, MARGIN, y);
    doc.setDrawColor(100, 100, 220);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);
    resetFont(doc);
    return y + 10;
}

/** Add a sub-heading (e.g. "Strengths"), return new Y */
function addSubHeading(doc: jsPDF, y: number, text: string, color: [number, number, number]): number {
    y = ensureSpace(doc, y, 12);
    doc.setFontSize(10);
    doc.setFont(FONT_NAME, "bold");
    doc.setTextColor(...color);
    doc.text(text, MARGIN, y);
    resetFont(doc);
    return y + 6;
}

/** Add wrapped body text, return new Y */
function addBody(doc: jsPDF, y: number, text: string, indent = 0): number {
    resetFont(doc);
    const clean = stripMarkdown(text);
    const availWidth = CONTENT_WIDTH - indent;
    const lines = doc.splitTextToSize(clean, availWidth);
    for (const line of lines) {
        y = ensureSpace(doc, y);
        doc.text(line, MARGIN + indent, y);
        y += LINE_HEIGHT;
    }
    resetFont(doc);
    return y + 2;
}

/** Add a bullet list with consistent formatting, return new Y */
function addBulletList(
    doc: jsPDF,
    y: number,
    items: string[],
    prefix: string,
    prefixColor: [number, number, number],
    textColor: [number, number, number] = DEFAULT_COLOR,
): number {
    const indent = 6;
    for (const item of items) {
        y = ensureSpace(doc, y, 8);
        // Draw prefix in accent color
        doc.setFontSize(9.5);
        doc.setFont(FONT_NAME, "normal");
        doc.setTextColor(...prefixColor);
        doc.text(prefix, MARGIN + 1, y);
        // Draw text in body color
        doc.setFont(FONT_NAME, "normal");
        doc.setTextColor(...textColor);
        const wrapped = doc.splitTextToSize(stripMarkdown(item), CONTENT_WIDTH - indent);
        for (let i = 0; i < wrapped.length; i++) {
            if (i > 0) y = ensureSpace(doc, y);
            doc.text(wrapped[i], MARGIN + indent, y);
            y += LINE_HEIGHT;
        }
        y += 0.5;
    }
    resetFont(doc);
    return y + 2;
}

/* ── main export ── */

export async function generateResultPdf(result: PdfResult, test?: PdfTest | null): Promise<void> {
    const fonts = await loadFonts();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    registerFonts(doc, fonts);
    let y = MARGIN;

    /* ── Header ── */
    const titleText = result.interview ? "Interview Evaluation Report" : "Candidate Evaluation Report";
    doc.setFontSize(18);
    doc.setFont(FONT_NAME, "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(titleText, MARGIN, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont(FONT_NAME, "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString("vi-VN")}`, MARGIN, y);
    y += 10;

    /* ── Candidate info ── */
    y = addHeading(doc, y, "Candidate Information");
    const position = test
        ? `${test.title ? `${test.title} (${test.job_role})` : test.job_role} - ${test.level}`
        : (result.interview ? "Interview Room Candidate" : "N/A");
    const info = [
        ["Name", result.candidate_name],
        ["Email", result.candidate_email],
        ["Position", position],
    ];
    if (result.submitted_at) {
        info.push(["Submitted", new Date(result.submitted_at).toLocaleString("vi-VN")]);
    }
    if (result.time_taken) {
        info.push(["Time Taken", `${Math.round(result.time_taken / 60)} minutes`]);
    }
    if (result.interview) {
        info.push(["Interview Round", `Round ${result.interview.round}`]);
        info.push(["Scheduled Time", new Date(result.interview.scheduled_at).toLocaleString("vi-VN")]);
        info.push(["Duration", `${result.interview.duration_minutes} minutes`]);
        info.push(["Location", `${result.interview.location_type}${result.interview.location_detail ? ` - ${result.interview.location_detail}` : ""}`]);
    }

    for (const [label, value] of info) {
        doc.setFontSize(10);
        doc.setFont(FONT_NAME, "bold");
        doc.setTextColor(50, 50, 50);
        doc.text(`${label}:`, MARGIN, y);
        doc.setFont(FONT_NAME, "normal");
        doc.text(value, MARGIN + 40, y);
        y += 5.5;
    }
    y += 4;

    /* ── Score ── */
    if (result.total_questions > 0) {
        y = addHeading(doc, y, "Test Score");
        const pct = Math.round((result.score / result.total_questions) * 100);
        const scoreColor: [number, number, number] = pct >= 80 ? [16, 185, 129] : pct >= 50 ? [245, 158, 11] : [239, 68, 68];
        doc.setFontSize(14);
        doc.setFont(FONT_NAME, "bold");
        doc.setTextColor(...scoreColor);
        doc.text(`${result.score} / ${result.total_questions}  (${pct}%)`, MARGIN, y);
        y += 7;

        if (result.status) {
            const statusColor: [number, number, number] = result.status === "pass" ? [16, 185, 129] : [239, 68, 68];
            doc.setFontSize(11);
            doc.setFont(FONT_NAME, "bold");
            doc.setTextColor(...statusColor);
            doc.text(`Decision: ${result.status.toUpperCase()}`, MARGIN, y);
            y += 8;
        }
        y += 2;
    }

    /* ── AI Analysis (CV Screening) ── */
    if (result.ai_analysis) {
        const a = result.ai_analysis;
        y = addHeading(doc, y, "CV AI Analysis");

        if (a.recommendation) {
            y = ensureSpace(doc, y, 10);
            doc.setFontSize(10);
            doc.setFont(FONT_NAME, "bold");
            doc.setTextColor(70, 70, 140);
            const recText = `Recommendation: ${stripMarkdown(a.recommendation)}`;
            const recLines = doc.splitTextToSize(recText, CONTENT_WIDTH);
            for (const line of recLines) {
                y = ensureSpace(doc, y);
                doc.text(line, MARGIN, y);
                y += LINE_HEIGHT + 0.5;
            }
            y += 3;
            resetFont(doc);
        }

        if (a.overall_assessment) {
            y = addBody(doc, y, a.overall_assessment);
            y += 2;
        }

        if (a.strengths?.length > 0) {
            y = addSubHeading(doc, y, "Strengths", [16, 150, 110]);
            y = addBulletList(doc, y, a.strengths, "\u2022", [16, 150, 110]);
        }

        if (a.weaknesses?.length > 0) {
            y = addSubHeading(doc, y, "Areas for Improvement", [200, 130, 20]);
            y = addBulletList(doc, y, a.weaknesses, "\u2022", [200, 130, 20]);
        }
        y += 2;
    }

    /* ── Interview Details (Transcript & AI Summary) ── */
    if (result.interview) {
        const iv = result.interview;
        if (iv.ai_summary) {
            y = addHeading(doc, y, "Interview AI Summary");
            y = addBody(doc, y, iv.ai_summary);
            y += 2;
        }

        if (iv.transcript) {
            y = addHeading(doc, y, "Interview Transcript");
            y = addBody(doc, y, iv.transcript);
            y += 2;
        }

        if (iv.recruiter_note) {
            y = addHeading(doc, y, "Interviewer Notes (Interview Room)");
            resetFont(doc);
            const noteLines = parseNoteLines(iv.recruiter_note);
            if (noteLines.length > 0) {
                y = addBulletList(doc, y, noteLines, "\u2022", [80, 80, 80], [50, 50, 50]);
            } else {
                y = addBody(doc, y, iv.recruiter_note);
            }
            y += 2;
        }
    }

    /* ── General Interviewer Notes ── */
    if (result.note) {
        y = addHeading(doc, y, "General Evaluation Notes");
        resetFont(doc);
        const noteLines = parseNoteLines(result.note);
        if (noteLines.length > 0) {
            y = addBulletList(doc, y, noteLines, "\u2022", [80, 80, 80], [50, 50, 50]);
        } else {
            y = addBody(doc, y, result.note);
        }
        y += 2;
    }

    /* ── Question Breakdown Table ── */
    if (test && test.questions?.length > 0) {
        y = addHeading(doc, y, "Question Breakdown");

        const tableData = test.questions.map((q, idx) => {
            const answer = result.answers?.find((a) => a.question_id === q.id) || result.answers?.[idx];
            const selected = answer?.selected_answer ?? -1;
            const cleanText = stripMarkdown(q.question_text).substring(0, 80);
            return [
                `Q${idx + 1}`,
                cleanText + (q.question_text.length > 80 ? "..." : ""),
                q.topic || "-",
                selected >= 0 ? String.fromCharCode(65 + selected) : "-",
                String.fromCharCode(65 + q.correct_answer),
                answer?.is_correct ? "Correct" : "Wrong",
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [["#", "Question", "Topic", "Answer", "Correct", "Result"]],
            body: tableData,
            styles: { fontSize: 7.5, cellPadding: 2, font: FONT_NAME },
            headStyles: { fillColor: [70, 70, 140], textColor: 255, fontStyle: "bold" },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 65 },
                2: { cellWidth: 30 },
                3: { cellWidth: 15 },
                4: { cellWidth: 15 },
                5: { cellWidth: 18 },
            },
            margin: { left: MARGIN, right: MARGIN },
        });
    }

    /* ── Download ── */
    const safeName = result.candidate_name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const safeRole = (test?.title || test?.job_role || (result.interview ? "Interview" : "Evaluation")).replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    doc.save(`Report - ${safeName} - ${safeRole}.pdf`);
}
