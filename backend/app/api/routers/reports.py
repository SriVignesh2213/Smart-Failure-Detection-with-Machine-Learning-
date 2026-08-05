from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
import io
from app.database.mongodb import get_database
from app.auth.dependencies import get_current_user
from app.services.report_generator import (
    generate_predictions_csv,
    generate_machines_csv,
    generate_predictions_pdf,
    generate_machines_pdf
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("")
async def get_report(
    report_type: str = Query("predictions", pattern="^(predictions|machines)$"),
    format: str = Query("pdf", pattern="^(pdf|csv)$"),
    machine_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    try:
        if report_type == "predictions":
            query = {}
            if machine_id:
                if not ObjectId.is_valid(machine_id):
                    raise HTTPException(status_code=400, detail="Invalid machine ID format")
                query["machine_id"] = ObjectId(machine_id)
                
            cursor = db["predictions"].find(query).sort("created_at", -1)
            records = await cursor.to_list(length=2000)
            
            if format == "csv":
                csv_data = generate_predictions_csv(records)
                filename = f"predictions_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                media_type = "text/csv"
                response_content = csv_data.encode('utf-8')
            else: # pdf
                pdf_data = generate_predictions_pdf(records)
                filename = f"predictions_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                media_type = "application/pdf"
                response_content = pdf_data
                
        else: # machines
            cursor = db["machines"].find().sort("name", 1)
            records = await cursor.to_list(length=1000)
            
            if format == "csv":
                csv_data = generate_machines_csv(records)
                filename = f"machines_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                media_type = "text/csv"
                response_content = csv_data.encode('utf-8')
            else: # pdf
                pdf_data = generate_machines_pdf(records)
                filename = f"machines_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                media_type = "application/pdf"
                response_content = pdf_data
                
        # Register the report record in the database
        report_record = {
            "name": filename,
            "type": format,
            "file_path": f"database://reports/{filename}", # virtual path or storage URI
            "created_by": ObjectId(current_user["_id"]),
            "created_at": datetime.now(timezone.utc)
        }
        await db["reports"].insert_one(report_record)
        
        # Log activity
        await db["activity_logs"].insert_one({
            "user_id": current_user["_id"],
            "action": "REPORT_GENERATION",
            "details": f"Generated {report_type.upper()} report in {format.upper()} format.",
            "timestamp": datetime.now(timezone.utc)
        })
        
        return StreamingResponse(
            io.BytesIO(response_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate export report: {e}")
