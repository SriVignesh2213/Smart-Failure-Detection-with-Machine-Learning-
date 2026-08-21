import sys
import os
import pytest
from unittest.mock import AsyncMock, MagicMock

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def limit(self, val):
        self.data = self.data[:val]
        return self

    def sort(self, *args, **kwargs):
        return self

    async def to_list(self, length=100):
        return self.data

class MockMongoDB:
    def __init__(self):
        self.users = {}
        self.machines = {}
        self.predictions = {}
        self.sensor_data = {}
        self.reports = {}
        self.activity_logs = {}

    def __getitem__(self, collection_name):
        # Return a mocked collection
        coll = MagicMock()
        
        async def insert_one(doc):
            if "_id" not in doc:
                from bson import ObjectId
                doc["_id"] = ObjectId()
            
            store = getattr(self, collection_name)
            store[doc["_id"]] = doc
            
            res = MagicMock()
            res.inserted_id = doc["_id"]
            return res
            
        async def find_one(query):
            store = getattr(self, collection_name)
            for k, doc in store.items():
                match = True
                for qk, qv in query.items():
                    if qk == "_id":
                        if str(k) != str(qv):
                            match = False
                    elif doc.get(qk) != qv:
                        match = False
                if match:
                    return doc
            return None

        def find(query=None):
            query = query or {}
            store = getattr(self, collection_name)
            matches = []
            for k, doc in store.items():
                match = True
                for qk, qv in query.items():
                    if qk == "_id":
                        if str(k) != str(qv):
                            match = False
                    elif doc.get(qk) != qv:
                        match = False
                if match:
                    matches.append(doc)
            return MockCursor(matches)
            
        async def count_documents(query):
            cursor = find(query)
            return len(cursor.data)

        async def update_one(query, update_payload):
            doc = await find_one(query)
            if doc and "$set" in update_payload:
                doc.update(update_payload["$set"])
            return MagicMock()

        async def delete_one(query):
            doc = await find_one(query)
            if doc:
                store = getattr(self, collection_name)
                del store[doc["_id"]]
            return MagicMock()

        coll.insert_one = insert_one
        coll.find_one = find_one
        coll.find = find
        coll.count_documents = count_documents
        coll.update_one = update_one
        coll.delete_one = delete_one
        return coll

@pytest.fixture(autouse=True)
def mock_db_connection(monkeypatch):
    """Automatically mock MongoDB database connections for all tests."""
    mock_db = MockMongoDB()
    
    # Pre-populate an admin user for testing
    from app.auth.security import hash_password
    from bson import ObjectId
    from datetime import datetime, timezone
    
    admin_id = ObjectId()
    mock_db.users[admin_id] = {
        "_id": admin_id,
        "email": "admin@factory.com",
        "hashed_password": hash_password("adminpassword"),
        "full_name": "Admin User",
        "role": "admin",
        "created_at": datetime.now(timezone.utc)
    }
    
    # Pre-populate a machine
    machine_id = ObjectId()
    mock_db.machines[machine_id] = {
        "_id": machine_id,
        "name": "Test Machine CNC",
        "type": "L",
        "serial_number": "SN-TEST-123",
        "location": "Bay A",
        "status": "healthy",
        "created_at": datetime.now(timezone.utc)
    }

    monkeypatch.setattr("app.database.mongodb.get_database", lambda: mock_db)
    monkeypatch.setattr("app.api.routers.auth.get_database", lambda: mock_db)
    monkeypatch.setattr("app.api.routers.machines.get_database", lambda: mock_db)
    monkeypatch.setattr("app.api.routers.predict.get_database", lambda: mock_db)
    monkeypatch.setattr("app.api.routers.dashboard.get_database", lambda: mock_db)
    monkeypatch.setattr("app.api.routers.reports.get_database", lambda: mock_db)
    monkeypatch.setattr("app.auth.dependencies.get_database", lambda: mock_db)
    monkeypatch.setattr("app.database.mongodb.connect_to_mongo", AsyncMock())
    monkeypatch.setattr("app.database.mongodb.close_mongo_connection", AsyncMock())
    
    return mock_db
