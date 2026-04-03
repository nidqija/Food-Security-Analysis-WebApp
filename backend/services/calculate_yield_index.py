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

# this function is used to train model and predict yields for next 2 months based on data of specific state 
def train_and_predict(state_name: str):
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    df = pd.read_sql(query, engine)
    
    # Fill missing DB values immediately to avoid NaN issues
    df = df.fillna(0)

    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    X = df[['month_num', 'rainfall', 'temperature', 'disease_index', 'price_change']]
    y = df['yield'] 

    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
    model.fit(X, y)

    # Calculate monthly averages
    monthly_stats = df.groupby('month_num').agg({
        'rainfall': 'mean',
        'temperature': 'mean',
        'disease_index': 'mean',
        'price_change': 'mean'
    }).reset_index()

    # Helper function to prevent index errors if a month is missing
    def get_month_data(m_num):
        row = monthly_stats[monthly_stats['month_num'] == m_num]
        if row.empty:
            # If month missing, use overall averages as a fallback
            return {
                'month_num': m_num,
                'rainfall': monthly_stats['rainfall'].mean() or 0,
                'temperature': monthly_stats['temperature'].mean() or 0,
                'disease_index': monthly_stats['disease_index'].mean() or 0,
                'price_change': monthly_stats['price_change'].mean() or 0
            }
        return row.iloc[0].to_dict()

    future_data = pd.DataFrame([get_month_data(1), get_month_data(2)])

    predictions = model.predict(future_data)
    feature_summary = future_data.to_dict(orient='records')
    
    return predictions, model, feature_summary 

# Corrected function call (Unpacking 3 values)
preds, my_trained_model, features = train_and_predict("Johor")
print(f"Predicted yields for {my_trained_model}: {preds}")

my_trained_model.save_model("xgb_model.json")

# function call to train model
preds, my_trained_model, features = train_and_predict("Johor")
print(f"Predicted yields for Jan and Feb for Johor: {preds}")

# save the trained model to json file for later use in the API
my_trained_model.save_model("xgb_model.json")
print("Model saved as xgb_model.json")





