import pandas as pd
from sqlalchemy import create_engine
import urllib
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import os
from dotenv import load_dotenv



load_dotenv()
safe_password = urllib.parse.quote_plus(os.getenv('password'))
engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_password}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")


def train_for_predicted_temp():

   df = pd.read_sql("SELECT * FROM training_data", engine)

   # X is for data required to train the model
   X = df[['state', 'year']]

   #Y is the targer variable for training the model 
   Y = df['hist_mean_temp']

   # encode the state variable using one-hot encoding to convert categorical data into numerical format for model training
   X_encoded = pd.get_dummies(X, columns=['state']) 

   # save the feature names used for training the model to ensure consistency during prediction
   joblib.dump(X_encoded.columns, 'temp_model_features.pkl')

   # train the model using xgboost
   model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1)
   model.fit(X_encoded, Y)

   joblib.dump(model, 'temp_prediction_model.pkl')
   print("Model trained and saved successfully for predicted temperature.")


if __name__ == "__main__":
    train_for_predicted_temp()