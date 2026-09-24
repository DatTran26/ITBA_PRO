"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Inbox,
  Filter,
  FileCheck2,
  MessagesSquare,
  Mail,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Timer,
  ClipboardList,
  PlayCircle,
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, PageTransition } from "@/components/ui/motion-wrapper";

/** Bốn bước chính của phễu tuyển dụng. Dải chuyển sắc xanh → lục chạy theo
 *  chiều đi của ứng viên là chi tiết nhận diện riêng của ITBA. */
const PIPELINE = [
  { icon: Inbox, label: "Nhận hồ sơ", value: "412", color: "var(--primary)" },
  { icon: Filter, label: "AI sàng lọc", value: "294", color: "var(--primary)" },
  { icon: FileCheck2, label: "Làm bài test", value: "183", color: "var(--primary)" },
  { icon: MessagesSquare, label: "Phỏng vấn", value: "94", color: "var(--success)" },
  { icon: Mail, label: "Gửi offer", value: "37", color: "var(--success)" },
  { icon: UserCheck, label: "Nhận việc", value: "24", color: "var(--success)" },
];

const PROOF = [
  { value: "4,2 phút", label: "trung bình để chấm xong một CV" },
  { value: "88%", label: "hồ sơ được chấm tự động" },
  { value: "31 ngày", label: "thời gian tuyển trung bình" },
  { value: "100%", label: "quyết định đều có ghi căn cứ" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Chấm CV theo đúng mô tả công việc",
    body: "Điểm phù hợp được phân rã theo kỹ năng, kinh nghiệm và lĩnh vực chuyên môn. Mỗi thành phần điểm đều kèm căn cứ lấy từ CV, không phải một con số từ trên trời.",
    tint: "var(--ai-bg)",
    ink: "var(--ai-txt)",
    wide: true,
  },
  {
    icon: ClipboardList,
    title: "Bài test kỹ thuật tự sinh",
    body: "Sinh đề theo vị trí tuyển dụng, chấm tự động và đối chiếu với điểm CV.",
    tint: "var(--cyan-bg)",
    ink: "var(--cyan-txt)",
  },
  {
    icon: ShieldCheck,
    title: "HR luôn giữ quyền quyết định",
    body: "AI đề xuất, người duyệt. Mọi lần ghi đè điểm đều bắt buộc ghi lý do và lưu lại người thực hiện.",
    tint: "var(--ok-bg)",
    ink: "var(--tg-success)",
  },
  {
    icon: Timer,
    title: "Không hồ sơ nào bị bỏ quên",
    body: "Hồ sơ dưới ngưỡng vào danh sách cần xem lại chứ không bị loại thẳng. Quá hạn phản hồi thì hệ thống nhắc.",
    tint: "var(--warn-bg)",
    ink: "var(--warn-txt)",
    wide: true,
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!mounted) return null;

  return (
    <PageTransition className="tg min-h-screen overflow-hidden relative">
      {/* Mảng nền mềm — chỉ ở trang giới thiệu, màn hình làm việc không có */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[10%] -left-[8%] w-[45%] h-[45%] rounded-full bg-primary/40 blur-[130px]" />
        <div className="absolute top-[35%] -right-[12%] w-[40%] h-[40%] rounded-full bg-primary/60 blur-[120px]" />
      </div>

      <motion.nav
        initial={false}
        animate={{
          top: scrolled ? 14 : 28,
          paddingTop: scrolled ? 12 : 16,
          paddingBottom: scrolled ? 12 : 16,
        }}
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[min(92%,64rem)] px-6 sm:px-8 rounded-full bg-white/90 backdrop-blur-xl border border-[var(--tg-border)] shadow-[var(--sh)] flex justify-between items-center gap-4"
      >
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <Image src="/logo.png" alt="Town Hown" width={545} height={398} className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" priority />
          <span className="tg-display text-xl text-[var(--p-deep)] tracking-tight">ITBA</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--tg-muted)]">
          <a href="#quy-trinh" className="hover:text-[var(--p-deep)] transition-colors">Quy trình</a>
          <a href="#tinh-nang" className="hover:text-[var(--p-deep)] transition-colors">Tính năng</a>
        </div>

        <Link
          href="/login"
          className="tg-pill px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shrink-0"
        >
          Đăng nhập
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.nav>

      <main className="relative z-10">
        <section className="pt-52 sm:pt-56 pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-[var(--tg-border)] shadow-[var(--sh)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--p-deep)]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Nền tảng tuyển dụng có AI
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="tg-display mt-8 text-[clamp(2rem,5.6vw,3.75rem)] text-[var(--p-deep)] max-w-[18ch]">
                Từ 412 hồ sơ xuống 24 người nhận việc,{" "}
                <span className="text-primary">không ai bị bỏ sót</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-7 max-w-[60ch] text-lg text-[var(--tg-muted)] leading-relaxed">
                Chấm CV theo đúng mô tả công việc, chấm bài test kỹ thuật, và ghi lại căn cứ cho
                từng quyết định để HR có thể lật lại bất cứ lúc nào.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/login" className="tg-pill px-7 py-3.5 text-[15px] font-semibold flex items-center gap-2.5">
                  Dùng thử miễn phí
                  <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
                <a href="#quy-trinh" className="tg-pill-ghost px-7 py-3.5 text-[15px] font-semibold flex items-center gap-2.5">
                  <PlayCircle className="w-[18px] h-[18px]" />
                  Xem quy trình
                </a>
              </div>
            </FadeIn>

            <StaggerContainer className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PROOF.map((p) => (
                <StaggerItem key={p.label}>
                  <div className="tg-card-sm p-5 h-full">
                    <div className="tg-display text-[22px] text-[var(--p-deep)] tabular-nums">{p.value}</div>
                    <p className="mt-1 text-[13px] text-[var(--tg-muted)] leading-snug">{p.label}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="quy-trinh" className="py-20 px-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="tg-heading text-[clamp(1.4rem,3vw,2rem)] text-[var(--tg-text)]">
                Sáu bước, mỗi bước đều có số
              </h2>
              <p className="mt-3 max-w-[64ch] text-[15px] text-[var(--tg-muted)]">
                Số liệu quý III của một vị trí Kỹ sư Backend. HR nhìn một lần là biết hồ sơ đang
                đọng ở đâu.
              </p>
            </FadeIn>

            <StaggerContainer className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {PIPELINE.map((s) => (
                <StaggerItem key={s.label}>
                  <div className="tg-card-sm overflow-hidden h-full">
                    <div className="h-12 grid place-items-center text-white" style={{ background: s.color }}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="px-3 pt-3 pb-4 text-center">
                      <div className="tg-display text-lg text-[var(--tg-text)] tabular-nums">{s.value}</div>
                      <p className="mt-0.5 text-[12px] text-[var(--tg-muted)]">{s.label}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="tinh-nang" className="py-20 px-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="tg-heading text-[clamp(1.4rem,3vw,2rem)] text-[var(--tg-text)]">
                AI chấm điểm, con người quyết định
              </h2>
            </FadeIn>

            <StaggerContainer className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-4">
              {FEATURES.map((f) => (
                <StaggerItem key={f.title} className={f.wide ? "md:col-span-7" : "md:col-span-5"}>
                  <div className="tg-card p-8 h-full flex flex-col gap-4">
                    <span className="tg-ico" style={{ background: f.tint, color: f.ink }}>
                      <f.icon className="w-5 h-5" />
                    </span>
                    <h3 className="tg-heading text-xl text-[var(--tg-text)]">{f.title}</h3>
                    <p className="text-[15px] text-[var(--tg-muted)] leading-relaxed">{f.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto tg-card px-8 py-12 sm:px-12 text-center flex flex-col items-center gap-6">
            <h2 className="tg-display text-[clamp(1.5rem,3.4vw,2.25rem)] text-[var(--p-deep)] max-w-[20ch]">
              Bắt đầu với vị trí đang tuyển gấp nhất của bạn
            </h2>
            <p className="max-w-[54ch] text-[15px] text-[var(--tg-muted)]">
              Tải lên mô tả công việc và một tập CV, hệ thống trả về danh sách đã xếp hạng kèm căn cứ.
            </p>
            <Link href="/login" className="tg-pill px-8 py-3.5 text-[15px] font-semibold flex items-center gap-2.5">
              Dùng thử miễn phí
              <ArrowRight className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--tg-border)] bg-white/70 backdrop-blur-sm px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Town Hown" width={545} height={398} className="h-8 w-auto object-contain" />
            <span className="text-sm text-[var(--tg-muted)]">
              © {new Date().getFullYear()} ITBA · Nền tảng tuyển dụng có AI
            </span>
          </div>
          <div className="flex gap-7 text-sm text-[var(--tg-muted)]">
            <span className="hover:text-[var(--p-deep)] cursor-pointer transition-colors">Điều khoản</span>
            <span className="hover:text-[var(--p-deep)] cursor-pointer transition-colors">Bảo mật</span>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
