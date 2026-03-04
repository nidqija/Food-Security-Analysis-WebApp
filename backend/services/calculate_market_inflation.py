import xgboost as xgb
from sqlalchemy import create_engine
from dotenv import load_dotenv

import os
import pandas as pd
import urllib


load_dotenv()
safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}") 


def calc_market_inflation_trend(state_name: str):
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    df = pd.read_sql(query, engine)
    
    # Fill missing DB values immediately to avoid NaN issues
    df = df.fillna(0)

    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    # for market inflation prediction , only use features that are relevant to price change prediction
    feature_cols = ['month_num', 'rainfall', 'temperature', 'disease_index', 'yield']

    # set target variable to train the model
    X = df[feature_cols]
    y = df['price_change'] 

    historical_avg = df['price_change'].tail(12).mean()  # Average price change over the last 12 months


    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
    model.fit(X, y)

   
    
    def get_month_features(m_num):
        row = df[df['month_num'] == m_num]
        if row.empty:
            return {
                'month_num': m_num,
                'rainfall': df['rainfall'].mean() or 0,
                'temperature': df['temperature'].mean() or 0,
                'disease_index': df['disease_index'].mean() or 0,
                'yield': df['yield'].mean() or 0
            }
        return row.iloc[0][feature_cols].to_dict()
    
    # prepare future data to predict inflation trend
    future_data = pd.DataFrame([get_month_features(1), get_month_features(2)])

    # ensure future data use the same function columns as training data
    # to prevent any mismatch issue during prediction training
    future_data = future_data[feature_cols] 
    
    # predict price change for next 2 months using trained model
    predictions = model.predict(future_data)

    jan_trend = float(predictions[0] - historical_avg)
    feb_trend = float(predictions[1] - historical_avg)
    
    return predictions.tolist(), [jan_trend, feb_trend], future_data.to_dict(orient='records')