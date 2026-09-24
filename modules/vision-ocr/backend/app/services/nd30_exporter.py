"""
ND30 Document Exporter — Generate .docx files compliant with
Decree 30/2020/ND-CP (Vietnamese Administrative Document Standards).

Layout specifications (NĐ 30/2020):
  - Margins: Top 2cm, Bottom 2cm, Left 3cm, Right 1.5cm
  - Font: Times New Roman, body 13pt, title 14pt
  - Header: 2-column table (no borders)
    * Left  : Organization name (bold) + doc number
    * Right : State header (bold) + location/date (italic)
  - Title: Centered, UPPERCASE, bold 14pt
  - Subject: Centered, bold, italic 13pt
  - Bases (Căn cứ): Indented, italic, ending with semicolon
  - Articles: Numbered, first-line indent
  - Footer: 2-column table
    * Left  : "Nơi nhận:" list (11pt)
    * Right : Signatory title + signature block

Supported document types:
  - Quyết định (QUYẾT ĐỊNH)
  - Công văn (CÔNG VĂN)
  - Biên bản (BIÊN BẢN)
  - Báo cáo (BÁO CÁO)
  - Thông báo (THÔNG BÁO)
  - Hợp đồng (HỢP ĐỒNG LAO ĐỘNG)
"""
from __future__ import annotations

import io
import logging
from typing import Any

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────

def _remove_table_borders(table: Any) -> None:
    """Remove all visible borders from a docx table (for layout tables)."""
    tbl = table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement("w:tblPr")
    tblBorders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        border_el = OxmlElement(f"w:{edge}")
        border_el.set(qn("w:val"), "none")
        border_el.set(qn("w:sz"), "0")
        border_el.set(qn("w:space"), "0")
        border_el.set(qn("w:color"), "auto")
        tblBorders.append(border_el)
    tblPr.append(tblBorders)


def _set_run_font(run: Any, name: str = "Times New Roman", size_pt: int = 13) -> None:
    run.font.name = name
    run.font.size = Pt(size_pt)
    # Ensure complex script font (for CJK/VN diacritics)
    rPr = run._r.get_or_add_rPr()
    cs = OxmlElement("w:rFonts")
    cs.set(qn("w:cs"), name)
    rPr.insert(0, cs)


def _para_normal(doc: Any, text: str, bold: bool = False, italic: bool = False,
                  align: str = "LEFT", size_pt: int = 13,
                  first_indent_cm: float = 0.0, space_before_pt: float = 0.0) -> Any:
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(first_indent_cm)
    p.paragraph_format.space_before = Pt(space_before_pt)
    p.paragraph_format.line_spacing = Pt(20)  # ~1.5 lines for 13pt
    p.alignment = {
        "LEFT": WD_ALIGN_PARAGRAPH.LEFT,
        "CENTER": WD_ALIGN_PARAGRAPH.CENTER,
        "JUSTIFY": WD_ALIGN_PARAGRAPH.JUSTIFY,
    }.get(align, WD_ALIGN_PARAGRAPH.LEFT)

    if text:
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        _set_run_font(run, size_pt=size_pt)

    return p


# ──────────────────────────────────────────────────────────
# Main Exporter
# ──────────────────────────────────────────────────────────

class ND30Exporter:
    """
    HR Administrative Document Exporter — NĐ 30/2020/NĐ-CP.

    Usage::

        exporter = ND30Exporter()
        docx_bytes = exporter.export(data)
        # Then stream docx_bytes as a FileResponse

    ``data`` schema::

        {
          "doc_type": "QUYẾT ĐỊNH",
          "company_name": "CÔNG TY CỔ PHẦN TOWN HOWN",
          "department": "PHÒNG NHÂN SỰ",
          "doc_number": "45/QĐ-NS",
          "location_date": "Hà Nội, ngày 15 tháng 09 năm 2026",
          "title": "QUYẾT ĐỊNH",
          "subject": "Về việc tiếp nhận và bổ nhiệm nhân sự",
          "bases": [
              "Căn cứ Điều lệ Công ty;",
              "Căn cứ Biên bản họp ngày 10/09/2026;"
          ],
          "articles": [
              {"title": "Điều 1", "content": "Tiếp nhận Ông/Bà..."},
              {"title": "Điều 2", "content": "Mức lương..."},
              {"title": "Điều 3", "content": "Phòng Nhân sự chịu trách nhiệm..."}
          ],
          "signatory_title": "TỔNG GIÁM ĐỐC",
          "signatory_name": "Trần Thị B",
          "recipients": ["Như Điều 3;", "Lưu: VT, NS."]
        }
    """

    STATE_HEADER_LINE1 = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"
    STATE_HEADER_LINE2 = "Độc lập - Tự do - Hạnh phúc"

    def export(self, data: dict) -> io.BytesIO:
        """Generate DOCX and return as BytesIO stream."""
        doc = Document()

        # ── Page margins (NĐ 30 standard) ───────────────
        section = doc.sections[0]
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(1.5)
        section.page_width = Cm(21.0)   # A4
        section.page_height = Cm(29.7)

        # ── Default style ────────────────────────────────
        normal_style = doc.styles["Normal"]
        normal_style.font.name = "Times New Roman"
        normal_style.font.size = Pt(13)

        self._build_header(doc, data)
        self._build_title(doc, data)
        self._build_bases(doc, data)
        self._build_articles(doc, data)
        self._build_footer(doc, data)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer

    # ── Sections ─────────────────────────────────────────

    def _build_header(self, doc: Any, data: dict) -> None:
        """Two-column header table (organization | state header)."""
        table = doc.add_table(rows=1, cols=2)
        table.autofit = False
        _remove_table_borders(table)
        table.columns[0].width = Cm(8.5)
        table.columns[1].width = Cm(9.0)

        # ── Left: Company / Department / Doc number ──────
        c_left = table.cell(0, 0)
        p_left = c_left.paragraphs[0]
        p_left.alignment = WD_ALIGN_PARAGRAPH.CENTER

        company = data.get("company_name") or data.get("organ_name") or "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN-TOWN"
        dept = data.get("department") or data.get("organ_name_upper") or "PHÒNG NHÂN SỰ"
        doc_num = data.get("doc_number") or data.get("doc_code") or ""

        r1 = p_left.add_run(f"{company}\n")
        r1.bold = True
        _set_run_font(r1, size_pt=13)

        r2 = p_left.add_run(f"{dept}\n")
        r2.bold = True
        _set_run_font(r2, size_pt=11)

        # underline separator
        p_sep = c_left.add_paragraph("─" * 22)
        p_sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_sep.runs[0].font.size = Pt(10)

        if doc_num:
            p_num = c_left.add_paragraph(f"Số: {doc_num}")
            p_num.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_num.runs[0].font.size = Pt(12)

        # ── Right: State header ──────────────────────────
        c_right = table.cell(0, 1)
        p_right = c_right.paragraphs[0]
        p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER

        r3 = p_right.add_run(f"{self.STATE_HEADER_LINE1}\n")
        r3.bold = True
        _set_run_font(r3, size_pt=13)

        r4 = p_right.add_run(f"{self.STATE_HEADER_LINE2}\n")
        r4.bold = True
        _set_run_font(r4, size_pt=13)

        r5 = p_right.add_run("─" * 20 + "\n")
        r5.font.size = Pt(10)

        loc = data.get("location", "")
        dt = data.get("date_str", "")
        location_date = data.get("location_date") or (f"{loc}, {dt}" if loc and dt else dt or loc)
        if location_date:
            r6 = p_right.add_run(location_date)
            r6.italic = True
            _set_run_font(r6, size_pt=12)

        doc.add_paragraph()  # spacer

    def _build_title(self, doc: Any, data: dict) -> None:
        """Centered, uppercase, bold document type title + subject."""
        doc_type = data.get("doc_type", data.get("title", "QUYẾT ĐỊNH")).upper()
        subject = data.get("subject", "")

        p_type = doc.add_paragraph()
        p_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_type.paragraph_format.space_before = Pt(12)
        r = p_type.add_run(doc_type)
        r.bold = True
        _set_run_font(r, size_pt=14)

        if subject:
            p_subj = doc.add_paragraph()
            p_subj.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r2 = p_subj.add_run(subject)
            r2.bold = True
            r2.italic = True
            _set_run_font(r2, size_pt=13)

        doc.add_paragraph()

    def _build_bases(self, doc: Any, data: dict) -> None:
        """Legal bases — italic, first-line indented, ending with ';'."""
        bases: list[str] = data.get("bases") or data.get("legal_bases") or []
        for base in bases:
            text = base if base.endswith(";") else base + ";"
            _para_normal(doc, text, italic=True, align="JUSTIFY",
                         first_indent_cm=1.0, size_pt=13)

        if bases:
            doc.add_paragraph()

    def _build_articles(self, doc: Any, data: dict) -> None:
        """Articles / clauses with bold title and body text."""
        articles: list[dict] = data.get("articles", [])
        for art in articles:
            title = art.get("title", "")
            content = art.get("content", "")
            p = _para_normal(doc, "", align="JUSTIFY", first_indent_cm=1.0, size_pt=13)
            if title:
                r_title = p.add_run(f"{title}. ")
                r_title.bold = True
                _set_run_font(r_title, size_pt=13)
            if content:
                r_body = p.add_run(content)
                _set_run_font(r_body, size_pt=13)

        if articles:
            doc.add_paragraph()

    def _build_footer(self, doc: Any, data: dict) -> None:
        """Footer table: recipients list (left) | signatory block (right)."""
        recipients: list[str] = data.get("recipients") or ["Lưu: VT, HR."]
        signatory_title = data.get("signatory_title") or data.get("signer_title") or "TỔNG GIÁM ĐỐC"
        signatory_name = data.get("signatory_name") or data.get("signer_name") or ""

        table = doc.add_table(rows=1, cols=2)
        table.autofit = False
        _remove_table_borders(table)
        table.columns[0].width = Cm(7.5)
        table.columns[1].width = Cm(10.0)

        # Recipients
        c_rec = table.cell(0, 0)
        p_hdr = c_rec.paragraphs[0]
        r_hdr = p_hdr.add_run("Nơi nhận:")
        r_hdr.bold = True
        r_hdr.font.size = Pt(11)

        for recipient in recipients:
            p_r = c_rec.add_paragraph(f"- {recipient}")
            p_r.runs[0].font.size = Pt(10)

        # Signatory block
        c_sig = table.cell(0, 1)
        p_sig = c_sig.paragraphs[0]
        p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER

        r_title = p_sig.add_run(f"{signatory_title}\n")
        r_title.bold = True
        _set_run_font(r_title, size_pt=13)

        r_note = p_sig.add_run("(Ký, ghi rõ họ tên và đóng dấu)\n\n\n\n")
        r_note.italic = True
        r_note.font.size = Pt(11)

        if signatory_name:
            p_name = c_sig.add_paragraph(signatory_name)
            p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_n = p_name.runs[0]
            r_n.bold = True
            _set_run_font(r_n, size_pt=13)
