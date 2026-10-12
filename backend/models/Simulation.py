from sqlalchemy import Column, Integer, ForeignKey, Date, Float, Text
from sqlalchemy.orm import relationship
from config.db import base

class Simulation(base):
    __tablename__ = "simulation"

    id = Column(Integer, primary_key=True, nullable=False)
    doc_id = Column(Integer, ForeignKey("document.id"), nullable=False)
    projected_penalty = Column(Integer, nullable=False)
    deadline = Column(Date, nullable=False)
    recommendations = Column(Text, nullable=False)

    document = relationship("Document", back_populates="simulations")