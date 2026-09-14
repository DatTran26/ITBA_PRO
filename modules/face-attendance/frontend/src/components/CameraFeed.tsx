import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraSlash, ArrowsClockwise, ShieldCheck, Warning } from '@phosphor-icons/react';
import { LivenessChallenge, LivenessMode } from '../types/faceAttendance';

interface CameraFeedProps {
  onCaptureFrames: (frames: Blob[]) => void;
  isLoading: boolean;
  challenge: LivenessChallenge | null;
  onRefreshChallenge: () => void;
  livenessMode: LivenessMode;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  onCaptureFrames,
  isLoading,
  challenge,
  onRefreshChallenge,
  livenessMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Không thể mở Camera. Vui lòng cấp quyền truy cập.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleTriggerCheckin = async () => {
    if (!videoRef.current || isCapturing || isLoading) return;
    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const blobs: Blob[] = [];
      const numFrames = 2;
      const intervalMs = 200;

      for (let i = 0; i < numFrames; i++) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/jpeg', 0.92)
        );
        if (blob) blobs.push(blob);
        if (i < numFrames - 1) {
          await new Promise((r) => setTimeout(r, intervalMs));
        }
      }

      if (blobs.length > 0) {
        onCaptureFrames(blobs);
      }
    } catch (err) {
      console.error('Capture frame error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      {/* Top Bar info */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${cameraActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold text-slate-300">
            {cameraActive ? 'Camera Live Stream' : 'Camera ngắt kết nối'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Anti-Spoof:</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            livenessMode === 'strict' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
            livenessMode === 'standard' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {livenessMode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Video Frame */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner flex items-center justify-center">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-80 border-2 border-dashed border-emerald-400/50 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
                <div className="w-3 h-3 border-t-2 border-l-2 border-emerald-400 absolute top-4 left-4" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-emerald-400 absolute top-4 right-4" />
                <div className="w-3 h-3 border-b-2 border-l-2 border-emerald-400 absolute bottom-4 left-4" />
                <div className="w-3 h-3 border-b-2 border-r-2 border-emerald-400 absolute bottom-4 right-4" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <CameraSlash size={48} className="mb-2 text-slate-600" />
            <p className="text-sm font-medium">{cameraError || 'Đang tải luồng camera...'}</p>
            <button
              onClick={startCamera}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors"
            >
              Thử lại kết nối
            </button>
          </div>
        )}

        {/* Loading overlay during recognition */}
        {(isLoading || isCapturing) && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <ArrowsClockwise size={40} className="text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-200">Đang nhận diện khuôn mặt & chống giả mạo...</p>
            <p className="text-xs text-slate-400 mt-1">Đang phân tích quang học da & micro-motion</p>
          </div>
        )}
      </div>

      {/* Liveness Challenge Prompt */}
      {challenge && (
        <div className="mt-4 w-full bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yêu cầu cử động (Liveness Test)</p>
              <p className="text-sm font-medium text-slate-200">{challenge.instruction}</p>
            </div>
          </div>
          <button
            onClick={onRefreshChallenge}
            title="Đổi thử thách khác"
            className="p-2 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowsClockwise size={18} />
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleTriggerCheckin}
        disabled={!cameraActive || isLoading || isCapturing}
        className={`mt-5 w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
          !cameraActive || isLoading || isCapturing
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-[0.99]'
        }`}
      >
        <Camera size={20} weight="bold" />
        Xác Nhận Điểm Danh Ngay
      </button>
    </div>
  );
};