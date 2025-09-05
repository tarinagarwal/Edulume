from fastapi import APIRouter, HTTPException
from fastapi import Query as FastAPIQuery
import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

cleanup_router = APIRouter()

# Initialize Pinecone
PINECONE_API = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")
pc = Pinecone(api_key=PINECONE_API)
index = pc.Index(index_name)

@cleanup_router.post("/cleanup-session")
async def cleanup_session(session_id: str = FastAPIQuery(...)):
    """
    Cleanup embeddings for a specific session from Pinecone
    """
    try:
        # Delete vectors with the session_id metadata
        # This will delete all vectors that have the matching session_id in metadata
        index.delete(filter={"session_id": session_id})
        
        # Also clear the chat history for this session
        from RAGresponse.responseRoute import chat_history, gemini_chat_history
        if session_id in chat_history:
            del chat_history[session_id]
        if session_id in gemini_chat_history:
            del gemini_chat_history[session_id]
            
        return {"message": f"Session {session_id} cleaned up successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cleanup session: {str(e)}")

@cleanup_router.get("/session-stats")
async def get_session_stats():
    """
    Get current Pinecone index statistics
    """
    try:
        stats = index.describe_index_stats()
        return {
            "total_vectors": stats.total_vector_count,
            "index_name": index_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")