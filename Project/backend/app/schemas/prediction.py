from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.schemas.base import PyObjectId

class PredictRequest(BaseModel):
    machine_id: str
    air_temp: float = Field(..., description="Air Temperature (K)", ge=200, le=400)
    process_temp: float = Field(..., description="Process Temperature (K)", ge=200, le=400)
    rotational_speed: float = Field(..., description="Rotational Speed (RPM)", ge=500, le=5000)
    torque: float = Field(..., description="Torque (Nm)", ge=0, le=200)
    tool_wear: float = Field(..., description="Tool Wear (min)", ge=0, le=500)
    product_type: str = Field(..., pattern="^(L|M|H)$", description="Product Type (L/M/H)")

class PredictResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    machine_id: PyObjectId
    user_id: PyObjectId
    sensor_data: Dict[str, Any]
    failure_probability: float
    is_failure: bool
    failure_type: str
    confidence_score: float
    shap_values: Dict[str, float]
    maintenance_action: str
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {PyObjectId: str}
