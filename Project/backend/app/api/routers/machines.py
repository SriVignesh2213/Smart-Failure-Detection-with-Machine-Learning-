from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.database.mongodb import get_database
from app.auth.dependencies import get_current_user
from app.schemas.machine import MachineCreate, MachineUpdate, MachineOut

router = APIRouter(prefix="/machines", tags=["Machines"])

@router.get("", response_model=List[MachineOut])
async def list_machines(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    cursor = db["machines"].find()
    machines = await cursor.to_list(length=1000)
    return machines

@router.post("", response_model=MachineOut, status_code=status.HTTP_201_CREATED)
async def create_machine(
    machine_data: MachineCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    # Check if serial number already exists
    existing = await db["machines"].find_one({"serial_number": machine_data.serial_number})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Machine with serial number '{machine_data.serial_number}' already registered."
        )
        
    new_machine = {
        "name": machine_data.name,
        "type": machine_data.type,
        "serial_number": machine_data.serial_number,
        "location": machine_data.location,
        "status": machine_data.status or "healthy",
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["machines"].insert_one(new_machine)
    inserted = await db["machines"].find_one({"_id": result.inserted_id})
    
    # Log activity
    await db["activity_logs"].insert_one({
        "user_id": current_user["_id"],
        "action": "MACHINE_CREATION",
        "details": f"Registered machine: {machine_data.name} (S/N: {machine_data.serial_number})",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return inserted

@router.put("/{id}", response_model=MachineOut)
async def update_machine(
    id: str,
    machine_data: MachineUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid machine ID format")
        
    # Check if machine exists
    machine = await db["machines"].find_one({"_id": ObjectId(id)})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    # Build update payload
    update_dict = {k: v for k, v in machine_data.model_dump().items() if v is not None}
    
    if not update_dict:
        return machine
        
    # If updating serial number, verify uniqueness
    if "serial_number" in update_dict and update_dict["serial_number"] != machine["serial_number"]:
        existing = await db["machines"].find_one({"serial_number": update_dict["serial_number"]})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Machine with serial number '{update_dict['serial_number']}' already registered."
            )
            
    await db["machines"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_dict}
    )
    
    updated = await db["machines"].find_one({"_id": ObjectId(id)})
    
    # Log activity
    await db["activity_logs"].insert_one({
        "user_id": current_user["_id"],
        "action": "MACHINE_UPDATE",
        "details": f"Updated machine '{machine['name']}' ({id}). Changes: {list(update_dict.keys())}",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_machine(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database offline")
        
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid machine ID format")
        
    # Check if machine exists
    machine = await db["machines"].find_one({"_id": ObjectId(id)})
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
        
    # Delete machine
    await db["machines"].delete_one({"_id": ObjectId(id)})
    
    # Cascade delete predictions or sensor data? No, let's keep them but disconnect them or let them remain.
    
    # Log activity
    await db["activity_logs"].insert_one({
        "user_id": current_user["_id"],
        "action": "MACHINE_DELETION",
        "details": f"Deleted machine: {machine['name']} (S/N: {machine['serial_number']})",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return
