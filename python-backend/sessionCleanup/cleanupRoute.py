from fastapi import APIRouter, HTTPException
from fastapi import Query as FastAPIQuery
import os
from dotenv import load_dotenv
from pinecone import Pinecone
import cloudinary
import cloudinary.uploader
import logging

load_dotenv()

logger = logging.getLogger(__name__)

cleanup_router = APIRouter()

# Initialize Pinecone
PINECONE_API = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")
pc = Pinecone(api_key=PINECONE_API)
index = pc.Index(index_name)

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@cleanup_router.post("/cleanup-session")
async def cleanup_session(session_id: str = FastAPIQuery(...), cloudinary_public_id: str = FastAPIQuery(None)):
    """
    Cleanup embeddings for a specific session from Pinecone and optionally delete from Cloudinary
    """
    try:
        if not session_id or len(session_id) < 5:
            raise HTTPException(status_code=400, detail="Valid session_id is required")
        
        logger.info(f"Cleaning up session: {session_id}")
        
        # Delete vectors with the session_id metadata from Pinecone
        index.delete(filter={"session_id": session_id})
        logger.info(f"Deleted Pinecone vectors for session: {session_id}")
        
        # Clear the chat history for this session
        from RAGresponse.responseRoute import session_storage
        if session_id in session_storage:
            del session_storage[session_id]
            logger.info(f"Cleared chat history for session: {session_id}")
        
        # Delete from Cloudinary if public_id provided
        if cloudinary_public_id:
            try:
                cloudinary.uploader.destroy(cloudinary_public_id, resource_type="raw")
                logger.info(f"Deleted Cloudinary file: {cloudinary_public_id}")
            except Exception as cloudinary_error:
                logger.error(f"Failed to delete from Cloudinary: {str(cloudinary_error)}")
                # Don't fail the entire cleanup if Cloudinary deletion fails
            
        return {
            "message": f"Session {session_id} cleaned up successfully",
            "pinecone_deleted": True,
            "cloudinary_deleted": bool(cloudinary_public_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cleanup session: {str(e)}")
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