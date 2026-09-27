from app.database import vendors_col
from app.models import VendorIn
from app.routers.generic_crud import build_crud_router

router = build_crud_router(
    prefix="/api/vendors",
    tag="vendors",
    collection=vendors_col,
    model_cls=VendorIn,
    write_roles=("admin",),
)
