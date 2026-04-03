import pandas as pd
import psycopg2
import dotenv
import os
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "datasets", "food_supply_datasets.csv")

dotenv.load_dotenv()

def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        r = urlparse(database_url)
        conn = psycopg2.connect(
            database=r.path[1:], user=r.username,
            password=r.password, host=r.hostname, port=r.port
        )
    else:
        conn = psycopg2.connect(
            database=os.getenv("database"), user=os.getenv("user_name"),
            password=os.getenv("password"), host=os.getenv("host"), port=os.getenv("port")
        )
    print("Database connection successful")
    return conn


def create_table(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_supply (
            id SERIAL PRIMARY KEY,
            state VARCHAR(255),
            month VARCHAR(20),
            rainfall FLOAT,
            temperature FLOAT,
            yield FLOAT,
            disease_index FLOAT,
            price_change FLOAT, 
            risk_score FLOAT
        )
    """)
    conn.commit()

    if cursor:
        print("Table created successfully")

    else:
        print("Table creation failed" , cursor)
    cursor.close()


def create_table_for_predict_temp(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mean_temperature (
            id SERIAL PRIMARY KEY,
            state VARCHAR(100) NOT NULL,
            year INT NOT NULL,
            hist_mean_temp FLOAT NOT NULL,
            UNIQUE (state, year)
        )
    """)
    conn.commit()
    print("✅ Table 'mean_temperature' is ready.")

    




get_db_connection()
create_table(get_db_connection())
create_table_for_predict_temp(get_db_connection())

# Insert food_supply CSV data
def insert_food_supply():
    from sqlalchemy import create_engine
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        engine = create_engine(database_url)
    else:
        from urllib.parse import quote_plus
        safe_pw = quote_plus(os.getenv("password", ""))
        engine = create_engine(f"postgresql://{os.getenv('user_name')}:{safe_pw}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}")
    df = pd.read_csv(file_path)
    df.to_sql("food_supply", engine, if_exists="replace", index=False)
    print(f"✅ Inserted {len(df)} rows into food_supply")

# Insert training_data via merge_datasets
def insert_training_data():
    from services.merge_datasets import merge_and_insert
    merge_and_insert()

if __name__ == "__main__":
    insert_food_supply()
    insert_training_data()





