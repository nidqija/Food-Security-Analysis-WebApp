from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

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

