"""
evaluate_model.py

Evaluates the trained LegalBERT classifier on the test dataset.
"""

from pathlib import Path
import json

import matplotlib.pyplot as plt
import pandas as pd
import torch

from torch.utils.data import Dataset, DataLoader

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
)

from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay,
)

# ==========================================================
# Configuration
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR.parent / "models" / "legal_bert"
TEST_FILE = BASE_DIR / "processed" / "test.csv"
OUTPUT_DIR = BASE_DIR / "processed"

MAX_LENGTH = 256
BATCH_SIZE = 16

LABEL_MAP = {
    "high": 0,
    "low": 1,
    "medium": 2,
}

ID_TO_LABEL = {v: k for k, v in LABEL_MAP.items()}

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

# ==========================================================
# Dataset
# ==========================================================

class ClauseDataset(Dataset):

    def __init__(self, dataframe, tokenizer):

        self.texts = dataframe["clause_text"].astype(str).tolist()

        self.labels = (
            dataframe["risk_level"]
            .str.lower()
            .map(LABEL_MAP)
            .tolist()
        )

        self.tokenizer = tokenizer

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):

        encoding = self.tokenizer(
            self.texts[idx],
            padding="max_length",
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors="pt",
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ==========================================================
# Prediction
# ==========================================================

def predict(model, dataloader):

    model.eval()

    actuals = []
    predictions = []

    with torch.no_grad():

        for batch in dataloader:

            input_ids = batch["input_ids"].to(DEVICE)
            attention_mask = batch["attention_mask"].to(DEVICE)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
            )

            preds = torch.argmax(outputs.logits, dim=1)

            predictions.extend(preds.cpu().numpy())
            actuals.extend(batch["labels"].numpy())

    return actuals, predictions


# ==========================================================
# Main
# ==========================================================

def main():

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("Loading model...")
    print("=" * 60)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)

    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_DIR
    ).to(DEVICE)

    test_df = pd.read_csv(TEST_FILE)

    required = ["clause_text", "risk_level"]

    missing = [c for c in required if c not in test_df.columns]

    if missing:
        raise ValueError(f"Missing columns in test.csv: {missing}")

    dataset = ClauseDataset(test_df, tokenizer)

    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
    )

    actuals, predictions = predict(model, loader)

    accuracy = accuracy_score(actuals, predictions)

    precision, recall, f1, _ = precision_recall_fscore_support(
        actuals,
        predictions,
        average="weighted",
        zero_division=0,
    )

    report = classification_report(
        actuals,
        predictions,
        target_names=["high", "low", "medium"],
        output_dict=True,
        zero_division=0,
    )

    pd.DataFrame(report).transpose().to_csv(
        OUTPUT_DIR / "classification_report.csv"
    )

    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
    }

    with open(
        OUTPUT_DIR / "evaluation_metrics.json",
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(metrics, f, indent=4)

    cm = confusion_matrix(actuals, predictions)

    disp = ConfusionMatrixDisplay(
        confusion_matrix=cm,
        display_labels=["high", "low", "medium"],
    )

    fig, ax = plt.subplots(figsize=(6, 6))

    disp.plot(ax=ax)

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "confusion_matrix.png",
        dpi=300,
    )

    plt.close(fig)

    predictions_df = test_df.copy()

    predictions_df["actual"] = [
        ID_TO_LABEL[i] for i in actuals
    ]

    predictions_df["predicted"] = [
        ID_TO_LABEL[i] for i in predictions
    ]

    predictions_df.to_csv(
        OUTPUT_DIR / "predictions.csv",
        index=False,
    )

    print("=" * 60)
    print("Evaluation Complete")
    print("=" * 60)

    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")

    print("\nFiles Generated:")

    print("classification_report.csv")
    print("evaluation_metrics.json")
    print("confusion_matrix.png")
    print("predictions.csv")


if __name__ == "__main__":
    main()