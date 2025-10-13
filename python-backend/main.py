from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fileUpload.uploadRoute import router
from RAGresponse.responseRoute import response_router
from sessionCleanup.cleanupRoute import cleanup_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Use environment variable for allowed origins
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"]
)

@app.get("/")
@limiter.limit("10/minute")
async def indexPage(request: Request):
    logger.info("Index page accessed")
    return {"response": "Hi! there is nothing here"}

app.include_router(router)
app.include_router(response_router)
app.include_router(cleanup_router)