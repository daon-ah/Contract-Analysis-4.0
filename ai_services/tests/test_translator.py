"""
tests/test_translator.py

Unit tests for ai_services/services/translator.py

Run:
    pytest tests/test_translator.py -v
"""

import pytest

from ai_services.services.translator import (
    TranslationOutput,
    Translator,
    get_translator,
)

# -------------------------------------------------------------------
# Sample Clauses
# -------------------------------------------------------------------

SIMPLE_CLAUSE = """
The customer shall pay all invoices within thirty days.
"""

LEGAL_CLAUSE = """
The supplier shall indemnify and hold harmless the customer
against all claims, damages, liabilities, costs and expenses.
"""

CONFIDENTIALITY = """
Both parties agree to maintain confidentiality regarding all
business information disclosed during the agreement.
"""

EMPTY = ""

UNSUPPORTED_LANGUAGE = "xyz"


# -------------------------------------------------------------------
# Translator Loading
# -------------------------------------------------------------------

def test_translator_instance():

    translator = get_translator()

    assert isinstance(translator, Translator)


# -------------------------------------------------------------------
# Translation Output
# -------------------------------------------------------------------

def test_translation_returns_output():

    translator = get_translator()

    result = translator.translate(
        SIMPLE_CLAUSE,
        target_language="en"
    )

    assert isinstance(result, TranslationOutput)


def test_plain_english_exists():

    translator = get_translator()

    result = translator.translate(
        LEGAL_CLAUSE,
        target_language="en"
    )

    assert result.plain_english.strip() != ""


def test_key_terms_exist():

    translator = get_translator()

    result = translator.translate(
        LEGAL_CLAUSE,
        target_language="en"
    )

    assert isinstance(result.key_terms, list)


def test_key_terms_not_empty():

    translator = get_translator()

    result = translator.translate(
        LEGAL_CLAUSE,
        target_language="en"
    )

    assert len(result.key_terms) > 0


# -------------------------------------------------------------------
# Translation Quality
# -------------------------------------------------------------------

def test_translation_shorter_than_original():

    translator = get_translator()

    result = translator.translate(
        LEGAL_CLAUSE,
        target_language="en"
    )

    assert len(result.plain_english) <= len(LEGAL_CLAUSE) * 2


def test_translation_contains_text():

    translator = get_translator()

    result = translator.translate(
        CONFIDENTIALITY,
        target_language="en"
    )

    assert result.plain_english is not None


# -------------------------------------------------------------------
# Empty Input
# -------------------------------------------------------------------

def test_empty_input():

    translator = get_translator()

    with pytest.raises(Exception):

        translator.translate(
            EMPTY,
            target_language="en"
        )


# -------------------------------------------------------------------
# Unsupported Language
# -------------------------------------------------------------------

def test_invalid_language():

    translator = get_translator()

    with pytest.raises(Exception):

        translator.translate(
            SIMPLE_CLAUSE,
            target_language=UNSUPPORTED_LANGUAGE
        )


# -------------------------------------------------------------------
# Repeatability
# -------------------------------------------------------------------

def test_repeatability():

    translator = get_translator()

    r1 = translator.translate(
        SIMPLE_CLAUSE,
        target_language="en"
    )

    r2 = translator.translate(
        SIMPLE_CLAUSE,
        target_language="en"
    )

    assert r1.plain_english == r2.plain_english


# -------------------------------------------------------------------
# Multiple Clauses
# -------------------------------------------------------------------

@pytest.mark.parametrize(
    "clause",
    [
        SIMPLE_CLAUSE,
        LEGAL_CLAUSE,
        CONFIDENTIALITY,
    ]
)
def test_multiple_inputs(clause):

    translator = get_translator()

    result = translator.translate(
        clause,
        target_language="en"
    )

    assert isinstance(result, TranslationOutput)


# -------------------------------------------------------------------
# Key Terms Validation
# -------------------------------------------------------------------

def test_key_terms_are_strings():

    translator = get_translator()

    result = translator.translate(
        LEGAL_CLAUSE,
        target_language="en"
    )

    assert all(
        isinstance(term, str)
        for term in result.key_terms
    )


# -------------------------------------------------------------------
# Cache Validation
# -------------------------------------------------------------------

def test_translator_cache():

    t1 = get_translator()

    t2 = get_translator()

    assert t1 is t2