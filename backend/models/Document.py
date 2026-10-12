from sqlalchemy import Column, Integer, ForeignKey, String, Float, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.db import base

class Document(base):
    __tablename__ = "document"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    risk_score = Column(Float, nullable=False)
    cloudinary_url = Column(String, nullable=False)
    cloudinary_public_id = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clauses = relationship("Clause", back_populates="document", cascade="all, delete")
    simulations = relationship("Simulation", back_populates="document", cascade="all, delete")
    chat_history = relationship("Chatbot", back_populates="document", cascade="all, delete-orphan"
    )