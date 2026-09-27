from fastapi import APIRouter, Depends
from app.database import (
    drugs_col, vendors_col, institutions_col, purchase_orders_col,
    distributions_col, inventory_col, users_col,
)
from app.auth import get_current_user
from app.utils import serialize_list

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(current_user: dict = Depends(get_current_user)):
    total_drugs = await drugs_col.count_documents({})
    total_vendors = await vendors_col.count_documents({})
    total_institutions = await institutions_col.count_documents({})
    pending_orders = await purchase_orders_col.count_documents({"status": "pending"})
    dispatched = await distributions_col.count_documents({"status": "dispatched"})
    total_users = await users_col.count_documents({})

    drugs = await drugs_col.find().to_list(1000)
    low_stock = [d for d in drugs if d.get("quantity", 0) <= d.get("reorder_level", 0)]

    recent_tx = await inventory_col.find().sort("transaction_date", -1).limit(8).to_list(8)
    recent_orders = await purchase_orders_col.find().sort("order_date", -1).limit(5).to_list(5)
    recent_dist = await distributions_col.find().sort("dispatch_date", -1).limit(5).to_list(5)

    return {
        "total_drugs": total_drugs,
        "total_vendors": total_vendors,
        "total_institutions": total_institutions,
        "pending_orders": pending_orders,
        "dispatched_distributions": dispatched,
        "total_users": total_users,
        "low_stock_count": len(low_stock),
        "low_stock_drugs": serialize_list(low_stock[:6]),
        "recent_transactions": serialize_list(recent_tx),
        "recent_orders": serialize_list(recent_orders),
        "recent_distributions": serialize_list(recent_dist),
    }
