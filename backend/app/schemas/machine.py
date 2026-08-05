from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.base import PyObjectId

class MachineCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: str = Field(..., pattern="^(L|M|H)$") # L, M, H
    serial_number: str = Field(..., min_length=3, max_length=50)
    location: str = Field(..., min_length=2, max_length=100)
    status: Optional[str] = "healthy" # healthy, warning, critical

class MachineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    type: Optional[str] = Field(None, pattern="^(L|M|H)$")
    serial_number: Optional[str] = Field(None, min_length=3, max_length=50)
    location: Optional[str] = Field(None, min_length=2, max_length=100)
    status: Optional[str] = Field(None, pattern="^(healthy|warning|critical)$")

class MachineOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    name: str
    type: str
    serial_number: str
    location: str
    status: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
