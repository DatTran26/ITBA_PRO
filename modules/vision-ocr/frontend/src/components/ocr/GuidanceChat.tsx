import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChatTeardrop, CheckCircle, Spinner, Warning } from "@phosphor-icons/react";
import type {
  AdvisoryNextAction,
  FieldDefinition,
  GuidanceMessage,
  GuidanceResponse,
} from "../../types/ocr";
import { chatGuidance, OCRServiceError } from "../../services/ocrService";

// ─── Kiểu gợi ý nhanh ────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Tôi cần làm bản tường trình về tai nạn giao thông",
  "Tôi muốn xin nghỉ phép 2 ngày",
  "Tôi cần viết báo cáo công việc",
  "Cần làm công văn gửi cơ quan khác",
  "Tôi muốn soạn tờ trình đề xuất",
];

// ─── Props ───────────────────────────────────────────────────────────────────
interface GuidanceChatProps {
  /** Gọi khi Guidance Agent đã xác định loại văn bản. */
  onResolved: (docType: string, requiredFields: FieldDefinition[], processSteps: string[]) => void;
}

// ─── Message bubble ──────────────────────────────────────────────────────────
interface BubbleProps {
  message: GuidanceMessage;
  isLatest?: boolean;
}

function MessageBubble({ message, isLatest }: BubbleProps) {
  const isUser = message.role === "user";
  return (
    <div
      className={`gc-bubble-row${isUser ? " gc-bubble-row--user" : ""}`}
      aria-live={isLatest ? "polite" : undefined}
    >
      {!isUser && (
        <div className="gc-avatar" aria-hidden="true">
          <ChatTeardrop weight="fill" size={16} />
        </div>
      )}
      <div className={`gc-bubble${isUser ? " gc-bubble--user" : " gc-bubble--assistant"}`}>
        {/* Render markdown-style **bold** */}
        <span
          dangerouslySetInnerHTML={{
            __html: message.content
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\n/g, "<br/>"),
          }}
        />
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="gc-bubble-row">
      <div className="gc-avatar" aria-hidden="true">
        <ChatTeardrop weight="fill" size={16} />
      </div>
      <div className="gc-bubble gc-bubble--assistant gc-bubble--typing" aria-label="Đang trả lời...">
        <span className="gc-dot" />
        <span className="gc-dot" />
        <span className="gc-dot" />
      </div>
    </div>
  );
}

// ─── Resolved banner ──────────────────────────────────────────────────────────
function ResolvedBanner({ docType, onContinue }: { docType: string; onContinue: () => void }) {
  return (
    <div className="gc-resolved-banner" role="status">
      <CheckCircle weight="fill" size={20} className="gc-resolved-icon" />
      <div className="gc-resolved-text">
        <span className="gc-resolved-label">Đã xác định:</span>
        <strong>{docType}</strong>
      </div>
      <button
        id="guidance-continue-btn"
        className="gc-continue-btn"
        onClick={onContinue}
        aria-label={`Tiếp tục điền thông tin cho ${docType}`}
      >
        Điền thông tin
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GuidanceChat({ onResolved }: GuidanceChatProps) {
  const [messages, setMessages] = useState<GuidanceMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý văn thư hành chính. Bạn đang cần làm loại giấy tờ gì, hoặc gặp vấn đề gì cần văn bản pháp lý? Hãy mô tả ngắn gọn để tôi hỗ trợ nhé.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<GuidanceResponse | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: GuidanceMessage = { role: "user", content: trimmed };
    const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await chatGuidance(trimmed, [...history, userMsg]);
      const aiMsg: GuidanceMessage = { role: "assistant", content: res.message };
      setMessages((prev) => [...prev, aiMsg]);

      if (res.is_resolved && res.doc_type) {
        setResolved(res);
      }
    } catch (err) {
      const msg =
        err instanceof OCRServiceError && err.kind === "network"
          ? "Không thể kết nối máy chủ. Vui lòng thử lại."
          : "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleContinue() {
    if (!resolved) return;
    onResolved(resolved.doc_type!, resolved.required_fields, resolved.process_steps);
  }

  return (
    <div className="gc-container" role="region" aria-label="Tư vấn loại văn bản">
      {/* Header */}
      <div className="gc-header">
        <ChatTeardrop weight="fill" size={20} />
        <span>Trợ lý Văn thư</span>
        {resolved && (
          <span className="gc-header-badge" aria-live="polite">
            ✓ {resolved.doc_type}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="gc-messages" role="log" aria-live="polite" aria-atomic="false">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} isLatest={i === messages.length - 1} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Resolved banner */}
      {resolved && <ResolvedBanner docType={resolved.doc_type!} onContinue={handleContinue} />}

      {/* Quick prompts — only show at start */}
      {messages.length === 1 && !loading && (
        <div className="gc-quick-prompts" role="list" aria-label="Gợi ý nhanh">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              className="gc-quick-btn"
              role="listitem"
              onClick={() => handleSend(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {!resolved && (
        <div className="gc-input-row">
          <textarea
            ref={inputRef}
            id="guidance-input"
            className="gc-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mô tả vấn đề của bạn… (Enter để gửi)"
            rows={2}
            aria-label="Nhập tin nhắn"
            disabled={loading}
          />
          <button
            id="guidance-send-btn"
            className="gc-send-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            aria-label="Gửi tin nhắn"
          >
            {loading ? <Spinner size={18} className="gc-spin" /> : <ArrowRight size={18} weight="bold" />}
          </button>
        </div>
      )}
    </div>
  );
}
