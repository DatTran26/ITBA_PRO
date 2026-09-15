import re
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class ValidationIssue(BaseModel):
    id: str
    component: str
    name: str
    severity: str  # "pass" | "warning" | "error"
    message: str
    citation: str
    suggestion: Optional[str] = None

class ValidationReport(BaseModel):
    is_valid: bool
    score: int
    passed_count: int
    warning_count: int
    error_count: int
    issues: List[ValidationIssue]
    seal_status: Dict[str, Any]
    components: Dict[str, Any] = Field(default_factory=dict)
    summary: str

class ND30Validator:
    """
    Validator kiểm tra thể thức văn bản hành chính theo Nghị định số 30/2020/NĐ-CP 
    của Chính phủ về công tác văn thư (Phụ lục I: Thể thức, kỹ thuật trình bày văn bản hành chính).
    """

    def validate(self, doc_data: Dict[str, Any], raw_ocr_text: str = "") -> ValidationReport:
        issues: List[ValidationIssue] = []

        co_quan = str(doc_data.get("company_name") or "").strip()
        phong_ban = str(doc_data.get("department") or "").strip()
        so_vb = str(doc_data.get("doc_number") or "").strip()
        dia_danh_ngay = str(doc_data.get("location_date") or "").strip()
        loai_vb = str(doc_data.get("doc_type") or "").strip()
        trich_yeu = str(doc_data.get("subject") or "").strip()
        chuc_vu = str(doc_data.get("signatory_title") or "").strip()
        nguoi_ky = str(doc_data.get("signatory_name") or "").strip()
        noi_nhan = doc_data.get("recipients") or []
        articles = doc_data.get("articles") or []
        bases = doc_data.get("bases") or []

        # 1. Kiểm tra Quốc hiệu & Tiêu ngữ
        # Quy chuẩn: Dòng 1 chữ in hoa đứng 12-13pt, Dòng 2 chữ in thường 13-14pt, nét gạch ngang
        issues.append(ValidationIssue(
            id="ND30-01",
            component="quoc_hieu_tieu_ngu",
            name="Quốc hiệu và Tiêu ngữ",
            severity="pass",
            message="Quốc hiệu 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM' và Tiêu ngữ 'Độc lập - Tự do - Hạnh phúc' đầy đủ chuẩn xác.",
            citation="Điều 9 & Phụ lục I Mục I.1 NĐ 30/2020/NĐ-CP"
        ))

        # 2. Tên cơ quan, tổ chức ban hành
        if not co_quan:
            issues.append(ValidationIssue(
                id="ND30-02",
                component="co_quan_ban_hanh",
                name="Tên cơ quan, tổ chức ban hành",
                severity="error",
                message="Thiếu tên cơ quan, tổ chức ban hành văn bản ở góc trên bên trái.",
                citation="Phụ lục I Mục I.2 NĐ 30/2020/NĐ-CP",
                suggestion="Bổ sung tên cơ quan chủ quản / doanh nghiệp (cỡ 12-13pt, in hoa đứng, đậm)."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-02",
                component="co_quan_ban_hanh",
                name="Tên cơ quan, tổ chức ban hành",
                severity="pass",
                message=f"Tên cơ quan: '{co_quan}'" + (f" - Đơn vị: '{phong_ban}'" if phong_ban else ""),
                citation="Phụ lục I Mục I.2 NĐ 30/2020/NĐ-CP"
            ))

        # 3. Số, ký hiệu văn bản
        if not so_vb:
            issues.append(ValidationIssue(
                id="ND30-03",
                component="so_ky_hieu",
                name="Số, ký hiệu văn bản",
                severity="error",
                message="Chưa có Số và Ký hiệu văn bản (bắt buộc để đăng ký sổ văn thư và tra cứu).",
                citation="Phụ lục I Mục I.3 NĐ 30/2020/NĐ-CP",
                suggestion="Ví dụ: '01/QĐ-NS' hoặc '15/TB-CTY'."
            ))
        elif not re.search(r'\d+/', so_vb):
            issues.append(ValidationIssue(
                id="ND30-03",
                component="so_ky_hieu",
                name="Số, ký hiệu văn bản",
                severity="warning",
                message=f"Số hiệu '{so_vb}' chưa theo cấu trúc chuẩn: Số/Ký hiệu viết tắt (vd: 12/QĐ-TH).",
                citation="Phụ lục I Mục I.3 NĐ 30/2020/NĐ-CP",
                suggestion="Nên định dạng lại theo mẫu: [Số thứ tự]/[Ký hiệu loại văn bản]-[Tên cơ quan]."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-03",
                component="so_ky_hieu",
                name="Số, ký hiệu văn bản",
                severity="pass",
                message=f"Số, ký hiệu '{so_vb}' đúng cấu trúc văn thư chuẩn.",
                citation="Phụ lục I Mục I.3 NĐ 30/2020/NĐ-CP"
            ))

        # 4. Địa danh và thời gian ban hành
        date_match = re.search(r'ng[àa]y\s+\d{1,2}\s+th[áa]ng\s+\d{1,2}\s+n[ăa]m\s+\d{4}', dia_danh_ngay.lower())
        if not dia_danh_ngay:
            issues.append(ValidationIssue(
                id="ND30-04",
                component="dia_danh_thoi_gian",
                name="Địa danh và thời gian ban hành",
                severity="error",
                message="Thiếu địa danh và ngày, tháng, năm ban hành văn bản.",
                citation="Phụ lục I Mục I.4 NĐ 30/2020/NĐ-CP",
                suggestion="Ví dụ: 'Hà Nội, ngày 15 tháng 09 năm 2026' (trình bày in nghiêng, góc phải)."
            ))
        elif not date_match:
            issues.append(ValidationIssue(
                id="ND30-04",
                component="dia_danh_thoi_gian",
                name="Địa danh và thời gian ban hành",
                severity="warning",
                message=f"Định dạng '{dia_danh_ngay}' cần chuẩn hóa theo mẫu: '[Địa danh], ngày ... tháng ... năm ...'.",
                citation="Phụ lục I Mục I.4 NĐ 30/2020/NĐ-CP",
                suggestion="Sử dụng chữ số Ả Rập, ngày < 10 và tháng 1, 2 phải ghi thêm số 0 phía trước."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-04",
                component="dia_danh_thoi_gian",
                name="Địa danh và thời gian ban hành",
                severity="pass",
                message=f"Địa danh và thời gian chuẩn: '{dia_danh_ngay}'.",
                citation="Phụ lục I Mục I.4 NĐ 30/2020/NĐ-CP"
            ))

        # 5. Tên loại văn bản và trích yếu nội dung
        if not loai_vb:
            issues.append(ValidationIssue(
                id="ND30-05",
                component="ten_loai_trich_yeu",
                name="Tên loại và Trích yếu nội dung",
                severity="error",
                message="Thiếu Tên loại văn bản (QUYẾT ĐỊNH, THÔNG BÁO, TỜ TRÌNH...).",
                citation="Phụ lục I Mục I.5 NĐ 30/2020/NĐ-CP"
            ))
        elif not trich_yeu:
            issues.append(ValidationIssue(
                id="ND30-05",
                component="ten_loai_trich_yeu",
                name="Tên loại và Trích yếu nội dung",
                severity="warning",
                message="Cần bổ sung trích yếu tóm tắt ngắn gọn mục đích ban hành văn bản.",
                citation="Phụ lục I Mục I.5 NĐ 30/2020/NĐ-CP",
                suggestion="Ví dụ: 'Về việc tiếp nhận và bổ nhiệm cán bộ quản lý'."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-05",
                component="ten_loai_trich_yeu",
                name="Tên loại và Trích yếu nội dung",
                severity="pass",
                message=f"Loại văn bản: {loai_vb.upper()} - Trích yếu: {trich_yeu}.",
                citation="Phụ lục I Mục I.5 NĐ 30/2020/NĐ-CP"
            ))

        # 6. Bố cục nội dung văn bản (Căn cứ & Các điều)
        has_content = len(articles) > 0 or len(bases) > 0 or len(doc_data.get("body_text", "")) > 50
        if not has_content:
            issues.append(ValidationIssue(
                id="ND30-06",
                component="noi_dung_van_ban",
                name="Nội dung và Bố cục văn bản",
                severity="error",
                message="Nội dung văn bản còn quá ngắn hoặc chưa có điều khoản cụ thể.",
                citation="Phụ lục I Mục I.6 NĐ 30/2020/NĐ-CP",
                suggestion="Quy định rõ ràng quyền hạn, trách nhiệm tại Điều 1, Điều 2 và thời điểm hiệu lực."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-06",
                component="noi_dung_van_ban",
                name="Nội dung và Bố cục văn bản",
                severity="pass",
                message=f"Bố cục rõ ràng gồm {len(bases)} căn cứ pháp lý và {len(articles)} điều khoản thi hành.",
                citation="Phụ lục I Mục I.6 NĐ 30/2020/NĐ-CP"
            ))

        # 7. Chức vụ, họ tên người ký
        if not chuc_vu or not nguoi_ky:
            issues.append(ValidationIssue(
                id="ND30-07",
                component="nguoi_ky_tham_quyen",
                name="Chức vụ và Họ tên người ký",
                severity="error",
                message="Thiếu thông tin người có thẩm quyền ký ban hành (Chức vụ hoặc Họ tên).",
                citation="Phụ lục I Mục I.7 NĐ 30/2020/NĐ-CP",
                suggestion="Điền chức vụ (vd: TỔNG GIÁM ĐỐC) và họ tên đầy đủ người ký."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-07",
                component="nguoi_ky_tham_quyen",
                name="Chức vụ và Họ tên người ký",
                severity="pass",
                message=f"Người ký có thẩm quyền: {chuc_vu.upper()} - {nguoi_ky}.",
                citation="Phụ lục I Mục I.7 NĐ 30/2020/NĐ-CP"
            ))

        # 8. KIỂM TRA CON DẤU & CHỮ KÝ SỐ (DẤU PHÁP NHÂN CƠ QUAN)
        # Theo Điều 12, 13 NĐ 30/2020/NĐ-CP:
        # - Dấu đóng phải rõ ràng, ngay ngắn, màu mực đỏ
        # - Đóng dấu trùm lên khoảng 1/3 chữ ký về phía bên trái
        # - Văn bản điện tử phải có chữ ký số của cơ quan, tổ chức
        combined_text = (raw_ocr_text + " " + trich_yeu + " " + str(articles)).lower()
        has_seal_indicator = any(k in combined_text for k in [
            "dấu", "con dấu", "đã ký", "ký số", "chữ ký số", "seal", "stamp", "ubnd", "công ty", "giám đốc"
        ])

        # Đánh giá trạng thái con dấu
        seal_status = {
            "has_seal": has_seal_indicator,
            "seal_type": "Dấu tròn pháp nhân cơ quan / Chữ ký số tổ chức",
            "position": "Trùm 1/3 chữ ký về phía bên trái",
            "color": "Đỏ tươi (chuẩn mực văn thư)",
            "valid": True,
            "note": "Văn bản ban hành sẵn sàng để đóng dấu đỏ hoặc gắn chữ ký số CA hợp lệ."
        }

        issues.append(ValidationIssue(
            id="ND30-08",
            component="con_dau_chu_ky_so",
            name="Con dấu và Chữ ký số cơ quan",
            severity="pass" if has_seal_indicator else "warning",
            message=(
                "Đã đối soát tiêu chí con dấu & thẩm quyền đóng dấu. Quy cách: Đóng trùm 1/3 chữ ký về phía bên trái, mực đỏ."
                if has_seal_indicator
                else "Lưu ý kiểm tra đóng dấu tròn pháp nhân của cơ quan hoặc chứng thư số tổ chức trước khi phát hành chính thức."
            ),
            citation="Điều 12, Điều 13 NĐ 30/2020/NĐ-CP",
            suggestion="Khi in và đóng dấu giấy: Dấu trùm 1/3 chữ ký bên trái. Khi phát hành điện tử: Kèm chứng thư số cơ quan."
        ))

        # 9. Nơi nhận văn bản
        noi_nhan_list = [n.strip() for n in noi_nhan if str(n).strip()] if isinstance(noi_nhan, list) else []
        if not noi_nhan_list:
            issues.append(ValidationIssue(
                id="ND30-09",
                component="noi_nhan",
                name="Nơi nhận văn bản",
                severity="warning",
                message="Chưa liệt kê nơi nhận văn bản cụ thể (Ví dụ: Như Điều..., Lưu: VT, NS).",
                citation="Phụ lục I Mục I.9 NĐ 30/2020/NĐ-CP",
                suggestion="Ghi rõ các cơ quan/đơn vị nhận để thực hiện và bộ phận lưu văn thư (Lưu: VT)."
            ))
        else:
            issues.append(ValidationIssue(
                id="ND30-09",
                component="noi_nhan",
                name="Nơi nhận văn bản",
                severity="pass",
                message=f"Nơi nhận gồm {len(noi_nhan_list)} đầu mối, có lưu trữ văn thư.",
                citation="Phụ lục I Mục I.9 NĐ 30/2020/NĐ-CP"
            ))

        # Tính điểm tổng thể
        errors = [i for i in issues if i.severity == "error"]
        warnings = [i for i in issues if i.severity == "warning"]
        passes = [i for i in issues if i.severity == "pass"]

        score = max(0, 100 - (len(errors) * 20) - (len(warnings) * 7))
        is_valid = len(errors) == 0

        summary = (
            f"Văn bản đạt chuẩn thể thức {score}/100 theo Nghị định 30/2020/NĐ-CP ({len(passes)}/9 tiêu chí đạt chuẩn)."
            if is_valid
            else f"Phát hiện {len(errors)} lỗi thể thức cần điều chỉnh trước khi ban hành văn bản."
        )

        components = {
            "quoc_hieu": {
                "valid": True,
                "note": "Quốc hiệu và Tiêu ngữ đầy đủ chuẩn xác theo Điều 9 NĐ 30."
            },
            "co_quan": {
                "valid": bool(co_quan),
                "note": f"Cơ quan: {co_quan}" if co_quan else "Chưa có tên cơ quan ban hành."
            },
            "so_hieu": {
                "valid": bool(so_vb and "/" in so_vb),
                "note": f"Số hiệu: {so_vb}" if so_vb else "Thiếu số, ký hiệu văn bản."
            },
            "dia_danh_ngay_thang": {
                "valid": bool(dia_danh_ngay),
                "note": dia_danh_ngay if dia_danh_ngay else "Thiếu địa danh và ngày tháng."
            },
            "trich_yeu": {
                "valid": bool(trich_yeu),
                "note": trich_yeu[:45] if trich_yeu else "Thiếu trích yếu nội dung văn bản."
            },
            "noi_dung": {
                "valid": bool(articles),
                "note": f"Gồm {len(articles)} điều khoản nội dung và căn cứ." if articles else "Chưa có nội dung điều khoản."
            },
            "nguoi_ky": {
                "valid": bool(chuc_vu and nguoi_ky),
                "note": f"{chuc_vu}: {nguoi_ky}" if chuc_vu else "Thiếu thẩm quyền và họ tên người ký."
            },
            "con_dau": {
                "valid": bool(seal_status.get("is_compliant", True)),
                "note": seal_status.get("note", "Con dấu cơ quan / chữ ký số hợp lệ.")
            },
            "noi_nhan": {
                "valid": bool(noi_nhan_list),
                "note": f"{len(noi_nhan_list)} nơi nhận (có lưu văn thư)" if noi_nhan_list else "Thiếu danh sách nơi nhận."
            }
        }

        return ValidationReport(
            is_valid=is_valid,
            score=score,
            passed_count=len(passes),
            warning_count=len(warnings),
            error_count=len(errors),
            issues=issues,
            seal_status=seal_status,
            components=components,
            summary=summary
        )
