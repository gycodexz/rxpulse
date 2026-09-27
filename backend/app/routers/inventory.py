from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId

from app.database import inventory_col, drugs_col
from app.models import InventoryIn
from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(current_user: dict = Depends(get_current_user)):
    items = await inventory_col.find().sort("transaction_date", -1).to_list(1000)
    return serialize_list(items)


@router.post("")
async def create_transaction(payload: InventoryIn, current_user: dict = Depends(require_roles("admin", "pharmacist"))):
    if payload.transaction_type not in ("in", "out"):
        raise HTTPException(status_code=400, detail="transaction_type must be 'in' or 'out'")

    try:
        drug_oid = ObjectId(payload.drug_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid drug id")

    drug = await drugs_col.find_one({"_id": drug_oid})
    if not drug:
        raise HTTPException(status_code=404, detail="Drug not found in catalog")

    if payload.transaction_type == "out" and drug.get("quantity", 0) < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock for this transaction")

    doc = payload.model_dump()
    doc["transaction_date"] = now_iso()
    doc["performed_by"] = current_user["_id"]
    result = await inventory_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    # This is to keep the drug master quantity in sync with stock movements
    delta = payload.quantity if payload.transaction_type == "in" else -payload.quantity
    await drugs_col.update_one({"_id": drug_oid}, {"$inc": {"quantity": delta}})

    return serialize(doc)


@router.get("/low-stock")
async def low_stock(current_user: dict = Depends(get_current_user)):
    drugs = await drugs_col.find().to_list(1000)
    low = [d for d in drugs if d.get("quantity", 0) <= d.get("reorder_level", 0)]
    return serialize_list(low)
