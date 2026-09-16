import React, { useState, useRef } from 'react';
import { X, UploadSimple, UserPlus, CheckCircle, Warning, FilePdf, Image as ImageIcon } from '@phosphor-icons/react';
import { faceAttendanceService } from '../services/faceAttendanceService';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [empCode, setEmpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Phòng Hành chính Nhân sự');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      if (selected.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selected));
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCode.trim() || !fullName.trim() || !file) {
      setError('Vui lòng điền đầy đủ Mã nhân viên, Họ tên và chọn tệp CV/ảnh.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('employee_code', empCode.trim());
      formData.append('full_name', fullName.trim());
      formData.append('department', department.trim());
      formData.append('email', email.trim());
      formData.append('file', file);

      const res = await faceAttendanceService.registerFromCV(formData);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      console.error('Enroll error:', err);
      setError(err.message || 'Lỗi xử lý đăng ký hồ sơ nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEmpCode('');
    setFullName('');
    setEmail('');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <UserPlus size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Đăng Ký Hồ Sơ Khuôn Mặt Nhân Sự</h2>
              <p className="text-xs text-slate-400">Trích xuất vector 512-D ArcFace từ CV hoặc ảnh chân dung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {result ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-1">Đăng ký thành công!</h3>
              <p className="text-xs text-slate-400 mb-5">{result.message}</p>

              {result.data?.avatar_preview && (
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg mb-4">
                  <img src={result.data.avatar_preview} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
                >
                  Đăng ký tiếp
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold rounded-xl text-white"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <Warning size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mã nhân viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: NV-001"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lê Trung Kiên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phòng ban</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Phòng Hành chính Nhân sự">Hành chính Nhân sự</option>
                    <option value="Phòng Kỹ thuật & AI">Kỹ thuật & AI</option>
                    <option value="Phòng Kinh doanh">Kinh doanh</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="VD: kien@company.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Upload Drop Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">File CV (PDF) hoặc Ảnh chân dung *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      {file.type.includes('pdf') ? (
                        <FilePdf size={32} className="text-rose-400" />
                      ) : (
                        <ImageIcon size={32} className="text-emerald-400" />
                      )}
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-xs">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-slate-500">
                      <UploadSimple size={28} className="text-slate-600 mb-1" />
                      <p className="text-xs font-semibold text-slate-300">Nhấn để tải file PDF / Ảnh lên</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tự động phát hiện và trích xuất khuôn mặt chính</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg ${
                    isLoading
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
                  }`}
                >
                  {isLoading ? 'Đang trích xuất Vector ArcFace...' : 'Đăng Ký Nhân Sự Ngay'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};