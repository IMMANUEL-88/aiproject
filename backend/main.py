# backend/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import uuid
import chromadb
import pymupdf
import openai
import google.generativeai as genai
from serpapi import GoogleSearch # <-- CORRECTED IMPORT (REVERTED)
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import models 
import database

# --- Initialization ---
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configure APIs ---
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

client_openai = openai.OpenAI()

# --- Initialize ChromaDB client ---
client = chromadb.PersistentClient(path="./chroma_db")

# --- Pydantic Models ---
class WorkflowExecutionRequest(BaseModel):
    query: str
    graph: Dict[str, Any]
    
def perform_web_search(query: str, api_key: str) -> str:
    """Performs a web search using SerpApi and returns a snippet."""
    if not api_key:
        return "Web search is enabled, but the SERP API key is missing."
    try:
        params = {"q": query, "api_key": api_key}
        search = GoogleSearch(params)
        results = search.get_dict()
        
        # Extract the most relevant snippet
        if "answer_box" in results and "snippet" in results["answer_box"]:
            return results["answer_box"]["snippet"]
        elif "organic_results" in results and results["organic_results"]:
            return results["organic_results"][0].get("snippet", "No snippet found.")
        return "No relevant information found from web search."
    except Exception as e:
        print(f"Error during SerpApi search: {e}")
        return "There was an error performing the web search."

def get_embedding(text: str, task_type: str):
    """Generates an embedding using the Gemini API."""
    try:
        # Gemini embedding models require a task_type
        # "retrieval_document" for documents to be stored
        # "retrieval_query" for the user's query
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=task_type,
        )
        return result['embedding']
    except Exception as e:
        print(f"Error creating Gemini embedding: {e}")
        return None

models.Base.metadata.create_all(bind=database.engine)

class StackBase(BaseModel):
    name: str
    description: str | None = None
    
class RagChatRequest(BaseModel):
    query: str
    doc_id: str
    
class RunWorkflowRequest(BaseModel):
    graph: Dict[str, Any]
    
class WorkflowExecutionRequest(BaseModel):
    query: str
    graph: Dict[str, Any]

class StackCreate(StackBase):
    pass

class ChatRequest(BaseModel):
    query: str

class StackUpdate(BaseModel):
    graph: Dict[str, Any]

class StackInDB(StackBase):
    id: int
    graph: Dict[str, Any] | None = None
    
    class Config:
        from_attributes = True

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- STACK API ENDPOINTS ---
@app.post("/api/stacks", response_model=StackInDB)
def create_stack(stack: StackCreate, db: Session = Depends(get_db)):
    db_stack = models.Stack(name=stack.name, description=stack.description, graph={"nodes": [], "edges": []})
    db.add(db_stack)
    db.commit()
    db.refresh(db_stack)
    return db_stack

@app.get("/api/stacks", response_model=List[StackInDB])
def get_stacks(db: Session = Depends(get_db)):
    stacks = db.query(models.Stack).all()
    return stacks

@app.get("/api/stacks/{stack_id}", response_model=StackInDB)
def get_stack(stack_id: int, db: Session = Depends(get_db)):
    db_stack = db.query(models.Stack).filter(models.Stack.id == stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")
    return db_stack

@app.put("/api/stacks/{stack_id}", response_model=StackInDB)
def update_stack(stack_id: int, stack_update: StackUpdate, db: Session = Depends(get_db)):
    db_stack = db.query(models.Stack).filter(models.Stack.id == stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")
    db_stack.graph = stack_update.graph
    db.commit()
    db.refresh(db_stack)
    return db_stack

# --- NEW DIRECT GEMINI CHAT ENDPOINT ---
@app.post("/api/chat/gemini")
async def chat_with_gemini(request: ChatRequest):
    """
    Handles a direct chat query with the Gemini API.
    """
    try:
        # Configure the model
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Generate content
        response = model.generate_content(request.query)

        return {"answer": response.text}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Gemini API.")
    
    
@app.post("/api/chat/rag")
async def rag_chat(request: RagChatRequest):
    """
    Handles a chat query using a specific document as context (RAG).
    """
    query = request.query
    doc_id = request.doc_id
    context = ""

    # 1. Retrieve context from the specified document in ChromaDB
    try:
        collection = client.get_collection(name=f"doc_{doc_id}")
        query_embedding = get_embedding(query, task_type="retrieval_query")
        
        if query_embedding:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=3
            )
            context = "\n".join(results['documents'][0])
            print(f"Retrieved context for RAG chat from doc_id {doc_id}")
    except Exception as e:
        print(f"Error querying ChromaDB for RAG chat: {e}")
        # We don't raise an error, just proceed with empty context
        context = "Could not retrieve context from the document."

    # 2. Construct a strict prompt for the LLM
    prompt_template = "You are an assistant that answers questions based ONLY on the provided context. If the information to answer the question is not in the context, you must say, 'I am sorry, but I cannot answer that question based on the provided document.' Do not use any outside knowledge.\n\nContext:\n{context}\n\nQuestion:\n{query}"
    
    final_prompt = prompt_template.format(query=query, context=context)

    # 3. Call the Gemini API
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(final_prompt)
        llm_response = response.text
    except Exception as e:
        print(f"Error calling Gemini for RAG chat completion: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Gemini API for RAG chat.")
    
    return {"answer": llm_response}
    

# --- CORE API ENDPOINTS ---
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(400, detail="Invalid file type. Only PDFs are supported.")
    
    doc_id = str(uuid.uuid4())
    collection = client.get_or_create_collection(name=f"doc_{doc_id}")
    
    file_content = await file.read()
    doc = pymupdf.open(stream=file_content, filetype="pdf")
    texts = [page.get_text() for page in doc]
    ids = [f"page_{i}" for i in range(len(texts))]

    # --- UPDATED TO USE GEMINI EMBEDDINGS ---
    # We use "retrieval_document" as the task_type for the document chunks
    embeddings = [get_embedding(text, task_type="retrieval_document") for text in texts]

    # Filter out any failed embeddings
    valid_embeddings = [(emb, doc, doc_id) for emb, doc, doc_id in zip(embeddings, texts, ids) if emb is not None]
    if not valid_embeddings:
        raise HTTPException(status_code=500, detail="Failed to create any embeddings for the document.")

    # Unzip the valid data
    final_embeddings, final_texts, final_ids = zip(*valid_embeddings)

    collection.add(
        embeddings=list(final_embeddings), 
        documents=list(final_texts), 
        ids=list(final_ids)
    )
    return {"doc_id": doc_id, "filename": file.filename, "pages": len(texts)}

    
# backend/main.py

# backend/main.py

@app.post("/api/workflow/run")
async def run_workflow(request: RunWorkflowRequest):
    graph = request.graph
    nodes = {node['id']: node for node in graph['nodes']}
    edges = graph['edges']
    
    node_outputs = {}

    user_input_node = next((node for node in nodes.values() if node['type'] == 'userInput'), None)
    if not user_input_node or 'query' not in user_input_node['data']:
        raise HTTPException(status_code=400, detail="User Input node with a query is required.")
    
    initial_query = user_input_node['data']['query']
    node_outputs[user_input_node['id']] = initial_query

    llm_node = next((node for node in nodes.values() if node['type'] == 'llmGemini'), None)
    if not llm_node:
        raise HTTPException(status_code=400, detail="An LLM (Gemini) node is required.")

    query_for_llm = ""
    context_for_llm = ""
    web_search_results = ""

    for edge in edges:
        if edge['target'] == llm_node['id']:
            source_node = nodes[edge['source']]
            
            if edge['targetHandle'] == 'query' and source_node['type'] == 'userInput':
                query_for_llm = node_outputs.get(source_node['id'])
            
            if edge['targetHandle'] == 'context' and source_node['type'] == 'knowledgeBase':
                if 'doc_id' in source_node['data']:
                    doc_id = source_node['data']['doc_id']
                    try:
                        collection = client.get_collection(name=f"doc_{doc_id}")
                        query_embedding = get_embedding(initial_query, task_type="retrieval_query")
                        
                        if query_embedding:
                            results = collection.query(query_embeddings=[query_embedding], n_results=3)
                            
                            # --- THIS IS THE FIX ---
                            # These two lines are now correctly indented inside the 'if' block
                            context_for_llm = "\n".join(results['documents'][0])
                            node_outputs[source_node['id']] = context_for_llm
                            # --- END OF FIX ---

                    except Exception as e:
                        print(f"Error processing Knowledge Base: {e}")
                        context_for_llm = ""

    llm_config = llm_node['data']
    
    if llm_config.get('websearchEnabled'):
        serp_api_key = llm_config.get('serpApiKey', os.getenv("SERPAPI_API_KEY"))
        web_search_results = perform_web_search(query=initial_query, api_key=serp_api_key)
    
    prompt_template = llm_config.get(
        'prompt', 
        "You are an assistant. Use the provided context and web search results to answer the question. If the information is not in the context or search results, say you don't know.\n\nContext:\n{context}\n\nWeb Search Results:\n{web_search_results}\n\nQuestion:\n{query}"
    )
    
    final_prompt = prompt_template.format(
        query=query_for_llm, 
        context=context_for_llm, 
        web_search_results=web_search_results
    )

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(final_prompt)
        llm_response = response.text
    except Exception as e:
        print(f"Error calling Gemini for chat completion: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Gemini API for chat completion.")   
    
    return {"answer": llm_response}
    