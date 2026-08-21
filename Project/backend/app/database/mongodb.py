import logging
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING

logger = logging.getLogger("app.database")

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_instance = MongoDB()

async def connect_to_mongo():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db = os.getenv("MONGO_DB", "predictive_maintenance")
    
    logger.info(f"Connecting to MongoDB at {mongo_uri}")
    db_instance.client = AsyncIOMotorClient(mongo_uri)
    db_instance.db = db_instance.client[mongo_db]
    
    # Initialize indexes
    await init_db_indexes()
    logger.info("MongoDB connection established successfully.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db

async def init_db_indexes():
    """Create indexes for performance and constraints."""
    db = db_instance.db
    if db is None:
        logger.error("Database connection not established. Indexes not initialized.")
        return
        
    try:
        # Users Collection
        await db["users"].create_indexes([
            IndexModel([("email", ASCENDING)], unique=True)
        ])
        
        # Machines Collection
        await db["machines"].create_indexes([
            IndexModel([("serial_number", ASCENDING)], unique=True)
        ])
        
        # Predictions Collection
        await db["predictions"].create_indexes([
            IndexModel([("machine_id", ASCENDING)]),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("created_at", ASCENDING)])
        ])
        
        # SensorData Collection
        await db["sensor_data"].create_indexes([
            IndexModel([("machine_id", ASCENDING), ("timestamp", ASCENDING)])
        ])
        
        # Reports Collection
        await db["reports"].create_indexes([
            IndexModel([("created_at", ASCENDING)])
        ])
        
        # ActivityLogs Collection
        await db["activity_logs"].create_indexes([
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("timestamp", ASCENDING)])
        ])
        
        logger.info("Database indexes initialized successfully.")
    except Exception as e:
        logger.error(f"Error creating database indexes: {e}")
