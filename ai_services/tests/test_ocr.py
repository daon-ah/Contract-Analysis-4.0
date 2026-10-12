"""
tests/test_ocr.py

Unit tests for ai_services/services/ocr.py

Run:
    pytest tests/test_ocr.py -v
"""

from pathlib import Path

import pytest

from ai_services.services.ocr import (
    OCRExtractionError,
    OCRPage,
    OCRResult,
    extract_text,
)

# -------------------------------------------------------------------
# Test files
# -------------------------------------------------------------------

VALID_PDF = Path("tests/data/sample_contract.pdf")
EMPTY_PDF = Path("tests/data/empty.pdf")
INVALID_PDF = Path("tests/data/does_not_exist.pdf")


# -------------------------------------------------------------------
# Successful OCR
# -------------------------------------------------------------------

def test_extract_text_returns_ocrresult():
    """OCR should return an OCRResult object."""

    result = extract_text(VALID_PDF)

    assert isinstance(result, OCRResult)


def test_ocr_returns_pages():
    """OCR should return at least one page."""

    result = extract_text(VALID_PDF)

    assert len(result.pages) > 0

    assert all(isinstance(page, OCRPage) for page in result.pages)


def test_ocr_returns_full_text():
    """Full extracted text should not be empty."""

    result = extract_text(VALID_PDF)

    assert isinstance(result.full_text, str)

    assert result.full_text.strip() != ""


def test_page_numbers_are_correct():
    """Page numbering should start at 1."""

    result = extract_text(VALID_PDF)

    assert result.pages[0].page_number == 1


def test_page_text_is_string():
    """Every page must contain text."""

    result = extract_text(VALID_PDF)

    for page in result.pages:

        assert isinstance(page.text, str)


# -------------------------------------------------------------------
# OCR fallback
# -------------------------------------------------------------------

def test_used_fallback_is_boolean():
    """Fallback flag should always be boolean."""

    result = extract_text(VALID_PDF)

    assert isinstance(result.used_fallback, bool)


def test_page_fallback_flags():
    """Each page should contain used_fallback flag."""

    result = extract_text(VALID_PDF)

    for page in result.pages:

        assert isinstance(page.used_fallback, bool)


# -------------------------------------------------------------------
# Error Handling
# -------------------------------------------------------------------

def test_invalid_file_raises_exception():
    """Invalid file path should raise OCRExtractionError."""

    with pytest.raises(OCRExtractionError):

        extract_text(INVALID_PDF)


def test_empty_document_raises():
    """
    Empty PDF should raise OCRExtractionError.
    """

    with pytest.raises(OCRExtractionError):

        extract_text(EMPTY_PDF)


# -------------------------------------------------------------------
# Output Quality
# -------------------------------------------------------------------

def test_extracted_text_contains_contract_words():
    """
    Sample contract should contain expected keywords.
    """

    result = extract_text(VALID_PDF)

    keywords = [
        "agreement",
        "party",
        "contract",
        "clause",
    ]

    assert any(
        keyword in result.full_text.lower()
        for keyword in keywords
    )


def test_every_page_has_page_number():
    """Each page should have page number >= 1."""

    result = extract_text(VALID_PDF)

    for page in result.pages:

        assert page.page_number >= 1


def test_no_none_pages():
    """OCR should never return None pages."""

    result = extract_text(VALID_PDF)

    assert all(page is not None for page in result.pages)


def test_full_text_matches_page_content():
    """
    Combined page text should equal full_text.
    """

    result = extract_text(VALID_PDF)

    combined = "\n\n".join(
        page.text
        for page in result.pages
        if page.text
    )

    assert combined == result.full_text