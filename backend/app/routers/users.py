from fastapi import APIRouter, Depends
from app.database import users_col
from app.utils import serialize_list
from app.auth import require_roles

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
async def list_users(current_user: dict = Depends(require_roles("admin"))):
    users = await users_col.find().sort("created_at", -1).to_list(500)
    result = serialize_list(users)
    for u in result:
        u.pop("password", None)
    return result
