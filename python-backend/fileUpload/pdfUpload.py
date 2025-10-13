from dotenv import load_dotenv
import os
import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

load_dotenv()

logger = logging.getLogger(__name__)

def process_pdf(file_path, session_id):
    try:
        logger.info(f"Processing PDF: {file_path} for session: {session_id}")
        
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        if not docs:
            logger.error("No content extracted from PDF")
            raise ValueError("PDF appears to be empty or unreadable")
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True,
        )
        all_splits = text_splitter.split_documents(docs)

        # Add session metadata to documents
        for doc in all_splits:
            doc.metadata["session_id"] = session_id

        PINECONE_API = os.getenv("PINECONE_API_KEY")
        pc = Pinecone(api_key=PINECONE_API)
        index_name = os.getenv("PINECONE_INDEX_NAME")
        region_name = os.getenv("PINECONE_ENVIRONMENT")
        
        if not pc.has_index(index_name):
            logger.info(f"Creating new Pinecone index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=1536,  # OpenAI text-embedding-3-small dimension
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region=region_name),
            )
        
        index = pc.Index(index_name)

        openai_api_key = os.getenv("OPENAI_API_KEY")
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=openai_api_key)
        vector_store = PineconeVectorStore(index=index, embedding=embeddings)
        
        vector_store.add_documents(all_splits)
        logger.info(f"Successfully processed {len(all_splits)} chunks")
        return f"Processed {len(all_splits)} chunks from {file_path}"
    
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise
