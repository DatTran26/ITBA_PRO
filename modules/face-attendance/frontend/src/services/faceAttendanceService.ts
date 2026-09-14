import { CheckInResponse, LivenessChallenge, Employee, AttendanceLog, AttendanceSummary, LivenessMode } from '../types/faceAttendance';

const BASE_URL = (import.meta as any).env?.VITE_FACE_API_URL || 'http://localhost:8000/api/face';

export const faceAttendanceService = {
  async registerFromCV(formData: FormData): Promise<any> {
    const res = await fetch(`${BASE_URL}/register-cv`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Lỗi khi đăng ký nhân viên từ CV');
    }
    return data;
  },

  async checkIn(
    frames: Blob[],
    deviceId = 'CAM_GATE_01',
    threshold = 0.65,
    mode: LivenessMode = 'standard'
  ): Promise<CheckInResponse> {
    const formData = new FormData();
    frames.forEach((blob, idx) => {
      formData.append('files', blob, `frame_${idx}.jpg`);
    });
    formData.append('device_id', deviceId);
    formData.append('threshold', threshold.toString());
    formData.append('liveness_mode', mode);

    const res = await fetch(`${BASE_URL}/check-in`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Lỗi khi điểm danh qua camera');
    }
    return data;
  },

  async getLivenessChallenge(): Promise<LivenessChallenge> {
    const res = await fetch(`${BASE_URL}/liveness-challenge`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Không lấy được thử thách liveness');
    }
    return res.json();
  },

  async getEmployees(): Promise<Employee[]> {
    const res = await fetch(`${BASE_URL}/employees`);
    const data = await res.json();
    return data.employees || [];
  },

  async getLogs(limit = 50): Promise<AttendanceLog[]> {
    const res = await fetch(`${BASE_URL}/logs?limit=${limit}`);
    const data = await res.json();
    return data.logs || [];
  },

  async getSummary(): Promise<AttendanceSummary> {
    const res = await fetch(`${BASE_URL}/summary`);
    const data = await res.json();
    return data.summary || {
      total_employees: 0,
      checked_in_today: 0,
      missing_today: 0,
      spoof_attempts_today: 0,
    };
  },
};