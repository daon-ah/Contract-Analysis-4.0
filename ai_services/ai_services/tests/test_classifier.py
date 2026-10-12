"""
tests/test_classifier.py

Unit tests for ai_services/services/classifier.py

Run:
    pytest tests/test_classifier.py -v
"""

import pytest

from ai_services.services.classifier import (
    ClassificationResult,
    ClauseClassifier,
    get_classifier,
)

# -------------------------------------------------------------------
# Sample Clauses
# -------------------------------------------------------------------

LOW_RISK = """
The customer may contact the supplier during normal business hours
for support related to the purchased product.
"""

MEDIUM_RISK = """
The customer shall provide written notice before terminating the
agreement. Termination becomes effective after thirty days.
"""

HIGH_RISK = """
The supplier shall indemnify and hold harmless the customer against
all claims, damages, liabilities, costs, and expenses arising from
this agreement.
"""

EMPTY = ""

LONG_TEXT = HIGH_RISK * 100


# -------------------------------------------------------------------
# Model Loading
# -------------------------------------------------------------------

def test_classifier_instance():

    classifier = get_classifier()

    assert isinstance(classifier, ClauseClassifier)


# -------------------------------------------------------------------
# Single Prediction
# -------------------------------------------------------------------

def test_single_prediction_returns_result():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    assert isinstance(result, ClassificationResult)


def test_prediction_has_valid_risk_level():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    assert result.risk_level is not None


def test_confidence_range():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    assert 0.0 <= result.confidence <= 1.0


def test_raw_scores_exist():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    assert isinstance(result.raw_scores, dict)

    assert len(result.raw_scores) == 3


def test_raw_scores_sum_close_to_one():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    total = sum(result.raw_scores.values())

    assert abs(total - 1.0) < 0.01


# -------------------------------------------------------------------
# Batch Prediction
# -------------------------------------------------------------------

def test_batch_prediction():

    classifier = get_classifier()

    clauses = [
        LOW_RISK,
        MEDIUM_RISK,
        HIGH_RISK,
    ]

    results = classifier.classify_batch(clauses)

    assert len(results) == 3

    assert all(
        isinstance(r, ClassificationResult)
        for r in results
    )


# -------------------------------------------------------------------
# Consistency
# -------------------------------------------------------------------

def test_prediction_is_repeatable():

    classifier = get_classifier()

    r1 = classifier.classify(HIGH_RISK)

    r2 = classifier.classify(HIGH_RISK)

    assert r1.risk_level == r2.risk_level


# -------------------------------------------------------------------
# Long Input
# -------------------------------------------------------------------

def test_long_clause():

    classifier = get_classifier()

    result = classifier.classify(LONG_TEXT)

    assert result is not None


# -------------------------------------------------------------------
# Empty Input
# -------------------------------------------------------------------

def test_empty_input():

    classifier = get_classifier()

    with pytest.raises(Exception):

        classifier.classify(EMPTY)


# -------------------------------------------------------------------
# Different Clauses
# -------------------------------------------------------------------

@pytest.mark.parametrize(
    "clause",
    [
        LOW_RISK,
        MEDIUM_RISK,
        HIGH_RISK,
    ],
)
def test_multiple_examples(clause):

    classifier = get_classifier()

    result = classifier.classify(clause)

    assert isinstance(result, ClassificationResult)

    assert 0 <= result.confidence <= 1


# -------------------------------------------------------------------
# Probability Validation
# -------------------------------------------------------------------

def test_probability_values():

    classifier = get_classifier()

    result = classifier.classify(HIGH_RISK)

    for value in result.raw_scores.values():

        assert 0 <= value <= 1


# -------------------------------------------------------------------
# Cache Validation
# -------------------------------------------------------------------

def test_classifier_cache():

    model1 = get_classifier()

    model2 = get_classifier()

    assert model1 is model2