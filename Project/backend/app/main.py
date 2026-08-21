import logging
import time
import os
from contextlib import asynccontextmanager
from typing import Dict, Tuple
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.routers import auth, machines, predict, dashboard, reports

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger("app.main")

# Simple In-Memory Rate Limiter
# Structure: {ip: (timestamp, count)}
RATE_LIMIT_WINDOW = 60 # 1 minute
RATE_LIMIT_MAX_REQUESTS = 100 # max requests per minute per IP
client_requests: Dict[str, Tuple[float, int]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB on Startup
    logger.info("Initializing application startup services...")
    await connect_to_mongo()
    yield
    # Close connection on Shutdown
    logger.info("Initializing application shutdown services...")
    await close_mongo_connection()

app = FastAPI(
    title="Smart Failure Detection System API",
    description="Backend API for predicting industrial machine failure using sensor values.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # for development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Rate Limiter Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Skip rate limiting for static endpoints or docs if necessary
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    if client_ip != "unknown":
        if client_ip in client_requests:
            window_start, count = client_requests[client_ip]
            if current_time - window_start < RATE_LIMIT_WINDOW:
                if count >= RATE_LIMIT_MAX_REQUESTS:
                    logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded. Try again in a minute."
                    )
                else:
                    client_requests[client_ip] = (window_start, count + 1)
            else:
                client_requests[client_ip] = (current_time, 1)
        else:
            client_requests[client_ip] = (current_time, 1)
            
    # Track request timing and response log
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"IP: {client_ip} - Path: {request.url.path} - Method: {request.method} - "
        f"Status: {response.status_code} - Process Time: {process_time:.4f}s"
    )
    
    return response

# Register routers on the main app under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(machines.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Smart Failure Detection System API is running.",
        "documentation": "/docs"
    }
