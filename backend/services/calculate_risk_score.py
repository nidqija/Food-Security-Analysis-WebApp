import xgboost as xgb
import os
import pandas as pd
from .db import engine


def calculate_risk(state_name: str):
    # fetch data for specific state to calculate average risk score 
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    df = pd.read_sql(query, engine)
    
    # Fill missing DB values immediately to avoid NaN issues
    df = df.fillna(0)
    
    # Ensure 'month' column is in datetime format and extract month number
    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    # X variable is for training the model to calculate risk score based on historical data
    X = df[['month_num', 'rainfall', 'temperature', 'disease_index', 'price_change']]

    # y variable is the target variable for training the model 
    y = df['yield'] 

   # train the model using xgboost regressor
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

     # Prepare average risk score data for January and February
    future_data = pd.DataFrame([get_month_data(1), get_month_data(2)])
    
     # calculate risk score based on predicted yields and disease index
    predictions = model.predict(future_data)
    
    # Simple risk score calculation based on predicted yields and disease index
    risk_score = (predictions.mean() * 0.5) + (future_data['disease_index'].mean() * 0.5)
    
    return risk_score