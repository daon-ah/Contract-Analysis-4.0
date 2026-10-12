"""
train_classifier.py

Fine-tunes a pretrained Legal-BERT model on the processed legal clause
dataset to classify contract clauses into Low, Medium, or High risk.
"""

import os
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)

# ==========================================================
# Configuration
# ==========================================================

MODEL_NAME = "nlpaueb/legal-bert-base-uncased"
TRAIN_PATH = os.path.join(
    "ai_services", "datasets", "processed", "train.csv"
)

VALID_PATH = os.path.join(
    "ai_services", "datasets", "processed", "validation.csv"
)

OUTPUT_DIR = os.path.join(
    "ai_services", "models", "legal_bert"
)

CHECKPOINT_DIR = os.path.join(
    OUTPUT_DIR, "checkpoints"
)

NUM_LABELS = 3
MAX_LENGTH = 256

BATCH_SIZE = 16
LEARNING_RATE = 2e-5
NUM_EPOCHS = 5
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.1

RANDOM_STATE = 42

EARLY_STOPPING_PATIENCE = 2

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

LABEL_MAP = {
    "high": 0,
    "low": 1,
    "medium": 2,
}

ID_TO_LABEL = {v: k for k, v in LABEL_MAP.items()}


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

    torch.manual_seed(RANDOM_STATE)

    print("=" * 60)
    print("Loading Processed Datasets")
    print("=" * 60)

    train_df = pd.read_csv(TRAIN_PATH)
    valid_df = pd.read_csv(VALID_PATH)

    print(f"Training Samples   : {len(train_df)}")
    print(f"Validation Samples : {len(valid_df)}")

    # ------------------------------------------------------
# Convert risk labels to numeric IDs
# ------------------------------------------------------

    LABEL_MAP = {
    "high": 0,
    "low": 1,
    "medium": 2,
}

    train_texts = train_df["clause_text"].astype(str).tolist()
    train_labels = (
    train_df["risk_level"]
    .str.lower()
    .map(LABEL_MAP)
    .tolist()
)

    valid_texts = valid_df["clause_text"].astype(str).tolist()
    valid_labels = (
    valid_df["risk_level"]
    .str.lower()
    .map(LABEL_MAP)
    .tolist()
)

    # ------------------------------------------------------
    # Tokenizer
    # ------------------------------------------------------

    print("\nLoading Tokenizer:", MODEL_NAME)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    train_encodings = tokenizer(
        train_texts,
        truncation=True,
        padding="max_length",
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

    valid_encodings = tokenizer(
        valid_texts,
        truncation=True,
        padding=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

    # ------------------------------------------------------
    # Datasets
    # ------------------------------------------------------

    train_dataset = ClauseDataset(train_encodings, train_labels)
    valid_dataset = ClauseDataset(valid_encodings, valid_labels)

    # ------------------------------------------------------
    # Model
    # ------------------------------------------------------

    print("\nLoading Model:", MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
    )
    model.to(DEVICE)
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    print(model.config)

    # ------------------------------------------------------
    # Training Arguments
    # ------------------------------------------------------

    training_args = TrainingArguments(
        output_dir=CHECKPOINT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        warmup_ratio=WARMUP_RATIO,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        logging_dir=os.path.join(CHECKPOINT_DIR, "logs"),
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        seed=RANDOM_STATE,
        report_to="none",
    )

    # ------------------------------------------------------
    # Trainer
    # ------------------------------------------------------

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=valid_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=EARLY_STOPPING_PATIENCE)],
    )

    # ------------------------------------------------------
    # Train
    # ------------------------------------------------------

    print("\n" + "=" * 60)
    print("Starting Training")
    print("=" * 60)

    trainer.train()
    
    # ------------------------------------------------------
# Evaluate
# ------------------------------------------------------

    print("\n" + "=" * 60)
    print("Final Validation Metrics")
    print("=" * 60)
    metrics = trainer.evaluate()

    for key, value in metrics.items():
        print(f"{key:<20}: {value}")
    
# ------------------------------------------------------
# Save Training Metrics
# ------------------------------------------------------
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    metrics_df = pd.DataFrame([metrics])

    metrics_df.to_csv(
    os.path.join(OUTPUT_DIR, "training_metrics.csv"),
    index=False
)  
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print("\nTraining metrics saved to:",
      os.path.join(OUTPUT_DIR, "training_metrics.csv"))

    print("\nModel and tokenizer saved to:", OUTPUT_DIR)

# ------------------------------------------------------
# Save Final Model + Tokenizer
# ------------------------------------------------------
if __name__ == "__main__":
    main()