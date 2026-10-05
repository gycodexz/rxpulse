from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
import random

from app.database import distributions_col, institutions_col, inventory_col, drugs_col, requisitions_col
from app.models import DistributionIn, DistributionStatusUpdate, HospitalRequisitionIn
from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/api/distributions", tags=["distributions"])


def generate_dist_number() -> str:
    from datetime import datetime
    year = datetime.utcnow().year
    return f"DIST-{year}-{random.randint(1000, 9999)}"


def generate_req_number() -> str:
    from datetime import datetime
    year = datetime.utcnow().year
    return f"REQ-{year}-{random.randint(1000, 9999)}"


@router.get("")
async def list_distributions(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user.get("role") == "institution_staff" and current_user.get("institution_id"):
        query = {"institution_id": current_user["institution_id"]}
    items = await distributions_col.find(query).sort("dispatch_date", -1).to_list(500)
    return serialize_list(items)


@router.post("")
async def create_distribution(payload: DistributionIn, current_user: dict = Depends(require_roles("admin", "pharmacist"))):
    try:
        inst_oid = ObjectId(payload.institution_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid institution id")

    institution = await institutions_col.find_one({"_id": inst_oid})
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    doc = {
        "distribution_number": generate_dist_number(),
        "institution_id": payload.institution_id,
        "institution_name": institution["name"],
        "dispatched_by": current_user["_id"],
        "dispatch_date": now_iso(),
        "status": "dispatched",
        "items": [item.model_dump() for item in payload.items],
        "received_by": None,
        "delivery_date": None,
        "notes": payload.notes,
    }
    result = await distributions_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Log matching "out" inventory transaction for every item and reduce drug stock
    for item in payload.items:
        try:
            drug_oid = ObjectId(item.drug_id)
        except InvalidId:
            continue
        await inventory_col.insert_one({
            "drug_id": item.drug_id,
            "drug_name": item.drug_name,
            "transaction_type": "out",
            "quantity": item.quantity,
            "unit": item.unit,
            "batch_number": item.batch_number,
            "expiry_date": item.expiry_date,
            "distribution_id": str(doc["_id"]),
            "institution_id": payload.institution_id,
            "transaction_date": now_iso(),
            "performed_by": current_user["_id"],
            "notes": f"Dispatched via {doc['distribution_number']}",
        })
        await drugs_col.update_one({"_id": drug_oid}, {"$inc": {"quantity": -item.quantity}})

    return serialize(doc)


@router.patch("/{dist_id}/status")
async def update_status(dist_id: str, payload: DistributionStatusUpdate, current_user: dict = Depends(require_roles("admin", "pharmacist", "institution_staff"))):
    allowed = {"dispatched", "delivered", "returned"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status value")
    try:
        oid = ObjectId(dist_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid id")

    update_fields = {"status": payload.status}
    if payload.status == "delivered":
        update_fields["delivery_date"] = now_iso()
        update_fields["received_by"] = current_user["_id"]
    if payload.acknowledgment_notes:
        update_fields["acknowledgment_notes"] = payload.acknowledgment_notes

    result = await distributions_col.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Distribution not found")
    item = await distributions_col.find_one({"_id": oid})
    return serialize(item)


# Hospital Requisitions / Indent Cart
@router.post("/requisitions")
async def create_requisition(payload: HospitalRequisitionIn, current_user: dict = Depends(get_current_user)):
    institution_id = payload.institution_id or current_user.get("institution_id")
    institution_name = payload.institution_name
    if not institution_name and institution_id:
        try:
            inst = await institutions_col.find_one({"_id": ObjectId(institution_id)})
            if inst:
                institution_name = inst["name"]
        except Exception:
            pass

    doc = {
        "requisition_number": generate_req_number(),
        "institution_id": institution_id,
        "institution_name": institution_name or "Hospital Dispensary",
        "department": payload.department,
        "urgency": payload.urgency,
        "requested_by": current_user["_id"],
        "requester_name": current_user.get("name", "Staff Nurse"),
        "created_at": now_iso(),
        "status": "submitted",  # submitted, approved, fulfilled, rejected
        "items": [it.model_dump() for it in payload.items],
        "notes": payload.notes,
    }
    result = await requisitions_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize(doc)


@router.get("/requisitions/all")
async def list_requisitions(current_user: dict = Depends(get_current_user)):
    reqs = await requisitions_col.find().sort("created_at", -1).to_list(200)
    return serialize_list(reqs)
