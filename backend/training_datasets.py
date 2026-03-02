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
    # 1. Load data from the database
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    df = pd.read_sql(query, engine)

   # calculate average stats for each month 
    average_query = f"""
    SELECT month, 
           AVG(rainfall) AS rainfall, 
           AVG(temperature) AS temperature, 
           AVG(disease_index) AS disease_index, 
           AVG(price_change) AS price_change, 
           AVG(yield) AS yield
    FROM food_supply
    WHERE state = '{state_name}'
    GROUP BY month
    ORDER BY month
    """

    stats = pd.read_sql(average_query, engine)

    if stats.empty:
        raise ValueError(f"No data found for state: {state_name}")
    


    

    # 2. Pre-processing: Convert Month to Numbers
    # Example: '2025-01' -> 1
    if 'month' in df.columns:
        df['month_num'] = pd.to_datetime(df['month']).dt.month
    
    # 3. Prepare Features (X) and Target (y)
    # ensure that the columns fetched from db match these names and types
    X = df[['month_num', 'rainfall', 'temperature', 'disease_index', 'price_change']]
    # target variable to predict 
    y = df['yield'] 

    # 4. Train the XGboost ml model
    model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
    # fit the model to the data

    model.fit(X, y)

    # prepare future data using average stats for jan and feb first
    monthly_stats = df.groupby('month_num').agg({
        'rainfall': 'mean',
        'temperature': 'mean',
        'disease_index': 'mean',
        'price_change': 'mean'
    }).reset_index()

# filter stats for Jan and Feb
    jan_stats = monthly_stats[monthly_stats['month_num'] == 1]
    feb_stats = monthly_stats[monthly_stats['month_num'] == 2]

# create future data for Jan and Feb using the average stats 
# separate dataframes by month to create a single dataframe for future predictions
    future_data = pd.DataFrame([{
        'month_num': 1,
        'rainfall': jan_stats['rainfall'].values[0],
        'temperature': jan_stats['temperature'].values[0],
        'disease_index': jan_stats['disease_index'].values[0],
        'price_change': jan_stats['price_change'].values[0]
    }, 
    {
        'month_num': 2,
        'rainfall': feb_stats['rainfall'].values[0],
        'temperature': feb_stats['temperature'].values[0],
        'disease_index': feb_stats['disease_index'].values[0],
        'price_change': feb_stats['price_change'].values[0]
    }
    
    ])

  # predict yields for Jan and Feb using the trained model
    predictions = model.predict(future_data)
    return predictions , model


# function call to train model
preds, my_trained_model = train_and_predict("Johor")
print(f"Predicted yields for Jan and Feb for Johor: {preds}")

# save the trained model to json file for later use in the API
my_trained_model.save_model("xgb_model.json")
print("Model saved as xgb_model.json")


