"""
local_llm_client.py

HTTP client for communicating with a locally hosted LLM
(e.g. Ollama or another OpenAI-compatible API).
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class LocalLLMError(Exception):
    """Raised when the local LLM request fails."""


class LocalLlamaClient:
    """
    Client for a local LLM endpoint.

    Compatible with Ollama's `/api/generate` endpoint and
    easily adaptable to other local LLM servers.
    """

    def __init__(
        self,
        endpoint: str,
        model: str = "llama3",
        timeout: int = 120,
    ) -> None:

        self.endpoint = endpoint.rstrip("/")
        self.model = model
        self.timeout = timeout

    # -----------------------------------------------------------------

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500,
        json_mode: bool = False,
    ) -> str:
        """
        Generate a completion from the local LLM.
        """

        prompt = f"{system_prompt}\n\n{user_prompt}"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }

        if json_mode:
            payload["format"] = "json"

        logger.info("Sending request to local LLM...")

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    self.endpoint,
                    json=payload,
                )

                response.raise_for_status()

        except httpx.TimeoutException as exc:
            raise LocalLLMError(
                "Local LLM request timed out."
            ) from exc

        except httpx.HTTPError as exc:
            raise LocalLLMError(
                f"HTTP error while contacting local LLM: {exc}"
            ) from exc

        except Exception as exc:
            raise LocalLLMError(
                f"Unexpected error: {exc}"
            ) from exc

    # -----------------------------------------------------------------

    def _extract_text(
        self,
        response: httpx.Response,
    ) -> str:
        """
        Extract generated text from common local LLM responses.
        """

        try:

            data = response.json()

        except json.JSONDecodeError:

            return response.text.strip()

        # -------------------------------------------------------------
        # Ollama response
        # -------------------------------------------------------------

        if isinstance(data, dict):

            if "response" in data:
                return data["response"].strip()

            # ---------------------------------------------------------
            # OpenAI-compatible APIs
            # ---------------------------------------------------------

            choices = data.get("choices")

            if isinstance(choices, list) and choices:

                choice = choices[0]

                if "message" in choice:

                    return (
                        choice["message"]
                        .get("content", "")
                        .strip()
                    )

                if "text" in choice:

                    return choice["text"].strip()

            # ---------------------------------------------------------
            # Generic APIs
            # ---------------------------------------------------------

            for key in (
                "content",
                "text",
                "message",
                "result",
                "output",
            ):

                if key in data:

                    value = data[key]

                    if isinstance(value, str):

                        return value.strip()

        return response.text.strip()


# ---------------------------------------------------------------------
# Example
# ---------------------------------------------------------------------

if __name__ == "__main__":

    client = LocalLlamaClient(
        endpoint="http://localhost:11434/api/generate",
        model="llama3",
    )

    try:

        result = client.complete(

            system_prompt="You are a helpful assistant.",

            user_prompt="Explain Artificial Intelligence in one sentence.",

            temperature=0.2,

            max_tokens=100,

        )

        print("\nResponse\n")
        print(result)

    except LocalLLMError as error:

        print(error)