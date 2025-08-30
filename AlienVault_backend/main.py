from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fileUpload.uploadRoute import router
from RAGrespopnse.responseRoute import response_router



app = FastAPI()

origins = ['*']  # add the local/deployment frontend URL here
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)
app.include_router(response_router)