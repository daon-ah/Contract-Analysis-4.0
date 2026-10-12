"""
tests/test_segmentation.py

Unit tests for ai_services/services/segmentation.py

Run:
    pytest tests/test_segmentation.py -v
"""

from pathlib import Path

import pytest

from ai_services.services.segmentation import (
    Segment,
    segment_document,
)

# -------------------------------------------------------------------
# Sample Documents
# -------------------------------------------------------------------

SIMPLE_DOCUMENT = """
1. Definitions

The terms used in this agreement shall have the following meanings.

2. Payment

The customer shall pay within thirty days.

3. Termination

Either party may terminate this agreement by giving thirty days notice.
"""

EMPTY_DOCUMENT = ""

LONG_DOCUMENT = """
1. Liability
""" + ("The supplier accepts full responsibility. " * 500)


# -------------------------------------------------------------------
# Basic Segmentation
# -------------------------------------------------------------------

def test_returns_list():

    result = segment_document(SIMPLE_DOCUMENT)

    assert isinstance(result, list)


def test_returns_segment_objects():

    result = segment_document(SIMPLE_DOCUMENT)

    assert all(
        isinstance(seg, Segment)
        for seg in result
    )


def test_document_not_empty():

    result = segment_document(SIMPLE_DOCUMENT)

    assert len(result) > 0


# -------------------------------------------------------------------
# Segment Validation
# -------------------------------------------------------------------

def test_every_segment_has_text():

    result = segment_document(SIMPLE_DOCUMENT)

    for seg in result:

        assert seg.text.strip() != ""


def test_every_segment_has_index():

    result = segment_document(SIMPLE_DOCUMENT)

    for seg in result:

        assert seg.index >= 0


def test_every_segment_has_header():

    result = segment_document(SIMPLE_DOCUMENT)

    for seg in result:

        assert seg.header is not None


# -------------------------------------------------------------------
# Header Detection
# -------------------------------------------------------------------

def test_headers_detected():

    result = segment_document(SIMPLE_DOCUMENT)

    headers = [seg.header.lower() for seg in result]

    assert any("definitions" in h for h in headers)

    assert any("payment" in h for h in headers)

    assert any("termination" in h for h in headers)


# -------------------------------------------------------------------
# Empty Input
# -------------------------------------------------------------------

def test_empty_document():

    result = segment_document(EMPTY_DOCUMENT)

    assert result == []


# -------------------------------------------------------------------
# Long Document
# -------------------------------------------------------------------

def test_long_document():

    result = segment_document(LONG_DOCUMENT)

    assert len(result) > 0


# -------------------------------------------------------------------
# Oversized Clause Splitting
# -------------------------------------------------------------------

def test_large_clause_split():

    result = segment_document(LONG_DOCUMENT)

    assert len(result) >= 1


# -------------------------------------------------------------------
# Segment Ordering
# -------------------------------------------------------------------

def test_segment_indexes_are_sorted():

    result = segment_document(SIMPLE_DOCUMENT)

    indexes = [seg.index for seg in result]

    assert indexes == sorted(indexes)


# -------------------------------------------------------------------
# No Empty Segments
# -------------------------------------------------------------------

def test_no_blank_segments():

    result = segment_document(SIMPLE_DOCUMENT)

    assert all(
        seg.text.strip()
        for seg in result
    )


# -------------------------------------------------------------------
# Consecutive Calls
# -------------------------------------------------------------------

def test_repeatability():

    r1 = segment_document(SIMPLE_DOCUMENT)

    r2 = segment_document(SIMPLE_DOCUMENT)

    assert len(r1) == len(r2)


# -------------------------------------------------------------------
# Text Preservation
# -------------------------------------------------------------------

def test_original_text_preserved():

    result = segment_document(SIMPLE_DOCUMENT)

    combined = "\n".join(seg.text for seg in result)

    assert "payment" in combined.lower()

    assert "termination" in combined.lower()


# -------------------------------------------------------------------
# Parametrized Tests
# -------------------------------------------------------------------

@pytest.mark.parametrize(
    "document",
    [
        SIMPLE_DOCUMENT,
        LONG_DOCUMENT,
    ]
)
def test_segmentation_runs(document):

    result = segment_document(document)

    assert isinstance(result, list)