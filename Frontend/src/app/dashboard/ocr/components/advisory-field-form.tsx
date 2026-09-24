"use client";

import React, { useState, useEffect } from "react";
import {
    Building2,
    FileEdit,
    UserCheck,
    Send,
    Loader2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    Check,
} from "lucide-react";
import type {
    FieldDefinition,
    FieldResolverResult,
    DocumentGenerationResult,
    UserProfile,
} from "../types";
import { resolveFields, generateDocument } from "../services/advisory-service";

interface AdvisoryFieldFormProps {
    docType: string;
    userProfile: UserProfile;
    onGenerated: (result: DocumentGenerationResult) => void;
    onCancel?: () => void;
}

const GROUP_META: Record<string, { label: string; icon: React.ReactNode }> = {
    co_quan: { label: "Thông tin Cơ quan & Đơn vị", icon: <Building2 className="h-4 w-4 text-[#7C8FFF]" /> },
    noi_dung: { label: "Nội dung Văn bản", icon: <FileEdit className="h-4 w-4 text-[#36DDAB]" /> },
    ky_duyet: { label: "Thẩm quyền & Người ký", icon: <UserCheck className="h-4 w-4 text-[#F59E0B]" /> },
    noi_nhan: { label: "Nơi nhận & Phối hợp", icon: <Send className="h-4 w-4 text-[#EC4899]" /> },
};

export default function AdvisoryFieldForm({
    docType,
    userProfile,
    onGenerated,
    onCancel,
}: AdvisoryFieldFormProps) {
    const [fields, setFields] = useState<FieldDefinition[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [prefilledKeys, setPrefilledKeys] = useState<Set<string>>(new Set());
    const [loadingResolve, setLoadingResolve] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        let mounted = true;
        setLoadingResolve(true);

        resolveFields(docType, userProfile)
            .then((res: any) => {
                if (!mounted) return;
                const fieldList = res.fields || res.missing_fields || [];
                const resolvedVals = res.resolved_values || res.filled_fields || {};
                setFields(fieldList);
                setValues(resolvedVals);
                setPrefilledKeys(new Set(res.prefilled_keys || []));
            })
            .catch((err) => {
                if (!mounted) return;
                setErrors([err.message || "Không thể tải cấu trúc biểu mẫu"]);
            })
            .finally(() => {
                if (mounted) setLoadingResolve(false);
            });

        return () => {
            mounted = false;
        };
    }, [docType, userProfile]);

    function handleFieldChange(key: string, val: string) {
        setValues((prev) => ({ ...prev, [key]: val }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Local required validation
        const missing: string[] = [];
        for (const f of fields) {
            if (f.required && !values[f.key]?.trim()) {
                missing.push(f.label);
            }
        }

        if (missing.length > 0) {
            setErrors([`Vui lòng điền đủ các trường bắt buộc: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`]);
            return;
        }

        setErrors([]);
        setSubmitting(true);

        try {
            const result = await generateDocument(docType, values);
            if (!result.validation_ready && result.missing_required.length > 0) {
                setErrors(result.missing_required);
                return;
            }
            onGenerated(result);
        } catch (err: any) {
            setErrors([err.message || "Lỗi khi tạo văn bản. Vui lòng thử lại."]);
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingResolve) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl">
                <Loader2 className="h-8 w-8 animate-spin text-[#36DDAB] mb-3" />
                <p className="text-sm font-medium text-[#ECF0F7]">
                    Đang nạp mẫu chuẩn và đồng bộ hồ sơ nhân sự...
                </p>
            </div>
        );
    }

    // Group fields
    const groupedFields: Record<string, FieldDefinition[]> = {};
    for (const f of fields) {
        const group = f.group || "noi_dung";
        if (!groupedFields[group]) groupedFields[group] = [];
        groupedFields[group].push(f);
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-2xl border border-white/[0.08] bg-[#1A233A]/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
        >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#36DDAB]">
                            Biểu mẫu Nghị định 30/2020/NĐ-CP
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">
                        Điền thông tin: <span className="text-[#7C8FFF]">{docType}</span>
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                        Các trường có dấu <span className="text-rose-400 font-bold">*</span> là bắt buộc theo quy định thể thức.
                    </p>
                </div>

                {prefilledKeys.size > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-[#36DDAB]/30 bg-[#36DDAB]/10 px-3.5 py-2 text-xs font-medium text-[#36DDAB]">
                        <Sparkles className="h-4 w-4" />
                        <span>Đã tự điền {prefilledKeys.size} trường từ Hồ sơ HR</span>
                    </div>
                )}
            </div>

            {/* Error alerts */}
            {errors.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-rose-200">
                        <AlertCircle className="h-4 w-4" />
                        <span>Cần hoàn thiện thông tin:</span>
                    </div>
                    {errors.map((err, i) => (
                        <p key={i} className="pl-6">{err}</p>
                    ))}
                </div>
            )}

            {/* Form groups */}
            <div className="space-y-6">
                {Object.entries(groupedFields).map(([groupKey, groupFields]) => {
                    const meta = GROUP_META[groupKey] || {
                        label: "Thông tin bổ sung",
                        icon: <FileEdit className="h-4 w-4" />,
                    };

                    return (
                        <div
                            key={groupKey}
                            className="rounded-xl border border-white/[0.06] bg-[#111827]/60 p-5 space-y-4"
                        >
                            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                                {meta.icon}
                                <h3 className="text-sm font-bold text-[#ECF0F7]">{meta.label}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupFields.map((field) => {
                                    const isPrefilled = prefilledKeys.has(field.key);
                                    const isTextarea = field.input_type === "textarea" || field.key === "articles";

                                    return (
                                        <div
                                            key={field.key}
                                            className={`flex flex-col gap-1.5 ${
                                                isTextarea ? "md:col-span-2" : ""
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                                                    {field.label}
                                                    {field.required && (
                                                        <span className="text-rose-400 font-bold">*</span>
                                                    )}
                                                </label>

                                                {isPrefilled && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#36DDAB] bg-[#36DDAB]/10 px-2 py-0.5 rounded-full border border-[#36DDAB]/20">
                                                        <Check className="h-3 w-3" />
                                                        từ hồ sơ HR
                                                    </span>
                                                )}
                                            </div>

                                            {isTextarea ? (
                                                <textarea
                                                    rows={4}
                                                    value={values[field.key] || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(field.key, e.target.value)
                                                    }
                                                    placeholder={field.placeholder}
                                                    className="w-full rounded-xl border border-white/[0.1] bg-[#1A233A]/80 p-3 text-sm text-[#ECF0F7] placeholder-[#64748B] outline-none focus:border-[#5B6CF0] focus:ring-1 focus:ring-[#5B6CF0] transition-all font-sans"
                                                />
                                            ) : (
                                                <input
                                                    type={field.input_type === "date" ? "date" : "text"}
                                                    value={values[field.key] || ""}
                                                    onChange={(e) =>
                                                        handleFieldChange(field.key, e.target.value)
                                                    }
                                                    placeholder={field.placeholder}
                                                    className="w-full rounded-xl border border-white/[0.1] bg-[#1A233A]/80 px-3.5 py-2.5 text-sm text-[#ECF0F7] placeholder-[#64748B] outline-none focus:border-[#5B6CF0] focus:ring-1 focus:ring-[#5B6CF0] transition-all"
                                                />
                                            )}

                                            {field.description && (
                                                <span className="text-[11px] text-[#64748B]">
                                                    {field.description}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-white/[0.1] bg-[#111827]/80 px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#1A233A] transition-all"
                    >
                        Quay lại trò chuyện
                    </button>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5B6CF0] to-[#36DDAB] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#5B6CF0]/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang sinh văn bản & thẩm định NĐ 30...</span>
                        </>
                    ) : (
                        <>
                            <span>Tạo văn bản & Chuyển sang Bàn thẩm định</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
