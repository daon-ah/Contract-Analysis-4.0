# Contract-Analysis-4.0

An intelligent end-to-end Contract Analysis & Intelligence platform featuring automated legal clause classification, risk assessment, OCR extraction, simulation, and negotiation counsel.

## Project Structure

```
Contract-Analysis-4.0/
├── ai_services/     # Machine learning & NLP models (Legal BERT, OCR, segmentation, simulation)
├── backend/         # FastAPI REST API (Auth, contract processing, chatbot, Cloudinary storage)
└── frontend/        # React + TypeScript + Vite web interface
```

## Features

- **Automated Contract Parsing & OCR**: Extract clauses and text from PDF / scanned documents.
- **Clause Classification & Risk Scoring**: Classify clauses and detect high-risk commitments using fine-tuned Legal-BERT models.
- **AI Legal Counsel & Negotiation**: Interactive chatbot and guidance for contract review and negotiation.
- **Explainability & Simulation**: Detailed clause breakdowns and hypothetical outcome simulations.

## Quick Start

### 1. AI Services
```bash
cd ai_services
pip install -r requirements.txt
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Configure DB_URL, JWT, Cloudinary, and SMTP credentials
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required configuration variables.
