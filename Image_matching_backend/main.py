from fastapi import FastAPI, Form, UploadFile
from typing import List
import uvicorn
import numpy as np  
from fastapi.middleware.cors import CORSMiddleware
from embedder import generate_embeddings
import uuid
from dotenv import load_dotenv
import os
from pinecone import Pinecone, ServerlessSpec
import requests
from io import BytesIO

# Initialize Pinecone
load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Check if index exists, else create it
index_name = "face-recognition"
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=512,  # FaceNet embeddings have 512 dimensions
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )

# Connect to the index
index = pc.Index(index_name)


app = FastAPI(root_path="/api")

# allow cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/save-find-missing")
async def save_find_missing(user_id: str = Form(...), image_urls: List[str] = Form(...)):
    ''' Stores image of person in find namespace'''
    embeddings = []
    for url in image_urls:
        try:
            # Fetch image from URL
            response = requests.get(url)
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Create UploadFile directly from downloaded image bytes
            image_filename = f"{user_id}_{uuid.uuid4()}.jpg"
            upload_file = UploadFile(filename=image_filename, file=BytesIO(response.content))
            
            embedding = await generate_embeddings(upload_file)
            if embedding is not None:  # Only add embedding if face was detected
                embeddings.append(embedding)
                
        except Exception as e:
            print(f"Error processing image from URL {url}: {e}")
            continue
    
    if not embeddings:
        return {"error": "No valid faces detected in any of the provided images"}
    
    # Compute the mean embedding (averaging all images of the same user)
    final_embedding = np.mean(embeddings, axis=0)
    final_embedding_list = [float(x) for x in final_embedding]
        
    index.upsert([(user_id, final_embedding_list)], namespace="find")
    return {"success": True, "message": "Finding person embeddings saved successfully"}


@app.post("/save-report-missing")
async def save_report_missing(user_id: str = Form(...), image_urls: List[str] = Form(...)):
    ''' Stores image of person in find namespace'''
    embeddings = []
    for url in image_urls:
        try:
            # Fetch image from URL
            response = requests.get(url)
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Create UploadFile directly from downloaded image bytes
            image_filename = f"{user_id}_{uuid.uuid4()}.jpg"
            upload_file = UploadFile(filename=image_filename, file=BytesIO(response.content))
            
            embedding = await generate_embeddings(upload_file)
            if embedding is not None:  # Only add embedding if face was detected
                embeddings.append(embedding)
                
        except Exception as e:
            print(f"Error processing image from URL {url}: {e}")
            continue
    
    if not embeddings:
        return {"error": "No valid faces detected in any of the provided images"}
    
    # Compute the mean embedding (averaging all images of the same user)
    final_embedding = np.mean(embeddings, axis=0)
    final_embedding_list = [float(x) for x in final_embedding]
        
    index.upsert([(user_id, final_embedding_list)], namespace="report")
    
    return {"success": True, "message": "Finding person embeddings saved successfully"}



@app.post("/search-find-missing")
async def search_find_missing(user_id: str = Form(...), image_urls: List[str] = Form(...)):
    """Stores multiple images of the same user from URLs, averages their embeddings, and stores in Pinecone."""
    embeddings = []
    for url in image_urls:
        try:
            # Fetch image from URL
            response = requests.get(url)
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Create UploadFile directly from downloaded image bytes    
            image_filename = f"{user_id}_{uuid.uuid4()}.jpg"
            upload_file = UploadFile(filename=image_filename, file=BytesIO(response.content))
            
            embedding = await generate_embeddings(upload_file)
            if embedding is not None:  # Only add embedding if face was detected
                embeddings.append(embedding)
                
        except Exception as e:
            print(f"Error processing image from URL {url}: {e}")
            continue
    
    if not embeddings:
        return {"error": "No valid faces detected in any of the provided images"}
    
    # Compute the mean embedding (averaging all images of the same user)
    final_embedding = np.mean(embeddings, axis=0)
    final_embedding_list = [float(x) for x in final_embedding]

    # Store in Pinecone under the 'reported' namespace
    try:
        query_response = index.query(vector=final_embedding_list, top_k=1, namespace="report", include_metadata=True)
        matches = query_response["matches"]
        if matches and matches[0]["score"] > 0.8:
            # Create a clean response dictionary with only necessary data
            match_data = [{
                "id": match["id"],
                "score": float(match["score"]),  # Convert numpy float to Python float
                "metadata": match.get("metadata", {})
            } for match in matches]
            return {
                "success": True,
                "message": "User found",
                "match": match_data
            }
        
        return {"message": "No matches found", "success": False}
        
    except Exception as e:
        print(f"Error searching embedding: {e}")
        return {"error": str(e)}

@app.post("/search-report-missing")
async def search_report_missing(user_id: str = Form(...), image_urls: List[str] = Form(...)):
    embeddings = []
    for url in image_urls:
        try:
            # Fetch image from URL
            response = requests.get(url)
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Create UploadFile directly from downloaded image bytes
            image_filename = f"{user_id}_{uuid.uuid4()}.jpg"
            upload_file = UploadFile(filename=image_filename, file=BytesIO(response.content))
            
            embedding = await generate_embeddings(upload_file)
            if embedding is not None:  # Only add embedding if face was detected
                embeddings.append(embedding)
                
        except Exception as e:
            print(f"Error processing image from URL {url}: {e}")
            continue
    
    if not embeddings:
        return {"error": "No valid faces detected in any of the provided images"}
    
    # Compute the mean embedding (averaging all images of the same user)
    final_embedding = np.mean(embeddings, axis=0)
    final_embedding_list = [float(x) for x in final_embedding]

    # Store in Pinecone under the 'reported' namespace
    try:
        query_response = index.query(vector=final_embedding_list, top_k=1, namespace="find", include_metadata=True)
        matches = query_response["matches"]
        if matches and matches[0]["score"] > 0.8:
            # Create a clean response dictionary with only necessary data
            match_data = [{
                "id": match["id"],
                "score": float(match["score"]),  # Convert numpy float to Python float
                "metadata": match.get("metadata", {})
            } for match in matches]
            return {
                "success": True,
                "message": "User found",
                "match": match_data
            }
        
        return {"message": "No matches found", "success": False}
        
    except Exception as e:
        print(f"Error searching embedding: {e}")
        return {"error": str(e)}
   
   
#  List all embeddings stored in index
@app.get("/list-embeddings")
async def list_embeddings():
    """Lists all embeddings stored in the index."""
    try:
        print("Listing embeddings")
        # Get all vector IDs from the index for both namespaces
        reported_stats = index.describe_index_stats()
        namespaces = reported_stats.namespaces
        
        vector_counts = {
            "reported": namespaces.get("reported", {}).get("vector_count", 0),
            "unconfirmed": namespaces.get("unconfirmed", {}).get("vector_count", 0)
        } 
      
        return {
            "total_vectors": sum(vector_counts.values()),
            "vectors_by_namespace": vector_counts,
        }
    except Exception as e:
        return {"error": str(e)}    

    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)