"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    Network,
    Search,
    BookOpen,
    ShieldAlert,
    Sparkles,
    Layers,
    FileText,
    CheckCircle2,
    Stamp,
    ArrowRight,
    HelpCircle,
    Database,
} from "lucide-react";
import { toast } from "sonner";

export interface GraphNode {
    id: string;
    label: string;
    category: "decree_article" | "doc_type" | "vector_store" | "system";
    count: number;
    x: number;
    y: number;
    connections: string[];
    details: string;
}

interface ND30GraphRagModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

const INITIAL_NODES: GraphNode[] = [
    {
        id: "d7_the_thuc",
        label: "Điều 7 - Thể thức 29 loại văn bản",
        category: "decree_article",
        count: 29,
        x: 480,
        y: 170,
        connections: ["d8_the_thuc", "phu_luc_3"],
        details: "Quy định 29 loại văn bản hành chính: Nghị quyết, quyết định, chỉ thị, quy chế, quy định, thông báo, hướng dẫn, chương trình, kế hoạch, phương án, đề án, dự án, báo cáo, biên bản, tờ trình, hợp đồng, công văn, công điện, bản ghi nhớ, bản thỏa thuận, giấy ủy quyền, giấy mời, giấy giới thiệu, giấy nghỉ phép, phiếu gửi, phiếu chuyển, phiếu báo, thư công.",
    },
    {
        id: "d8_the_thuc",
        label: "Điều 8 - 9 Thành phần chính",
        category: "decree_article",
        count: 12,
        x: 360,
        y: 200,
        connections: ["phu_luc_1", "d13_ky_ban_hanh"],
        details: "9 Thành phần thể thức chính: 1. Quốc hiệu & Tiêu ngữ, 2. Tên cơ quan ban hành, 3. Số ký hiệu, 4. Địa danh ngày tháng, 5. Tên loại & Trích yếu, 6. Nội dung, 7. Chức vụ chữ ký, 8. Dấu/chữ ký số, 9. Nơi nhận.",
    },
    {
        id: "d13_ky_ban_hanh",
        label: "Điều 13 - Thẩm quyền ký & Mực xanh",
        category: "decree_article",
        count: 10,
        x: 620,
        y: 360,
        connections: ["d8_the_thuc", "d32_con_dau"],
        details: "Chữ ký dùng MỰC MÀU XANH đối với bản giấy. Hình thức ký: TM. (Thay mặt), KT. (Ký thay), TL. (Thừa lệnh), TUQ. (Thừa ủy quyền).",
    },
    {
        id: "d25_sao_van_ban",
        label: "Điều 25-27 - Sao y, Sao lục, Trích sao",
        category: "decree_article",
        count: 15,
        x: 180,
        y: 400,
        connections: ["phu_luc_1", "vector_chunks"],
        details: "Sao y (từ giấy sang giấy/điện tử), Sao lục (từ bản sao y), Trích sao (tạo lại phần nội dung cần trích sao). BẢN SAO Y/SAO LỤC/TRÍCH SAO CÓ GIÁ TRỊ PHÁP LÝ NHƯ BẢN CHÍNH.",
    },
    {
        id: "d32_con_dau",
        label: "Điều 32-33 - Quản lý con dấu & Giáp lai",
        category: "decree_article",
        count: 14,
        x: 660,
        y: 480,
        connections: ["d13_ky_ban_hanh", "phu_luc_1"],
        details: "Đóng dấu trùm lên khoảng 1/3 chữ ký về PHÍA BÊN TRÁI. Dấu giáp lai đóng ở mép phải, MỖI DẤU ĐÓNG TỐI ĐA 05 TỜ VĂN BẢN.",
    },
    {
        id: "phu_luc_1",
        label: "Phụ lục I - Kỹ thuật trình bày & Lề trang",
        category: "decree_article",
        count: 20,
        x: 300,
        y: 440,
        connections: ["d8_the_thuc"],
        details: "Khổ A4 (210x297mm). Lề trên/dưới 20-25mm, trái 30-35mm, phải 15-20mm. Phông Times New Roman TCVN 6909:2001, màu đen. Đánh số trang lề trên ở giữa từ số 1 (không hiển thị trang 1).",
    },
    {
        id: "phu_luc_2",
        label: "Phụ lục II - Quy tắc Viết hoa",
        category: "decree_article",
        count: 18,
        x: 140,
        y: 280,
        connections: ["phu_luc_1"],
        details: "Quy tắc viết hoa danh từ riêng chỉ tên người, tên địa lý, tên cơ quan tổ chức. Viết hoa đặc biệt: 'Nhà nước', 'Nhân dân', 'Bác', 'Đảng'.",
    },
    {
        id: "phu_luc_3",
        label: "Phụ lục III - Bảng Viết tắt & Mẫu 1.1-3.2",
        category: "decree_article",
        count: 29,
        x: 460,
        y: 380,
        connections: ["d7_the_thuc", "quyet_dinh", "cong_van"],
        details: "Bảng chữ viết tắt 29 loại văn bản (NQ, QĐ, CT, BC, TTr, HĐ, CĐ, GM, GGT, GNP...) và chi tiết các Mẫu trình bày từ Mẫu 1.1 đến Mẫu 3.2.",
    },
    {
        id: "phu_luc_4",
        label: "Phụ lục IV - Mẫu dấu ĐẾN & Sổ văn bản",
        category: "decree_article",
        count: 12,
        x: 520,
        y: 500,
        connections: ["d32_con_dau"],
        details: "Kích thước dấu ĐẾN: 35mm x 50mm khắc sẵn. Quy định sổ đăng ký văn bản đi, đến và phiếu giải quyết văn bản đến.",
    },
    {
        id: "quyet_dinh",
        label: "Quyết định (cá biệt) - Mẫu 1.2",
        category: "doc_type",
        count: 20,
        x: 220,
        y: 140,
        connections: ["d7_the_thuc", "d8_the_thuc"],
        details: "Mẫu 1.2 & 1.3 Phụ lục I. Thể thức bao gồm: Căn cứ ban hành, các Điều khoản (Điều 1, Điều 2...), Nơi nhận, Chữ ký và Con dấu pháp nhân.",
    },
    {
        id: "cong_van",
        label: "Công văn hành chính - Mẫu 1.5",
        category: "doc_type",
        count: 18,
        x: 680,
        y: 180,
        connections: ["d7_the_thuc", "d8_the_thuc"],
        details: "Mẫu 1.5 Phụ lục I. Có phần Kính gửi rõ ràng, trích yếu sau chữ V/v, kết thúc bằng nơi nhận và thẩm quyền ký.",
    },
    {
        id: "vector_chunks",
        label: "ChromaDB Vector Store (76 Pages Data)",
        category: "vector_store",
        count: 76,
        x: 420,
        y: 460,
        connections: ["phu_luc_1"],
        details: "Kho dữ liệu 76 trang Nghị định 30/2020/NĐ-CP được mã hóa thành các vector embeddings 768 chiều phục vụ RAG retrieval.",
    },
    {
        id: "rag_evaluator",
        label: "RAG Evaluator & Faithfulness",
        category: "system",
        count: 8,
        x: 240,
        y: 580,
        connections: ["vector_chunks"],
        details: "Bộ đánh giá tự động 3 tiêu chí: Completeness (11 khối thể thức), Faithfulness (bám sát 38 điều NĐ 30), Relevance.",
    },
];

export default function ND30GraphRagModal({ isOpen, onClose, initialQuery = "" }: ND30GraphRagModalProps) {
    const [nodes, setNodes] = useState<GraphNode[]>(INITIAL_NODES);
    const [selectedNodeId, setSelectedNodeId] = useState<string>("d32_con_dau");
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [ragQueryText, setRagQueryText] = useState(initialQuery);
    const [ragResponse, setRagResponse] = useState<any>(null);
    const [isQuerying, setIsQuerying] = useState(false);

    // Fetch live graph from backend if available
    useEffect(() => {
        if (!isOpen) return;
        fetch("/api/ocr/nd30/knowledge-graph")
            .then((res) => res.json())
            .then((data) => {
                if (data.nodes && Array.isArray(data.nodes)) {
                    setNodes(data.nodes);
                }
            })
            .catch(() => {
                // Fallback to INITIAL_NODES
            });
    }, [isOpen]);

    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
    }, [nodes, selectedNodeId]);

    // Filter nodes by search and category
    const filteredNodes = useMemo(() => {
        return nodes.filter((n) => {
            const matchesCat = categoryFilter === "all" || n.category === categoryFilter;
            const matchesQuery =
                !searchQuery ||
                n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.details.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesQuery;
        });
    }, [nodes, categoryFilter, searchQuery]);

    // Run Graph RAG query
    const handleRunRagQuery = async (queryToRun: string = ragQueryText) => {
        if (!queryToRun.trim()) return;
        setIsQuerying(true);
        try {
            const res = await fetch("/api/ocr/nd30/graph-rag", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queryToRun }),
            });
            if (!res.ok) throw new Error("Lỗi truy vấn RAG");
            const data = await res.json();
            setRagResponse(data);

            // If an entity matches a node id, highlight it
            const matchedEntity = data.entities?.[0]?.entity?.toLowerCase();
            if (matchedEntity) {
                const found = nodes.find(
                    (n) =>
                        n.id.toLowerCase().includes(matchedEntity) ||
                        n.label.toLowerCase().includes(matchedEntity)
                );
                if (found) setSelectedNodeId(found.id);
            }
            toast.success("Graph RAG đã trích xuất thực thể & căn cứ pháp lý!");
        } catch {
            toast.error("Không thể kết nối Graph RAG.");
        } finally {
            setIsQuerying(false);
        }
    };

    if (!isOpen) return null;

    // Node category styles
    const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
        decree_article: { bg: "bg-[#F59E0B]/20", border: "border-[#F59E0B]", text: "text-[#FCD34D]" },
        doc_type: { bg: "bg-[#3B82F6]/20", border: "border-[#3B82F6]", text: "text-[#93C5FD]" },
        vector_store: { bg: "bg-[#8B5CF6]/20", border: "border-[#8B5CF6]", text: "text-[#C4B5FD]" },
        system: { bg: "bg-[#10B981]/20", border: "border-[#10B981]", text: "text-[#6EE7B7]" },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex flex-col h-[94vh] w-full max-w-7xl rounded-2xl border border-white/10 bg-[#0A0F1D] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-6 py-4 bg-[#111827]/80 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-[#6366F1]/30">
                            <Network className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white tracking-wide">
                                    Graph RAG & Knowledge Graph: Nghị định 30/2020/NĐ-CP
                                </h3>
                                <span className="rounded-full bg-[#10B981]/20 px-2.5 py-0.5 text-[10px] font-semibold text-[#34D399] border border-[#10B981]/30">
                                    DemoT3 Connected
                                </span>
                            </div>
                            <p className="text-xs text-[#94A3B8]">
                                Đồ thị tri thức thực thể pháp quy: 38 Điều khoản, 6 Phụ lục, 76 trang văn bản & Vector Retrieval
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Sub-Header Toolbar */}
                <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-6 py-2.5 bg-[#0D1527] gap-3">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        {[
                            { key: "all", label: "Tất cả thực thể" },
                            { key: "decree_article", label: "⚖️ Điều khoản & Phụ lục NĐ 30" },
                            { key: "doc_type", label: "📄 Loại văn bản (QĐ, CV, TB...)" },
                            { key: "vector_store", label: "⚡ Vector Index (76 Pages)" },
                            { key: "system", label: "🤖 RAG Evaluator" },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => setCategoryFilter(cat.key)}
                                className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                                    categoryFilter === cat.key
                                        ? "bg-[#5B6CF0] text-white shadow-md shadow-[#5B6CF0]/25"
                                        : "bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm thực thể trong đồ thị..."
                            className="w-full rounded-xl border border-white/10 bg-[#162036] py-1.5 pl-9 pr-3 text-xs text-white placeholder-[#64748B] focus:border-[#5B6CF0] focus:outline-none"
                        />
                    </div>
                </div>

                {/* Main Body: Split View (Graph Visualizer + Inspector / RAG Query) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden bg-[#070B14]">
                    {/* Visual Knowledge Graph Canvas (2 Columns) */}
                    <div className="lg:col-span-2 relative h-full overflow-hidden border-r border-white/10 flex flex-col">
                        <div className="absolute top-4 left-4 z-10 rounded-xl border border-white/10 bg-[#0E172A]/90 p-2.5 backdrop-blur-md text-[11px] text-[#94A3B8] shadow-xl space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                                <span>Điều khoản & Phụ lục NĐ 30</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                                <span>29 Loại văn bản chuẩn mẫu</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                                <span>ChromaDB Vector Embeddings</span>
                            </div>
                        </div>

                        {/* Interactive SVG Canvas */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                            <svg
                                viewBox="80 50 680 580"
                                className="w-full h-full max-h-[620px] select-none"
                            >
                                <defs>
                                    <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* Render Connection Edges */}
                                {nodes.map((sourceNode) => {
                                    return sourceNode.connections.map((targetId) => {
                                        const targetNode = nodes.find((n) => n.id === targetId);
                                        if (!targetNode) return null;
                                        const isHighlighted =
                                            sourceNode.id === selectedNodeId || targetNode.id === selectedNodeId;

                                        return (
                                            <line
                                                key={`${sourceNode.id}-${targetId}`}
                                                x1={sourceNode.x}
                                                y1={sourceNode.y}
                                                x2={targetNode.x}
                                                y2={targetNode.y}
                                                stroke={isHighlighted ? "#818CF8" : "rgba(255,255,255,0.12)"}
                                                strokeWidth={isHighlighted ? 2.5 : 1}
                                                strokeDasharray={isHighlighted ? "4,4" : "none"}
                                                className="transition-all duration-300"
                                            />
                                        );
                                    });
                                })}

                                {/* Render Nodes */}
                                {filteredNodes.map((node) => {
                                    const isSelected = node.id === selectedNodeId;
                                    const isNeighbor = selectedNode?.connections.includes(node.id);
                                    const colors = categoryColors[node.category] || categoryColors.decree_article;

                                    return (
                                        <g
                                            key={node.id}
                                            transform={`translate(${node.x}, ${node.y})`}
                                            onClick={() => setSelectedNodeId(node.id)}
                                            className="cursor-pointer group"
                                        >
                                            {/* Outer Glow Ring for Selected Node */}
                                            {isSelected && (
                                                <circle
                                                    r="28"
                                                    fill="none"
                                                    stroke="#6366F1"
                                                    strokeWidth="2.5"
                                                    strokeDasharray="4,2"
                                                    className="animate-spin"
                                                    style={{ transformOrigin: "0 0" }}
                                                />
                                            )}

                                            {/* Node Main Circle */}
                                            <circle
                                                r={isSelected ? "22" : "17"}
                                                className={`transition-all duration-200 ${
                                                    isSelected
                                                        ? "fill-[#6366F1] stroke-white stroke-2"
                                                        : isNeighbor
                                                        ? "fill-[#1E293B] stroke-[#818CF8] stroke-2"
                                                        : "fill-[#0F172A] stroke-white/20 hover:stroke-[#818CF8]"
                                                }`}
                                            />

                                            {/* Count Badge Inside Node */}
                                            <text
                                                textAnchor="middle"
                                                dy="4"
                                                className="text-[10px] font-bold fill-white pointer-events-none"
                                            >
                                                {node.count}
                                            </text>

                                            {/* Label below node */}
                                            <text
                                                textAnchor="middle"
                                                dy={isSelected ? "38" : "32"}
                                                className={`text-[11px] font-medium transition-all pointer-events-none ${
                                                    isSelected
                                                        ? "fill-white font-bold"
                                                        : "fill-[#94A3B8] group-hover:fill-white"
                                                }`}
                                            >
                                                {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    {/* Inspector & Ask Graph RAG Panel (1 Column) */}
                    <div className="flex flex-col h-full overflow-y-auto bg-[#0A0F1D] p-5 space-y-5">
                        {/* Ask Graph RAG Search Box */}
                        <div className="rounded-2xl border border-white/10 bg-[#121A2E] p-4 shadow-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[#F59E0B]" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                    Tra cứu & Hỏi đáp Graph RAG
                                </h4>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={ragQueryText}
                                    onChange={(e) => setRagQueryText(e.target.value)}
                                    placeholder="Hỏi về thể thức, con dấu, lề trang..."
                                    onKeyDown={(e) => e.key === "Enter" && handleRunRagQuery()}
                                    className="flex-1 rounded-xl border border-white/10 bg-[#0B1120] px-3 py-1.5 text-xs text-white placeholder-[#64748B] focus:border-[#5B6CF0] focus:outline-none"
                                />
                                <button
                                    onClick={() => handleRunRagQuery()}
                                    disabled={isQuerying}
                                    className="rounded-xl bg-gradient-to-r from-[#5B6CF0] to-[#7C8FFF] px-3 py-1.5 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {isQuerying ? "..." : "Tra cứu"}
                                </button>
                            </div>

                            {/* Quick Prompts */}
                            <div className="flex flex-wrap gap-1.5 text-[10px]">
                                {[
                                    "Đóng con dấu trùm 1/3 chữ ký",
                                    "Căn lề trang chuẩn A4",
                                    "Mực màu xanh ký bản giấy",
                                    "Quy định dấu giáp lai",
                                ].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setRagQueryText(p);
                                            handleRunRagQuery(p);
                                        }}
                                        className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#ECF0F7] border border-white/[0.06] transition-colors"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RAG Query Result (if available) */}
                        {ragResponse && (
                            <div className="rounded-2xl border border-[#5B6CF0]/30 bg-[#5B6CF0]/10 p-4 shadow-xl space-y-2 animate-in fade-in duration-200">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#7C8FFF]">
                                    <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
                                    <span>Kết quả đối chiếu thực thể Graph RAG:</span>
                                </div>
                                {ragResponse.entities?.map((ent: any, idx: number) => (
                                    <div key={idx} className="rounded-xl bg-[#0F172A] p-2.5 text-xs border border-white/5 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#FBBF24]">{ent.entity}</span>
                                            <span className="text-[10px] text-[#64748B] uppercase">{ent.type}</span>
                                        </div>
                                        <p className="text-[#94A3B8] text-[11px]">{ent.context}</p>
                                    </div>
                                ))}
                                {ragResponse.rag_context?.legal_citations && (
                                    <div className="text-[11px] text-[#34D399] italic">
                                        Căn cứ: {ragResponse.rag_context.legal_citations.join(", ")}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected Node Details Card */}
                        {selectedNode && (
                            <div className="flex-1 rounded-2xl border border-white/10 bg-[#121A2E] p-5 shadow-xl space-y-4">
                                <div className="flex items-start justify-between border-b border-white/10 pb-3">
                                    <div>
                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#94A3B8] uppercase">
                                            {selectedNode.category}
                                        </span>
                                        <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                                            {selectedNode.label}
                                        </h4>
                                    </div>
                                    <span className="rounded-xl bg-[#6366F1]/20 px-2.5 py-1 text-xs font-extrabold text-[#A5B4FC] border border-[#6366F1]/30">
                                        {selectedNode.count} quy tắc
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[11px] font-semibold text-[#64748B] block mb-1">
                                        NỘI DUNG QUY ĐỊNH PHÁP QUY:
                                    </span>
                                    <p className="text-xs text-[#ECF0F7] leading-relaxed bg-[#0B1120] p-3 rounded-xl border border-white/5">
                                        {selectedNode.details}
                                    </p>
                                </div>

                                {/* Connected Entities */}
                                {selectedNode.connections.length > 0 && (
                                    <div>
                                        <span className="text-[11px] font-semibold text-[#64748B] block mb-2">
                                            CÁC THỰC THỂ LIÊN QUAN TRONG ĐỒ THỊ:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedNode.connections.map((targetId) => {
                                                const targetNode = nodes.find((n) => n.id === targetId);
                                                if (!targetNode) return null;
                                                return (
                                                    <button
                                                        key={targetId}
                                                        onClick={() => setSelectedNodeId(targetId)}
                                                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#162036] px-2.5 py-1 text-xs text-[#7C8FFF] hover:bg-[#5B6CF0]/20 hover:text-white transition-colors"
                                                    >
                                                        <span>{targetNode.label}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 bg-[#111827]/80 text-xs text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#8B5CF6]" />
                        <span>Nguồn tri thức: Bộ chuẩn Nghị định 30/2020/NĐ-CP • DemoT3 Knowledge Graph & Resolution Engine</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
    );
}
