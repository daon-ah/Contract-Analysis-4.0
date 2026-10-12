"""
predict.py

Predicts the risk level of new legal contract clauses using
the trained LegalBERT model.
"""

from pathlib import Path
import pandas as pd
import torch
import torch.nn.functional as F

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
)

# ==========================================================
# Configuration
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR.parent / "models" / "legal_bert"
OUTPUT_DIR = BASE_DIR.parent / "datasets" / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MAX_LENGTH = 256

LABEL_MAP = {
    0: "high",
    1: "low",
    2: "medium",
}

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

# ==========================================================
# Load Model
# ==========================================================

print("Loading LegalBERT model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_DIR
)

model.to(DEVICE)
model.eval()

# ==========================================================
# Prediction Function
# ==========================================================

def predict_clause(clause_text: str):

    encoding = tokenizer(
        clause_text,
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

    input_ids = encoding["input_ids"].to(DEVICE)
    attention_mask = encoding["attention_mask"].to(DEVICE)

    with torch.no_grad():

        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )

        probabilities = F.softmax(
            outputs.logits,
            dim=1,
        )

        confidence, prediction = torch.max(
            probabilities,
            dim=1,
        )

    risk = LABEL_MAP[prediction.item()]

    return {
        "risk_level": risk,
        "confidence": float(confidence.item()),
    }

# ==========================================================
# Main
# ==========================================================

def main():

    print("=" * 60)
    print("Legal Contract Risk Predictor")
    print("=" * 60)

    while True:

        clause = input(
            "\nEnter a contract clause (or type 'exit'): "
        )

        if clause.lower() == "exit":
            break

        result = predict_clause(clause)
        

        prediction_df = pd.DataFrame([{
        "clause_text": clause,
        "predicted_risk": result["risk_level"],
        "confidence": round(result["confidence"], 4)
}])

        prediction_df.to_csv(
        OUTPUT_DIR / "prediction.csv",
        index=False
)

        print("\nPrediction")
        print("-" * 40)
        print(f"Risk Level : {result['risk_level'].upper()}")
        print(f"Confidence : {result['confidence']:.2%}")

if __name__ == "__main__":
    main()