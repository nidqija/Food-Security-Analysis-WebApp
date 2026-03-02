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


def insert_data(conn, data):
    cursor = conn.cursor()
    for index, row in data.iterrows():
        cursor.execute("""
            INSERT INTO food_supply (state, month, rainfall, temperature, yield, disease_index, price_change, risk_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row['State'], 
            row['Month'], 
            row['Rainfall'], 
            row['Temp'], 
            row['Yield'], 
            row['Disease_Index'], 
            row['Price_Change'], 
            0
        ))
    conn.commit()

    if conn:
        print("Data inserted successfully")
    else:
        print("Data insertion failed" , conn)
    cursor.close()


get_db_connection()
create_table(get_db_connection())
insert_data(get_db_connection(), pd.read_csv(file_path))






