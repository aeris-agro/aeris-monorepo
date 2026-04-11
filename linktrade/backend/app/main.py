from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    buyers,
    contracts,
    disputes,
    health,
    listings,
    orders,
    prices,
    quality,
    transport,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="LinkTrade API",
    description="Agricultural Market Intelligence & Trading Platform",
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
app.include_router(listings.router, prefix=API_V1, tags=["Listings"])
app.include_router(orders.router, prefix=API_V1, tags=["Orders"])
app.include_router(contracts.router, prefix=API_V1, tags=["Contracts"])
app.include_router(prices.router, prefix=API_V1, tags=["Prices"])
app.include_router(buyers.router, prefix=API_V1, tags=["Buyers"])
app.include_router(quality.router, prefix=API_V1, tags=["Quality"])
app.include_router(transport.router, prefix=API_V1, tags=["Transport"])
app.include_router(disputes.router, prefix=API_V1, tags=["Disputes"])
