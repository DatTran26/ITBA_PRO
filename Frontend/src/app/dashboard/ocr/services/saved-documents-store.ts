"use client";

import { useState, useEffect } from "react";
import type { SavedND30Document, ND30ExportPayload } from "../types";

const STORAGE_KEY = "downtown_saved_nd30_documents_v1";
const EVENT_NAME = "downtown_documents_updated";

/**
 * Default sample documents to seed the archive if user hasn't created any yet
 */
const DEFAULT_SAMPLE_DOCUMENTS: SavedND30Document[] = [
    {
        id: "sample-gnp-01",
        title: "Đơn xin nghỉ phép đi du lịch và việc riêng",
        doc_type: "GIẤY NGHỈ PHÉP",
        created_at: Date.now() - 3600 * 1000 * 2, // 2 hours ago
        file_name: "GIAY_NGHI_PHEP_NGUYEN_VAN_AN_ND30.docx",
        status: "exported",
        source: "advisory",
        signatory_name: "NGUYỄN VĂN AN",
        company_name: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
        department: "Phòng Hành chính - Nhân sự",
        export_payload: {
            doc_type: "GIẤY NGHỈ PHÉP",
            company_name: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
            department: "Phòng Hành chính - Nhân sự",
            doc_number: "01/GNP-DT",
            location_date: "Hà Nội, ngày 23 tháng 09 năm 2026",
            subject: "Về việc xin nghỉ phép giải quyết việc gia đình và đi du lịch",
            bases: [
                "Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20 tháng 11 năm 2019;",
                "Căn cứ Nội quy lao động và Thỏa ước lao động tập thể của Công ty;",
                "Theo đề nghị và nguyện vọng cá nhân của người làm đơn."
            ],
            articles: [
                {
                    title: "Kính gửi",
                    content: "Ban Giám đốc Công ty Cổ phần Công nghệ DOWN TOWN;\nTrưởng phòng Hành chính - Nhân sự."
                },
                {
                    title: "Thông tin người xin nghỉ",
                    content: "Họ và tên: NGUYỄN VĂN AN\nChức vụ: Chuyên viên Văn thư - Pháp chế\nBộ phận: Phòng Hành chính - Nhân sự\nĐiện thoại liên hệ: 0901 234 567."
                },
                {
                    title: "Thời gian và lý do nghỉ phép",
                    content: "Thời gian xin nghỉ phép: Từ ngày 25/09/2026 đến hết ngày 27/09/2026 (03 ngày làm việc).\nLý do nghỉ: Giải quyết việc gia đình và nghỉ mát theo chế độ phép năm.\nNơi nghỉ phép: Thành phố Đà Nẵng."
                },
                {
                    title: "Bàn giao công việc",
                    content: "Công việc trong thời gian nghỉ đã được bàn giao đầy đủ cho đồng nghiệp Lê Thị Mai phụ trách, đảm bảo tiến độ công việc không bị gián đoạn."
                }
            ],
            signatory_title: "NGƯỜI LÀM ĐƠN",
            signatory_name: "NGUYỄN VĂN AN",
            recipients: [
                "Như Điều khoản kính gửi;",
                "Bộ phận Kế toán - Chấm công;",
                "Lưu: VT, HS."
            ]
        },
        preview_markdown: `# GIẤY NGHỈ PHÉP\n\n**Kính gửi:** Ban Giám đốc Công ty;\nTrưởng phòng Hành chính - Nhân sự.\n\nTôi tên là: **NGUYỄN VĂN AN**\nThời gian nghỉ: Từ 25/09/2026 đến hết 27/09/2026.`
    },
    {
        id: "sample-qd-02",
        title: "Quyết định về việc ban hành quy chế làm việc và chuyển đổi số",
        doc_type: "QUYẾT ĐỊNH",
        created_at: Date.now() - 3600 * 1000 * 26, // yesterday
        file_name: "QUYET_DINH_BAN_HANH_QUY_CHE_ND30.docx",
        status: "issued",
        source: "advisory",
        signatory_name: "NGUYỄN VĂN AN",
        company_name: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
        department: "Hội đồng Quản trị",
        export_payload: {
            doc_type: "QUYẾT ĐỊNH",
            company_name: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
            department: "HỘI ĐỒNG QUẢN TRỊ",
            doc_number: "48/QĐ-HĐQT",
            location_date: "Hà Nội, ngày 22 tháng 09 năm 2026",
            subject: "Về việc ban hành Quy chế vận hành hệ thống Trợ lý AI và Văn thư số",
            bases: [
                "Căn cứ Luật Doanh nghiệp số 59/2020/QH14 ngày 17 tháng 6 năm 2020;",
                "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ về công tác văn thư;",
                "Căn cứ Điều lệ tổ chức và hoạt động của Công ty Cổ phần Công nghệ DOWN TOWN;"
            ],
            articles: [
                {
                    title: "Điều 1",
                    content: "Ban hành kèm theo Quyết định này 'Quy chế quản lý, soạn thảo và lưu trữ văn bản hành chính điện tử chuẩn Nghị định 30' áp dụng toàn hệ thống DOWN TOWN."
                },
                {
                    title: "Điều 2",
                    content: "Giao Phòng Hành chính - Nhân sự và Ban Công nghệ Thông tin tổ chức triển khai, đào tạo và giám sát việc thực hiện quy chế này."
                },
                {
                    title: "Điều 3",
                    content: "Các Phó Tổng Giám đốc, Giám đốc Khối, Trưởng các Phòng, Ban và toàn thể cán bộ nhân viên chịu trách nhiệm thi hành Quyết định này kể từ ngày ký."
                }
            ],
            signatory_title: "TỔNG GIÁM ĐỐC",
            signatory_name: "NGUYỄN VĂN AN",
            recipients: [
                "Như Điều 3;",
                "Hội đồng Quản trị (để b/c);",
                "Lưu: VT, Ban CNTT."
            ]
        },
        preview_markdown: `# QUYẾT ĐỊNH\n\n**Về việc ban hành Quy chế vận hành hệ thống Trợ lý AI và Văn thư số**\n\nTổng Giám đốc Công ty Quyết định ban hành Quy chế công tác văn thư điện tử chuẩn Nghị định 30.`
    }
];

/**
 * Get all saved documents from LocalStorage
 */
export function getSavedDocuments(): SavedND30Document[] {
    if (typeof window === "undefined") return DEFAULT_SAMPLE_DOCUMENTS;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            // Seed with sample documents on first visit so user has immediate feedback
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_DOCUMENTS));
            return DEFAULT_SAMPLE_DOCUMENTS;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.sort((a, b) => b.created_at - a.created_at);
        }
        return DEFAULT_SAMPLE_DOCUMENTS;
    } catch (err) {
        console.warn("Failed to read saved documents from localStorage:", err);
        return DEFAULT_SAMPLE_DOCUMENTS;
    }
}

/**
 * Save or update a document in LocalStorage
 */
export function saveDocument(
    docData: Omit<SavedND30Document, "id" | "created_at"> & {
        id?: string;
        created_at?: number;
    }
): SavedND30Document {
    if (typeof window === "undefined") {
        throw new Error("Cannot save document in server environment");
    }

    const currentList = getSavedDocuments();
    const docId = docData.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = docData.created_at || Date.now();

    const fullDoc: SavedND30Document = {
        ...docData,
        id: docId,
        created_at: createdAt,
        file_name:
            docData.file_name ||
            `${(docData.doc_type || "VanBan").replace(/[\/\s]+/g, "_")}_ND30.docx`,
        status: docData.status || "draft",
        source: docData.source || "advisory",
    };

    const existingIndex = currentList.findIndex((d) => d.id === docId);
    let updatedList: SavedND30Document[];

    if (existingIndex >= 0) {
        updatedList = [...currentList];
        updatedList[existingIndex] = fullDoc;
    } else {
        updatedList = [fullDoc, ...currentList];
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { doc: fullDoc } }));
    } catch (err) {
        console.error("Failed to persist document to localStorage:", err);
    }

    return fullDoc;
}

/**
 * Delete a document by ID
 */
export function deleteSavedDocument(id: string): void {
    if (typeof window === "undefined") return;

    const currentList = getSavedDocuments();
    const updatedList = currentList.filter((d) => d.id !== id);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { deletedId: id } }));
    } catch (err) {
        console.error("Failed to delete document from localStorage:", err);
    }
}

/**
 * Clear all saved documents
 */
export function clearAllSavedDocuments(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
    } catch (err) {
        console.error("Failed to clear saved documents:", err);
    }
}

/**
 * Export a saved document as Word (.docx) directly to the browser
 */
export async function exportSavedDocumentAsDocx(doc: SavedND30Document): Promise<void> {
    const payload = doc.export_payload;
    const downloadFilename = doc.file_name || `${(doc.doc_type || "VanBan").replace(/[\/\s]+/g, "_")}_ND30.docx`;

    // Try modern File System Access API
    if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: downloadFilename,
                types: [
                    {
                        description: "Văn bản Microsoft Word (.docx)",
                        accept: {
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                        },
                    },
                ],
            });

            const res = await fetch("/api/ocr/export-nd30", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Lỗi máy chủ khi tạo văn bản DOCX");
            }

            const blob = await res.blob();
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            // Mark document status as exported
            saveDocument({
                ...doc,
                status: "exported",
            });
            return;
        } catch (pickerErr: any) {
            if (pickerErr.name === "AbortError") return;
            console.warn("showSaveFilePicker failed, falling back to form post:", pickerErr);
        }
    }

    // Fallback Method: Native form post
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/ocr/export-nd30";
    form.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();

    // Mark as exported
    saveDocument({
        ...doc,
        status: "exported",
    });

    setTimeout(() => {
        try {
            document.body.removeChild(form);
        } catch {}
    }, 3000);
}

/**
 * Custom React hook to consume and react to saved documents
 */
export function useSavedDocuments() {
    const [documents, setDocuments] = useState<SavedND30Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const reload = () => {
        setDocuments(getSavedDocuments());
        setIsLoading(false);
    };

    useEffect(() => {
        reload();

        const handleUpdate = () => reload();
        window.addEventListener(EVENT_NAME, handleUpdate);
        window.addEventListener("storage", handleUpdate);

        return () => {
            window.removeEventListener(EVENT_NAME, handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, []);

    return {
        documents,
        count: documents.length,
        isLoading,
        reload,
        remove: deleteSavedDocument,
        clearAll: clearAllSavedDocuments,
        save: saveDocument,
        exportDocx: exportSavedDocumentAsDocx,
    };
}
