# Builds a simple CRUD router for a collection.
# Used for straightforward master-data collections (institutions, vendors, drugs) where there is no extra cross-collection business logic.

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel

from app.utils import serialize, serialize_list, now_iso
from app.auth import get_current_user, require_roles


def build_crud_router(prefix: str, tag: str, collection, model_cls, write_roles):
    router = APIRouter(prefix=prefix, tags=[tag])

    @router.get("")
    async def list_items(current_user: dict = Depends(get_current_user)):
        items = await collection.find().sort("created_at", -1).to_list(500)
        return serialize_list(items)

    @router.get("/{item_id}")
    async def get_item(item_id: str, current_user: dict = Depends(get_current_user)):
        try:
            oid = ObjectId(item_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid id")
        item = await collection.find_one({"_id": oid})
        if not item:
            raise HTTPException(status_code=404, detail="Not found")
        return serialize(item)

    @router.post("")
    async def create_item(payload: model_cls, current_user: dict = Depends(require_roles(*write_roles))):
        doc = payload.model_dump()
        doc["created_at"] = now_iso()
        doc["is_active"] = doc.get("is_active", True)
        result = await collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return serialize(doc)

    @router.put("/{item_id}")
    async def update_item(item_id: str, payload: model_cls, current_user: dict = Depends(require_roles(*write_roles))):
        try:
            oid = ObjectId(item_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid id")
        doc = payload.model_dump()
        result = await collection.update_one({"_id": oid}, {"$set": doc})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        item = await collection.find_one({"_id": oid})
        return serialize(item)

    @router.delete("/{item_id}")
    async def delete_item(item_id: str, current_user: dict = Depends(require_roles(*write_roles))):
        try:
            oid = ObjectId(item_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid id")
        result = await collection.delete_one({"_id": oid})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        return {"detail": "Deleted"}

    return router
