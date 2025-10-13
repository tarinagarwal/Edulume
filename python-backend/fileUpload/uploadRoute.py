from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
import os
from .pdfUpload import process_pdf
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# File validation constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_CONTENT_TYPES = ["application/pdf"]

@router.post("/upload-pdf/")
@limiter.limit("5/minute")
async def upload_pdf(request: Request, file: UploadFile = File(...), session_id: str = Form(...)):
    cloudinary_public_id = None
    
    try:
        # Validate session_id
        if not session_id or len(session_id) < 5:
            raise HTTPException(status_code=400, detail="Valid session_id is required")
        
        # Validate file type
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Validate filename
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must have .pdf extension")
        
        # Read and validate file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024)}MB limit")
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        logger.info(f"Uploading PDF for session: {session_id}, size: {len(file_content)} bytes")
        
        # Upload to Cloudinary - sanitize filename to remove whitespace and special chars
        filename_base = file.filename.split('.')[0]
        # Replace spaces and special characters with underscores
        sanitized_filename = "".join(c if c.isalnum() or c in ('-', '_') else '_' for c in filename_base)
        # Remove trailing/leading underscores and collapse multiple underscores
        sanitized_filename = '_'.join(filter(None, sanitized_filename.split('_')))
        
        public_id = f"{session_id}_{sanitized_filename}"
        cloudinary_public_id = f"pdfs/{public_id}"
        
        upload_result = cloudinary.uploader.upload(
            file_content,
            resource_type="raw",
            folder="pdfs",
            public_id=public_id,
            timeout=60
        )
        pdf_url = upload_result["secure_url"]
        logger.info(f"PDF uploaded to Cloudinary: {pdf_url}")

        # Process and embed PDF
        embedding_result = process_pdf(pdf_url, session_id)
        logger.info(f"PDF embedded successfully: {embedding_result}")

        return {
            "message": "PDF uploaded and embedded successfully",
            "cloudinary_url": pdf_url,
            "cloudinary_public_id": cloudinary_public_id,
            "embedding_result": embedding_result,
            "session_id": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading or processing PDF: {str(e)}")
        # Cleanup Cloudinary if upload succeeded but processing failed
        if cloudinary_public_id:
            try:
                cloudinary.uploader.destroy(cloudinary_public_id, resource_type="raw")
                logger.info(f"Cleaned up Cloudinary file: {cloudinary_public_id}")
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup Cloudinary: {str(cleanup_error)}")
        
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")