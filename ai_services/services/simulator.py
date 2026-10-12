import logging
from dataclasses import dataclass
from functools import lru_cache

from ai_services.services.classifier import (
    RiskLevel,
    ClassificationResult,
    get_classifier,
)
from ai_services.services.explainability import (
    explain_clause,
    ShapSummary,
)
from ai_services.services.translator import (
    TranslationOutput,
    get_translator,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# Risk Ranking
# ---------------------------------------------------------------------

RISK_RANK = {
    RiskLevel.LOW: 0,
    RiskLevel.MEDIUM: 1,
    RiskLevel.HIGH: 2,
}

# ---------------------------------------------------------------------
# Simulation Result
# ---------------------------------------------------------------------

@dataclass
class SimulationResult:
    """
    Complete output of a clause simulation.
    """

    original_prediction: ClassificationResult
    modified_prediction: ClassificationResult

    summary: str

    translation: TranslationOutput | None

    explanation: ShapSummary | None


# ---------------------------------------------------------------------
# Delta Description
# ---------------------------------------------------------------------

def _describe_delta(
    original: RiskLevel,
    modified: RiskLevel,
) -> str:
    """
    Describe how the risk changed.
    """

    original_rank = RISK_RANK[original]
    modified_rank = RISK_RANK[modified]

    if original_rank == modified_rank:

        return (
            f"The clause remains classified as "
            f"{modified.value} risk."
        )

    if modified_rank > original_rank:

        return (
            f"The hypothetical wording increases "
            f"risk from {original.value} to "
            f"{modified.value}."
        )

    return (
        f"The hypothetical wording reduces "
        f"risk from {original.value} to "
        f"{modified.value}."
    )


# ---------------------------------------------------------------------
# Clause Simulator
# ---------------------------------------------------------------------

class ClauseSimulator:
    """
    Legal Time Machine simulator.

    Compares an original clause with a modified
    version to determine whether legal risk
    increases or decreases.
    """

    def __init__(self):

        self.classifier = get_classifier()

        self.translator = get_translator()

    # ---------------------------------------------------------------

    def simulate(
        self,
        original_clause: str,
        modified_clause: str,
        target_language: str = "en",
    ) -> SimulationResult:

        if not original_clause.strip():

            raise ValueError(
                "Original clause cannot be empty."
            )

        if not modified_clause.strip():

            raise ValueError(
                "Modified clause cannot be empty."
            )

        # -----------------------------------------------------------
        # Classification
        # -----------------------------------------------------------

        original_prediction = self.classifier.classify(
            original_clause
        )

        modified_prediction = self.classifier.classify(
            modified_clause
        )

        # -----------------------------------------------------------
        # Summary
        # -----------------------------------------------------------

        summary = _describe_delta(
            original_prediction.risk_level,
            modified_prediction.risk_level,
        )

        # -----------------------------------------------------------
        # Translation
        # -----------------------------------------------------------

        translation = None

        try:

            translation = self.translator.translate(
                modified_clause,
                target_language=target_language,
            )

        except Exception:

            logger.exception(
                "Translation failed."
            )

        # -----------------------------------------------------------
        # Explainability
        # -----------------------------------------------------------

        explanation = None

        try:

            explanation = explain_clause(
                modified_clause,
                modified_prediction.risk_level,
            )

        except Exception:

            logger.exception(
                "SHAP explanation failed."
            )

        return SimulationResult(

            original_prediction=original_prediction,

            modified_prediction=modified_prediction,

            summary=summary,

            translation=translation,

            explanation=explanation,

        )


# ---------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_simulator() -> ClauseSimulator:
    """
    Returns a singleton simulator.
    """

    return ClauseSimulator()


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    simulator = get_simulator()

    original = """
    The supplier shall indemnify and hold harmless
    the customer against all losses and liabilities.
    """

    modified = """
    The supplier's liability shall be limited
    to the total contract value.
    """

    result = simulator.simulate(
        original,
        modified,
    )

    print("\nSimulation")
    print("-" * 50)

    print(
        "Original Risk :",
        result.original_prediction.risk_level.value,
    )

    print(
        "Modified Risk :",
        result.modified_prediction.risk_level.value,
    )

    print(
        "Confidence :",
        result.modified_prediction.confidence,
    )

    print(
        "\nSummary:",
        result.summary,
    )

    if result.translation:

        print(
            "\nPlain English:\n",
            result.translation.plain_english,
        )

    if result.explanation:

        print("\nTop SHAP Features")

        for feature in result.explanation.top_features:

            print(
                feature.token,
                feature.weight,
            )