import xgboost as xgb
import os
import pandas as pd
from services.db import engine


def calc_market_inflation_trend(state_name: str):
    # select intended query
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    # read data into pandas dataframe
    df = pd.read_sql(query, engine)
    
    # Fill missing DB values immediately to avoid NaN issues
    df = df.fillna(0)

    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    # for market inflation prediction , only use features that are relevant to price change prediction
    feature_cols = ['month_num', 'rainfall', 'temperature', 'disease_index', 'yield']

    # set target variable to train the model
    X = df[feature_cols]
    # set price change as target variable for the model to learn 
    y = df['price_change'] 

    # Average price change over the last 12 months
    historical_avg = df['price_change'].tail(12).mean()  

    # fine tune xgboost with an n estimator of 100 and a learning rate of 0.1
    # this allows the model to learn complex patterns while preventing overfitting
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
    model.fit(X, y)

   
    # helper function to get features for a given month
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
        
        # return the first row's features as a dict
        # only need 1 row since we are predicting for a specific month
        return row.iloc[0][feature_cols].to_dict()
    
    # prepare future data to predict inflation trend
    future_data = pd.DataFrame([get_month_features(1), get_month_features(2)])

    # ensure future data use the same function columns as training data
    # to prevent any mismatch issue during prediction training
    future_data = future_data[feature_cols] 
    
    # predict price change for next 2 months using trained model
    predictions = model.predict(future_data)

    # calculate inflation trend 
    # convert the total with float 
    jan_trend = float(predictions[0] - historical_avg)
    feb_trend = float(predictions[1] - historical_avg)
    
    # return the predicted price change in the form of a list
    return predictions.tolist(), [jan_trend, feb_trend], future_data.to_dict(orient='records')