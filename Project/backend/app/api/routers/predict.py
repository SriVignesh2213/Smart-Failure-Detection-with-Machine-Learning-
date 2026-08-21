from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database.mongodb import get_database
from app.auth.dependencies import get_current_user
from app.ml.predictor import get_predictor
from app.schemas.prediction import PredictRequest, PredictResponse

router = APIRouter(prefix="/predict", tags=["Predictions"])

@router.post("", response_model=PredictResponse)
async def perform_prediction(
    request: PredictRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    if not ObjectId.is_valid(request.machine_id):
        raise HTTPException(status_code=400, detail="Invalid machine ID format")
        
    # Check if machine exists
    machine = await db["machines"].find_one({"_id": ObjectId(request.machine_id)})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    # Prepare input dictionary
    input_data = {
        "product_type": request.product_type,
        "air_temp": request.air_temp,
        "process_temp": request.process_temp,
        "rotational_speed": request.rotational_speed,
        "torque": request.torque,
        "tool_wear": request.tool_wear
    }
    
    # Perform prediction using ML predictor service
    predictor = get_predictor()
    prediction_results, shap_values = predictor.predict(input_data)
    
    # Create prediction document
    prediction_doc = {
        "machine_id": ObjectId(request.machine_id),
        "user_id": ObjectId(current_user["_id"]),
        "sensor_data": input_data,
        "failure_probability": prediction_results["failure_probability"],
        "is_failure": prediction_results["is_failure"],
        "failure_type": prediction_results["failure_type"],
        "confidence_score": prediction_results["confidence_score"],
        "shap_values": shap_values,
        "maintenance_action": prediction_results["maintenance_action"],
        "created_at": datetime.now(timezone.utc)
    }
    
    # Save prediction
    pred_result = await db["predictions"].insert_one(prediction_doc)
    
    # Save sensor telemetry to history
    await db["sensor_data"].insert_one({
        "machine_id": ObjectId(request.machine_id),
        "air_temp": request.air_temp,
        "process_temp": request.process_temp,
        "rotational_speed": request.rotational_speed,
        "torque": request.torque,
        "tool_wear": request.tool_wear,
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Update current machine status (healthy, warning, critical)
    predicted_status = prediction_results["status"]
    await db["machines"].update_one(
        {"_id": ObjectId(request.machine_id)},
        {"$set": {"status": predicted_status}}
    )
    
    # Fetch inserted prediction
    inserted = await db["predictions"].find_one({"_id": pred_result.inserted_id})
    
    # Log activity
    await db["activity_logs"].insert_one({
        "user_id": current_user["_id"],
        "action": "FAILURE_PREDICTION",
        "details": f"Ran prediction on machine '{machine['name']}'. Failure Prob: {prediction_results['failure_probability']:.2f}, Result: {predicted_status.upper()}",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return inserted

@router.get("/history", response_model=List[PredictResponse])
async def list_prediction_history(
    machine_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    query = {}
    if machine_id:
        if not ObjectId.is_valid(machine_id):
            raise HTTPException(status_code=400, detail="Invalid machine ID filter format")
        query["machine_id"] = ObjectId(machine_id)
        
    cursor = db["predictions"].find(query).sort("created_at", -1)
    history = await cursor.to_list(length=1000)
    return history

@router.get("/{id}", response_model=PredictResponse)
async def get_prediction(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid prediction ID format")
        
    prediction = await db["predictions"].find_one({"_id": ObjectId(id)})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction record not found")
        
    return prediction
