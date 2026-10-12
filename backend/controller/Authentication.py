from fastapi import APIRouter, HTTPException
from fastapi.params import Depends
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR, HTTP_202_ACCEPTED, HTTP_400_BAD_REQUEST
from config.db import connect_db
from schemas.ResponseModel import ResponseModel
from schemas.Schemas import SignUp, Login, SendOTP, OTPChangePassword
from sqlalchemy.orm import Session
from service import Authentication
from fastapi import Response

router = APIRouter()
auth_service = Authentication

@router.post("/signup", response_model=ResponseModel, tags=["auth"])
def signup(user_data: SignUp, db: Session = Depends(connect_db)):
    try:
        res_msg = auth_service.signup(user_data, db)
        return ResponseModel(status="success", message=res_msg, data=res_msg)
    except ValueError as e:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=ResponseModel, tags=["auth"])
def login(user_data: Login, response: Response, db: Session = Depends(connect_db)):
    try:
        msg = auth_service.login(user_data.email.lower(), user_data.password, db, response)
        return ResponseModel(status="success", message=msg, data=None)
    except ValueError as e:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/send-otp", response_model=ResponseModel, tags=["auth"])
def send_otp(user_data: SendOTP, response: Response, db: Session = Depends(connect_db)):
    try:
        return ResponseModel(status="success", message=auth_service.sendOTP(user_data.email.lower(), db), data=None)
    except ValueError as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/update-password", response_model=ResponseModel, tags=["auth"])
def change_password_otp(user_data: OTPChangePassword, response=Response, db: Session = Depends(connect_db)):
    try:
        return ResponseModel(status="success", message=auth_service.change_password_otp(user_data.email.lower(), user_data.otp, user_data.password, db), data=None)
    except ValueError as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
