"""
file_parser.py — Reads a file from storage and returns a pandas DataFrame.

Supported formats:
  .xlsx / .xls  → pd.read_excel (openpyxl)
  .csv / .tsv   → pd.read_csv
  .json         → pd.read_json (records or lines)
  .jsonl        → pd.read_json (lines=True)
  .parquet      → pd.read_parquet (pyarrow)
  .pdf          → pdfplumber — first table found is converted to DataFrame

Sovereignty contract: this module never sends data outside the host machine.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import pandas as pd


# Maximum rows loaded into memory for the full DataFrame (safety cap).
MAX_ROWS = 1_000_000


def parse_file(file_path: str, sheet: Optional[str] = None) -> pd.DataFrame:
    """
    Read *file_path* and return a pandas DataFrame.

    Args:
        file_path: Absolute path on the shared storage volume.
        sheet:     Sheet name for Excel files (ignored for other formats).

    Raises:
        FileNotFoundError: if the path does not exist.
        ValueError:        if the format is not supported or no table found.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    suffix = path.suffix.lower()

    if suffix in (".xlsx", ".xls"):
        return _read_excel(path, sheet)
    elif suffix in (".csv", ".tsv"):
        return _read_csv(path, suffix)
    elif suffix == ".json":
        return _read_json(path, lines=False)
    elif suffix == ".jsonl":
        return _read_json(path, lines=True)
    elif suffix == ".parquet":
        return _read_parquet(path)
    elif suffix == ".pdf":
        return _read_pdf(path)
    else:
        raise ValueError(
            f"Unsupported file format '{suffix}'. "
            "Accepted formats: .xlsx, .xls, .csv, .tsv, .json, .jsonl, .parquet, .pdf"
        )


# ---------------------------------------------------------------------------
# Format-specific readers
# ---------------------------------------------------------------------------

def _read_excel(path: Path, sheet: Optional[str]) -> pd.DataFrame:
    kwargs: dict = {"engine": "openpyxl", "nrows": MAX_ROWS}
    if sheet:
        kwargs["sheet_name"] = sheet
    df = pd.read_excel(path, **kwargs)
    # pd.read_excel returns a dict when sheet_name is None; take the first sheet.
    if isinstance(df, dict):
        df = next(iter(df.values()))
    return df


def _read_csv(path: Path, suffix: str) -> pd.DataFrame:
    sep = "\t" if suffix == ".tsv" else ","
    return pd.read_csv(path, sep=sep, nrows=MAX_ROWS, low_memory=False)


def _read_json(path: Path, lines: bool) -> pd.DataFrame:
    try:
        df = pd.read_json(path, lines=lines)
    except ValueError:
        # Some JSON files are objects — try orient="records" as fallback
        df = pd.read_json(path, orient="records")
    if not isinstance(df, pd.DataFrame):
        raise ValueError("JSON file did not produce a tabular DataFrame.")
    return df.head(MAX_ROWS)


def _read_parquet(path: Path) -> pd.DataFrame:
    return pd.read_parquet(path, engine="pyarrow")


def _read_pdf(path: Path) -> pd.DataFrame:
    try:
        import pdfplumber  # optional dep — only required for PDF support
    except ImportError:
        raise ImportError(
            "pdfplumber is required for PDF parsing. "
            "Install it with: pip install pdfplumber"
        )

    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if table:
                headers = table[0]
                rows = table[1:]
                df = pd.DataFrame(rows, columns=headers)
                # Clean up: strip whitespace from headers, drop fully-null rows
                df.columns = [str(c).strip() if c else f"col_{i}"
                               for i, c in enumerate(df.columns)]
                df = df.dropna(how="all")
                return df.head(MAX_ROWS)

    raise ValueError("No table found in the PDF file.")
