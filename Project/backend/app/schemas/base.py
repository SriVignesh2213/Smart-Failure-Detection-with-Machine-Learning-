from typing import Annotated
from bson import ObjectId
from pydantic import BeforeValidator

def validate_object_id(v: any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId string")
        return v
    raise ValueError("Invalid ObjectId type")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]
