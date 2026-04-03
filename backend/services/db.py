import os
import urllib
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return create_engine(database_url)
    safe_password = urllib.parse.quote_plus(os.getenv("password", ""))
    return create_engine(
        f"postgresql://{os.getenv('user_name')}:{safe_password}"
        f"@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('database')}"
    )

engine = get_engine()
