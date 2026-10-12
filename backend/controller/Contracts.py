from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Request,
    Depends
)
from fastapi.encoders import jsonable_encoder
from models.Document import Document
from models.Clause import Clause
from models.Simulation import Simulation
from config.db import connect_db
from service.CloudinaryService import CloudinaryService
from service.ContractAnalysis import ContractService
from core.scanner import validate_file
from schemas.ResponseModel import ResponseModel
from schemas.Schemas import Analyze, Simulate
from utils import ID
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/upload", response_model=ResponseModel)
async def upload_file(request: Request, uploaded_file: UploadFile = File(...), db: Session = Depends(connect_db)):
    try:
        await validate_file(uploaded_file)

        await uploaded_file.seek(0)

        upload = CloudinaryService.upload_contract(uploaded_file.file, uploaded_file.filename)
        user_id = ID.get(request)

        filename = upload["url"].split("/")[-1]

        document = Document(
            user_id=user_id,
            filename=filename,
            raw_text="",  # Not analyzed yet
            risk_score=0.0,  # Default
            cloudinary_url=upload["url"],
            cloudinary_public_id=upload["public_id"]
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return ResponseModel(
            status="success",
            message="File uploaded successfully",
            data={
                "id":document.id,
                "public_id": upload["public_id"],
                "url": upload["url"]
            }
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/analyze", response_model=ResponseModel)
async def analyze(data: Analyze, request: Request, db: Session = Depends(connect_db)):
    try:
        id = ID.get(request)

        document = db.query(Document).filter(
            Document.id == data.document_id,
            Document.user_id == id
        ).first()

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        file_bytes = CloudinaryService.download_contract(
            document.cloudinary_url
        )

        result = ContractService(db).analysis(
            file_bytes=file_bytes,
            document=document,
            id=id
        )

        return ResponseModel(
            status="success",
            message="Analysis completed successfully",
            data=jsonable_encoder(result)
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/simulate", response_model=ResponseModel)
def simulation(request: Request, data: Simulate, db: Session = Depends(connect_db)):
    try:
        id = ID.get(request)

        simulation_result=ContractService(db).simulate(data.document_id, data.clause_id, data.modified_clause)

        return ResponseModel(status="success", message="Simulation completed successfully", data=simulation_result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/analyses", response_model=ResponseModel)
async def get_analyses(
    request: Request,
    db: Session = Depends(connect_db)
):
    user_id = ID.get(request)

    documents = (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )

    analyses = [
        {
            "id": doc.id,
            "filename": doc.filename,
            "riskScore": doc.risk_score,
            "uploadedAt": doc.created_at,
            "cloudinaryUrl": doc.cloudinary_url,
            "cloudinaryPublicId": doc.cloudinary_public_id,
            "totalClauses": len(doc.clauses)
        }
        for doc in documents
    ]

    return ResponseModel(
        status="success",
        message="Analyses fetched successfully",
        data=analyses
    )


@router.get("/analyses/{analysis_id}", response_model=ResponseModel)
async def get_analysis_details(
    analysis_id: int,
    request: Request,
    db: Session = Depends(connect_db)
):
    user_id = ID.get(request)

    document = (
        db.query(Document)
        .filter(
            Document.id == analysis_id,
            Document.user_id == user_id
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    clauses = (
        db.query(Clause)
        .filter(Clause.doc_id == analysis_id)
        .all()
    )

    simulations = (
        db.query(Simulation)
        .filter(Simulation.doc_id == analysis_id)
        .all()
    )

    return ResponseModel(
        status="success",
        message="Analysis details fetched successfully",
        data={
            "document": {
                "id": document.id,
                "filename": document.filename,
                "rawText": document.raw_text,
                "riskScore": document.risk_score,
                "uploadedAt": document.created_at,
                "cloudinaryUrl": document.cloudinary_url,
                "cloudinaryPublicId": document.cloudinary_public_id
            },
            "clauses": [
                {
                    "id": clause.id,
                    "clauseType": clause.clause_type,
                    "rawText": clause.raw_text,
                    "translatedText": clause.translated_text,
                    "riskLevel": clause.risk_level,
                    "shapValues": clause.shap_values
                }
                for clause in clauses
            ],
            "simulations": [
                {
                    "id": simulation.id,
                    "projectedPenalty": simulation.projected_penalty,
                    "deadline": simulation.deadline,
                    "recommendations": simulation.recommendations
                }
                for simulation in simulations
            ]
        }
    )