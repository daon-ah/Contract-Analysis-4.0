from pydantic import BaseModel, EmailStr
from typing import Optional

class SignUp(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    law_firm: str
    role: str

class Login(BaseModel):
    email: EmailStr
    password: str

class Analyze(BaseModel):
    document_id: int

class SendOTP(BaseModel):
    email: EmailStr

class OTPChangePassword(BaseModel):
    email: EmailStr
    password: str
    otp: int

class UpdateProfile(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    law_firm: Optional[str] = None
    role: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    law_firm: str | None
    role: str | None

    class Config:
        from_attributes = True

class Simulate(BaseModel):
    document_id: int
    clause_id: int
    modified_clause: str


class ContractData(BaseModel):
    clause_type: str
    raw_text: str
    translated_text: str
    risk_level: str


class ChatRequest(BaseModel):
    contract_id: int
    user_question: str


class ChatResponse(BaseModel):
    answer: str