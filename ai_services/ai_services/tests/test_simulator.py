"""
tests/test_simulator.py

Unit tests for ai_services/services/simulator.py

Run:
    pytest tests/test_simulator.py -v
"""

import pytest

from ai_services.services.simulator import (
    ClauseSimulator,
    SimulationResult,
    get_simulator,
)

# -------------------------------------------------------------------
# Sample Clauses
# -------------------------------------------------------------------

ORIGINAL_CLAUSE = """
The supplier shall indemnify and hold harmless the customer against
all losses arising from this agreement.
"""

MODIFIED_CLAUSE = """
The supplier's liability shall be limited to the total contract value,
except where prohibited by law.
"""

LOW_RISK = """
The customer shall contact the supplier during business hours.
"""

EMPTY = ""


# -------------------------------------------------------------------
# Simulator Loading
# -------------------------------------------------------------------

def test_simulator_instance():

    simulator = get_simulator()

    assert isinstance(simulator, ClauseSimulator)


# -------------------------------------------------------------------
# Basic Simulation
# -------------------------------------------------------------------

def test_simulation_returns_result():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert isinstance(result, SimulationResult)


# -------------------------------------------------------------------
# Result Fields
# -------------------------------------------------------------------

def test_result_contains_original_prediction():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert result.original_prediction is not None


def test_result_contains_modified_prediction():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert result.modified_prediction is not None


def test_result_contains_summary():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert result.summary.strip() != ""


# -------------------------------------------------------------------
# Risk Comparison
# -------------------------------------------------------------------

def test_risk_levels_exist():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert result.original_prediction.risk_level is not None

    assert result.modified_prediction.risk_level is not None


# -------------------------------------------------------------------
# Confidence
# -------------------------------------------------------------------

def test_confidence_scores():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert 0 <= result.original_prediction.confidence <= 1

    assert 0 <= result.modified_prediction.confidence <= 1


# -------------------------------------------------------------------
# Repeatability
# -------------------------------------------------------------------

def test_repeatability():

    simulator = get_simulator()

    r1 = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    r2 = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert (
        r1.modified_prediction.risk_level ==
        r2.modified_prediction.risk_level
    )


# -------------------------------------------------------------------
# Empty Input
# -------------------------------------------------------------------

def test_empty_original_clause():

    simulator = get_simulator()

    with pytest.raises(Exception):

        simulator.simulate(
            EMPTY,
            MODIFIED_CLAUSE,
        )


def test_empty_modified_clause():

    simulator = get_simulator()

    with pytest.raises(Exception):

        simulator.simulate(
            ORIGINAL_CLAUSE,
            EMPTY,
        )


# -------------------------------------------------------------------
# Same Clause
# -------------------------------------------------------------------

def test_same_clause():

    simulator = get_simulator()

    result = simulator.simulate(
        LOW_RISK,
        LOW_RISK,
    )

    assert result is not None


# -------------------------------------------------------------------
# Translation (if enabled)
# -------------------------------------------------------------------

def test_translation_output():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
        target_language="en",
    )

    assert result.translation is not None


# -------------------------------------------------------------------
# Explainability
# -------------------------------------------------------------------

def test_shap_summary_exists():

    simulator = get_simulator()

    result = simulator.simulate(
        ORIGINAL_CLAUSE,
        MODIFIED_CLAUSE,
    )

    assert result.explanation is not None


# -------------------------------------------------------------------
# Multiple Simulations
# -------------------------------------------------------------------

@pytest.mark.parametrize(
    "original, modified",
    [
        (
            ORIGINAL_CLAUSE,
            MODIFIED_CLAUSE,
        ),
        (
            LOW_RISK,
            ORIGINAL_CLAUSE,
        ),
        (
            MODIFIED_CLAUSE,
            LOW_RISK,
        ),
    ],
)
def test_multiple_cases(original, modified):

    simulator = get_simulator()

    result = simulator.simulate(
        original,
        modified,
    )

    assert isinstance(result, SimulationResult)