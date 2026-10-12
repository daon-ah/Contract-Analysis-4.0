import os
from sqlalchemy import create_engine, false
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path)

DB_URL = os.getenv("DB_URL")

engine = create_engine(DB_URL)

engine = create_engine(DB_URL)
sessionLocal = sessionmaker(autocommit = False, autoflush = True, bind = engine)
base = declarative_base()

def connect_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()