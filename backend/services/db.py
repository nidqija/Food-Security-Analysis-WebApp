import os
import urllib
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            return create_engine(
                database_url,
                connect_args={"sslmode": "require"} if "neon.tech" in database_url else {}
            )
        safe_password = urllib.parse.quote_plus(os.getenv("password", ""))
        user = os.getenv("user_name")
        host = os.getenv("host")
        if not all([user, host]):
            print("Warning: DB credentials not set, engine not created.")
            return None
        return create_engine(
            f"postgresql://{user}:{safe_password}"
            f"@{host}:{os.getenv('port')}/{os.getenv('database')}"
        )
    except Exception as e:
        print(f"Warning: Could not create DB engine: {e}")
        return None

engine = get_engine()
