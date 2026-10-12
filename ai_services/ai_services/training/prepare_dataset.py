"""
build_dataset.py

Modular multi-source legal clause dataset builder.

Sources supported out of the box:
  - full_dataset_labeled.csv   (clause / category / risk / label columns, auto-detected)
  - CUAD (CUADv1_qas.csv long/QA format, or master_clauses.csv wide format)

Extend by adding a new loader function and registering it in SOURCE_LOADERS.
"""

import os
import re
import json
import pandas as pd

from sklearn.model_selection import train_test_split

# ==========================================================
# Configuration
# ==========================================================

FULL_DATASET_PATH = "C:\\VS Code\\contract-risk-blaze4.0\\ai_services\\datasets\\raw\\full_dataset_labeled.csv"
CUAD_PATH = "C:\\VS Code\\contract-risk-blaze4.0\\ai_services\\datasets\\raw\\CUADv1_qas.csv"

OUTPUT_DIR = "C:\\VS Code\\contract-risk-blaze4.0\\ai_services\\datasets\\processed"

TRAIN_SIZE = 0.80
VALID_SIZE = 0.10
TEST_SIZE = 0.10
RANDOM_STATE = 42

COMMON_COLUMNS = ["clause_text", "category", "risk_level", "source"]

# int-label -> risk fallback if only a numeric label column exists
# (alphabetical LabelEncoder order: high=0, low=1, medium=2)
NUMERIC_LABEL_MAP = {0: "high", 1: "low", 2: "medium"}

# Configurable initial risk assignment for CUAD clause categories.
# Anything not listed defaults to CUAD_DEFAULT_RISK.
CUAD_DEFAULT_RISK = "medium"
CUAD_CATEGORY_RISK_MAP = {
    "Uncapped Liability": "high",
    "Cap On Liability": "low",
    "Liquidated Damages": "high",
    "Non-Compete": "high",
    "Exclusivity": "high",
    "Most Favored Nation": "high",
    "Change Of Control": "high",
    "Ip Ownership Assignment": "high",
    "Joint Ip Ownership": "medium",
    "Anti-Assignment": "medium",
    "Termination For Convenience": "high",
    "Covenant Not To Sue": "medium",
    "Audit Rights": "medium",
    "Source Code Escrow": "medium",
    "Volume Restriction": "medium",
    "Price Restrictions": "medium",
    "Minimum Commitment": "medium",
    "Revenue/Profit Sharing": "medium",
    "Rofr/Rofo/Rofn": "medium",
    "Non-Disparagement": "low",
    "No-Solicit Of Employees": "medium",
    "No-Solicit Of Customers": "medium",
    "Competitive Restriction Exception": "low",
    "Unlimited/All-You-Can-Eat-License": "medium",
    "Irrevocable Or Perpetual License": "medium",
    "Non-Transferable License": "low",
    "Affiliate License-Licensor": "low",
    "Affiliate License-Licensee": "low",
    "Post-Termination Services": "low",
    "Warranty Duration": "low",
    "Insurance": "low",
    "Third Party Beneficiary": "low",
    "Governing Law": "low",
    "Document Name": "low",
    "Parties": "low",
    "Agreement Date": "low",
    "Effective Date": "low",
    "Expiration Date": "low",
    "Renewal Term": "low",
    "Notice Period To Terminate Renewal": "medium",
    "License Grant": "low",
}


# ==========================================================
# Shared Helpers
# ==========================================================

def clean_text(text: str) -> str:
    text = str(text)
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s.,;:()\-]", "", text)
    return text.strip()


def normalize_risk(value) -> str:
    value = str(value).strip().lower()
    mapping = {
        "low": "low", "l": "low",
        "medium": "medium", "med": "medium", "m": "medium",
        "high": "high", "h": "high",
    }
    return mapping.get(value, value)


def finalize(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    df = df.copy()
    df["source"] = source_name
    for col in ["clause_text", "category", "risk_level"]:
        if col not in df.columns:
            df[col] = None
    df = df[COMMON_COLUMNS]
    df["clause_text"] = df["clause_text"].apply(clean_text)
    df["category"] = df["category"].fillna("unknown").astype(str).str.strip().str.lower()
    df["risk_level"] = df["risk_level"].apply(normalize_risk)
    df.dropna(subset=["clause_text"], inplace=True)
    df = df[df["clause_text"].str.strip() != ""]
    df = df[df["risk_level"].isin(["low", "medium", "high"])]
    return df


def find_column(columns, candidates) -> str | None:
    lower_map = {c.lower(): c for c in columns}
    for cand in candidates:
        if cand in lower_map:
            return lower_map[cand]
    for cand in candidates:
        for col_lower, col_orig in lower_map.items():
            if cand in col_lower:
                return col_orig
    return None


# ==========================================================
# Loader: full_dataset_labeled.csv (auto-detected columns)
# ==========================================================

def load_full_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)

    text_col = find_column(df.columns, ["clause_text", "clause", "text"])
    category_col = find_column(df.columns, ["category", "clause_type", "type"])
    risk_col = find_column(df.columns, ["risk_level", "risk"])
    label_col = find_column(df.columns, ["label"])

    if text_col is None:
        raise ValueError(f"{path}: could not detect clause text column.")

    out = pd.DataFrame()
    out["clause_text"] = df[text_col]
    out["category"] = df[category_col] if category_col else "unknown"

    if risk_col:
        out["risk_level"] = df[risk_col]
    elif label_col:
        out["risk_level"] = df[label_col].map(NUMERIC_LABEL_MAP)
    else:
        raise ValueError(f"{path}: could not detect risk/label column.")

    return finalize(out, "full_dataset_labeled")


# ==========================================================
# Loader: CUAD (auto-detects wide master_clauses.csv vs long QA format)
# ==========================================================

def _cuad_assign_risk(category: str) -> str:
    return CUAD_CATEGORY_RISK_MAP.get(category, CUAD_DEFAULT_RISK)


def _load_cuad_long(df: pd.DataFrame) -> pd.DataFrame:
    """Handles CUADv1_qas.csv-style long/QA format."""
    df = df[df["is_impossible"] == False]  # noqa: E712
    df = df.dropna(subset=["answer_text"])
    df = df[df["answer_text"].astype(str).str.strip() != ""]

    out = pd.DataFrame()
    out["clause_text"] = df["answer_text"]
    out["category"] = df["category"]
    out["risk_level"] = df["category"].apply(_cuad_assign_risk)

    return finalize(out, "cuad")


def _load_cuad_wide(df: pd.DataFrame, id_col: str) -> pd.DataFrame:
    """Handles wide master_clauses.csv: one row per contract, one column per category."""
    value_cols = [c for c in df.columns if c != id_col]

    melted = df.melt(id_vars=[id_col], value_vars=value_cols,
                      var_name="category", value_name="clause_text")

    melted.dropna(subset=["clause_text"], inplace=True)
    melted = melted[melted["clause_text"].astype(str).str.strip().isin(["", "[]"]) == False]  # noqa: E712

    out = pd.DataFrame()
    out["clause_text"] = melted["clause_text"]
    out["category"] = melted["category"]
    out["risk_level"] = melted["category"].apply(_cuad_assign_risk)

    return finalize(out, "cuad")


def load_cuad(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    columns_lower = {c.lower() for c in df.columns}

    if {"answer_text", "is_impossible", "category"}.issubset(columns_lower):
        return _load_cuad_long(df)

    # Wide format: assume first column is the contract/document identifier.
    id_col = find_column(df.columns, ["filename", "document_name", "contract_title", "id"]) or df.columns[0]
    return _load_cuad_wide(df, id_col)


# ==========================================================
# Source Registry (extend here for SEC Contracts, etc.)
# ==========================================================

SOURCE_LOADERS = {
    "full_dataset_labeled": (FULL_DATASET_PATH, load_full_dataset),
    "cuad": (CUAD_PATH, load_cuad),
    # "sec_contracts": ("sec_contracts.csv", load_sec_contracts),  # add later
}


# ==========================================================
# Statistics
# ==========================================================

def build_statistics(df: pd.DataFrame, train_df, val_df, test_df) -> dict:
    return {
        "total_rows": len(df),
        "risk_distribution": df["risk_level"].value_counts().to_dict(),
        "category_distribution": df["category"].value_counts().to_dict(),
        "source_distribution": df["source"].value_counts().to_dict(),
        "split_sizes": {
            "train": len(train_df),
            "validation": len(val_df),
            "test": len(test_df),
        },
    }


# ==========================================================
# Main
# ==========================================================

def main():
    print("=" * 60)
    print("Loading & Standardizing Sources")
    print("=" * 60)

    frames = []
    for name, (path, loader) in SOURCE_LOADERS.items():
        if not os.path.exists(path):
            print(f"Skipping {name}: file not found ({path})")
            continue
        loaded = loader(path)
        print(f"{name:<22}: {len(loaded)} rows")
        frames.append(loaded)

    merged_df = pd.concat(frames, ignore_index=True)
    print(f"\nAfter Merge: {len(merged_df)} rows")

    merged_df.drop_duplicates(subset=["clause_text"], inplace=True)
    print(f"After Deduplication: {len(merged_df)} rows")

    # ------------------------------------------------------
    # Split
    # ------------------------------------------------------

    train_df, temp_df = train_test_split(
        merged_df,
        test_size=(1 - TRAIN_SIZE),
        random_state=RANDOM_STATE,
        stratify=merged_df["risk_level"],
    )
    validation_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=RANDOM_STATE,
        stratify=temp_df["risk_level"],
    )

    # ------------------------------------------------------
    # Save
    # ------------------------------------------------------

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    merged_df.to_csv(os.path.join(OUTPUT_DIR, "merged_dataset.csv"), index=False)
    train_df.to_csv(os.path.join(OUTPUT_DIR, "train.csv"), index=False)
    validation_df.to_csv(os.path.join(OUTPUT_DIR, "validation.csv"), index=False)
    test_df.to_csv(os.path.join(OUTPUT_DIR, "test.csv"), index=False)

    stats = build_statistics(merged_df, train_df, validation_df, test_df)
    with open(os.path.join(OUTPUT_DIR, "dataset_statistics.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    # ------------------------------------------------------
    # Print Statistics
    # ------------------------------------------------------

    print("\n" + "=" * 60)
    print("Dataset Statistics")
    print("=" * 60)
    print(json.dumps(stats, indent=2))

    print("\nSaved Files:")
    for fname in ["merged_dataset.csv", "train.csv", "validation.csv", "test.csv", "dataset_statistics.json"]:
        print(f"{OUTPUT_DIR}/{fname}")


if __name__ == "__main__":
    main()