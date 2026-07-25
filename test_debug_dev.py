import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

from app import create_app
from app.extensions import db
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserProfileSchema

app = create_app('development')
app.config['PROPAGATE_EXCEPTIONS'] = True

with app.app_context():
    # Find all users
    users = list(db.db["users"].find())
    print(f"Total users in dev database: {len(users)}")
    for user_doc in users:
        print("\nRAW USER DOC:", user_doc)
        for k, v in user_doc.items():
            print(f"  Field: {k:<15} Type: {type(v).__name__:<15} Value: {v}")
            
        # Try to load via repository
        user_id = user_doc["_id"]
        try:
            user_obj = UserRepository.get_by_id(user_id)
            print("Successfully loaded User model object:", user_obj)
            
            # Check role property
            print("Role property:", user_obj.role)
            if user_obj.role:
                print("Role name:", user_obj.role.role_name)
            else:
                print("Role is None!")
                
            # Try to serialize
            serialized = UserProfileSchema().dump(user_obj)
            print("Serialized User Profile:", serialized)
        except Exception as e:
            print("Exception occurred for user ID", user_id)
            traceback.print_exc()
            
    # Find all roles
    roles = list(db.db["roles"].find())
    print(f"\nTotal roles in dev database: {len(roles)}")
    for role_doc in roles:
        print("RAW ROLE DOC:", role_doc)
        for k, v in role_doc.items():
            print(f"  Field: {k:<15} Type: {type(v).__name__:<15} Value: {v}")
