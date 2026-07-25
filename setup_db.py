import os
from dotenv import load_dotenv
from app import create_app
from app.extensions import db

def main():
    load_dotenv()
    print("Loading environment configuration...")
    app = create_app("development")
    
    with app.app_context():
        print(f"Connecting to database: {app.config['MONGO_URI']}")
        try:
            # Test connection
            db.db.command("ping")
            print("Successfully connected to the database!")
            
            # Seed roles
            print("Seeding default roles...")
            roles = [
                {"_id": 1, "role_name": "Admin", "description": "Administrator with full access"},
                {"_id": 2, "role_name": "Engineer", "description": "Maintenance Engineer with write/predict access"},
                {"_id": 3, "role_name": "Viewer", "description": "Viewer with read-only access"}
            ]
            for role_doc in roles:
                role_exists = db.db["roles"].find_one({"role_name": role_doc["role_name"]})
                if not role_exists:
                    db.db["roles"].insert_one(role_doc)
            print("Database seeded successfully with default roles (Admin, Engineer, Viewer).")
            
        except Exception as e:
            print(f"Error occurred during database setup: {e}")

if __name__ == "__main__":
    main()
