from pathlib import Path
import os

# Base directory of the ai_services package
BASE_DIR = Path(__file__).resolve().parent


class Settings:
    """
    Configuration settings for AI services.
    Values can be overridden using environment variables.
    """

    # ---------------------------------------------------------
    # Translator Settings
    # ---------------------------------------------------------

    TRANSLATOR_PROVIDER ="local_llama"
    TRANSLATOR_MODEL_NAME = os.getenv(
        "TRANSLATOR_MODEL_NAME",
        "llama3",    # local model name
    )


    LOCAL_LLM_ENDPOINT = os.getenv(
        "LOCAL_LLM_ENDPOINT",
        "http://localhost:11434/api/generate",
    )

    # ---------------------------------------------------------
    # Classifier Settings
    # ---------------------------------------------------------

    CLASSIFIER_MODEL_PATH = BASE_DIR / "models" / "legal_bert"


# Singleton settings object
settings = Settings()