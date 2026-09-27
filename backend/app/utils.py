from bson import ObjectId
from datetime import datetime


def serialize(doc: dict) -> dict:
    # To Convert a MongoDB document into a JSON-safe dict.
    if not doc:
        return doc
    doc = dict(doc)
    doc["_id"] = str(doc["_id"]) # COnverting the "_id" of Mongo to "id" for React
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            doc[k] = str(v)
    return doc


def serialize_list(docs) -> list:
    return [serialize(d) for d in docs]


def now_iso() -> str:
    return datetime.utcnow().isoformat()
