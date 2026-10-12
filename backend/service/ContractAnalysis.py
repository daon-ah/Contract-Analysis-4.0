from ai_services.services import (
    extract_text,
    segment_document,
    get_classifier,
    explain_clause,
    get_translator,
    get_simulator,
)
from dataclasses import asdict
from models.Document import Document
from models.Clause import Clause
from models.Simulation import Simulation
from datetime import date

class ContractService:
    def __init__(self, db):
        self.db = db
        self.classifier = get_classifier()
        self.translator = get_translator()
        self.simulator = get_simulator()

    def analysis(self, file_bytes: bytes, document: Document, id: int):
        ocr_result = extract_text(
            file_bytes=file_bytes,
            filename=document.filename,
        )

        document.raw_text = ocr_result.full_text
        risk_score = 0

        print("FULL TEXT:")
        print(ocr_result.full_text[:1000])

        segments = segment_document(ocr_result.full_text)

        results = []

        for segment in segments[:3]:
            print("HEADER:", segment.header)
            print("TEXT:", segment.text[:300])

        for segment in segments:

            # Classification
            prediction = self.classifier.classify(segment.text)

            # SHAP Explanation
            try:
                explanation = explain_clause(
                    segment.text,
                    prediction.risk_level,
                )
            except Exception:
                explanation = None

            if prediction.risk_level.value == "HIGH":
                risk_score += 10

            elif prediction.risk_level.value == "MEDIUM":
                risk_score += 5

            # Translation
            translation = None

            try:
                translation = self.translator.translate(segment.text)
            except Exception as e:
                print(f"Translation failed for clause {segment.index}")
                print(e)


            print(translation)

            if translation:
                print(translation.model_dump())

            clause = Clause(
                doc_id=document.id,
                clause_type=segment.header,
                raw_text=segment.text,
                translated_text=(
                    translation.plain_english
                    if translation
                    else segment.text
                ),
                risk_level=prediction.risk_level.value,
                shap_values=(
                    asdict(explanation)
                    if explanation
                    else {}
                )
            )

            self.db.add(clause)
            self.db.flush()

            results.append({
                "clause_id": clause.id,
                "header": segment.header,
                "text": segment.text,
                "risk": {
                    "risk_level": prediction.risk_level.value,
                    "confidence": prediction.confidence,
                    "raw_scores": prediction.raw_scores,
                },
                "explanation": (
                    asdict(explanation)
                    if explanation
                    else None
                ),
                "translation": (
                    translation.model_dump()
                    if translation
                    else None
                ),
            })

        document.risk_score = risk_score

        self.db.commit()
        self.db.refresh(document)

        return {
            "ocr": {
                "pages": len(ocr_result.pages),
                "used_fallback": ocr_result.used_fallback,
            },
            "total_clauses": len(results),
            "clauses": results,
        }

    def simulate(self, document_id: int, clause_id: int, modified_clause: str):

        clause = self.db.query(Clause).filter(
            Clause.id == clause_id,
            Clause.doc_id == document_id
        ).first()

        if clause is None:
            raise ValueError("Clause not found")

        result = self.simulator.simulate(
            original_clause=clause.raw_text,
            modified_clause=modified_clause
        )

        simulation = Simulation(
            doc_id=document_id,
            projected_penalty=0.0,
            deadline=date.today(),
            recommendations=result.summary
        )

        self.db.add(simulation)
        self.db.commit()

        return {
            "original_clause": clause.raw_text,
            "modified_clause": modified_clause,
            "old_risk": result.original_prediction.risk_level.value,
            "new_risk": result.modified_prediction.risk_level.value,
            "summary": result.summary,
            "translation": (
                result.translation.plain_english
                if result.translation
                else None
            ),
            "explanation": (
                asdict(result.explanation)
                if result.explanation
                else None
            )
        }