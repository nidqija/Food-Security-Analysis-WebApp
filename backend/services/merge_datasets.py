import pandas as pd
import os
from dotenv import load_dotenv
from .db import engine

load_dotenv()

def merge_and_insert():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    DATASETS_DIR = os.path.join(current_dir, "..", "datasets")

    df_temp = pd.read_csv(os.path.join(DATASETS_DIR, "mean_temperature.csv"))
    df_crop = pd.read_csv(os.path.join(DATASETS_DIR, "crops_state.csv"))

    df_crop['date'] = pd.to_datetime(df_crop['date'])
    df_crop['year'] = df_crop['date'].dt.year
    df_master = pd.merge(df_crop, df_temp, on=['state', 'year'], how='inner')

    df_master['yield'] = df_master['production'] / df_master['planted_area']
    df_master.to_csv(os.path.join(DATASETS_DIR, "training_master.csv"), index=False)
    df_master.to_sql('training_data', engine, if_exists='replace', index=False)
    print("Merged dataset created and inserted into the database successfully.")

if __name__ == "__main__":
    merge_and_insert()
