import xgboost as xgb
from dotenv import load_dotenv
import os
import pandas as pd
from .db import engine

load_dotenv()

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "xgb_model.json")

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

if __name__ == "__main__":
    preds, my_trained_model, features = train_and_predict("Johor")
    print(f"Predicted yields for Jan and Feb for Johor: {preds}")
    my_trained_model.save_model(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")





