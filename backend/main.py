import json
import os
from xml.parsers.expat import model
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import create_engine , text
import pandas as pd
import urllib
import xgboost as xgb
import json
from services.calculate_yield_index import train_and_predict
from services.calculate_risk_score import calculate_risk
from services.calculate_market_inflation import calc_market_inflation_trend
import numpy as np

load_dotenv()


# ========================================================================================================================================
app = FastAPI()
safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")
model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
model.load_model("xgb_model.json")
csv_path = "../datasets/crops_state.csv"
pkl_model_path = "../datasets/temp_prediction_model.pkl"
pkl_feature_path = "../datasets/temp_model_features.pkl"

# Allow CORS for all origins (for development purposes)
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],  # Allow only the frontend origin in production
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/risk")
async def get_risk():
   
    risk_score = 72  # Example risk score
    return {"risk_score": risk_score}


@app.get("/greetings")
async def say_hello():
    return {"message": "Hello from FastAPI!"}

@app.get('/request_state_yield/{state_name}')
async def get_state_yield(state_name: str):

    try :
     preds , _ , features = train_and_predict(state_name)
     clean_preds = np.nan_to_num(preds).tolist()


     return {"state": state_name , "predictions_jan": float(clean_preds[0]), "predictions_feb": float(clean_preds[1]), "features": features}

    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return {"error": "Could not read model data"}
    

@app.get('/request_state_risk/{state_name}')
async def get_state_risk(state_name: str):

    try :
     risk_score = calculate_risk(state_name)
     clean_risk_score = np.nan_to_num(risk_score).tolist()

     return {"state": state_name , "risk_score": float(clean_risk_score)}

    except Exception as e:
        print(f"Error calculating risk score: {e}")
        return {"error": "Could not calculate risk score"}
    

@app.get('/request_state_inflation/{state_name}')
async def get_state_inflation(state_name: str):
   try:
        predictions, trends, features = calc_market_inflation_trend(state_name)
        clean_predictions = np.nan_to_num(predictions).tolist()
        clean_trends = np.nan_to_num(trends).tolist()
    
        return {"state": state_name , "predicted_price_change_jan": float(clean_predictions[0]), "predicted_price_change_feb": float(clean_predictions[1]), "price_change_trend_jan": float(clean_trends[0]), "price_change_trend_feb": float(clean_trends[1]), "features": features}
   
   except Exception as e:
        print(f"Error calculating market inflation trend: {e}")
        return {"error": "Could not calculate market inflation trend"}

    
@app.get('/request_state_analysis/{state_name}')
async def get_state_analysis(state_name: str):
   df = pd.read_csv(csv_path)
   state_data = df[df['state'] == state_name].iloc[0].to_dict()
   return {"state": state_name , "analysis": state_data}
  


@app.get('/load_raw_records/{state_name}')
async def load_raw_records(state_name: str):
    with engine.connect() as connection:
        result = connection.execute(text(f"SELECT * FROM food_supply WHERE state = '{state_name}'"))
        result2 = connection.execute(text(f"SELECT * FROM training_data WHERE state = '{state_name}'"))
        records = [row._asdict() for row in result]
        records2 = [row._asdict() for row in result2]
    return {"state": state_name , "records": records , "training_data": records2}