from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from config.db import base

class Clause(base):
    __tablename__ = "clause"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doc_id = Column(Integer, ForeignKey("document.id"), nullable=False)
    clause_type = Column(String, nullable=False)
    raw_text = Column(String, nullable=False)
    translated_text = Column(String, nullable=False)
    risk_level = Column(String(20), nullable=False)
    shap_values = Column(JSONB, nullable=False)

    document = relationship("Document", back_populates="clauses")