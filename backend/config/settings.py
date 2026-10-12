from dotenv import load_dotenv
import os

load_dotenv()


class Settings:

    OLLAMA_URL = os.getenv(
        "OLLAMA_URL",
        "http://localhost:11434/api/chat"
    )

    MODEL_NAME = os.getenv(
        "MODEL_NAME",
        "gemma3:4b"
    )

    TEMPERATURE = float(
        os.getenv(
            "TEMPERATURE",
            0.2
        )
    )


settings = Settings()