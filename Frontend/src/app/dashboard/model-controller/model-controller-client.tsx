"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cpu,
  ScanFace,
  ShieldAlert,
  HardDrive,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  X,
  Sliders,
  Info,
  Activity,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Flame,
  UserX,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

export interface BehaviorModelConfig {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  modelPath: string;
  modelExists?: boolean;
  confidence: number;
  iouThreshold: number;
  labels: string[];
}

export interface VisionConfig {
  faceStoragePath: string;
  faceStorageExists?: boolean;
  faceModelName: string;
  faceMatchThreshold: number;
  behaviorModelPath?: string;
  behaviorModelExists?: boolean;
  behaviorConfidence?: number;
  behaviorLabels?: string[];
  behaviorModels: BehaviorModelConfig[];
}

interface StorageStats {
  storagePath: string;
  exists: boolean;
  totalUsers: number;
  totalImages: number;
  totalSizeBytes: number;
}

const DEFAULT_BEHAVIOR_MODELS: BehaviorModelConfig[] = [
  {
    id: "smoke_detection",
    name: "Mô hình phát hiện Hút thuốc (Smoking Detection)",
    description: "Phát hiện người hút thuốc lá, điếu thuốc và khói thuốc trong khu vực làm việc",
    enabled: true,
    modelPath: "D:\\WEB\\model_trained\\ML\\Model_trained\\rc_v1_yolov8\\train_yolov8n_200ep\\weights\\best.pt",
    confidence: 0.5,
    iouThreshold: 0.45,
    labels: ["smoke", "cigarette"],
  },
  {
    id: "seat_occupancy",
    name: "Mô hình phát hiện Rời vị trí (Seat & Desk Occupancy)",
    description: "Phát hiện bàn làm việc không có người hoặc ghế trống trong giờ làm",
    enabled: true,
    modelPath: "D:\\Open AI\\down_town\\src\\models\\vision-ai\\behavior.pt",
    confidence: 0.25,
    iouThreshold: 0.45,
    labels: ["empty_seat", "un-occupied_desk"],
  },
];

const DEFAULT_CONFIG: VisionConfig = {
  faceStoragePath: "D:\\Open AI\\down_town\\src\\data\\vision-ai\\faces",
  faceStorageExists: true,
  faceModelName: "buffalo_l",
  faceMatchThreshold: 0.75,
  behaviorModels: DEFAULT_BEHAVIOR_MODELS,
};

const ARCFACE_MODELS = [
  { id: "buffalo_l", name: "buffalo_l (Khuyên dùng - Chuẩn nhận diện cao nhất 512-dim)" },
  { id: "buffalo_m", name: "buffalo_m (Cân bằng tốc độ CPU & độ chính xác)" },
  { id: "buffalo_s", name: "buffalo_s (Nhẹ & siêu nhanh, tài nguyên thấp)" },
  { id: "buffalo_sc", name: "buffalo_sc (Biến thể rút gọn)" },
];

const MODEL_TEMPLATES = [
  {
    name: "Phát hiện Sử dụng điện thoại (Phone Usage)",
    description: "Cảnh báo khi nhân sự dùng điện thoại cá nhân trong giờ làm việc",
    modelPath: "models/vision-ai/phone.pt",
    confidence: 0.4,
    iouThreshold: 0.45,
    labels: ["phone", "cell phone", "phone_use"],
  },
  {
    name: "Phát hiện Ngủ trong giờ (Sleeping / Inactive)",
    description: "Cảnh báo tư thế gục đầu xuống bàn hoặc ngủ trong ca trực",
    modelPath: "models/vision-ai/sleeping.pt",
    confidence: 0.35,
    iouThreshold: 0.45,
    labels: ["sleeping", "head_down", "drowsy"],
  },
  {
    name: "Mô hình Tùy chỉnh (Custom Behavior)",
    description: "Tự định nghĩa trọng số YOLO và danh sách các nhãn vi phạm mục tiêu",
    modelPath: "yolov8n.pt",
    confidence: 0.3,
    iouThreshold: 0.45,
    labels: ["custom_violation"],
  },
];

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ModelControllerClient() {
  const [config, setConfig] = useState<VisionConfig>(DEFAULT_CONFIG);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // New model creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelDesc, setNewModelDesc] = useState("");
  const [newModelPath, setNewModelPath] = useState("");
  const [newModelConf, setNewModelConf] = useState(0.35);
  const [newModelIou, setNewModelIou] = useState(0.45);
  const [newModelLabels, setNewModelLabels] = useState<string[]>(["violation"]);
  const [newModelTagInput, setNewModelTagInput] = useState("");

  // Per-model tag input helper
  const [perModelTagInput, setPerModelTagInput] = useState<Record<string, string>>({});

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vision-controller", { cache: "no-store" });
      const data = await readApiResponse<{
        ok?: boolean;
        error?: string;
        config?: VisionConfig;
        storage?: StorageStats;
      }>(res);

      if (!res.ok || !data.ok) {
        setBackendOnline(false);
        toast.error("Không thể kết nối dịch vụ Vision AI Backend", {
          description: data.error || "Vui lòng kiểm tra cổng 8001 của Python FastAPI",
        });
      } else {
        setBackendOnline(true);
        if (data.config) {
          const cfg = data.config;
          if (!cfg.behaviorModels || cfg.behaviorModels.length === 0) {
            cfg.behaviorModels = DEFAULT_BEHAVIOR_MODELS;
          }
          setConfig(cfg);
        }
        if (data.storage) {
          setStorageStats(data.storage);
        }
      }
    } catch (err) {
      setBackendOnline(false);
      toast.error(err instanceof Error ? err.message : "Lỗi mạng khi tải cấu hình Model AI");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vision-controller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await readApiResponse<{
        ok?: boolean;
        message?: string;
        error?: string;
        config?: VisionConfig;
        storage?: StorageStats;
      }>(res);

      if (!res.ok || !data.ok) {
        toast.error("Lưu cấu hình thất bại", {
          description: data.error || "Kiểm tra lại định dạng tham số",
        });
      } else {
        toast.success("Cập nhật tham số mô hình Vision AI thành công!", {
          description: "Các mô hình ArcFace & YOLO (Smoke, Seat, Custom) đã nạp cấu hình mới nhất.",
        });
        if (data.config) {
          const cfg = data.config;
          if (!cfg.behaviorModels || cfg.behaviorModels.length === 0) {
            cfg.behaviorModels = DEFAULT_BEHAVIOR_MODELS;
          }
          setConfig(cfg);
        }
        if (data.storage) setStorageStats(data.storage);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi gửi yêu cầu cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    toast.info("Đã đặt lại thông số về giá trị mặc định", {
      description: "Nhấn 'Lưu cấu hình' để áp dụng xuống hệ thống.",
    });
  };

  // Model update helpers
  const updateModelField = (modelId: string, patch: Partial<BehaviorModelConfig>) => {
    setConfig((prev) => ({
      ...prev,
      behaviorModels: prev.behaviorModels.map((m) =>
        m.id === modelId ? { ...m, ...patch } : m
      ),
    }));
  };

  const handleToggleModelEnabled = (modelId: string) => {
    setConfig((prev) => ({
      ...prev,
      behaviorModels: prev.behaviorModels.map((m) =>
        m.id === modelId ? { ...m, enabled: !m.enabled } : m
      ),
    }));
  };

  const handleDeleteModel = (modelId: string, modelName: string) => {
    if (config.behaviorModels.length <= 1) {
      toast.warning("Hệ thống cần giữ lại ít nhất 1 mô hình giám sát");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      behaviorModels: prev.behaviorModels.filter((m) => m.id !== modelId),
    }));
    toast.info(`Đã xóa mô hình "${modelName}"`);
  };

  const handleAddLabelToModel = (modelId: string) => {
    const raw = (perModelTagInput[modelId] || "").trim().toLowerCase();
    if (!raw) return;
    const targetModel = config.behaviorModels.find((m) => m.id === modelId);
    if (!targetModel) return;

    if (targetModel.labels.includes(raw)) {
      toast.warning("Nhãn này đã có trong danh sách");
      return;
    }

    updateModelField(modelId, {
      labels: [...targetModel.labels, raw],
    });
    setPerModelTagInput((prev) => ({ ...prev, [modelId]: "" }));
  };

  const handleRemoveLabelFromModel = (modelId: string, labelToRemove: string) => {
    const targetModel = config.behaviorModels.find((m) => m.id === modelId);
    if (!targetModel) return;
    updateModelField(modelId, {
      labels: targetModel.labels.filter((l) => l !== labelToRemove),
    });
  };

  // Add new model workflow
  const applyTemplate = (tmpl: typeof MODEL_TEMPLATES[number]) => {
    setNewModelName(tmpl.name);
    setNewModelDesc(tmpl.description);
    setNewModelPath(tmpl.modelPath);
    setNewModelConf(tmpl.confidence);
    setNewModelIou(tmpl.iouThreshold);
    setNewModelLabels([...tmpl.labels]);
  };

  const handleAddNewModelSubmit = () => {
    if (!newModelName.trim()) {
      toast.error("Vui lòng nhập tên mô hình");
      return;
    }
    if (!newModelPath.trim()) {
      toast.error("Vui lòng nhập đường dẫn file weights (.pt)");
      return;
    }
    const newId = `custom_${Date.now()}`;
    const newModel: BehaviorModelConfig = {
      id: newId,
      name: newModelName.trim(),
      description: newModelDesc.trim(),
      enabled: true,
      modelPath: newModelPath.trim(),
      modelExists: false,
      confidence: newModelConf,
      iouThreshold: newModelIou,
      labels: newModelLabels.length > 0 ? newModelLabels : ["violation"],
    };

    setConfig((prev) => ({
      ...prev,
      behaviorModels: [...prev.behaviorModels, newModel],
    }));

    toast.success(`Đã thêm mô hình "${newModel.name}" vào danh sách`, {
      description: "Hãy nhấn 'Lưu cấu hình Model AI' để áp dụng xuống hệ thống.",
    });

    // Reset add form
    setShowAddForm(false);
    setNewModelName("");
    setNewModelDesc("");
    setNewModelPath("");
    setNewModelConf(0.35);
    setNewModelIou(0.45);
    setNewModelLabels(["violation"]);
  };

  const handleAddNewModelTag = () => {
    const raw = newModelTagInput.trim().toLowerCase();
    if (!raw) return;
    if (newModelLabels.includes(raw)) {
      toast.warning("Nhãn này đã tồn tại");
      return;
    }
    setNewModelLabels((prev) => [...prev, raw]);
    setNewModelTagInput("");
  };

  const getModelIcon = (modelId: string) => {
    if (modelId.includes("smoke")) return <Flame className="h-5 w-5 text-amber-400" />;
    if (modelId.includes("seat") || modelId.includes("leaving"))
      return <UserX className="h-5 w-5 text-rose-400" />;
    return <ShieldAlert className="h-5 w-5 text-indigo-400" />;
  };

  const getModelBadgeColor = (modelId: string) => {
    if (modelId.includes("smoke")) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    if (modelId.includes("seat") || modelId.includes("leaving"))
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppNavbar />
      <PageContainer>
        <div className="space-y-6 pb-12">
          {/* Breadcrumb */}
          <PageBreadcrumb
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Giám sát nơi làm việc", href: "/dashboard/faces" },
              { label: "Cấu hình Model AI" },
            ]}
          />

          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Cpu className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                      Bộ điều khiển Mô hình Vision AI
                    </h1>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10">
                      Super Admin Only
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Tinh chỉnh độc lập tham số ArcFace và các mô hình YOLO (Smoke, Rời vị trí, Custom) kèm ngưỡng IOU.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-400">Vision API:</span>
                {backendOnline === true && (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online (Port 8001)
                  </span>
                )}
                {backendOnline === false && (
                  <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Offline
                  </span>
                )}
                {backendOnline === null && (
                  <span className="text-slate-500">Đang kiểm tra...</span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadConfig}
                disabled={loading}
                className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Tải lại
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Đang tải tham số các mô hình AI...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION 1: ARCFACE / INSIGHTFACE */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ScanFace className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">1. Mô hình Khuôn mặt (ArcFace / InsightFace)</h2>
                </div>
                <Card className="border-slate-800 bg-slate-900/80 shadow-lg">
                  <CardHeader className="border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-white">InsightFace Buffalo Biometric Engine</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Xử lý Đăng ký 6 góc, Đăng nhập Face Login & Chấm công nhận diện
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        Face Attendance
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
                    {/* Model Architecture Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Kiến trúc mô hình khuôn mặt (Model Name)
                      </label>
                      <select
                        value={config.faceModelName}
                        onChange={(e) => setConfig({ ...config, faceModelName: e.target.value })}
                        aria-label="Kiến trúc mô hình khuôn mặt"
                        className="w-full rounded-md border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {ARCFACE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400">
                        buffalo_l trích xuất vector đặc trưng chuẩn 512 chiều với độ chính xác cao nhất.
                      </p>
                    </div>

                    {/* Face Match Threshold */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Ngưỡng so khớp khuôn mặt (Cosine Similarity)
                        </label>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {(config.faceMatchThreshold * 100).toFixed(0)}% ({config.faceMatchThreshold})
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.40"
                        max="0.95"
                        step="0.01"
                        value={config.faceMatchThreshold}
                        onChange={(e) =>
                          setConfig({ ...config, faceMatchThreshold: parseFloat(e.target.value) })
                        }
                        aria-label="Ngưỡng so khớp khuôn mặt"
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0.40 (Dễ)</span>
                        <span className="text-emerald-400 font-semibold">0.75 (Khuyên dùng)</span>
                        <span>0.95 (Cực kỳ nghiêm ngặt)</span>
                      </div>
                      <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/60 text-xs text-slate-300">
                        <span className="text-emerald-300 font-medium">Quy tắc xác thực 6 góc:</span> Khi chấm công, ảnh quét phải đạt độ tương đồng ≥{" "}
                        <strong className="text-emerald-400">{config.faceMatchThreshold}</strong> trên ít nhất 2 trong 6 góc.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SECTION 2: SEPARATE BEHAVIOR YOLO MODELS */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">2. Các Mô hình YOLO Giám sát hành vi</h2>
                      <p className="text-xs text-slate-400">
                        Từng mô hình hoạt động độc lập với trọng số weights, ngưỡng Confidence, ngưỡng IOU và danh sách nhãn riêng biệt.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-3.5 self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {showAddForm ? "Đóng form thêm model" : "Thêm Model mới"}
                  </Button>
                </div>

                {/* EXPANDABLE ADD NEW MODEL FORM */}
                {showAddForm && (
                  <Card className="mb-6 border-indigo-500/40 bg-slate-900/95 shadow-xl animate-in fade-in slide-in-from-top-2">
                    <CardHeader className="border-b border-slate-800 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-indigo-400" />
                          <CardTitle className="text-sm font-semibold text-white">
                            Thêm mô hình giám sát hành vi mới
                          </CardTitle>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          aria-label="Đóng"
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <CardDescription className="text-xs text-slate-400">
                        Chọn một mẫu có sẵn hoặc tự điền trọng số YOLOv8 để bổ sung thêm model mới vào hệ thống.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Templates shortcuts */}
                      <div>
                        <p className="text-xs text-slate-300 font-medium mb-1.5">Mẫu cấu hình nhanh:</p>
                        <div className="flex flex-wrap gap-2">
                          {MODEL_TEMPLATES.map((tmpl) => (
                            <button
                              key={tmpl.name}
                              type="button"
                              onClick={() => applyTemplate(tmpl)}
                              className="px-2.5 py-1 text-xs rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                            >
                              + {tmpl.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-300">Tên mô hình:</label>
                          <Input
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            placeholder="vd: Phát hiện Dùng điện thoại"
                            className="bg-slate-800 border-slate-700 text-xs h-8"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-300">Mô tả ngắn:</label>
                          <Input
                            value={newModelDesc}
                            onChange={(e) => setNewModelDesc(e.target.value)}
                            placeholder="vd: Nhận diện cầm điện thoại trong giờ làm việc"
                            className="bg-slate-800 border-slate-700 text-xs h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300">Đường dẫn trọng số weights (.pt):</label>
                        <Input
                          value={newModelPath}
                          onChange={(e) => setNewModelPath(e.target.value)}
                          placeholder="D:\models\phone_detection.pt hoặc yolov8n.pt"
                          className="bg-slate-800 border-slate-700 font-mono text-xs h-8"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* New Model Confidence Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300">Confidence Threshold (Độ tin cậy):</span>
                            <span className="font-mono text-amber-400 font-bold">{(newModelConf * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="0.95"
                            step="0.01"
                            value={newModelConf}
                            onChange={(e) => setNewModelConf(parseFloat(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        {/* New Model IOU Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300">IOU Threshold (Ngưỡng lọc trùng):</span>
                            <span className="font-mono text-sky-400 font-bold">{(newModelIou * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.10"
                            max="0.95"
                            step="0.01"
                            value={newModelIou}
                            onChange={(e) => setNewModelIou(parseFloat(e.target.value))}
                            className="w-full accent-sky-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* New Model Labels */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs text-slate-300">Nhãn vi phạm bắt buộc:</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {newModelLabels.map((lbl) => (
                            <Badge
                              key={lbl}
                              className="bg-slate-800 border border-slate-700 text-slate-200 pl-2 pr-1 py-0.5 flex items-center gap-1 text-xs"
                            >
                              <span>{lbl}</span>
                              <button
                                type="button"
                                onClick={() => setNewModelLabels(newModelLabels.filter((l) => l !== lbl))}
                                className="hover:text-rose-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newModelTagInput}
                            onChange={(e) => setNewModelTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewModelTag();
                              }
                            }}
                            placeholder="Thêm nhãn (vd: phone_use)..."
                            className="bg-slate-800 border-slate-700 text-xs h-8"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddNewModelTag}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 h-8 px-3 text-xs"
                          >
                            + Thêm nhãn
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddForm(false)}
                          className="border-slate-700 bg-slate-800 text-slate-300 text-xs h-8"
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddNewModelSubmit}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                        >
                          Xác nhận thêm Model
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* INDIVIDUAL MODEL CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {config.behaviorModels.map((model, idx) => {
                    const isSmoke = model.id.includes("smoke");
                    const isSeat = model.id.includes("seat") || model.id.includes("leaving");

                    return (
                      <Card
                        key={model.id}
                        className={`border-slate-800 bg-slate-900/80 shadow-lg transition-all ${
                          !model.enabled ? "opacity-60 border-dashed" : ""
                        }`}
                      >
                        <CardHeader className="border-b border-slate-800 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
                                {getModelIcon(model.id)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base text-white">
                                    {model.name}
                                  </CardTitle>
                                </div>
                                <CardDescription className="text-xs text-slate-400 mt-0.5">
                                  {model.description || "Mô hình suy luận vi phạm hành vi"}
                                </CardDescription>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleModelEnabled(model.id)}
                                title={model.enabled ? "Đang bật - Nhấn để tắt" : "Đang tắt - Nhấn để bật"}
                                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-slate-700 bg-slate-800/80 transition-colors hover:bg-slate-700"
                              >
                                {model.enabled ? (
                                  <>
                                    <ToggleRight className="h-4 w-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">Bật</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="h-4 w-4 text-slate-500" />
                                    <span className="text-slate-500">Tắt</span>
                                  </>
                                )}
                              </button>

                              {!isSmoke && !isSeat && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteModel(model.id, model.name)}
                                  title="Xóa mô hình này"
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-5 pt-4">
                          {/* Model Weights Path */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Đường dẫn trọng số weights (.pt)
                              </label>
                              {model.modelExists ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> File khả dụng
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-amber-400">
                                  <AlertTriangle className="h-3 w-3" /> Chưa tìm thấy file
                                </span>
                              )}
                            </div>
                            <Input
                              value={model.modelPath}
                              onChange={(e) => updateModelField(model.id, { modelPath: e.target.value })}
                              placeholder="D:\models\weights.pt"
                              className="bg-slate-800/90 border-slate-700 text-slate-100 font-mono text-xs"
                            />

                            {/* Preset Shortcuts */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="text-[11px] text-slate-500 self-center mr-0.5">Gợi ý:</span>
                              {isSmoke && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateModelField(model.id, {
                                      modelPath:
                                        "D:\\WEB\\model_trained\\ML\\Model_trained\\rc_v1_yolov8\\train_yolov8n_200ep\\weights\\best.pt",
                                    })
                                  }
                                  className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono"
                                >
                                  rc_v1_yolov8 (Best)
                                </button>
                              )}
                              {isSeat && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateModelField(model.id, {
                                      modelPath: "D:\\Open AI\\down_town\\src\\models\\vision-ai\\behavior.pt",
                                    })
                                  }
                                  className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 font-mono"
                                >
                                  behavior.pt
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => updateModelField(model.id, { modelPath: "yolov8n.pt" })}
                                className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-mono"
                              >
                                yolov8n.pt
                              </button>
                            </div>
                          </div>

                          {/* Dual Sliders: Confidence & IOU */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800">
                            {/* Confidence Threshold */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                                  Confidence (Độ tin cậy)
                                </label>
                                <span className="font-mono text-xs font-bold text-amber-400">
                                  {(model.confidence * 100).toFixed(0)}% ({model.confidence})
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.05"
                                max="0.95"
                                step="0.01"
                                value={model.confidence}
                                onChange={(e) =>
                                  updateModelField(model.id, { confidence: parseFloat(e.target.value) })
                                }
                                aria-label={`Độ tin cậy của ${model.name}`}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-500">
                                Ngưỡng tối thiểu để chấp nhận phát hiện là vi phạm.
                              </p>
                            </div>

                            {/* IOU Threshold */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                                  IOU Threshold (Gộp BBox)
                                </label>
                                <span className="font-mono text-xs font-bold text-sky-400">
                                  {(model.iouThreshold * 100).toFixed(0)}% ({model.iouThreshold})
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.10"
                                max="0.95"
                                step="0.01"
                                value={model.iouThreshold}
                                onChange={(e) =>
                                  updateModelField(model.id, { iouThreshold: parseFloat(e.target.value) })
                                }
                                aria-label={`Ngưỡng IOU của ${model.name}`}
                                className="w-full accent-sky-500 cursor-pointer"
                              />
                              <p className="text-[10px] text-slate-500">
                                Ngưỡng NMS loại bỏ bounding box trùng lặp (chuẩn 0.45).
                              </p>
                            </div>
                          </div>

                          {/* Target Violation Labels */}
                          <div className="space-y-2.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              Nhãn vi phạm theo dõi (Target Labels)
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {model.labels.map((lbl) => (
                                <Badge
                                  key={lbl}
                                  className={`${getModelBadgeColor(
                                    model.id
                                  )} pl-2.5 pr-1 py-1 flex items-center gap-1.5 text-xs font-mono`}
                                >
                                  <span>{lbl}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLabelFromModel(model.id, lbl)}
                                    aria-label={`Xóa nhãn ${lbl}`}
                                    className="hover:bg-white/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>

                            {/* Add Label to Model */}
                            <div className="flex gap-2 pt-1">
                              <Input
                                value={perModelTagInput[model.id] || ""}
                                onChange={(e) =>
                                  setPerModelTagInput({
                                    ...perModelTagInput,
                                    [model.id]: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddLabelToModel(model.id);
                                  }
                                }}
                                placeholder="Thêm nhãn vi phạm..."
                                className="bg-slate-800/90 border-slate-700 text-xs text-slate-100 h-8"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAddLabelToModel(model.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 h-8 px-3 text-xs"
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: STORAGE & DIRECTORIES */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-5 w-5 text-sky-400" />
                  <h2 className="text-lg font-semibold text-white">3. Đường dẫn Lưu trữ Dữ liệu Cục bộ (Local Storage)</h2>
                </div>
                <Card className="border-slate-800 bg-slate-900/80 shadow-lg">
                  <CardHeader className="border-b border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base text-white">
                          Cấu hình Đường dẫn Lưu trữ Dữ liệu (Local Storage)
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Đường dẫn thư mục vật lý lưu trữ ảnh mẫu 6 góc, vector embeddings và dữ liệu vi phạm
                        </CardDescription>
                      </div>
                      <Badge className="bg-sky-500/10 border-sky-500/30 text-sky-400">
                        Storage Controller
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Đường dẫn thư mục lưu khuôn mặt (Face Storage Path)
                        </label>
                        {storageStats?.exists ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Thư mục đã sẵn sàng trên ổ đĩa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-amber-400">
                            <AlertTriangle className="h-3 w-3" /> Thư mục sẽ được tạo tự động khi ghi dữ liệu
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={config.faceStoragePath}
                          onChange={(e) => setConfig({ ...config, faceStoragePath: e.target.value })}
                          placeholder="D:\data\vision-ai\faces"
                          className="bg-slate-800/90 border-slate-700 text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="text-[11px] text-slate-400 self-center">Gợi ý:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              faceStoragePath:
                                "D:\\Open AI\\down_town\\src\\data\\vision-ai\\faces",
                            })
                          }
                          className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono"
                        >
                          src/data/vision-ai/faces (Chuẩn dự án)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig({
                              ...config,
                              faceStoragePath: "C:\\data\\vision-ai\\faces",
                            })
                          }
                          className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono"
                        >
                          C:\data\vision-ai\faces
                        </button>
                      </div>
                    </div>

                    {/* Real-time Storage Metrics Cards */}
                    {storageStats && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="text-xs text-slate-400">Tổng số hồ sơ nhân sự</p>
                          <p className="text-2xl font-bold text-white mt-1">
                            {storageStats.totalUsers}{" "}
                            <span className="text-xs font-normal text-slate-500">tài khoản</span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="text-xs text-slate-400">Tổng ảnh mẫu 6 góc</p>
                          <p className="text-2xl font-bold text-sky-400 mt-1">
                            {storageStats.totalImages}{" "}
                            <span className="text-xs font-normal text-slate-500">ảnh</span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="text-xs text-slate-400">Dung lượng đĩa đã chiếm dụng</p>
                          <p className="text-2xl font-bold text-emerald-400 mt-1">
                            {formatBytes(storageStats.totalSizeBytes)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* SAVE / RESET ACTIONS BAR */}
              <div className="sticky bottom-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/90 to-slate-900/95 border border-indigo-500/30 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Sliders className="h-5 w-5 text-indigo-400 shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Thông số của từng mô hình (Smoke, Seat, ArcFace) sẽ có hiệu lực ngay lập tức không cần restart backend.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetDefaults}
                    disabled={saving}
                    className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Khôi phục mặc định
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 text-xs sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu cấu hình...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu cấu hình Model AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
