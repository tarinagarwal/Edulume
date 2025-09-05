from dotenv import load_dotenv
import os

from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from pinecone import Pinecone
from pinecone import ServerlessSpec

from google import genai
from google.genai import types
load_dotenv()

# Initialize a Pinecone client with your API key
PINECONE_API = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")
region_name = os.getenv("PINECONE_ENVIRONMENT")
pc = Pinecone(api_key=PINECONE_API)
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

def pinecone_retriver(query, session_id=None):
    """
    This function helps to retrieve the documents from the vector database
    query: This is the query to be processed by the user
    session_id: Optional session ID to filter documents
    """
    vector_store = PineconeVectorStore(index=index, embedding=embeddings)
    
    if session_id:
        # Filter by session_id in metadata
        retriever = vector_store.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={
                "k": 10, 
                "score_threshold": 0.4,
                "filter": {"session_id": session_id}
            },
        )
    else:
        retriever = vector_store.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"k": 10, "score_threshold": 0.4},
        )
    
    documents = retriever.invoke(query)
    content_list = [doc.page_content for doc in documents]
    return content_list

def finetuning_RAG_LLM(chat_history):
    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction="You are a summary writing expert. Based on the provided chat history, write the summary of the chat history using decent words possible. Also rephrase the 'Follow Up User Query' into a complete, standalone query and merge it to the summary so that it makes sense. Only output the rewritten summary and nothing else."),
        contents=chat_history
    )
    summary = response.text
    chat_history.clear()
    chat_history.append("Here is the summary of the previous conversation:\n" + summary)

def finetuning_RAG_LLM(chat_history):
    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction="You are a summary writing expert. Based on the provided chat history, write the summary of the chat history using decent words possible. Also rephrase the 'Follow Up User Query' into a complete, standalone query and merge it to the summary so that it makes sense. Only output the rewritten summary and nothing else."),
        contents=chat_history
    )
    summary = response.text
    chat_history.clear()
    chat_history.append("Here is the summary of the previous conversation:\n" + summary)

def RAG_LLM_integration(content_list, query, chat_history):
    client = genai.Client()
    chat_history.append(f"User: {query}")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=f"You are an intelligent document assistant. You will be given context from a document based on the user's query. Your task is to answer the user's question based ONLY on the provided context from the document. If the answer is not in the context, you must say, 'Sorry! I could not find the answer in the document.'. Keep your answer clear, concise and helpful. Always reference the document content when providing answers.\n\nContext: {content_list}"),
        contents=chat_history
    )
    chat_history.append(f"Model: {response.text}")
    chatbot_response = response.text
    return chatbot_response

def main(query, chat_history, session_id=None):
    content_list = pinecone_retriver(query, session_id)
    if len(chat_history) <= 10:
        rag_response = RAG_LLM_integration(content_list, query, chat_history)
    else:
        finetuning_RAG_LLM(chat_history)
        rag_response = RAG_LLM_integration(content_list, query, chat_history)
    return rag_response