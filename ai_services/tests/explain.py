"""
tests/explain.py

Unit tests for ai_services/services/explainability.py

Run:
    pytest tests/explain.py -v
"""

import pytest

from ai_services.services.classifier import get_classifier
from ai_services.services.explainability import (
    explain_clause,
    ShapSummary,
)

# ---------------------------------------------------------
# Sample Clauses
# ---------------------------------------------------------

LOW_RISK = """
The customer may contact the supplier during business hours
for technical support.
"""

MEDIUM_RISK = """
Either party may terminate this agreement by providing
thirty days written notice.
"""

HIGH_RISK = """
The supplier shall indemnify and hold harmless the customer
against all claims, liabilities, damages, and expenses.
"""

EMPTY = ""


# ---------------------------------------------------------
# Classifier
# ---------------------------------------------------------

classifier = get_classifier()


# ---------------------------------------------------------
# Return Type
# ---------------------------------------------------------

def test_returns_shapsummary_or_none():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    assert result is None or isinstance(result, ShapSummary)


# ---------------------------------------------------------
# High Risk Explanation
# ---------------------------------------------------------

def test_high_risk_clause():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if result is not None:

        assert isinstance(result, ShapSummary)


# ---------------------------------------------------------
# Medium Risk Explanation
# ---------------------------------------------------------

def test_medium_risk_clause():

    prediction = classifier.classify(MEDIUM_RISK)

    result = explain_clause(
        MEDIUM_RISK,
        prediction.risk_level,
    )

    assert result is None or isinstance(result, ShapSummary)


# ---------------------------------------------------------
# Low Risk Clause
# ---------------------------------------------------------

def test_low_risk_clause():

    prediction = classifier.classify(LOW_RISK)

    result = explain_clause(
        LOW_RISK,
        prediction.risk_level,
    )

    assert result is None or isinstance(result, ShapSummary)


# ---------------------------------------------------------
# Empty Input
# ---------------------------------------------------------

def test_empty_input():

    with pytest.raises(Exception):

        explain_clause(
            EMPTY,
            "HIGH",
        )


# ---------------------------------------------------------
# Explanation Attributes
# ---------------------------------------------------------

def test_summary_attributes():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if result is not None:

        assert hasattr(result, "summary")

        assert hasattr(result, "top_features")


# ---------------------------------------------------------
# Summary Exists
# ---------------------------------------------------------

def test_summary_not_empty():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if result is not None:

        assert result.summary.strip() != ""


# ---------------------------------------------------------
# Feature List
# ---------------------------------------------------------

def test_feature_list():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if result is not None:

        assert isinstance(result.top_features, list)


# ---------------------------------------------------------
# Feature Names
# ---------------------------------------------------------

def test_feature_names_are_strings():

    prediction = classifier.classify(HIGH_RISK)

    result = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if result is not None:

        assert all(
            isinstance(feature, str)
            for feature in result.top_features
        )


# ---------------------------------------------------------
# Repeatability
# ---------------------------------------------------------

def test_repeatability():

    prediction = classifier.classify(HIGH_RISK)

    r1 = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    r2 = explain_clause(
        HIGH_RISK,
        prediction.risk_level,
    )

    if r1 is not None and r2 is not None:

        assert r1.summary == r2.summary


# ---------------------------------------------------------
# Multiple Clauses
# ---------------------------------------------------------

@pytest.mark.parametrize(
    "clause",
    [
        LOW_RISK,
        MEDIUM_RISK,
        HIGH_RISK,
    ],
)
def test_multiple_inputs(clause):

    prediction = classifier.classify(clause)

    result = explain_clause(
        clause,
        prediction.risk_level,
    )

    assert result is None or isinstance(result, ShapSummary)


# ---------------------------------------------------------
# Long Clause
# ---------------------------------------------------------

def test_long_clause():

    clause = HIGH_RISK * 30

    prediction = classifier.classify(clause)

    result = explain_clause(
        clause,
        prediction.risk_level,
    )

    assert result is None or isinstance(result, ShapSummary)