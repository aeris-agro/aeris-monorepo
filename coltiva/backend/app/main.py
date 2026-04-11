from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    agents,
    farmers,
    health,
    pest_reports,
    planting,
    recommendations,
    ussd,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Coltiva API",
    description="Production Intelligence — Farmer Registry, Planting & Advisory",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"

app.include_router(health.router, prefix=API_V1, tags=["Health"])
app.include_router(farmers.router, prefix=API_V1, tags=["Farmers"])
app.include_router(planting.router, prefix=API_V1, tags=["Planting"])
app.include_router(pest_reports.router, prefix=API_V1, tags=["Pest Reports"])
app.include_router(recommendations.router, prefix=API_V1, tags=["Recommendations"])
app.include_router(agents.router, prefix=API_V1, tags=["Field Agents"])
app.include_router(ussd.router, prefix=API_V1, tags=["USSD"])
