from fastapi import APIRouter, Request
from pydantic import BaseModel
import RAGresponse.RAG_app as RAG_app
from fastapi import Query as FastAPIQuery, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

class Query(BaseModel):
    user_query: str

class Response(BaseModel):
    rag_response: str

response_router = APIRouter()

# Session storage with metadata
class SessionData:
    def __init__(self):
        self.chat_history = []
        self.gemini_chat_history = []
        self.last_accessed = datetime.now()
        self.message_count = 0

# Global variable for chat history per session with expiration
session_storage = defaultdict(SessionData)
SESSION_EXPIRY_HOURS = 24
MAX_MESSAGES_PER_SESSION = 100

def cleanup_expired_sessions():
    """Remove sessions that haven't been accessed in SESSION_EXPIRY_HOURS"""
    current_time = datetime.now()
    expired_sessions = [
        session_id for session_id, data in session_storage.items()
        if (current_time - data.last_accessed).total_seconds() > SESSION_EXPIRY_HOURS * 3600
    ]
    for session_id in expired_sessions:
        del session_storage[session_id]
        logger.info(f"Expired session cleaned up: {session_id}")
    return len(expired_sessions)

# Fetching user request using POST request
@response_router.post("/query", response_model=Response)
@limiter.limit("20/minute")
async def fetch_query(request: Request, query: Query, session_id: str = FastAPIQuery(...)):
    try:
        # Validate session_id
        if not session_id or len(session_id) < 5:
            raise HTTPException(status_code=400, detail="Valid session_id is required")
        
        # Validate query
        if not query.user_query or len(query.user_query.strip()) == 0:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if len(query.user_query) > 1000:
            raise HTTPException(status_code=400, detail="Query too long (max 1000 characters)")
        
        # Cleanup expired sessions periodically
        cleanup_expired_sessions()
        
        # Get or create session data
        session_data = session_storage[session_id]
        session_data.last_accessed = datetime.now()
        
        # Check message limit
        if session_data.message_count >= MAX_MESSAGES_PER_SESSION:
            raise HTTPException(status_code=429, detail="Session message limit reached. Please start a new session.")
        
        logger.info(f"Processing query for session: {session_id}")
        
        # Process query
        rag_resp = RAG_app.main(query.user_query, session_data.gemini_chat_history, session_id)
        
        # Update session data
        session_data.chat_history.append({"user_query": query.user_query, "rag_response": rag_resp})
        session_data.message_count += 1
        
        return Response(rag_response=rag_resp if rag_resp else "")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing your query")

# Providing the response using get request
@response_router.get("/history", response_model=list)
async def get_history(session_id: str = FastAPIQuery(...)):
    try:
        if not session_id or len(session_id) < 5:
            raise HTTPException(status_code=400, detail="Valid session_id is required")
        
        if session_id not in session_storage:
            raise HTTPException(status_code=404, detail="No history found for this session.")
        
        session_data = session_storage[session_id]
        session_data.last_accessed = datetime.now()
        
        return session_data.chat_history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching chat history")

@response_router.get("/session-info")
async def get_session_info(session_id: str = FastAPIQuery(...)):
    """Get information about a session"""
    try:
        if session_id not in session_storage:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_data = session_storage[session_id]
        return {
            "session_id": session_id,
            "message_count": session_data.message_count,
            "last_accessed": session_data.last_accessed.isoformat(),
            "messages_remaining": MAX_MESSAGES_PER_SESSION - session_data.message_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session info: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching session info")
