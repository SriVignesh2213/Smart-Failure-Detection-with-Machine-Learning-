from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.base import PyObjectId

class SensorDataOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    machine_id: PyObjectId
    air_temp: float
    process_temp: float
    rotational_speed: float
    torque: float
    tool_wear: float
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}

class ReportOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    type: str
    file_path: str
    created_by: PyObjectId
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}

class ActivityLogOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    user_id: Optional[PyObjectId] = None
    action: str
    details: str
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
