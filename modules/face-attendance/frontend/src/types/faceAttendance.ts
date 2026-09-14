export type LivenessMode = 'standard' | 'strict' | 'off';

export interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  department: string;
  email?: string;
  avatar_base64?: string;
  created_at?: string;
}

export interface AttendanceLog {
  id: number;
  employee_id: number;
  employee_code: string;
  full_name: string;
  checkin_time: string;
  similarity_score: number;
  liveness_score: number;
  device_id: string;
  status: 'SUCCESS' | 'SPOOF_DETECTED' | 'NOT_MATCHED' | string;
}

export interface LivenessChallenge {
  challenge_id: string;
  action: 'blink' | 'turn_head' | 'smile' | string;
  instruction: string;
}

export interface CheckInResponse {
  success: boolean;
  status: 'SUCCESS' | 'SPOOF_REJECTED' | 'NOT_MATCHED' | 'NO_FACE';
  message: string;
  employee?: {
    id: number;
    employee_code: string;
    full_name: string;
    department: string;
    avatar_base64?: string;
  };
  similarity_score?: number;
  liveness_score?: number;
  liveness_details?: any;
  log?: AttendanceLog;
}

export interface AttendanceSummary {
  total_employees: number;
  checked_in_today: number;
  missing_today: number;
  spoof_attempts_today: number;
}