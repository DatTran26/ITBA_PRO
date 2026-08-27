"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Timer,
  LineChart,
  Target,
  Shield,
  Globe,
  Cpu,
  Layers,
  MessageSquare,
  Database,
  Zap,
  Wind,
  Code
} from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem, PageTransition, TiltCard, RevealText } from "@/components/ui/motion-wrapper";
import BackgroundOrbs from "@/components/ui/background-orbs";
import { NeuralNetwork } from "@/components/ui/neural-network";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  const technologies = [
    { name: 'TypeScript', icon: Code, color: '#00F2FF' },
    { name: 'Supabase', icon: Database, color: '#3ECF8E' },
    { name: 'OpenAI', icon: BrainCircuit, color: '#10a37f' },
    { name: 'Next.js', icon: Layers, color: '#FFFFFF' },
    { name: 'Vercel', icon: Zap, color: '#FFFFFF' },
    { name: 'Tailwind', icon: Wind, color: '#38BDF8' }
  ];

  return (
    <PageTransition className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-orange-100 overflow-hidden font-body relative transition-colors duration-1000">

      {/* Advanced Neural Background */}
      <NeuralNetwork />

      {/* Arctic Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[5%] -left-[5%] w-[40%] h-[40%] bg-indigo-100/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-rose-100/10 blur-[100px]" />
      </div>

      <BackgroundOrbs />

      <motion.nav
        initial={false}
        animate={{
          top: scrolled ? 16 : 32,
          width: scrolled ? "92%" : "calc(100% - 6rem)",
          paddingTop: scrolled ? 16 : 22,
          paddingBottom: scrolled ? 16 : 22,
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.5)",
        }}
        className="fixed left-1/2 -translate-x-1/2 z-50 max-w-7xl px-12 border border-black/[0.03] rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] flex justify-between items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] backdrop-blur-xl"
      >
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-[12px] shadow-2xl group-hover:scale-105 transition-transform duration-500">
            AI
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-slate-900">
            ITBA.CORE
          </span>
        </Link>
        <div className="flex gap-12 items-center">
          <Link href="/login" className="text-base font-mono font-black uppercase tracking-[0.4em] text-orange-600 hover:text-orange-700 transition-all flex items-center gap-1 group">
            <span className="opacity-40 group-hover:opacity-100 transition-opacity">/ </span>
            WPCTeam
            <span className="w-2.5 h-5 bg-orange-600 ml-2 animate-[pulse_1s_infinite] opacity-80" />
          </Link>
        </div>
      </motion.nav>

      <main className="relative z-10">
        <section className="relative pt-60 pb-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-50 border border-emerald-100 mb-10 group cursor-default">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">Neural System Online</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <RevealText
                text="Autonomous Digital Intelligence"
                className="text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tight mb-10 leading-[1] uppercase silver-silk-text justify-center"
              />
            </FadeIn>

            <FadeIn delay={0.3}>
              <p className="max-w-3xl mx-auto text-slate-500 text-lg md:text-xl font-medium leading-relaxed mb-16 opacity-80">
                Frontier human potential processing. Neural synthesis of talent, technology, and engineering precision. Redefining intelligence through autonomous synthesis.
              </p>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <Link href="/login" className="relative group px-16 py-6 bg-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] text-white overflow-hidden shadow-[0_20px_60px_-20px_rgba(139,92,246,0.6)] transition-all duration-500 hover:shadow-[0_25px_80px_-15px_rgba(139,92,246,0.8)] hover:-translate-y-1.5 active:scale-95 active:translate-y-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-violet-700 to-rose-700 opacity-95 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    Launch System
                    <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-2" />
                  </span>
                </Link>
                <Link href="#features" className="px-16 py-6 bg-white border border-rose-100 text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-rose-50 transition-all shadow-sm">
                  Briefing
                </Link>
              </div>
            </FadeIn>

            {/* Arctic Tech Badges */}
            <FadeIn delay={0.6}>
              <div className="mt-40">
                <p className="text-[11px] font-black tracking-[0.6em] text-[#475569] uppercase mb-16 opacity-60">Verified Infrastructure</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                  {technologies.map((tech, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="group relative px-8 py-5 rounded-2xl bg-white border border-indigo-50 flex items-center gap-4 transition-all duration-500 hover:border-violet-300 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <div
                        className={`relative z-10 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 transition-all duration-500`}
                        style={{ color: i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#3B82F6' : '#EF4444' }}
                      >
                        <tech.icon className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" />
                      </div>

                      <div className="relative z-10 flex flex-col items-start leading-none gap-1">
                        <span className="text-lg font-black tracking-tight text-slate-900">
                          {tech.name}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Protocol
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Bento Grid: Arctic Minimalist */}
        <section id="features" className="py-52 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-40">
              <div className="inline-block px-8 py-3 rounded-full bg-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.6em] mb-10 border border-slate-200">Core Specs</div>
              <h2 className="text-6xl md:text-7xl font-black silver-silk-text tracking-tight mb-10 leading-none uppercase">Neural Precision</h2>
              <p className="max-w-3xl mx-auto text-slate-400 text-[13px] font-black uppercase tracking-[0.5em]">System-wide optimization protocols.</p>
            </div>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-12 auto-rows-[480px]">
               {/* Feature 1 */}
                <StaggerItem className="md:col-span-8">
                  <TiltCard className="h-full">
                    <div className="inner-glow-card p-12 h-full flex flex-col justify-between group rounded-[2.5rem]">
                      <div className="space-y-8">
                         <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100 group-hover:scale-105 transition-transform duration-500">
                            <BrainCircuit className="w-8 h-8" />
                         </div>
                         <h3 className="text-4xl font-black uppercase silver-silk-text tracking-tighter">Synthesis Engine</h3>
                         <p className="text-slate-500 text-lg leading-relaxed max-w-lg font-medium">
                            Real-time neural processing of candidate capabilities. Orchestrating assessment protocols with zero-latency.
                         </p>
                      </div>
                      <div className="h-32 w-full bg-indigo-50/50 rounded-3xl border border-indigo-100 p-8 flex items-end gap-3 group-hover:border-indigo-300 transition-all duration-500">
                        {[40, 70, 45, 90, 65, 80, 55, 30, 85].map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            whileInView={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 1.5, ease: "circOut" }}
                            className={`flex-1 rounded-t-lg opacity-40 hover:opacity-100 transition-all`}
                            style={{ backgroundColor: i % 3 === 0 ? '#8B5CF6' : i % 3 === 1 ? '#3B82F6' : '#EF4444' }}
                          />
                        ))}
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>

               {/* Feature 2 */}
                <StaggerItem className="md:col-span-4">
                  <TiltCard className="h-full">
                    <div className="h-full bg-white border border-slate-100 p-12 flex flex-col justify-center text-center gap-10 rounded-[2.5rem] group">
                      <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 group-hover:scale-105 group-hover:rotate-6 transition-all duration-700">
                        <Target className="w-12 h-12" />
                      </div>
                      <div>
                         <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-4">Neural Ops</h4>
                         <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Intelligence</h3>
                         <p className="text-slate-400 text-[11px] leading-loose font-black uppercase tracking-[0.2em]">High-fidelity screening.</p>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>

               {/* Feature 3 */}
                <StaggerItem className="md:col-span-4">
                  <TiltCard className="h-full">
                    <div className="h-full bg-white border border-slate-100 p-12 flex flex-col items-start gap-8 rounded-[2.5rem] group">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                        <Shield className="w-8 h-8" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Security</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed font-black uppercase tracking-widest">Enterprise-grade encryption and autonomous validation.</p>
                      </div>
                      <div className="mt-auto w-full pt-8 border-t border-indigo-50 text-[10px] font-black text-violet-600 uppercase tracking-[0.4em] flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                        Verified
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>

               {/* Feature 4 */}
                <StaggerItem className="md:col-span-8">
                  <TiltCard className="h-full">
                    <div className="h-full inner-glow-card p-12 flex items-center justify-between gap-12 rounded-[2.5rem] group overflow-hidden">
                      <div className="space-y-8 flex-1">
                         <h3 className="text-4xl font-black uppercase silver-silk-text tracking-tighter">Strategic BRIEF</h3>
                         <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Transforming terminal output into actionable strategic intelligence for elite global engineering teams.
                         </p>
                      </div>
                      <div className="hidden lg:block w-64 h-64 relative">
                         <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[80px]" />
                         <MessageSquare className="w-full h-full text-indigo-600 opacity-[0.03] rotate-[10deg] scale-125" />
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
            </StaggerContainer>
          </div>
        </section>
      </main>

      {/* Arctic High-End Footer */}
      <footer className="relative z-10 border-t border-slate-100 bg-white pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-20 mb-32">
            <div className="space-y-10 max-w-sm">
              <Link href="/" className="inline-flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-2xl transition-transform duration-700">
                  AI
                </div>
                <span className="text-2xl font-black tracking-tighter silver-silk-text uppercase">
                  ITBA.CORE
                </span>
              </Link>
              <p className="text-slate-400 text-[15px] leading-[1.8] font-medium">
                Premium engineering excellence and autonomous technical screening. Redefining intelligence through neural synthesis.
              </p>
            </div>

            <div className="w-full lg:max-w-md p-10 inner-glow-card border-slate-100 rounded-[2rem]">
               <h4 className="text-lg font-black silver-silk-text mb-3 uppercase tracking-tight">Launch Platform</h4>
               <p className="text-slate-400 text-xs mb-8 font-black uppercase tracking-widest">Technical briefings directly to terminal.</p>
               <div className="flex gap-3">
                 <input
                    type="email"
                    placeholder="TERMINAL@ITBA.CORE"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-[10px] font-black text-slate-900 focus:border-violet-400 outline-none transition-all placeholder:text-slate-300"
                 />
                 <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg">
                   LAUNCH
                 </button>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-32">
            {[
              { title: "Capabilities", links: ["Neural Engine", "Assessment Suite", "Intelligence", "Role Synthesis"] },
              { title: "Ecosystem", links: ["API Terminal", "Integrations", "Security", "Global Edge"] },
              { title: "Infrastructure", links: ["Documentation", "System Logs", "Architectural", "Status"], special: true }
            ].map((col, i) => (
              <div key={i} className="space-y-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900 opacity-30">{col.title}</h4>
                <ul className="space-y-5">
                  {col.links.map((link, j) => (
                    <li key={j} className="text-[13px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all cursor-pointer">
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase">
             <span>© {new Date().getFullYear()} ITBA CORE. PROCESSED IN SILICON VALLEY.</span>
             <div className="flex gap-10">
               <span className="hover:text-slate-900 cursor-pointer transition-colors">Legal</span>
               <span className="hover:text-slate-900 cursor-pointer transition-colors">Protocols</span>
             </div>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
