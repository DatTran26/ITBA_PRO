import React, { useState } from 'react';
import { AttendanceLog } from '../types/faceAttendance';
import { CheckCircle, Warning, MagnifyingGlass, ArrowsClockwise } from '@phosphor-icons/react';

interface AttendanceLogsTableProps {
  logs: AttendanceLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AttendanceLogsTable: React.FC<AttendanceLogsTableProps> = ({
  logs,
  isLoading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    return (
      log.full_name?.toLowerCase().includes(q) ||
      log.employee_code?.toLowerCase().includes(q) ||
      log.status?.toLowerCase().includes(q)
    );
  });

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, họ tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            title="Làm mới bảng"
          >
            <ArrowsClockwise size={16} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>
        <div className="text-xs text-slate-400">
          Tổng cộng: <span className="font-bold text-slate-200">{filteredLogs.length}</span> bản ghi
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3">Mã NV</th>
              <th className="px-4 py-3">Họ và Tên</th>
              <th className="px-4 py-3">Thời Gian Quét</th>
              <th className="px-4 py-3">Khớp (Sim)</th>
              <th className="px-4 py-3">Anti-Spoof</th>
              <th className="px-4 py-3">Thiết Bị</th>
              <th className="px-4 py-3">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                const isSpoof = log.status === 'SPOOF_DETECTED';

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-300">
                      {log.employee_code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      {log.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatTime(log.checkin_time)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-400">
                        {Math.round((log.similarity_score || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-300">
                        {Math.round((log.liveness_score || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {log.device_id || 'CAM_01'}
                    </td>
                    <td className="px-4 py-3">
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={14} weight="fill" />
                          Hợp Lệ
                        </span>
                      ) : isSpoof ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Warning size={14} weight="fill" />
                          Giả Mạo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {log.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {isLoading ? 'Đang tải dữ liệu...' : 'Chưa có bản ghi điểm danh nào phù hợp.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};