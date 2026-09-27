from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
import random

from app.database import purchase_orders_col
from app.models import PurchaseOrderIn, PurchaseOrderStatusUpdate
from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase_orders"])


def generate_order_number() -> str:
    from datetime import datetime
    year = datetime.utcnow().year
    return f"PO-{year}-{random.randint(1000, 9999)}"


@router.get("")
async def list_orders(current_user: dict = Depends(get_current_user)):
    orders = await purchase_orders_col.find().sort("order_date", -1).to_list(500)
    return serialize_list(orders)


@router.get("/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(order_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid id")
    order = await purchase_orders_col.find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize(order)


@router.post("")
async def create_order(payload: PurchaseOrderIn, current_user: dict = Depends(require_roles("admin", "pharmacist"))):
    total_value = sum(item.total_price for item in payload.items)
    doc = {
        "order_number": generate_order_number(),
        "vendor_id": payload.vendor_id,
        "ordered_by": current_user["_id"],
        "order_date": now_iso(),
        "expected_delivery": payload.expected_delivery,
        "status": "pending",
        "items": [item.model_dump() for item in payload.items],
        "total_order_value": total_value,
        "delivery_date": None,
        "notes": payload.notes,
    }
    result = await purchase_orders_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.patch("/{order_id}/status")
async def update_status(order_id: str, payload: PurchaseOrderStatusUpdate, current_user: dict = Depends(require_roles("admin", "pharmacist"))):
    allowed = {"pending", "approved", "shipped", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status value")
    try:
        oid = ObjectId(order_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid id")

    update_fields = {"status": payload.status}
    if payload.status == "delivered":
        update_fields["delivery_date"] = now_iso()

    result = await purchase_orders_col.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await purchase_orders_col.find_one({"_id": oid})
    return serialize(order)
