import pandas as pd
import psycopg2
import dotenv
import os

file_path = "../datasets/food_supply_datasets.csv"

print("File path: ", file_path)

dotenv.load_dotenv()

def get_db_connection():
    conn = psycopg2.connect(
        database=os.getenv("database"),
        user=os.getenv("user_name"),
        password=os.getenv("password"),
        host=os.getenv("host"),
        port=os.getenv("port")
    )

    if conn:
        print("Database connection successful")
    
    else :
        print("Database connection failed" , conn)

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





