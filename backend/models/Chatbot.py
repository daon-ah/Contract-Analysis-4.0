from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from datetime import datetime
from config.db import base

class Chatbot(base):
    __tablename__ = "chatbot"

    id = Column(Integer, primary_key=True, nullable=False)
    doc_id = Column(Integer, ForeignKey("document.id"), nullable=False)
    user_question = Column(String, nullable=False)
    response = Column(String, nullable=False)
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    document = relationship(
        "Document",
        back_populates="chat_history"
    )