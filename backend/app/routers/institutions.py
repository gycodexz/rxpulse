from app.database import institutions_col
from app.models import InstitutionIn
from app.routers.generic_crud import build_crud_router

router = build_crud_router(
    prefix="/api/institutions",
    tag="institutions",
    collection=institutions_col,
    model_cls=InstitutionIn,
    write_roles=("admin",),
)
