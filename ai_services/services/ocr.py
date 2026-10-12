import logging
from dataclasses import dataclass
from pathlib import Path
from io import BytesIO

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

MIN_TEXT_LEN_PER_PAGE = 20
OCR_DPI = 300

# ---------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------

@dataclass
class OCRPage:
    """
    Represents OCR output for a single page.
    """
    page_number: int
    text: str
    used_fallback: bool = False


@dataclass
class OCRResult:
    """
    Represents OCR output for an entire document.
    """
    pages: list[OCRPage]
    full_text: str
    used_fallback: bool


# ---------------------------------------------------------------------
# Exception
# ---------------------------------------------------------------------

class OCRExtractionError(Exception):
    """Raised when OCR extraction fails."""
    pass


# ---------------------------------------------------------------------
# Primary Extraction (PyMuPDF)
# ---------------------------------------------------------------------

def _extract_with_pymupdf(file_bytes: bytes) -> list[OCRPage]:

    pages = []

    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as document:

            for index, page in enumerate(document):

                text = page.get_text("text") or ""

                pages.append(
                    OCRPage(
                        page_number=index + 1,
                        text=text.strip(),
                        used_fallback=False,
                    )
                )

    except Exception as exc:
        raise OCRExtractionError(
            f"Unable to read PDF: {exc}"
        ) from exc

    return pages


# ---------------------------------------------------------------------
# PaddleOCR Fallback
# ---------------------------------------------------------------------

def _extract_with_paddleocr(
    file_bytes: bytes,
    page_numbers: list[int],
) -> dict[int, str]:
    """
    OCR fallback for scanned pages.
    """

    from paddleocr import PaddleOCR

    ocr = PaddleOCR(
        use_angle_cls=True,
        lang="en",
        show_log=False,
    )

    extracted = {}

    with fitz.open(stream=file_bytes, filetype="pdf") as document:

        for page_number in page_numbers:

            page = document[page_number - 1]

            pixmap = page.get_pixmap(
                dpi=OCR_DPI
            )

            image = pixmap.tobytes("png")

            result = ocr.ocr(
                image,
                cls=True,
            )

            lines = []

            for block in result or []:

                for _, (text, confidence) in block:

                    if text.strip():

                        lines.append(text)

            extracted[page_number] = "\n".join(lines)

    return extracted


# ---------------------------------------------------------------------
# Public OCR API
# ---------------------------------------------------------------------

def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """
    Extract text from a PDF.

    Uses:

    1. PyMuPDF
    2. PaddleOCR (fallback)
    """

    if not filename.lower().endswith(".pdf"):
        raise OCRExtractionError(
            "Only PDF files are supported."
        )

    pages = _extract_with_pymupdf(file_bytes)

    low_text_pages = [

        page.page_number

        for page in pages

        if len(page.text) < MIN_TEXT_LEN_PER_PAGE

    ]

    used_fallback = False

    if low_text_pages:

        logger.info(
            "Running PaddleOCR on pages: %s",
            low_text_pages,
        )

        try:

            ocr_pages = _extract_with_paddleocr(
                file_bytes,
                low_text_pages,
            )

            used_fallback = True

            for page in pages:

                if page.page_number in ocr_pages:

                    page.text = (
                        ocr_pages[
                            page.page_number
                        ].strip()
                    )

                    page.used_fallback = True

        except Exception:

            logger.exception(
                "PaddleOCR failed. Using PyMuPDF text."
            )

    full_text = "\n\n".join(

        page.text

        for page in pages

        if page.text.strip()

    )

    if not full_text:

        raise OCRExtractionError(
            "No readable text found in the document."
        )

    return OCRResult(
        pages=pages,
        full_text=full_text,
        used_fallback=used_fallback,
    )


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    pdf = Path("sample_contract.pdf")

    try:

        result = extract_text(pdf)

        print("\nOCR Result")
        print("-" * 40)

        print("Fallback Used :", result.used_fallback)
        print("Pages         :", len(result.pages))

        print("\nExtracted Text\n")

        print(result.full_text[:1000])

    except OCRExtractionError as error:

        print(error)