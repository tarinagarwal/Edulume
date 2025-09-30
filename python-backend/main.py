from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fileUpload.uploadRoute import router
from RAGresponse.responseRoute import response_router
from sessionCleanup.cleanupRoute import cleanup_router



app = FastAPI(docs_url=None,redoc_url=None,openapi_url=None)

origins = ['*']  # add the local/deployment frontend URL here
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET","POST"],
    allow_headers=["*"]
)

@app.get("/")
async def indexPage():
    return {"response":"Hi! there is nothing here"}

app.include_router(router)
app.include_router(response_router)
app.include_router(cleanup_router)