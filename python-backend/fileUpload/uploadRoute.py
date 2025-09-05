from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import os
from .pdfUpload import process_pdf
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter()

@router.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...), session_id: str = Form(None)):
    try:
        # Step 1: Upload to Cloudinary
        file_content = await file.read()
        public_id = f"{session_id}_{file.filename.split('.')[0]}" if session_id else file.filename.split(".")[0]
        upload_result = cloudinary.uploader.upload(
            file_content,
            resource_type="raw",
            folder="pdfs",
            public_id=public_id
        )
        pdf_url = upload_result["secure_url"]

        # Step 2: Download and embed PDF using process_pdf with session_id
        embedding_result = process_pdf(pdf_url, session_id)

        # Keep the file in Cloudinary for PDF preview
        # Don't delete it immediately as we need it for the chat session

        return {
            "message": "PDF uploaded and embedded successfully",
            "cloudinary_url": pdf_url,
            "embedding_result": embedding_result,
            "session_id": session_id
        }
    except Exception as e:
        return {"message": f"Error uploading or processing PDF: {e}"}