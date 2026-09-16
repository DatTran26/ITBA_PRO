import React, { useState, useEffect } from 'react';
import { CameraFeed } from './CameraFeed';
import { LivenessIndicator } from './LivenessIndicator';
import { EnrollmentModal } from './EnrollmentModal';
import { AttendanceLogsTable } from './AttendanceLogsTable';
import { faceAttendanceService } from '../services/faceAttendanceService';
import {
  Employee,
  AttendanceLog,
  AttendanceSummary,
  LivenessChallenge,
  CheckInResponse,
  LivenessMode
} from '../types/faceAttendance';
import {
  UserCheck,
  UsersThree,
  ShieldCheck,
  ShieldWarning,
  UserPlus,
  ArrowsClockwise,
  CheckCircle,
  WarningCircle,
  ListDashes,
  Camera
} from '@phosphor-icons/react';

export const FaceAttendanceWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'employees' | 'logs'>('checkin');
  const [livenessMode, setLivenessMode] = useState<LivenessMode>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<CheckInResponse | null>(null);
  const [challenge, setChallenge] = useState<LivenessChallenge | null>(null);

  // Data states
  const [summary, setSummary] = useState<AttendanceSummary>({
    total_employees: 0,
    checked_in_today: 0,
    missing_today: 0,
    spoof_attempts_today: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  useEffect(() => {
    loadSummary();
    loadChallenge();
    if (activeTab === 'employees') loadEmployees();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  const loadSummary = async () => {
    try {
      const data = await faceAttendanceService.getSummary();
      setSummary(data);
    } catch (err) {
      console.warn('Lỗi tải summary:', err);
    }
  };

  const loadChallenge = async () => {
    try {
      const data = await faceAttendanceService.getLivenessChallenge();
      setChallenge(data);
    } catch (err) {
      console.warn('Lỗi tải challenge:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await faceAttendanceService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.warn('Lỗi tải nhân viên:', err);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await faceAttendanceService.getLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Lỗi tải logs:', err);
    }
  };

  const handleCaptureFrames = async (frames: Blob[]) => {
    setIsLoading(true);
    setLastCheckin(null);

    try {
      const result = await faceAttendanceService.checkIn(
        frames,
        'CAM_GATE_01',
        0.65,
        livenessMode
      );
      setLastCheckin(result);
      loadSummary();
      loadChallenge();
    } catch (err: any) {
      setLastCheckin({
        success: false,
        status: 'NOT_MATCHED',
        message: err.message || 'Lỗi xử lý điểm danh từ máy chủ',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Camera size={24} weight="bold" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Face Attendance & Anti-Spoofing
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Town Hown AI
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Điểm danh sinh trắc học thời gian thực, bóc tách ArcFace 512-D và Dual Anti-Spoofing
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <UserPlus size={18} weight="bold" />
            Đăng Ký Nhân Sự
          </button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <UsersThree size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Nhân Sự</p>
            <p className="text-2xl font-black text-white">{summary.total_employees}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <UserCheck size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đã Điểm Danh Hôm Nay</p>
            <p className="text-2xl font-black text-emerald-400">{summary.checked_in_today}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <UsersThree size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chưa Điểm Danh</p>
            <p className="text-2xl font-black text-amber-400">{summary.missing_today}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ShieldWarning size={24} weight="bold" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ngăn Chặn Giả Mạo</p>
            <p className="text-2xl font-black text-rose-400">{summary.spoof_attempts_today}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'checkin'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera size={18} />
          Quét Điểm Danh Trực Tiếp
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'employees'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UsersThree size={18} />
          Danh Sách Nhân Sự ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListDashes size={18} />
          Lịch Sử Chấm Công
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Camera Feed */}
            <div className="lg:col-span-7 space-y-6">
              <CameraFeed
                onCaptureFrames={handleCaptureFrames}
                isLoading={isLoading}
                challenge={challenge}
                onRefreshChallenge={loadChallenge}
                livenessMode={livenessMode}
              />
            </div>

            {/* Right: Feedback Result & Anti-spoofing Inspector */}
            <div className="lg:col-span-5 space-y-6">
              {/* Check-in Result Card */}
              {lastCheckin && (
                <div
                  className={`rounded-2xl p-5 border shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
                    lastCheckin.status === 'SUCCESS'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : lastCheckin.status === 'SPOOF_REJECTED'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {lastCheckin.employee?.avatar_base64 ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400 shrink-0 shadow-lg">
                        <img
                          src={lastCheckin.employee.avatar_base64}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center shrink-0">
                        {lastCheckin.status === 'SUCCESS' ? (
                          <CheckCircle size={32} className="text-emerald-400" />
                        ) : (
                          <WarningCircle size={32} className="text-rose-400" />
                        )}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          lastCheckin.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {lastCheckin.status}
                        </span>
                        {lastCheckin.similarity_score !== undefined && (
                          <span className="text-xs font-semibold text-slate-300">
                            Khớp: {Math.round(lastCheckin.similarity_score * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {lastCheckin.employee?.full_name || 'Không xác định'}
                      </h4>
                      {lastCheckin.employee?.department && (
                        <p className="text-xs text-slate-400">{lastCheckin.employee.department}</p>
                      )}
                      <p className="text-xs mt-2 leading-relaxed opacity-90">{lastCheckin.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Anti-spoofing Inspector */}
              <LivenessIndicator
                score={lastCheckin?.liveness_score}
                mode={livenessMode}
                onModeChange={setLivenessMode}
                details={lastCheckin?.liveness_details}
              />

              {/* Quick instructions */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Quy Trình Chuẩn Điểm Danh</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                  <li>Đứng đối diện camera trong khoảng cách từ 40cm - 90cm.</li>
                  <li>Đảm bảo ánh sáng khuôn mặt đồng đều, không đứng ngược sáng.</li>
                  <li>Thực hiện chớp mắt hoặc cử động nhẹ theo chỉ thị chống giả mạo.</li>
                  <li>Nhấn nút <strong className="text-emerald-400">Xác Nhận Điểm Danh</strong> để hoàn tất trong 0.5s.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Danh Sách Nhân Sự Đã Đăng Ký Khuôn Mặt</h3>
                <p className="text-xs text-slate-400">Đã trích xuất và số hóa vector ArcFace 512 chiều</p>
              </div>
              <button
                onClick={loadEmployees}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <ArrowsClockwise size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 hover:border-emerald-500/40 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                    {emp.avatar_base64 ? (
                      <img src={emp.avatar_base64} alt={emp.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                        {emp.full_name?.charAt(0) || 'NV'}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{emp.full_name}</p>
                    <p className="text-[11px] font-mono text-emerald-400">{emp.employee_code}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <AttendanceLogsTable
            logs={logs}
            isLoading={isLoading}
            onRefresh={loadLogs}
          />
        )}
      </div>

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => {
          loadSummary();
          loadEmployees();
        }}
      />
    </div>
  );
};