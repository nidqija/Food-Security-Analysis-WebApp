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
from training_datasets import train_and_predict
import numpy as np

load_dotenv()


# ========================================================================================================================================
app = FastAPI()
safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")
model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
model.load_model("xgb_model.json")

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

    

    
  



