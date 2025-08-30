from fastapi import APIRouter, UploadFile, File, HTTPException
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
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Step 1: Upload to Cloudinary
        file_content = await file.read()
        public_id = file.filename.split(".")[0]
        upload_result = cloudinary.uploader.upload(
            file_content,
            resource_type="raw",
            folder="pdfs",
            public_id=public_id
        )
        pdf_url = upload_result["secure_url"]

        # Step 2: Download and embed PDF using process_pdf
        embedding_result = process_pdf(pdf_url)

        # Step 3: Delete the file from Cloudinary
        cloudinary.uploader.destroy(
            f"pdfs/{public_id}",
            resource_type="raw"
        )

        return {
            "message": "PDF uploaded, embedded, and deleted from Cloudinary successfully",
            "cloudinary_url": pdf_url,
            "embedding_result": embedding_result
        }
    except Exception as e:
        return {"message": f"Error uploading, processing, or deleting PDF: {e}"}