import requests

from config.settings import settings


class OllamaService:

    def __init__(self):

        self.url = settings.OLLAMA_URL

        self.model = settings.MODEL_NAME

        self.temperature = settings.TEMPERATURE

    def generate(self, prompt: str) -> str:

        payload = {

            "model": self.model,

            "messages": [

                {

                    "role": "user",

                    "content": prompt

                }

            ],

            "stream": False,

            "options": {

                "temperature": self.temperature

            }

        }

        try:

            response = requests.post(

                self.url,

                json=payload,

                timeout=120

            )

            response.raise_for_status()

            data = response.json()

            return data["message"]["content"].strip()

        except requests.exceptions.ConnectionError:

            raise Exception(

                "Cannot connect to Ollama. Make sure Ollama is running."

            )

        except requests.exceptions.Timeout:

            raise Exception(

                "Ollama took too long to respond."

            )

        except Exception as e:

            raise Exception(

                f"Ollama Error: {str(e)}"

            )