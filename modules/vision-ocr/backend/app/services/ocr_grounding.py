"""
OCR Grounding Service — Normalize bounding boxes for Visual Grounding on frontend.

Converts raw PaddleOCR polygon coordinates [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
into normalized {x, y, w, h} (0.0–1.0) relative to image dimensions.
These normalized values are resolution-independent and can be used directly
as percentage-based CSS positioning in the SVG overlay on the ReviewWorkspace.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GroundedBlock:
    """A single text block with its normalized bounding box.

    bbox keys:
      x — left edge (0.0 = left side of image, 1.0 = right side)
      y — top edge (0.0 = top of image, 1.0 = bottom)
      w — width  (fraction of image width)
      h — height (fraction of image height)
    """
    id: str
    text: str
    confidence: float
    bbox: dict  # {"x": float, "y": float, "w": float, "h": float}
    field_key: str | None = None  # e.g. "fullName", "idNumber", "issueDate"


def parse_paddle_to_grounded_blocks(
    ocr_result: list[Any],
    img_width: int,
    img_height: int,
) -> list[GroundedBlock]:
    """
    Parse PaddleOCR result list into normalized GroundedBlock list.

    Each item in ocr_result is:
        [[[x1, y1], [x2, y1], [x2, y2], [x1, y2]], ("text", confidence)]

    Returns blocks sorted top-to-bottom then left-to-right (reading order).
    """
    if img_width <= 0 or img_height <= 0:
        logger.warning("Invalid image dimensions (%d x %d), skipping grounding", img_width, img_height)
        return []

    blocks: list[GroundedBlock] = []

    for idx, line in enumerate(ocr_result):
        try:
            box_coords, (text, score) = line[0], line[1]
            if not text or not text.strip():
                continue

            xs = [float(pt[0]) for pt in box_coords]
            ys = [float(pt[1]) for pt in box_coords]

            x_min = max(0.0, min(xs))
            x_max = min(float(img_width), max(xs))
            y_min = max(0.0, min(ys))
            y_max = min(float(img_height), max(ys))

            norm_bbox = {
                "x": round(x_min / img_width, 5),
                "y": round(y_min / img_height, 5),
                "w": round((x_max - x_min) / img_width, 5),
                "h": round((y_max - y_min) / img_height, 5),
            }

            blocks.append(
                GroundedBlock(
                    id=f"box_{idx}",
                    text=text.strip(),
                    confidence=round(float(score), 3),
                    bbox=norm_bbox,
                )
            )
        except (IndexError, KeyError, TypeError, ValueError) as exc:
            logger.debug("Skipping malformed OCR line %d: %s", idx, exc)
            continue

    # Sort by reading order: top-to-bottom (y), left-to-right (x)
    blocks.sort(key=lambda b: (b.bbox["y"], b.bbox["x"]))
    return blocks


def parse_gemini_grounded_response(
    raw_text: str,
    image_b64: str,
) -> tuple[str, list[GroundedBlock]]:
    """
    Gemini Vision does not natively return bounding boxes.

    Strategy: Return the full text alongside an empty blocks list.
    Bounding box grounding will only be populated when PaddleOCR is used
    as the primary or fallback engine. Gemini path provides rich text only.

    Returns:
        (full_text, blocks)
    """
    return raw_text, []
