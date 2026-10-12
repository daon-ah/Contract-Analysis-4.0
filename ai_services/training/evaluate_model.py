"""
evaluate_model.py

Evaluates the fine-tuned Legal-BERT model on the held-out test dataset.
"""

import os
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
)

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
)

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR.parent / "models" / "legal_bert"
TEST_PATH = BASE_DIR / "processed" / "test.csv"

MAX_LENGTH = 256
BATCH_SIZE = 16

LABEL_NAMES = ["high", "low", "medium"]

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ==========================================================
# Dataset
# ==========================================================

class ClauseDataset(Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item


# ==========================================================
# Metrics
# ==========================================================

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    accuracy = accuracy_score(labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average="weighted", zero_division=0
    )

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


# ==========================================================
# Main
# ==========================================================

def main():

    print("=" * 60)
    print("Loading Test Dataset")
    print("=" * 60)

    test_df = pd.read_csv(TEST_PATH)
    print(f"Test Samples : {len(test_df)}")

    test_texts = test_df["clause"].astype(str).tolist()
    test_labels = test_df["label"].tolist()

    # ------------------------------------------------------
    # Load Tokenizer + Model
    # ------------------------------------------------------

    print("\nLoading Model From:", MODEL_DIR)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.to(DEVICE)

    test_encodings = tokenizer(
        test_texts,
        truncation=True,
        padding=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

    test_dataset = ClauseDataset(test_encodings, test_labels)

    # ------------------------------------------------------
    # Trainer (evaluation only)
    # ------------------------------------------------------

    eval_args = TrainingArguments(
        output_dir="eval_tmp",
        per_device_eval_batch_size=BATCH_SIZE,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=eval_args,
        compute_metrics=compute_metrics,
    )

    # ------------------------------------------------------
    # Predict
    # ------------------------------------------------------

    print("\n" + "=" * 60)
    print("Running Evaluation")
    print("=" * 60)

    predictions = trainer.predict(test_dataset)

    logits = predictions.predictions
    y_true = predictions.label_ids
    y_pred = np.argmax(logits, axis=-1)

    # ------------------------------------------------------
    # Metrics
    # ------------------------------------------------------

    metrics = predictions.metrics
    print("\nOverall Metrics")
    for key, value in metrics.items():
        print(f"{key:<25}: {value}")

    print("\nClassification Report")
    print(
        classification_report(
            y_true,
            y_pred,
            target_names=LABEL_NAMES,
            zero_division=0,
        )
    )

    print("Confusion Matrix")
    print(pd.DataFrame(
        confusion_matrix(y_true, y_pred),
        index=[f"true_{l}" for l in LABEL_NAMES],
        columns=[f"pred_{l}" for l in LABEL_NAMES],
    ))
    

    # ------------------------------------------------------
    # Save Predictions
    # ------------------------------------------------------

    results_df = test_df.copy()
    results_df["predicted_label"] = y_pred
    results_df["predicted_risk"] = [LABEL_NAMES[i] for i in y_pred]

    os.makedirs("processed", exist_ok=True)
    results_path = os.path.join("processed", "test_predictions.csv")
    results_df.to_csv(results_path, index=False)

    print("\nPredictions saved to:", results_path)
    
    report = classification_report(
    y_true,
    y_pred,
    target_names=LABEL_NAMES,
    zero_division=0,
)

    print(report)

    with open(os.path.join(MODEL_DIR, "evaluation_report.txt"), "w") as f:
        f.write(report)


if __name__ == "__main__":
    main()