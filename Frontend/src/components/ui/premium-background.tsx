"use client";

import React from "react";

export const PremiumBackground = () => {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden bg-background">
      {/* Static Noise Texture — pre-baked PNG tile replaces feTurbulence (CPU-free) */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("/textures/noise-256x256.png")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Static Mesh Gradients — no animation, blur is purely decorative at this radius */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-[140px]"
      />

      <div
        className="absolute -bottom-[20%] right-[0%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px]"
      />

      <div
        className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]"
      />

      {/* Floating Beams / Lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-[40%] w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-[60%] w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-[80%] w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
          maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
        }}
      />

      {/* Global Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
    </div>
  );
};
