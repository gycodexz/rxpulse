from fastapi import APIRouter, HTTPException, status
from app.database import users_col
from app.models import RegisterRequest, LoginRequest, TokenResponse
from app.auth import hash_password, verify_password, create_access_token
from app.utils import serialize, now_iso

router = APIRouter(prefix="/api/auth", tags=["auth"])

ALLOWED_ROLES = {"admin", "pharmacist", "vendor", "institution_staff"}


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    if payload.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role selected")

    existing = await users_col.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": payload.role,
        "institution_id": payload.institution_id,
        "vendor_id": payload.vendor_id,
        "is_active": True,
        "created_at": now_iso(),
    }
    result = await users_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    user = serialize(doc)
    user.pop("password", None)
    token = create_access_token({"sub": user["_id"], "role": user["role"]})
    return {"access_token": token, "user": user}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await users_col.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="This account has been deactivated")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    safe_user = serialize(user)
    safe_user.pop("password", None)
    return {"access_token": token, "user": safe_user}
