from fastapi import APIRouter
from pydantic import BaseModel
import RAGrespopnse.RAG_app as RAG_app
from fastapi import Query as FastAPIQuery, HTTPException


class Query(BaseModel):
    user_query: str

class Response(BaseModel):
    rag_response: str

response_router=APIRouter()

# Global variable for chat history per session
chat_history = {}
gemini_chat_history = {}

# fetching response from RAG
def rag_response(query, session_chat_history):
    rag_resp = RAG_app.main(query=query, chat_history=session_chat_history)
    return rag_resp

# Fetching user request using POST request
@response_router.post("/query", response_model=Response)
async def fetch_query(query: Query, session_id: str = FastAPIQuery(...)):
    if session_id not in chat_history:
        chat_history[session_id] = []
    if session_id not in gemini_chat_history:
        gemini_chat_history[session_id] = []
    rag_resp = RAG_app.main(query.user_query, gemini_chat_history[session_id])
    chat_history[session_id].append({"user_query": query.user_query, "rag_response": rag_resp})
    if rag_resp is not None:
        return Response(rag_response=rag_resp)
    else:
        return Response(rag_response="")

# Providing the response using get request
@response_router.get("/history", response_model=list)
async def get_history(session_id: str = FastAPIQuery(...)):
    if session_id not in chat_history:
        raise HTTPException(status_code=404, detail="No history found for this session.")
    return chat_history[session_id]