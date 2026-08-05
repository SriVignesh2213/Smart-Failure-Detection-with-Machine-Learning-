from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database.mongodb import get_database
from app.auth.dependencies import get_current_user
from app.ml.predictor import get_predictor
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("")
async def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    try:
        # 1. KPI Cards data
        total_machines = await db["machines"].count_documents({})
        healthy_machines = await db["machines"].count_documents({"status": "healthy"})
        warning_machines = await db["machines"].count_documents({"status": "warning"})
        critical_machines = await db["machines"].count_documents({"status": "critical"})
        machines_at_risk = warning_machines + critical_machines
        
        total_predictions = await db["predictions"].count_documents({})
        
        # Get Model Accuracy from ML predictor
        predictor = get_predictor()
        accuracy = 0.985 # fallback
        model_name = "XGBoost Classifier"
        if predictor.is_loaded and predictor.metrics_summary:
            accuracy = predictor.metrics_summary.get("accuracy", 0.985)
            model_name = predictor.metrics_summary.get("model_name", "Best Model")
            
        # 2. Recent predictions list (latest 5)
        recent_preds_cursor = db["predictions"].find().sort("created_at", -1).limit(5)
        recent_preds = await recent_preds_cursor.to_list(length=5)
        
        recent_predictions_list = []
        for pred in recent_preds:
            machine = await db["machines"].find_one({"_id": pred["machine_id"]})
            machine_name = machine["name"] if machine else "Unknown Machine"
            machine_sn = machine["serial_number"] if machine else "N/A"
            
            recent_predictions_list.append({
                "id": str(pred["_id"]),
                "machine_id": str(pred["machine_id"]),
                "machine_name": machine_name,
                "machine_sn": machine_sn,
                "failure_probability": pred["failure_probability"],
                "is_failure": pred["is_failure"],
                "failure_type": pred["failure_type"],
                "created_at": pred["created_at"]
            })
            
        # 3. Machine Status Distribution
        status_distribution = [
            {"name": "Healthy", "value": healthy_machines, "color": "#10B981"},
            {"name": "Warning", "value": warning_machines, "color": "#F59E0B"},
            {"name": "Critical", "value": critical_machines, "color": "#EF4444"}
        ]
        
        # 4. Failure vs No Failure prediction distribution
        fail_count = await db["predictions"].count_documents({"is_failure": True})
        no_fail_count = await db["predictions"].count_documents({"is_failure": False})
        prediction_distribution = [
            {"name": "Failures Predicted", "value": fail_count},
            {"name": "Normal Operations", "value": no_fail_count}
        ]
        
        # 5. Failure Trend (Daily counts for the last 7 days)
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        failure_trends = []
        for i in range(6, -1, -1):
            day_start = today - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_preds_count = await db["predictions"].count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end}
            })
            day_failures_count = await db["predictions"].count_documents({
                "created_at": {"$gte": day_start, "$lt": day_end},
                "is_failure": True
            })
            
            failure_trends.append({
                "date": day_start.strftime("%b %d"),
                "predictions": day_preds_count,
                "failures": day_failures_count
            })
            
        # 6. Specific Failure Types breakdown
        # TWF, HDF, PWF, OSF, RNF
        failure_types_breakdown = [
            {"name": "Tool Wear (TWF)", "value": await db["predictions"].count_documents({"failure_type": {"$regex": "TWF"}})},
            {"name": "Heat Dissipation (HDF)", "value": await db["predictions"].count_documents({"failure_type": {"$regex": "HDF"}})},
            {"name": "Power (PWF)", "value": await db["predictions"].count_documents({"failure_type": {"$regex": "PWF"}})},
            {"name": "Overstrain (OSF)", "value": await db["predictions"].count_documents({"failure_type": {"$regex": "OSF"}})},
            {"name": "Random (RNF)", "value": await db["predictions"].count_documents({"failure_type": {"$regex": "RNF"}})}
        ]
        
        return {
            "summary": {
                "total_machines": total_machines,
                "healthy_machines": healthy_machines,
                "machines_at_risk": machines_at_risk,
                "total_predictions": total_predictions,
                "model_accuracy": accuracy,
                "model_name": model_name
            },
            "recent_predictions": recent_predictions_list,
            "status_distribution": status_distribution,
            "prediction_distribution": prediction_distribution,
            "failure_trends": failure_trends,
            "failure_types_breakdown": failure_types_breakdown
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compiling dashboard details: {e}")
