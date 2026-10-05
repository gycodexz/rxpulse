from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from app.database import (
    drugs_col, vendors_col, institutions_col, purchase_orders_col,
    distributions_col, inventory_col, users_col, requisitions_col, consumption_logs_col
)
from app.auth import get_current_user
from app.utils import serialize_list, serialize

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


@router.get("/admin")
async def admin_dashboard(current_user: dict = Depends(get_current_user)):
    drugs = await drugs_col.find().to_list(1000)
    total_drugs = len(drugs)
    total_inventory_value = sum(d.get("quantity", 0) * d.get("price_per_unit", 0) for d in drugs)
    
    # Shortages calculation with burn rate and projected stockout days
    shortages = []
    critical_count = 0
    out_of_stock_count = 0

    for d in drugs:
        qty = d.get("quantity", 0)
        reorder = d.get("reorder_level", 50)
        daily_burn = max(5, int(reorder / 7))  # Estimated daily consumption
        
        if qty == 0:
            severity = "OUT_OF_STOCK"
            run_out_days = 0
            out_of_stock_count += 1
            rec_reorder = max(100, reorder * 2)
        elif qty <= int(reorder * 0.4):
            severity = "CRITICAL"
            run_out_days = max(1, int(qty / daily_burn))
            critical_count += 1
            rec_reorder = max(50, reorder * 2 - qty)
        elif qty <= reorder:
            severity = "LOW_STOCK"
            run_out_days = max(3, int(qty / daily_burn))
            rec_reorder = max(30, reorder * 2 - qty)
        else:
            continue

        item = serialize(d)
        item["severity"] = severity
        item["daily_burn_rate"] = daily_burn
        item["projected_stockout_days"] = run_out_days
        item["recommended_reorder"] = rec_reorder
        shortages.append(item)

    shortages.sort(key=lambda x: (x["severity"] != "OUT_OF_STOCK", x["projected_stockout_days"]))

    orders = await purchase_orders_col.find().to_list(500)
    pending_orders = [o for o in orders if o.get("status") == "pending"]
    pending_po_value = sum(o.get("total_order_value", 0) for o in pending_orders)

    total_vendors = await vendors_col.count_documents({})
    total_institutions = await institutions_col.count_documents({})
    total_users = await users_col.count_documents({})

    return {
        "total_drugs": total_drugs,
        "total_inventory_value": total_inventory_value,
        "out_of_stock_count": out_of_stock_count,
        "critical_count": critical_count,
        "total_shortages_count": len(shortages),
        "shortages": shortages,
        "pending_po_count": len(pending_orders),
        "pending_po_value": pending_po_value,
        "recent_pending_orders": serialize_list(pending_orders[:5]),
        "total_vendors": total_vendors,
        "total_institutions": total_institutions,
        "total_users": total_users,
    }


@router.get("/pharmacist")
async def pharmacist_dashboard(current_user: dict = Depends(get_current_user)):
    drugs = await drugs_col.find().to_list(1000)
    now_date = datetime.utcnow().date()

    near_expiry = []
    expired_count = 0
    quarantined_count = 0

    for d in drugs:
        exp_str = d.get("expiry_date")
        if exp_str:
            try:
                exp_date = datetime.strptime(exp_str[:10], "%Y-%m-%d").date()
                days_left = (exp_date - now_date).days
                if days_left <= 0:
                    expired_count += 1
                    status = "EXPIRED"
                elif days_left <= 30:
                    status = "CRITICAL_30_DAYS"
                elif days_left <= 90:
                    status = "WARNING_90_DAYS"
                else:
                    status = "GOOD"
                
                if days_left <= 90:
                    item = serialize(d)
                    item["days_until_expiry"] = days_left
                    item["expiry_status"] = status
                    near_expiry.append(item)
            except Exception:
                pass

    near_expiry.sort(key=lambda x: x["days_until_expiry"])

    low_stock = [serialize(d) for d in drugs if d.get("quantity", 0) <= d.get("reorder_level", 0)]
    recent_tx = await inventory_col.find().sort("transaction_date", -1).limit(10).to_list(10)
    pending_dispatches = await distributions_col.find({"status": "dispatched"}).sort("dispatch_date", -1).limit(6).to_list(6)
    open_pos = await purchase_orders_col.find({"status": {"$in": ["pending", "approved", "shipped"]}}).sort("order_date", -1).limit(6).to_list(6)

    return {
        "total_catalog_drugs": len(drugs),
        "near_expiry_count": len(near_expiry),
        "expired_count": expired_count,
        "near_expiry_list": near_expiry[:8],
        "low_stock_count": len(low_stock),
        "low_stock_list": low_stock[:6],
        "recent_transactions": serialize_list(recent_tx),
        "pending_dispatches": serialize_list(pending_dispatches),
        "open_purchase_orders": serialize_list(open_pos),
    }


@router.get("/vendor")
async def vendor_dashboard(current_user: dict = Depends(get_current_user)):
    vendor_id = current_user.get("vendor_id")
    query = {"vendor_id": vendor_id} if vendor_id else {}

    orders = await purchase_orders_col.find(query).sort("order_date", -1).to_list(100)
    
    total_supplied_value = sum(o.get("total_order_value", 0) for o in orders if o.get("status") in ["shipped", "delivered"])
    pending_orders = [o for o in orders if o.get("status") == "pending"]
    approved_orders = [o for o in orders if o.get("status") == "approved"]
    shipped_orders = [o for o in orders if o.get("status") == "shipped"]
    delivered_orders = [o for o in orders if o.get("status") == "delivered"]

    # Central warehouse urgent shortages that this vendor can supply
    drugs = await drugs_col.find().to_list(500)
    urgent_demands = []
    for d in drugs:
        if d.get("quantity", 0) <= d.get("reorder_level", 0):
            item = serialize(d)
            item["deficit"] = max(20, d.get("reorder_level", 50) * 2 - d.get("quantity", 0))
            urgent_demands.append(item)

    return {
        "total_orders": len(orders),
        "total_revenue": total_supplied_value,
        "pending_orders_count": len(pending_orders),
        "approved_orders_count": len(approved_orders),
        "shipped_orders_count": len(shipped_orders),
        "delivered_orders_count": len(delivered_orders),
        "recent_orders": serialize_list(orders[:6]),
        "urgent_demands": urgent_demands[:6],
    }


@router.get("/staff")
async def staff_dashboard(current_user: dict = Depends(get_current_user)):
    institution_id = current_user.get("institution_id")
    dist_query = {"institution_id": institution_id} if institution_id else {}

    distributions = await distributions_col.find(dist_query).sort("dispatch_date", -1).to_list(100)
    in_transit = [d for d in distributions if d.get("status") == "dispatched"]
    delivered = [d for d in distributions if d.get("status") == "delivered"]

    recent_consumptions = await consumption_logs_col.find().sort("date", -1).limit(10).to_list(10)
    requisitions = await requisitions_col.find().sort("created_at", -1).limit(6).to_list(6)

    # Catalog preview for requisition
    drugs = await drugs_col.find({"quantity": {"$gt": 0}}).limit(10).to_list(10)

    return {
        "in_transit_shipments_count": len(in_transit),
        "in_transit_shipments": serialize_list(in_transit[:5]),
        "delivered_count": len(delivered),
        "recent_requisitions": serialize_list(requisitions),
        "recent_consumption_logs": serialize_list(recent_consumptions),
        "available_medicines": serialize_list(drugs),
    }
