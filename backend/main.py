import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import create_engine
import pandas as pd

load_dotenv()






# ========================================================================================================================================
app = FastAPI()
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")


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

@app.get('/state/{state_name}')
def get_state_data(state_name: str):
    query = f"SELECT * FROM food_supply WHERE state = '{state_name}'"
    result = engine.execute(query)
    data = [dict(row) for row in result]
    return {"data": data}


