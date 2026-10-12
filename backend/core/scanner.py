from pathlib import Path
import io

import pyclamd
from fastapi import UploadFile
from pypdf import PdfReader
from docx import Document

ALLOWED_EXTENSIONS = [".pdf", ".docx"]

clamd = pyclamd.ClamdNetworkSocket(
    host="localhost",
    port=3310
)


def validate_pdf(file_bytes: bytes):
    try:
        PdfReader(io.BytesIO(file_bytes))
    except Exception:
        raise ValueError("Invalid PDF")


def validate_docx(file_bytes: bytes):
    try:
        Document(io.BytesIO(file_bytes))
    except Exception:
        raise ValueError("Invalid DOCX")


async def validate_file(file: UploadFile):

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type")

    file_bytes = await file.read()

    if extension == ".pdf":
        validate_pdf(file_bytes)

    elif extension == ".docx":
        validate_docx(file_bytes)

    # ClamAV scan can be added here

    return file_bytes

cd = pyclamd.ClamdNetworkSocket(
    host="localhost",
    port=3310
)