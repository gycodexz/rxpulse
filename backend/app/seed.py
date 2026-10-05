import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "rxpulse")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pw(pw: str) -> str:
    return pwd_context.hash(pw)

def now_iso(days_offset=0):
    dt = datetime.utcnow() + timedelta(days=days_offset)
    return dt.isoformat()

async def seed():
    print(f"Connecting to MongoDB {MONGO_URI}, DB: {DB_NAME}...")

    # 1. Institutions
    inst_col = db["institutions"]
    institutions_data = [
        {
            "name": "Apex Trauma & Multispecialty Hospital",
            "type": "hospital",
            "contact_person": "Dr. Sameer Kulkarni",
            "contact_phone": "9820112233",
            "email": "apex.admin@hospital.org",
            "address": {"street": "Dr. Ambedkar Road", "city": "Mumbai", "state": "Maharashtra", "pincode": "400012"},
            "is_active": True,
            "created_at": now_iso(-30),
        },
        {
            "name": "City General Healthcare Center",
            "type": "hospital",
            "contact_person": "Dr. Sunita Deshmukh",
            "contact_phone": "9890223344",
            "email": "citygeneral@punehealth.gov",
            "address": {"street": "FC Road", "city": "Pune", "state": "Maharashtra", "pincode": "411004"},
            "is_active": True,
            "created_at": now_iso(-20),
        },
        {
            "name": "Green Cross Primary Health Centre (PHC)",
            "type": "phc",
            "contact_person": "Dr. Ramesh Patil",
            "contact_phone": "9823445566",
            "email": "phc.greencross@nhm.gov",
            "address": {"street": "Civil Hospital Road", "city": "Nashik", "state": "Maharashtra", "pincode": "422001"},
            "is_active": True,
            "created_at": now_iso(-15),
        },
    ]

    await inst_col.delete_many({})
    res_inst = await inst_col.insert_many(institutions_data)
    inst_ids = [str(id_) for id_ in res_inst.inserted_ids]
    print(f"Seeded {len(inst_ids)} institutions.")

    # 2. Vendors
    vendor_col = db["vendors"]
    vendors_data = [
        {
            "name": "Sun Pharma Distribution Logistics",
            "contact_person": "Amit Shah",
            "phone": "9819001122",
            "email": "orders@sunpharma-dist.com",
            "drug_license_number": "MH-TZ-2024-9182",
            "gst_number": "27AABCS1429B1Z1",
            "address": {"street": "MIDC Andheri East", "city": "Mumbai", "state": "Maharashtra", "pincode": "400093"},
            "is_active": True,
            "created_at": now_iso(-40),
        },
        {
            "name": "Cipla Institutional Healthcare Supply",
            "contact_person": "Vikram Verma",
            "phone": "9811223344",
            "email": "institutions@cipla.com",
            "drug_license_number": "DL-2023-4412",
            "gst_number": "07AACCC1122D1Z2",
            "address": {"street": "Okhla Industrial Area", "city": "New Delhi", "state": "Delhi", "pincode": "110020"},
            "is_active": True,
            "created_at": now_iso(-35),
        },
        {
            "name": "Dr. Reddy's Pharma Logistics",
            "contact_person": "P. Ramakrishnan",
            "phone": "9848011223",
            "email": "supply@drreddys.com",
            "drug_license_number": "TS-2024-8833",
            "gst_number": "36AABCD9988E1Z3",
            "address": {"street": "Genome Valley", "city": "Hyderabad", "state": "Telangana", "pincode": "500078"},
            "is_active": True,
            "created_at": now_iso(-25),
        },
    ]

    await vendor_col.delete_many({})
    res_vend = await vendor_col.insert_many(vendors_data)
    vendor_ids = [str(id_) for id_ in res_vend.inserted_ids]
    print(f"Seeded {len(vendor_ids)} vendors.")

    # 3. Users for all 4 roles
    users_col = db["users"]
    users_data = [
        {
            "name": "Dr. Ananya Roy (Executive Health Director)",
            "email": "admin@rxpulse.org",
            "password": hash_pw("password123"),
            "role": "admin",
            "is_active": True,
            "created_at": now_iso(-60),
        },
        {
            "name": "Vikram Sen (Chief Pharmacist)",
            "email": "pharmacist@rxpulse.org",
            "password": hash_pw("password123"),
            "role": "pharmacist",
            "is_active": True,
            "created_at": now_iso(-60),
        },
        {
            "name": "Rajesh Kumar (Sun Pharma Lead)",
            "email": "vendor@rxpulse.org",
            "password": hash_pw("password123"),
            "role": "vendor",
            "vendor_id": vendor_ids[0],
            "is_active": True,
            "created_at": now_iso(-60),
        },
        {
            "name": "Sister Priya Sharma (Head Nurse)",
            "email": "staff@rxpulse.org",
            "password": hash_pw("password123"),
            "role": "institution_staff",
            "institution_id": inst_ids[0],
            "is_active": True,
            "created_at": now_iso(-60),
        },
    ]

    await users_col.delete_many({})
    res_users = await users_col.insert_many(users_data)
    user_ids = [str(id_) for id_ in res_users.inserted_ids]
    print(f"Seeded {len(user_ids)} users across all 4 roles.")

    # 4. Drugs catalog (Diverse stocks: critical shortage, low stock, healthy)
    drugs_col = db["drugs"]
    drugs_data = [
        {
            "name": "Paracetamol 500mg",
            "generic_name": "Acetaminophen",
            "manufacturer": "Cipla",
            "drug_form": "tablet",
            "quantity": 1450,
            "unit": "tablets",
            "price_per_unit": 2.50,
            "reorder_level": 250,
            "batch_number": "BT-PCM-2401",
            "expiry_date": (datetime.utcnow() + timedelta(days=540)).strftime("%Y-%m-%d"),
            "schedule": "OTC",
            "salt_composition": "Paracetamol IP 500mg",
            "storage_condition": "Store below 30°C in cool dry place",
            "prescription_required": False,
            "vendor_id": vendor_ids[1],
            "created_at": now_iso(-45),
        },
        {
            "name": "Amoxicillin 500mg",
            "generic_name": "Amoxicillin Trihydrate",
            "manufacturer": "Sun Pharma",
            "drug_form": "capsule",
            "quantity": 38,  # Critical shortage!
            "unit": "capsules",
            "price_per_unit": 8.75,
            "reorder_level": 200,
            "batch_number": "BT-AMX-2388",
            "expiry_date": (datetime.utcnow() + timedelta(days=210)).strftime("%Y-%m-%d"),
            "schedule": "H",
            "salt_composition": "Amoxicillin 500mg",
            "storage_condition": "Store in airtight containers below 25°C",
            "prescription_required": True,
            "vendor_id": vendor_ids[0],
            "created_at": now_iso(-40),
        },
        {
            "name": "Human Insulin 100IU/ml",
            "generic_name": "Recombinant Human Insulin",
            "manufacturer": "Sun Pharma",
            "drug_form": "injection",
            "quantity": 14,  # Critical shortage!
            "unit": "vials",
            "price_per_unit": 185.00,
            "reorder_level": 120,
            "batch_number": "BT-INS-9901",
            "expiry_date": (datetime.utcnow() + timedelta(days=80)).strftime("%Y-%m-%d"),
            "schedule": "H",
            "salt_composition": "Human Insulin IP 100 IU/ml",
            "storage_condition": "Cold chain 2°C - 8°C (Do not freeze)",
            "prescription_required": True,
            "vendor_id": vendor_ids[0],
            "created_at": now_iso(-30),
        },
        {
            "name": "Remdesivir 100mg Lyophilized",
            "generic_name": "Remdesivir",
            "manufacturer": "Dr. Reddy's",
            "drug_form": "injection",
            "quantity": 0,  # OUT OF STOCK
            "unit": "vials",
            "price_per_unit": 1800.00,
            "reorder_level": 50,
            "batch_number": "BT-RDV-1022",
            "expiry_date": (datetime.utcnow() + timedelta(days=360)).strftime("%Y-%m-%d"),
            "schedule": "H1",
            "salt_composition": "Remdesivir 100mg sterile powder for infusion",
            "storage_condition": "Store below 30°C",
            "prescription_required": True,
            "vendor_id": vendor_ids[2],
            "created_at": now_iso(-20),
        },
        {
            "name": "Azithromycin 500mg",
            "generic_name": "Azithromycin Dihydrate",
            "manufacturer": "Cipla",
            "drug_form": "tablet",
            "quantity": 620,
            "unit": "tablets",
            "price_per_unit": 22.00,
            "reorder_level": 150,
            "batch_number": "BT-AZI-7711",
            "expiry_date": (datetime.utcnow() + timedelta(days=400)).strftime("%Y-%m-%d"),
            "schedule": "H",
            "salt_composition": "Azithromycin IP 500mg",
            "storage_condition": "Store in dry place below 25°C",
            "prescription_required": True,
            "vendor_id": vendor_ids[1],
            "created_at": now_iso(-35),
        },
        {
            "name": "Ceftriaxone 1g Vial",
            "generic_name": "Ceftriaxone Sodium",
            "manufacturer": "Sun Pharma",
            "drug_form": "injection",
            "quantity": 42,  # Critical shortage!
            "unit": "vials",
            "price_per_unit": 65.00,
            "reorder_level": 180,
            "batch_number": "BT-CFT-4491",
            "expiry_date": (datetime.utcnow() + timedelta(days=25)).strftime("%Y-%m-%d"),  # Near expiry!
            "schedule": "H",
            "salt_composition": "Ceftriaxone Sodium IP 1000mg",
            "storage_condition": "Protected from light, below 25°C",
            "prescription_required": True,
            "vendor_id": vendor_ids[0],
            "created_at": now_iso(-28),
        },
        {
            "name": "Metformin 500mg Sustained Release",
            "generic_name": "Metformin Hydrochloride",
            "manufacturer": "Sun Pharma",
            "drug_form": "tablet",
            "quantity": 1800,
            "unit": "tablets",
            "price_per_unit": 3.40,
            "reorder_level": 300,
            "batch_number": "BT-MTF-8821",
            "expiry_date": (datetime.utcnow() + timedelta(days=620)).strftime("%Y-%m-%d"),
            "schedule": "OTC",
            "salt_composition": "Metformin Hydrochloride IP 500mg SR",
            "storage_condition": "Store in dry place",
            "prescription_required": False,
            "vendor_id": vendor_ids[0],
            "created_at": now_iso(-50),
        },
        {
            "name": "Salbutamol Respirator Solution 5mg/ml",
            "generic_name": "Salbutamol Sulphate",
            "manufacturer": "Cipla",
            "drug_form": "drops",
            "quantity": 55,  # Low stock
            "unit": "bottles",
            "price_per_unit": 42.00,
            "reorder_level": 90,
            "batch_number": "BT-SBT-2201",
            "expiry_date": (datetime.utcnow() + timedelta(days=190)).strftime("%Y-%m-%d"),
            "schedule": "OTC",
            "salt_composition": "Salbutamol Sulphate IP 5mg/ml",
            "storage_condition": "Store below 25°C, protect from light",
            "prescription_required": False,
            "vendor_id": vendor_ids[1],
            "created_at": now_iso(-22),
        },
        {
            "name": "Pantoprazole 40mg IV",
            "generic_name": "Pantoprazole Sodium",
            "manufacturer": "Cipla",
            "drug_form": "injection",
            "quantity": 480,
            "unit": "vials",
            "price_per_unit": 54.00,
            "reorder_level": 100,
            "batch_number": "BT-PAN-9102",
            "expiry_date": (datetime.utcnow() + timedelta(days=480)).strftime("%Y-%m-%d"),
            "schedule": "OTC",
            "salt_composition": "Pantoprazole Sodium IP 40mg",
            "storage_condition": "Store below 25°C",
            "prescription_required": False,
            "vendor_id": vendor_ids[1],
            "created_at": now_iso(-18),
        },
        {
            "name": "Alprazolam 0.5mg Tablets",
            "generic_name": "Alprazolam",
            "manufacturer": "Dr. Reddy's",
            "drug_form": "tablet",
            "quantity": 110,
            "unit": "tablets",
            "price_per_unit": 5.50,
            "reorder_level": 60,
            "batch_number": "BT-ALP-3312",
            "expiry_date": (datetime.utcnow() + timedelta(days=320)).strftime("%Y-%m-%d"),
            "schedule": "X",  # Scheduled Narcotic/Psychotropic
            "salt_composition": "Alprazolam IP 0.5mg",
            "storage_condition": "High security locked storage below 25°C",
            "prescription_required": True,
            "vendor_id": vendor_ids[2],
            "created_at": now_iso(-12),
        },
    ]

    await drugs_col.delete_many({})
    res_drugs = await drugs_col.insert_many(drugs_data)
    drug_ids = [str(id_) for id_ in res_drugs.inserted_ids]
    print(f"Seeded {len(drug_ids)} drug items.")

    # 5. Purchase Orders
    po_col = db["purchase_orders"]
    orders_data = [
        {
            "order_number": "PO-2026-1044",
            "vendor_id": vendor_ids[0],
            "ordered_by": user_ids[1],
            "order_date": now_iso(-5),
            "expected_delivery": now_iso(3),
            "status": "shipped",
            "courier_name": "Blue Dart Express Logistics",
            "tracking_number": "BD-882910429",
            "items": [
                {
                    "drug_id": drug_ids[1],
                    "drug_name": "Amoxicillin 500mg",
                    "quantity_ordered": 500,
                    "unit": "capsules",
                    "price_per_unit": 8.50,
                    "total_price": 4250.0,
                },
                {
                    "drug_id": drug_ids[2],
                    "drug_name": "Human Insulin 100IU/ml",
                    "quantity_ordered": 100,
                    "unit": "vials",
                    "price_per_unit": 180.00,
                    "total_price": 18000.0,
                },
            ],
            "total_order_value": 22250.0,
            "delivery_date": None,
            "notes": "Emergency replenishment for central stock shortages",
        },
        {
            "order_number": "PO-2026-1088",
            "vendor_id": vendor_ids[2],
            "ordered_by": user_ids[1],
            "order_date": now_iso(-2),
            "expected_delivery": now_iso(5),
            "status": "pending",
            "items": [
                {
                    "drug_id": drug_ids[3],
                    "drug_name": "Remdesivir 100mg Lyophilized",
                    "quantity_ordered": 60,
                    "unit": "vials",
                    "price_per_unit": 1750.00,
                    "total_price": 105000.0,
                }
            ],
            "total_order_value": 105000.0,
            "delivery_date": None,
            "notes": "Awaiting Administrator financial approval for critical ICU stock",
        },
        {
            "order_number": "PO-2026-1012",
            "vendor_id": vendor_ids[1],
            "ordered_by": user_ids[1],
            "order_date": now_iso(-14),
            "expected_delivery": now_iso(-7),
            "status": "delivered",
            "courier_name": "DTDC Express",
            "tracking_number": "DTDC-4910284",
            "items": [
                {
                    "drug_id": drug_ids[0],
                    "drug_name": "Paracetamol 500mg",
                    "quantity_ordered": 1000,
                    "unit": "tablets",
                    "price_per_unit": 2.40,
                    "total_price": 2400.0,
                }
            ],
            "total_order_value": 2400.0,
            "delivery_date": now_iso(-6),
            "notes": "Delivered and verified in good condition",
        },
    ]

    await po_col.delete_many({})
    await po_col.insert_many(orders_data)
    print("Seeded purchase orders.")

    # 6. Distributions
    dist_col = db["distributions"]
    dist_data = [
        {
            "distribution_number": "DIST-2026-8812",
            "institution_id": inst_ids[0],
            "institution_name": "Apex Trauma & Multispecialty Hospital",
            "dispatched_by": user_ids[1],
            "dispatch_date": now_iso(-1),
            "status": "dispatched",
            "items": [
                {
                    "drug_id": drug_ids[0],
                    "drug_name": "Paracetamol 500mg",
                    "batch_number": "BT-PCM-2401",
                    "quantity": 300,
                    "unit": "tablets",
                },
                {
                    "drug_id": drug_ids[4],
                    "drug_name": "Azithromycin 500mg",
                    "batch_number": "BT-AZI-7711",
                    "quantity": 100,
                    "unit": "tablets",
                },
            ],
            "received_by": None,
            "delivery_date": None,
            "notes": "Priority dispatch for ICU and Emergency Trauma ward",
        },
        {
            "distribution_number": "DIST-2026-8790",
            "institution_id": inst_ids[1],
            "institution_name": "City General Healthcare Center",
            "dispatched_by": user_ids[1],
            "dispatch_date": now_iso(-8),
            "status": "delivered",
            "items": [
                {
                    "drug_id": drug_ids[6],
                    "drug_name": "Metformin 500mg Sustained Release",
                    "batch_number": "BT-MTF-8821",
                    "quantity": 400,
                    "unit": "tablets",
                }
            ],
            "received_by": user_ids[3],
            "delivery_date": now_iso(-7),
            "notes": "Received in good condition, batch inspected by dispensary staff",
        },
    ]

    await dist_col.delete_many({})
    await dist_col.insert_many(dist_data)
    print("Seeded distributions.")

    # 7. Hospital Requisitions
    req_col = db["requisitions"]
    req_data = [
        {
            "requisition_number": "REQ-2026-4410",
            "institution_id": inst_ids[0],
            "institution_name": "Apex Trauma & Multispecialty Hospital",
            "department": "Emergency Trauma Unit",
            "urgency": "urgent",
            "requested_by": user_ids[3],
            "requester_name": "Sister Priya Sharma",
            "created_at": now_iso(-1),
            "status": "submitted",
            "items": [
                {"drug_id": drug_ids[2], "drug_name": "Human Insulin 100IU/ml", "requested_quantity": 30, "unit": "vials"},
                {"drug_id": drug_ids[5], "drug_name": "Ceftriaxone 1g Vial", "requested_quantity": 50, "unit": "vials"},
            ],
            "notes": "High patient intake this weekend; running low on emergency IV vials",
        }
    ]
    await req_col.delete_many({})
    await req_col.insert_many(req_data)
    print("Seeded hospital requisitions.")

    # 8. Ward Consumption Logs
    cons_col = db["consumption_logs"]
    cons_data = [
        {
            "drug_id": drug_ids[0],
            "drug_name": "Paracetamol 500mg",
            "ward_name": "Trauma Ward 3",
            "patient_identifier": "PT-2026-901",
            "quantity": 2,
            "unit": "tablets",
            "prescribed_by": "Dr. Kulkarni",
            "logged_by": user_ids[3],
            "staff_name": "Sister Priya Sharma",
            "institution_id": inst_ids[0],
            "date": now_iso(-1),
            "notes": "Administered post-surgery pain relief",
        },
        {
            "drug_id": drug_ids[4],
            "drug_name": "Azithromycin 500mg",
            "ward_name": "Pulmonology Ward B",
            "patient_identifier": "PT-2026-884",
            "quantity": 1,
            "unit": "tablets",
            "prescribed_by": "Dr. Joshi",
            "logged_by": user_ids[3],
            "staff_name": "Sister Priya Sharma",
            "institution_id": inst_ids[0],
            "date": now_iso(0),
            "notes": "Respiratory tract infection antibiotic course",
        },
    ]
    await cons_col.delete_many({})
    await cons_col.insert_many(cons_data)
    print("Seeded ward consumption logs.")

    print("\n✅ Seed completed successfully! All 4 roles and realistic datasets are ready.")

if __name__ == "__main__":
    asyncio.run(seed())
