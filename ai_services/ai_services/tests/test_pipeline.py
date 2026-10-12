"""
tests/test_pipeline.py

Integration Tests

OCR
 ↓
Segmentation
 ↓
Classification
 ↓
Explainability
 ↓
Translation
 ↓
Simulation

Run:

pytest tests/test_pipeline.py -v
"""

from pathlib import Path

import pytest

from ai_services.services.ocr import extract_text
from ai_services.services.segmentation import segment_document
from ai_services.services.classifier import get_classifier
from ai_services.services.explainability import explain_clause
from ai_services.services.translator import get_translator
from ai_services.services.simulator import get_simulator


# ----------------------------------------------------
# Test Files
# ----------------------------------------------------

PDF = Path("tests/data/sample_contract.pdf")


# ----------------------------------------------------
# Full Pipeline
# ----------------------------------------------------

def test_complete_pipeline():

    # ---------------- OCR ----------------

    ocr = extract_text(PDF)

    assert ocr.full_text.strip() != ""

    # ---------------- Segmentation ----------------

    segments = segment_document(ocr.full_text)

    assert len(segments) > 0

    # ---------------- Classifier ----------------

    classifier = get_classifier()

    predictions = []

    for segment in segments:

        prediction = classifier.classify(segment.text)

        predictions.append(prediction)

    assert len(predictions) == len(segments)

    # ---------------- Explainability ----------------

    explanations = []

    for segment, prediction in zip(segments, predictions):

        explanation = explain_clause(

            segment.text,

            prediction.risk_level,

        )

        explanations.append(explanation)

    # ---------------- Translator ----------------

    translator = get_translator()

    translations = []

    for segment in segments:

        translation = translator.translate(

            segment.text,

            target_language="en",

        )

        translations.append(translation)

    assert len(translations) == len(segments)

    # ---------------- Simulator ----------------

    simulator = get_simulator()

    simulation = simulator.simulate(

        segments[0].text,

        segments[0].text,

    )

    assert simulation is not None


# ----------------------------------------------------
# OCR -> Segmentation
# ----------------------------------------------------

def test_ocr_segmentation():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    assert len(segments) > 0

    assert all(seg.text for seg in segments)


# ----------------------------------------------------
# Segmentation -> Classification
# ----------------------------------------------------

def test_classification_pipeline():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    classifier = get_classifier()

    for segment in segments:

        prediction = classifier.classify(segment.text)

        assert prediction.confidence >= 0

        assert prediction.risk_level is not None


# ----------------------------------------------------
# Explainability Pipeline
# ----------------------------------------------------

def test_explainability_pipeline():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    classifier = get_classifier()

    prediction = classifier.classify(

        segments[0].text

    )

    explanation = explain_clause(

        segments[0].text,

        prediction.risk_level,

    )

    assert explanation is not None


# ----------------------------------------------------
# Translation Pipeline
# ----------------------------------------------------

def test_translation_pipeline():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    translator = get_translator()

    translation = translator.translate(

        segments[0].text,

        target_language="en",

    )

    assert translation.plain_english != ""

    assert len(translation.key_terms) > 0


# ----------------------------------------------------
# Simulation Pipeline
# ----------------------------------------------------

def test_simulation_pipeline():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    simulator = get_simulator()

    simulation = simulator.simulate(

        segments[0].text,

        segments[0].text,

    )

    assert simulation.summary != ""


# ----------------------------------------------------
# Empty Document
# ----------------------------------------------------

def test_empty_document():

    with pytest.raises(Exception):

        segment_document("")


# ----------------------------------------------------
# Deterministic Prediction
# ----------------------------------------------------

def test_repeatability():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    classifier = get_classifier()

    p1 = classifier.classify(

        segments[0].text

    )

    p2 = classifier.classify(

        segments[0].text

    )

    assert p1.risk_level == p2.risk_level


# ----------------------------------------------------
# Batch Test
# ----------------------------------------------------

def test_multiple_segments():

    ocr = extract_text(PDF)

    segments = segment_document(ocr.full_text)

    classifier = get_classifier()

    translator = get_translator()

    for segment in segments:

        prediction = classifier.classify(

            segment.text

        )

        translation = translator.translate(

            segment.text,

            "en",

        )

        assert prediction is not None

        assert translation is not None