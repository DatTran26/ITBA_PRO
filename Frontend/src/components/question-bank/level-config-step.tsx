"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronRight, Tag } from "lucide-react";
import type { LevelConfig, QuestionType } from "./question-bank-types";
import LevelConfigSelectors from "./level-config-selectors";
import LevelConfigTypePicker from "./level-config-type-picker";
import LevelConfigShortageBanner from "./level-config-shortage-banner";

interface Props {
  onConfigured: (config: LevelConfig) => void;
  initialTotal?: number;
  lockTotal?: boolean;
  syncedTypeCounts?: Partial<Record<QuestionType, number>>;
  // Required when syncedTypeCounts is owned by the parent — lets applySubstitution
  // update the parent's source of truth (e.g. workbench Format Weights matrix).
  onSyncedCountsChange?: (next: Partial<Record<QuestionType, number>>, newTotal: number) => void;
  hideTypePicker?: boolean;
  hideTotal?: boolean;
  submitLabel?: string;
  hideSubmit?: boolean;
}

export default function LevelConfigStep({ onConfigured, initialTotal, lockTotal = false, syncedTypeCounts, onSyncedCountsChange, hideTypePicker = false, hideTotal = false, submitLabel = "Pull questions", hideSubmit = false }: Props) {
  const [mode, setMode] = useState<"single" | "mixed">("single");
  const [total, setTotal] = useState(10);
  const [level, setLevel] = useState("junior");
  const [ratios, setRatios] = useState({ junior: 30, middle: 50, senior: 20 });
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<QuestionType, number>>({} as Record<QuestionType, number>);

  // Inline availability — populated from /api/question-bank/availability so reviewers
  // can see counts per type BEFORE pulling, and apply substitution upfront.
  // totalAllTopics/byTypeAllTopics show what's reachable if topic filter is dropped.
  const [availability, setAvailability] = useState<{
    total: number;
    byType: Partial<Record<QuestionType, number>>;
    byLevel: Record<string, number>;
    totalAllTopics: number;
    byTypeAllTopics: Partial<Record<QuestionType, number>>;
  } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    fetch("/api/question-bank?distinct=topics")
      .then((r) => r.json())
      .then((json) => {
        if (json.topics) setAvailableTopics(json.topics);
      })
      .catch(() => {});
  }, []);

  // Refetch availability whenever level filter or topics change.
  useEffect(() => {
    const levels = mode === "single" ? [level] : ["junior", "middle", "senior"];
    setLoadingAvailability(true);
    fetch("/api/question-bank/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levels, topics: selectedTopics.length ? selectedTopics : undefined }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (typeof json.total === "number") setAvailability({
          total: json.total,
          byType: json.byType ?? {},
          byLevel: json.byLevel ?? {},
          totalAllTopics: json.totalAllTopics ?? json.total,
          byTypeAllTopics: json.byTypeAllTopics ?? json.byType ?? {},
        });
      })
      .catch(() => setAvailability(null))
      .finally(() => setLoadingAvailability(false));
  }, [mode, level, selectedTopics]);

  useEffect(() => {
    if (typeof initialTotal === "number" && initialTotal > 0) {
      setTotal(initialTotal);
    }
  }, [initialTotal]);

  const ratioSum = ratios.junior + ratios.middle + ratios.senior;
  const ratioValid = Math.abs(ratioSum - 100) < 0.01;

  function toggleTopic(t: string) {
    setSelectedTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function buildConfig(): LevelConfig {
    const config: LevelConfig = {
      mode,
      total,
      topics: selectedTopics.length > 0 ? selectedTopics : undefined,
    };
    if (mode === "single") {
      config.level = level;
    } else {
      config.ratios = ratios;
    }
    const sourceTypeCounts = syncedTypeCounts ?? typeCounts;
    const selectedTypes = Object.entries(sourceTypeCounts)
      .filter(([, count]) => count > 0)
      .map(([question_type, count]) => ({ question_type: question_type as QuestionType, count }));
    if (selectedTypes.length > 0) config.type_counts = selectedTypes;
    return config;
  }

  function handleSubmit() {
    const config = buildConfig();
    onConfigured(config);
  }

  const serializedSyncedCounts = useMemo(
    () => JSON.stringify(syncedTypeCounts ?? {}),
    [syncedTypeCounts],
  );
  const lastAutoSyncRef = useRef<string>("");

  useEffect(() => {
    if (!hideSubmit) return;
    const nextConfig = buildConfig();
    const serialized = JSON.stringify(nextConfig);
    if (serialized === lastAutoSyncRef.current) return;
    lastAutoSyncRef.current = serialized;
    onConfigured(nextConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideSubmit, mode, total, level, ratios.junior, ratios.middle, ratios.senior, selectedTopics, serializedSyncedCounts]);

  const canSubmit =
    total >= 1 &&
    total <= 200 &&
    (mode === "single" ? !!level : ratioValid);

  // Per-type shortage view: requested > available.
  const activeTypeCounts = syncedTypeCounts ?? typeCounts;
  const shortages = useMemo(() => {
    if (!availability) return [];
    return Object.entries(activeTypeCounts)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([type, requested]) => {
        const available = availability.byType[type as QuestionType] ?? 0;
        return { type: type as QuestionType, requested: requested ?? 0, available, missing: Math.max(0, (requested ?? 0) - available) };
      })
      .filter((entry) => entry.missing > 0);
  }, [activeTypeCounts, availability]);

  const totalRequested = Object.values(activeTypeCounts).reduce((sum, count) => sum + (count ?? 0), 0);
  const totalAvailableForFilter = availability?.total ?? 0;

  // Redistribute deficit from short types into types that still have headroom.
  // Mutates typeCounts so the user sees the new weights filled in. Also caps
  // `total` to the actual achievable sum so Execute pulls exactly that many.
  const applySubstitution = useCallback(() => {
    if (!availability || shortages.length === 0) return;
    // Seed from whichever source of truth holds the current counts.
    const next: Record<QuestionType, number> = { ...(activeTypeCounts as Record<QuestionType, number>) };
    let deficit = 0;
    for (const s of shortages) {
      next[s.type] = s.available; // cap to what's available
      deficit += s.missing;
    }
    // Allocate deficit to types with headroom, largest headroom first.
    const headroom = Object.entries(availability.byType)
      .map(([type, available]) => {
        const current = next[type as QuestionType] ?? 0;
        return { type: type as QuestionType, room: Math.max(0, (available ?? 0) - current) };
      })
      .filter((entry) => entry.room > 0)
      .sort((a, b) => b.room - a.room);

    for (const { type, room } of headroom) {
      if (deficit <= 0) break;
      const take = Math.min(deficit, room);
      next[type] = (next[type] ?? 0) + take;
      deficit -= take;
    }
    const achievable = Object.values(next).reduce((sum, c) => sum + (c ?? 0), 0);
    // When type counts come from the parent (workbench Format Weights), update both
    // the parent's counts and total via callback. Otherwise own local state.
    if (syncedTypeCounts && onSyncedCountsChange) {
      onSyncedCountsChange(next, achievable);
    } else {
      setTypeCounts(next);
      if (achievable < total) setTotal(achievable);
    }
    if (achievable < total) {
      toast.warning(`Đã giảm tổng số câu từ ${total} xuống ${achievable} vì bank không đủ.`, {
        description: "Thêm câu hỏi vào bank hoặc bỏ lọc topic/level để tăng phạm vi.",
      });
    } else {
      toast.success("Đã phân bổ lại format weights theo số câu có sẵn trong bank.");
    }
  }, [availability, shortages, activeTypeCounts, total, syncedTypeCounts, onSyncedCountsChange]);

  // Drop topic filter so substitution can reach into other topics at the same level.
  // Triggers a re-fetch of availability via the [selectedTopics] effect.
  const expandToAllTopics = useCallback(() => {
    if (selectedTopics.length === 0) return;
    setSelectedTopics([]);
    toast.success("Đã bỏ lọc topic — substitution sẽ lấy thêm từ các topic khác cùng level.", {
      description: "Bấm 'Chấp nhận phương án thay thế' để phân bổ lại format weights.",
    });
  }, [selectedTopics]);

  const broaderAvailable = availability ? availability.totalAllTopics - availability.total : 0;

  // Preview what applySubstitution would produce — used to render a before/after
  // diff in the shortage banner so reviewers see the plan before approving it.
  const substitutionPreview = useMemo(() => {
    if (!availability || shortages.length === 0) return null;
    const next: Record<QuestionType, number> = { ...(activeTypeCounts as Record<QuestionType, number>) };
    let deficit = 0;
    for (const s of shortages) {
      next[s.type] = s.available;
      deficit += s.missing;
    }
    const fills: Array<{ type: QuestionType; from: number; to: number }> = [];
    const headroom = Object.entries(availability.byType)
      .map(([type, available]) => {
        const current = next[type as QuestionType] ?? 0;
        return { type: type as QuestionType, room: Math.max(0, (available ?? 0) - current) };
      })
      .filter((entry) => entry.room > 0)
      .sort((a, b) => b.room - a.room);
    for (const { type, room } of headroom) {
      if (deficit <= 0) break;
      const take = Math.min(deficit, room);
      const before = next[type] ?? 0;
      next[type] = before + take;
      fills.push({ type, from: before, to: next[type] });
      deficit -= take;
    }
    const achievable = Object.values(next).reduce((sum, c) => sum + (c ?? 0), 0);
    return { next, fills, achievable, stillShort: deficit };
  }, [availability, shortages, activeTypeCounts]);

  return (
    <div className="space-y-6">
      <LevelConfigSelectors
        mode={mode}
        setMode={setMode}
        total={total}
        setTotal={setTotal}
        lockTotal={lockTotal}
        hideTotal={hideTotal}
        level={level}
        setLevel={setLevel}
        ratios={ratios}
        setRatios={setRatios}
      />

      <LevelConfigTypePicker
        hideTypePicker={hideTypePicker}
        typeCounts={typeCounts}
        setTypeCounts={setTypeCounts}
        availability={availability}
        loadingAvailability={loadingAvailability}
      />

      {/* Shortage banner — always visible (synced or local mode). Shows a before/after
          diff so reviewers see exactly what the substitution will do. */}
      {shortages.length > 0 && substitutionPreview && (
        <LevelConfigShortageBanner
          shortages={shortages}
          substitutionPreview={substitutionPreview}
          totalRequested={totalRequested}
          totalAvailableForFilter={totalAvailableForFilter}
          broaderAvailable={broaderAvailable}
          selectedTopics={selectedTopics}
          availability={availability}
          onApplySubstitution={applySubstitution}
          onExpandToAllTopics={expandToAllTopics}
        />
      )}

      {/* Topic filter */}
      {availableTopics.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Topic filter (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTopics.map((t) => (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  selectedTopics.includes(t)
                    ? "bg-success/15 border-border/40 text-success"
                    : "border-border/15 text-muted-foreground hover:text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hideSubmit && (
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-success hover:bg-success text-white border-0 h-9 px-6 rounded-xl gap-2"
        >
          {submitLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
