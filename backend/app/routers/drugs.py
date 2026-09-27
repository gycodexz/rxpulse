from app.database import drugs_col
from app.models import DrugIn
from app.routers.generic_crud import build_crud_router

router = build_crud_router(
    prefix="/api/drugs",
    tag="drugs",
    collection=drugs_col,
    model_cls=DrugIn,
    write_roles=("admin", "pharmacist"),
)
