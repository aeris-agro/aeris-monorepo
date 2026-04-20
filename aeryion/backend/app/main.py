# FILE: app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, ndvi, rainfall, soil, alerts, forecast, fire, stations
from app.config import settings

app = FastAPI(
    title="Aeryion Environmental Intelligence API",
    description="Real-time environmental intelligence for Lango sub-region, Uganda.",
    version="1.0.0",
    docs_url="/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aeryion.aerisgroup.ug",
        "https://coltiva.aerisgroup.ug",
        "https://linktrade.aerisgroup.ug",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-Service-Key"],
)

app.include_router(health.router)
app.include_router(ndvi.router,      prefix="/v1/ndvi")
app.include_router(rainfall.router,  prefix="/v1/rainfall")
app.include_router(soil.router,      prefix="/v1/soil")
app.include_router(alerts.router,    prefix="/v1/alerts")
app.include_router(forecast.router,  prefix="/v1/forecast")
app.include_router(fire.router,      prefix="/v1/fire")
app.include_router(stations.router,  prefix="/v1/stations")
