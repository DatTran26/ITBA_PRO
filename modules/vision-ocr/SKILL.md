---
name: vision-ocr
description: >
  High-speed Multimodal Vision OCR engine specification, prompt rules, and 
  FastAPI + React implementation guide for image text extraction, handwriting, 
  and table transcription with local pytesseract fallback. Use when requested to 
  build, scan, debug, or extract text from images.
---

# Vision OCR Engine — Multimodal Image Extraction Skill

## Overview

Ultra-fast (~5s) Multimodal Vision OCR module using Google Gemini Vision VLM with a local `pytesseract` fallback.

## Architecture

1. **Primary VLM Path**: Base64 encoded image $\rightarrow$ Gemini REST API (`gemini-2.5-flash` / `gemini-3.5-flash-lite`).
2. **Offline Fallback**: `pytesseract` + `Pillow` on Windows (`C:\Program Files\Tesseract-OCR\tesseract.exe`).
3. **Response Schema**:
   ```json
   {
     "text": "Extracted text content...",
     "image_b64": "data:image/png;base64,...",
     "status": "success"
   }
   ```

## Prompt Specification

```text
You are an expert OCR engine. Accurately transcribe ALL visible text from this image, including:
- Printed text
- Handwritten text
- Table contents (preserve structure with | separators)
- Numbers, dates, codes
- Headers, footers, watermarks

Rules:
1. Preserve original language — do NOT translate.
2. Maintain line breaks and paragraph structure.
3. For tables, use markdown table format.
4. Return ONLY the extracted text, no commentary.
```
