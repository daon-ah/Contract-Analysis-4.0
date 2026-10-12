"""
prepare_dataset.py

Prepares the legal clause dataset for Legal-BERT training.

Functions:
1. Load dataset
2. Select required columns
3. Remove duplicates
4. Remove missing values
5. Normalize clause text
6. Encode labels
7. Stratified train/validation/test split
8. Save processed datasets
"""

import os
import re
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ==========================================================
# Configuration
# ==========================================================

INPUT_DATASET = r"C:\VS Code\contract-risk-blaze4.0\ai_services\training\legal_contract_clauses.csv"
OUTPUT_DIR = r"C:\VS Code\contract-risk-blaze4.0\ai_services\training\processed"

TRAIN_SIZE = 0.80
VALID_SIZE = 0.10
TEST_SIZE = 0.10

RANDOM_STATE = 42

# ==========================================================
# Text Cleaning
# ==========================================================

def clean_text(text: str) -> str:
    text = str(text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s.,;:()\-]", "", text)
    return text.strip()

# ==========================================================
# Main
# ==========================================================

def main():

    print("=" * 60)
    print("Loading Dataset")
    print("=" * 60)

    df = pd.read_csv(INPUT_DATASET)

    print(f"Original Samples : {len(df)}")

    # ------------------------------------------------------
    # Keep only required columns
    # ------------------------------------------------------

    df = df[["clause_text", "risk_level"]]

    df.rename(
        columns={
            "clause_text": "clause",
            "risk_level": "risk",
        },
        inplace=True,
    )

    # ------------------------------------------------------
    # Remove duplicates
    # ------------------------------------------------------

    df.drop_duplicates(inplace=True)

    print(f"After Removing Duplicates : {len(df)}")

    # ------------------------------------------------------
    # Remove missing values
    # ------------------------------------------------------

    df.dropna(subset=["clause", "risk"], inplace=True)

    print(f"After Removing Missing Rows : {len(df)}")

    # ------------------------------------------------------
    # Clean text
    # ------------------------------------------------------

    df["clause"] = df["clause"].apply(clean_text)

    # ------------------------------------------------------
    # Encode Labels
    # ------------------------------------------------------

    encoder = LabelEncoder()

    df["label"] = encoder.fit_transform(df["risk"])

    print("\nLabel Mapping")

    for label, value in zip(
        encoder.classes_,
        encoder.transform(encoder.classes_),
    ):
        print(f"{label:<10} -> {value}")

    # ------------------------------------------------------
    # Train / Validation / Test Split
    # ------------------------------------------------------

    train_df, temp_df = train_test_split(
        df,
        test_size=(1 - TRAIN_SIZE),
        random_state=RANDOM_STATE,
        stratify=df["label"],
    )

    validation_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=temp_df["label"],
    )

    # ------------------------------------------------------
    # Save Processed Dataset
    # ------------------------------------------------------

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    train_df.to_csv(
        os.path.join(OUTPUT_DIR, "train.csv"),
        index=False,
    )

    validation_df.to_csv(
        os.path.join(OUTPUT_DIR, "validation.csv"),
        index=False,
    )

    test_df.to_csv(
        os.path.join(OUTPUT_DIR, "test.csv"),
        index=False,
    )

    # ------------------------------------------------------
    # Statistics
    # ------------------------------------------------------

    print("\n" + "=" * 60)
    print("Dataset Statistics")
    print("=" * 60)

    print(f"Training Samples   : {len(train_df)}")
    print(f"Validation Samples : {len(validation_df)}")
    print(f"Testing Samples    : {len(test_df)}")

    print("\nTraining Distribution")
    print(train_df["risk"].value_counts())

    print("\nValidation Distribution")
    print(validation_df["risk"].value_counts())

    print("\nTesting Distribution")
    print(test_df["risk"].value_counts())

    print("\nProcessed datasets saved successfully.")

    print("\nSaved Files:")
    print(f"{OUTPUT_DIR}/train.csv")
    print(f"{OUTPUT_DIR}/validation.csv")
    print(f"{OUTPUT_DIR}/test.csv")


if __name__ == "__main__":
    main()