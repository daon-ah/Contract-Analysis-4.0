import json
import re
import logging
from functools import lru_cache

from pydantic import BaseModel, ValidationError

from ai_services.config import settings
from ai_services.services.local_llm_client import LocalLlamaClient


logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# System Prompt
# ---------------------------------------------------------------------

SYSTEM_PROMPT = """
You are an expert legal document translator.

Translate legal clauses into plain English.

Return ONLY valid JSON.

Format:

{
    "plain_english": "...",
    "key_terms": [
        "...",
        "..."
    ]
}

Do not return markdown.
Do not return explanations.
Do not return additional text.
"""

MAX_RETRIES = 2

# ---------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------

class TranslationError(Exception):
    """Raised when translation fails."""
    pass


class TranslationOutput(BaseModel):
    """
    Output returned by the translator.
    """

    plain_english: str
    key_terms: list[str] = []


# ---------------------------------------------------------------------
# Translator
# ---------------------------------------------------------------------

class ClauseTranslator:

    def __init__(self):
        self.provider = settings.TRANSLATOR_PROVIDER
        self.model_name = settings.TRANSLATOR_MODEL_NAME
        self.client = self._build_client()

    # -------------------------------------------------------------

    def _build_client(self):

        if self.provider == "local_llama":
            return LocalLlamaClient(
                endpoint=settings.LOCAL_LLM_ENDPOINT,
                model=self.model_name,
            )

        raise ValueError(
            f"Unsupported translator provider: {self.provider}"
        )

    # -------------------------------------------------------------

    def _call_llm(
        self,
        clause_text: str,
    ) -> str:

        return self.client.complete(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=clause_text,
            temperature=0.2,
            max_tokens=500,
            json_mode=True,
        )

    # -------------------------------------------------------------

    def translate(
        self,
        clause_text: str,
        target_language: str = "en",
    ) -> TranslationOutput:

        if not clause_text.strip():
            raise ValueError(
                "Clause text cannot be empty."
            )
        if self._should_skip_translation(clause_text):
            return TranslationOutput(
                plain_english="",
                key_terms=[],
            )

        last_error = None

        for attempt in range(MAX_RETRIES):

            try:

                raw = self._call_llm(clause_text)

                cleaned = (
                    raw.strip()
                    .removeprefix("```json")
                    .removeprefix("```")
                    .removesuffix("```")
                    .strip()
                )

                parsed = json.loads(cleaned)

                return TranslationOutput.model_validate(parsed)

            except (
                json.JSONDecodeError,
                ValidationError,
            ) as exc:

                last_error = exc

                logger.warning(
                    "Translation parse failed (attempt %d): %s",
                    attempt + 1,
                    exc,
                )

            except Exception as exc:

                last_error = exc

                logger.exception(
                    "Translation failed (attempt %d)",
                    attempt + 1,
                )

        raise TranslationError(
            f"Unable to translate clause after "
            f"{MAX_RETRIES} attempts."
        ) from last_error
    # -------------------------------------------------------------
    # Skip non-contract content
    # -------------------------------------------------------------

    def _should_skip_translation(self, text: str) -> bool:

        text = text.strip()

        if not text:
            return True

        # Page numbers
        if re.fullmatch(r"Page\s+\d+", text, re.IGNORECASE):
            return True

        # Mostly underscores (signature lines)
        if re.fullmatch(r"[_\-\s]{8,}", text):
            return True

        # Windows file paths
        if "\\" in text and (
            ".doc" in text.lower()
            or ".docx" in text.lower()
            or ".pdf" in text.lower()
        ):
            return True

        # Email
        if re.search(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            text,
        ):
            return True

        # Phone/Fax labels
        if re.search(
            r"\b(phone|telephone|fax)\b",
            text,
            re.IGNORECASE,
        ):
            return True

        # Address indicators
        if re.search(
            r"\b(address|avenue|street|road|lane|drive|blvd|zip)\b",
            text,
            re.IGNORECASE,
        ):
            return True

        # Signature section
        if re.search(
            r"\b(signature|signed|printed|by:)\b",
            text,
            re.IGNORECASE,
        ):
            return True

        return False


# ---------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_translator() -> ClauseTranslator:
    """
    Returns a singleton translator.
    """
    return ClauseTranslator()


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    translator = get_translator()

    clause = """
    The supplier shall indemnify and hold harmless
    the customer against all liabilities,
    claims and damages.
    """

    try:

        result = translator.translate(clause)

        print("\nPlain English\n")
        print(result.plain_english)

        print("\nKey Terms")

        for term in result.key_terms:
            print("-", term)

    except TranslationError as error:
        print(error)