from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import ensure_indexes
from app.routers import (
    auth_routes, institutions, vendors, drugs,
    purchase_orders, inventory, distributions, dashboard, users,
)

app = FastAPI(
    title="RxPulse API",
    description="Drug Inventory and Supply Chain Tracking System — backend API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "RxPulse API"}


app.include_router(auth_routes.router)
app.include_router(users.router)
app.include_router(institutions.router)
app.include_router(vendors.router)
app.include_router(drugs.router)
app.include_router(purchase_orders.router)
app.include_router(inventory.router)
app.include_router(distributions.router)
app.include_router(dashboard.router)
