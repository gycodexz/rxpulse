from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
import random

from app.database import purchase_orders_col, vendor_quotes_col, vendors_col
from app.models import PurchaseOrderIn, PurchaseOrderStatusUpdate, VendorSupplyQuoteIn
from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase_orders"])


def generate_order_number() -> str:
    from datetime import datetime
    year = datetime.utcnow().year
    return f"PO-{year}-{random.randint(1000, 9999)}"


@router.get("")
async def list_orders(current_user: dict = Depends(get_current_user)):
    # If user is a vendor, filter to only their orders if vendor_id is assigned
    query = {}
    if current_user.get("role") == "vendor" and current_user.get("vendor_id"):
        query = {"vendor_id": current_user["vendor_id"]}
    orders = await purchase_orders_col.find(query).sort("order_date", -1).to_list(500)
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
async def update_status(order_id: str, payload: PurchaseOrderStatusUpdate, current_user: dict = Depends(require_roles("admin", "pharmacist", "vendor"))):
    allowed = {"pending", "approved", "shipped", "delivered", "cancelled"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status value")
    try:
        oid = ObjectId(order_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid id")

    update_fields = {"status": payload.status}
    if payload.courier_name:
        update_fields["courier_name"] = payload.courier_name
    if payload.tracking_number:
        update_fields["tracking_number"] = payload.tracking_number
    if payload.notes:
        update_fields["shipping_notes"] = payload.notes
    if payload.status == "shipped":
        update_fields["shipped_date"] = now_iso()
    if payload.status == "delivered":
        update_fields["delivery_date"] = now_iso()

    result = await purchase_orders_col.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await purchase_orders_col.find_one({"_id": oid})
    return serialize(order)


@router.post("/vendor-quote")
async def submit_vendor_quote(payload: VendorSupplyQuoteIn, current_user: dict = Depends(get_current_user)):
    vendor_id = payload.vendor_id or current_user.get("vendor_id")
    vendor_name = payload.vendor_name or current_user.get("name", "Vendor Partner")
    
    total_quote_value = sum(it.total_price for it in payload.items)
    doc = {
        "quote_number": f"VQ-{random.randint(10000, 99999)}",
        "vendor_id": vendor_id,
        "vendor_name": vendor_name,
        "submitted_by": current_user["_id"],
        "submitted_at": now_iso(),
        "status": "submitted",
        "expected_dispatch_date": payload.expected_dispatch_date,
        "items": [it.model_dump() for it in payload.items],
        "total_quote_value": total_quote_value,
        "notes": payload.notes,
    }
    result = await vendor_quotes_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.get("/vendor-quotes/all")
async def list_vendor_quotes(current_user: dict = Depends(get_current_user)):
    quotes = await vendor_quotes_col.find().sort("submitted_at", -1).to_list(100)
    return serialize_list(quotes)
