from sqlalchemy import Column, Integer, String

from config.db import base

class OTP(base):
    __tablename__ = "otp"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    otp = Column(Integer, nullable=False)