import React from 'react';
import { ShieldCheck, ShieldWarning, Sparkle, SlidersHorizontal } from '@phosphor-icons/react';
import { LivenessMode } from '../types/faceAttendance';

interface LivenessIndicatorProps {
  score?: number;
  mode: LivenessMode;
  onModeChange: (mode: LivenessMode) => void;
  details?: any;
}

export const LivenessIndicator: React.FC<LivenessIndicatorProps> = ({
  score,
  mode,
  onModeChange,
  details,
}) => {
  const percentage = score !== undefined ? Math.round(score * 100) : null;
  const isHealthy = percentage !== null && percentage >= 50;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Cấu Hình Dual Anti-Spoofing</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          {(['standard', 'strict', 'off'] as LivenessMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === m
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {percentage !== null ? (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Độ tin cậy người thật:</span>
              <span className={`font-bold ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {percentage}% {isHealthy ? '(Đạt chuẩn)' : '(Nghi vấn giả mạo)'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isHealthy ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {details && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Phổ tần số da (Laplacian)</span>
                <span className="font-semibold text-slate-200">
                  {details.texture_analysis?.laplacian_var || 'N/A'} (Nét tự nhiên)
                </span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="block text-slate-500 text-[10px] uppercase font-bold">Cử động sống (Micro-motion)</span>
                <span className="font-semibold text-slate-200">
                  {details.motion_analysis?.movement_std ? `${details.motion_analysis.movement_std} (Tự nhiên)` : 'Đạt'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 leading-relaxed">
          Hệ thống đang sẵn sàng quét kiểm tra vi chuyển động võng mạc, chớp mắt tự nhiên và độ khuếch tán ánh sáng da người thật.
        </p>
      )}
    </div>
  );
};