from xml.parsers.expat import model
import xgboost as xgb
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os
import pandas as pd
import urllib



load_dotenv()

safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")


def train_and_predict(state_name: str):
    # 1. Load data
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    df = pd.read_sql(query, engine)

    # 2. Pre-processing: Convert Month to Numbers
    # Example: '2025-01' -> 1
    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    # 3. Prepare Features (X) and Target (y)
    # Drop strings and IDs. Let's predict 'yield' since 'risk_score' is all 0s right now.
    X = df[['month_num', 'rainfall', 'temperature', 'disease_index', 'price_change']]
    y = df['yield'] 

    # 4. Train
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
    model.fit(X, y)

    # 5. Prepare Future Data (Must match X columns exactly!)
    future_data = pd.DataFrame({
        'month_num': [1, 2], # Jan, Feb
        'rainfall': [100, 150],
        'temperature': [25, 30],
        'disease_index': [0.2, 0.3],
        'price_change': [0.05, 0.1]
    })

    predictions = model.predict(future_data)
    return predictions , model



preds, my_trained_model = train_and_predict("Johor")
print(f"Predicted yields for Jan and Feb for Johor: {preds}")

my_trained_model.save_model("xgb_model.json")
print("Model saved as xgb_model.json")


