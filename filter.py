#!/usr/bin/env python3
"""
Find rows in an Excel file where the combination of
'Date du Jour' and 'Longueur P (mm)' appears more than once.
"""

import pandas as pd
from pathlib import Path


INPUT_FILE = "input.xlsx"       # ← change this to your file name
OUTPUT_FILE = "duplicates.xlsx" # ← result will be written here
SHEET_NAME = 0                  # sheet index or sheet name, e.g. "Feuil1"


def main():
    # 1. Load the Excel sheet
    df = pd.read_excel(INPUT_FILE, sheet_name=SHEET_NAME)

    # 2. Filter to rows where (Date du Jour, Longueur P (mm)) is duplicated
    dup_mask = df.duplicated(
        subset=["Date du Jour", "Longueur P (mm)"],
        keep=False  # mark ALL occurrences, not just the second one
    )
    dup_df = df[dup_mask]

    # 3. Save result
    out_path = Path(OUTPUT_FILE)
    dup_df.to_excel(out_path, index=False)
    print(f"Found {len(dup_df)} duplicate rows.")
    print(f"Saved to: {out_path.resolve()}")


if __name__ == "__main__":
    main()