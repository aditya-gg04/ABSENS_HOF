from fastapi import FastAPI, Form, File, UploadFile
from typing import List
from fastapi.staticfiles import StaticFiles
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
from PIL import Image

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

@app.post("/report-missing")
async def store_user_images(user_id: str = Form(...), image_urls: List[str] = Form(...)):
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
        # check if user_id already exists in the index with namespace "unconfirmed"
        query_response = index.query(vector=final_embedding_list, top_k=1, namespace="unconfirmed", include_metadata=True)
        matches = query_response["matches"]
        if matches and matches[0]["score"] > 0.8:
            return {"message": "User already exists in unconfirmed namespace", "user_id": user_id}
        
        index.upsert([(user_id, final_embedding_list)], namespace="reported")
        return {
            "message": "User images stored successfully",
            "user_id": user_id,
            "status": "success",
            "embedding_size": len(final_embedding_list)
        }
    except Exception as e:
        print(f"Error saving embedding: {e}")
        return {"error": str(e)}

@app.post("/find-missing")
async def find_missing_child(user_id: str = Form(...), image_url: str = Form(...)):
    """Searches for a missing child using facial similarity."""
    try:
        # Fetch image from URL
        response = requests.get(image_url)
        response.raise_for_status()  # Raise exception for bad status codes
        
        # Create UploadFile directly from downloaded image bytes
        image_filename = f"{user_id}_{uuid.uuid4()}.jpg"
        upload_file = UploadFile(filename=image_filename, file=BytesIO(response.content))
        
        embedding = await generate_embeddings(upload_file)
        if embedding is None:
            return {"error": "No valid face detected in the provided image"}

        # Query Pinecone for similar embeddings in 'reported' namespace
        search_results = index.query(vector=embedding, top_k=1, namespace="reported", include_metadata=True)

        if search_results["matches"]:
            match = search_results["matches"][0]
            # Check if similarity score is above threshold (0.8 for high confidence)
            if match["score"] > 0.8:
                user_id = match["id"]
                return {"message": "Child found", "user_id": user_id, "similarity_score": match["score"]}
        
        # If no match found or similarity below threshold, store embedding in 'unconfirmed' namespace
        index.upsert([(user_id, embedding)], namespace="unconfirmed")
        return {"message": "No match found, stored for future cases"}
        
    except Exception as e:
        print(f"Error processing image from URL {image_url}: {e}")
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