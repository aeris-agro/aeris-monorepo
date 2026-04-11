from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    alerts,
    fire,
    forecast,
    health,
    ndvi,
    rainfall,
    soil,
    stations,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Aeryion API",
    description="Environmental Intelligence — Weather, Remote Sensing & Alerts",
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
app.include_router(forecast.router, prefix=API_V1, tags=["Forecast"])
app.include_router(rainfall.router, prefix=API_V1, tags=["Rainfall"])
app.include_router(ndvi.router, prefix=API_V1, tags=["NDVI"])
app.include_router(soil.router, prefix=API_V1, tags=["Soil"])
app.include_router(alerts.router, prefix=API_V1, tags=["Alerts"])
app.include_router(stations.router, prefix=API_V1, tags=["Stations"])
app.include_router(fire.router, prefix=API_V1, tags=["Fire"])
