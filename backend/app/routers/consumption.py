from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId

from app.database import consumption_logs_col, drugs_col
from app.models import ConsumptionLogIn
from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user

router = APIRouter(prefix="/api/consumption", tags=["consumption"])


@router.get("")
async def list_consumption(current_user: dict = Depends(get_current_user)):
    logs = await consumption_logs_col.find().sort("date", -1).to_list(500)
    return serialize_list(logs)


@router.post("")
async def log_consumption(payload: ConsumptionLogIn, current_user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["logged_by"] = current_user["_id"]
    doc["staff_name"] = current_user.get("name", "Staff")
    doc["institution_id"] = current_user.get("institution_id")
    doc["date"] = now_iso()

    result = await consumption_logs_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)
