import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rxpulse")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collections : Based on the schema doc
users_col = db["users"]
institutions_col = db["institutions"]
vendors_col = db["vendors"]
drugs_col = db["drugs"]
purchase_orders_col = db["purchase_orders"]
inventory_col = db["inventory"]
distributions_col = db["distributions"]
consumption_logs_col = db["consumption_logs"]
requisitions_col = db["requisitions"]
vendor_quotes_col = db["vendor_quotes"]

async def ensure_indexes():
    await users_col.create_index("email", unique=True)
    await drugs_col.create_index("name")
    await purchase_orders_col.create_index("order_number", unique=True)
    await distributions_col.create_index("distribution_number", unique=True)

