from service.ollama_service import OllamaService
from service.prompt_builder import PromptBuilder
from models.Chatbot import Chatbot
from models.Document import Document
from models.Clause import Clause


class ChatService:

    def __init__(self, db):
        self.db = db
        self.ollama = OllamaService()

    def chat(
        self,
        contract_id: int,
        user_id: int,
        user_question: str
    ):

        # Verify the document belongs to the logged-in user
        document = (
            self.db.query(Document)
            .filter(
                Document.id == contract_id,
                Document.user_id == user_id
            )
            .first()
        )

        if document is None:
            raise ValueError("Document not found")

        # Load previous chat history from the database
        messages = (
            self.db.query(Chatbot)
            .filter(Chatbot.doc_id == contract_id)
            .order_by(Chatbot.id)
            .all()
        )

        history = []

        for msg in messages:
            history.append({
                "role": "user",
                "content": msg.user_question
            })

            history.append({
                "role": "assistant",
                "content": msg.response
            })

        # Load analyzed clauses
        clauses = (
            self.db.query(Clause)
            .filter(Clause.doc_id == contract_id)
            .all()
        )

        if not clauses:
            raise ValueError(
                "This contract has not been analyzed yet."
            )

        # Build prompt
        prompt = PromptBuilder.build_prompt(
            user_question=user_question,
            contract_data=clauses,
            conversation_history=history
        )

        # Generate answer using Ollama
        answer = self.ollama.generate(prompt)

        # Save chat to the database
        chat = Chatbot(
            doc_id=contract_id,
            user_question=user_question,
            response=answer
        )

        self.db.add(chat)
        self.db.commit()

        return answer