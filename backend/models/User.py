from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from config.db import base

class User(base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String, nullable = False)
    email = Column(String, nullable = False, unique = True, index = True)
    phone = Column(String)
    law_firm = Column(String)
    role = Column(String)
    password = Column(String, nullable = False)

    created_at = Column(DateTime(timezone = True), server_default = func.now())
    updated_at = Column(DateTime(timezone = True), onupdate = func.now())