from dotenv import load_dotenv
import os
# Load environment variables from .env file
load_dotenv()


from langchain_community.document_loaders import PyPDFLoader
import pprint


file_path="./data/machine_learning.pdf"
def process_pdf(file_path, session_id=None):
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from pinecone import Pinecone, ServerlessSpec
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_pinecone import PineconeVectorStore
    import os
    from dotenv import load_dotenv
    load_dotenv()

    loader = PyPDFLoader(file_path)
    docs = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True,
    )
    all_splits = text_splitter.split_documents(docs)

    # Add session metadata to documents if session_id is provided
    if session_id:
        for doc in all_splits:
            doc.metadata["session_id"] = session_id

    PINECONE_API = os.getenv("PINECONE_API_KEY")
    pc = Pinecone(api_key=PINECONE_API)
    index_name = os.getenv("PINECONE_INDEX_NAME")
    region_name = os.getenv("PINECONE_ENVIRONMENT")
    if not pc.has_index(index_name):
        pc.create_index(
            name=index_name,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region=region_name),
        )
    index = pc.Index(index_name)

    google_api_key = os.getenv("GOOGLE_API_KEY")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=google_api_key)
    vector_store = PineconeVectorStore(index=index, embedding=embeddings)
    # comment the line below for testing purpose
    vector_store.add_documents(all_splits)
    return f"Processed {len(all_splits)} chunks from {file_path}"
