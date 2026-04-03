import pandas as pd
import os 
from sqlalchemy import create_engine
from dotenv import load_dotenv
import urllib

load_dotenv()
safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")


current_dir = os.path.dirname(os.path.abspath(__file__))

temp_csv_path = os.path.join(current_dir, "mean_temperature.csv")
crop_csv_path = os.path.join(current_dir, "crops_state.csv")

df_temp = pd.read_csv(temp_csv_path)
df_crop = pd.read_csv(crop_csv_path)

df_crop['date'] = pd.to_datetime(df_crop['date'])
df_crop['year'] = df_crop['date'].dt.year
df_master = pd.merge(df_crop, df_temp, on=['state', 'year'], how='inner')


df_master['yield'] = df_master['production'] / df_master['planted_area']
master_path = os.path.join(current_dir, "training_master.csv")
df_master.to_csv(master_path, index=False)

df_master.to_sql('training_data', engine, if_exists='replace', index=False)
print("Merged dataset created and inserted into the database successfully.")
