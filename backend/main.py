import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Import NLP modules
from nlp_processors import (
    DocumentProcessor,
    TextExtractor,
    Summarizer,
    EntityExtractor,
    SemanticSearch,
)

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Nyaya AI - NLP Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize NLP processors
text_extractor = TextExtractor()
summarizer = Summarizer()
entity_extractor = EntityExtractor()
semantic_search = SemanticSearch()


class ProcessDocumentRequest(BaseModel):
    document_id: str
    user_id: str
    file_path: str
    file_type: str


class AskQuestionRequest(BaseModel):
    document_id: str
    user_id: str
    question: str


class SearchRequest(BaseModel):
    user_id: str
    query: str
    top_k: Optional[int] = 10


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "Nyaya AI NLP Backend"}


@app.post("/process-document")
async def process_document(request: ProcessDocumentRequest):
    """
    Process a document: extract text, generate summary, extract entities
    """
    try:
        # Download file from Supabase Storage
        file_data = supabase.storage.from_("documents").download(request.file_path)

        # Extract text based on file type
        text = text_extractor.extract(file_data, request.file_type)

        # Generate summary
        summary = summarizer.summarize(text)

        # Extract entities
        entities = entity_extractor.extract(text)

        # Generate embeddings for semantic search
        embeddings = semantic_search.embed_text(text)

        # Update document in Supabase
        supabase.table("documents").update(
            {
                "content": text,
                "status": "completed",
            }
        ).eq("id", request.document_id).execute()

        # Store summary
        supabase.table("document_summaries").insert(
            {
                "document_id": request.document_id,
                "summary": summary,
                "summary_type": "abstractive",
                "confidence": 0.85,
            }
        ).execute()

        # Store entities
        for entity in entities:
            supabase.table("legal_entities").insert(
                {
                    "document_id": request.document_id,
                    "entity_type": entity["type"],
                    "entity_value": entity["value"],
                    "context": entity.get("context", ""),
                    "confidence": entity.get("confidence", 0.8),
                }
            ).execute()

        # Store embeddings
        for i, embedding in enumerate(embeddings):
            supabase.table("document_embeddings").insert(
                {
                    "document_id": request.document_id,
                    "chunk_text": embedding["text"],
                    "chunk_index": i,
                    "embedding": embedding["vector"],
                }
            ).execute()

        # Update analytics
        supabase.table("document_analytics").update(
            {
                "summary_generated": True,
                "entities_extracted": True,
            }
        ).eq("document_id", request.document_id).execute()

        return {
            "status": "success",
            "document_id": request.document_id,
            "summary": summary,
            "entities_count": len(entities),
        }

    except Exception as e:
        # Mark document as failed
        supabase.table("documents").update(
            {"status": "failed"}
        ).eq("id", request.document_id).execute()

        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask-question")
async def ask_question(request: AskQuestionRequest):
    """
    Answer a question about a specific document
    """
    try:
        # Get document content
        doc_response = supabase.table("documents").select(
            "content"
        ).eq("id", request.document_id).eq("user_id", request.user_id).execute()

        if not doc_response.data:
            raise HTTPException(status_code=404, detail="Document not found")

        document_content = doc_response.data[0]["content"]

        # Generate answer using QA model
        answer = entity_extractor.answer_question(
            document_content, request.question
        )

        # Store Q&A interaction
        supabase.table("qa_interactions").insert(
            {
                "user_id": request.user_id,
                "document_id": request.document_id,
                "question": request.question,
                "answer": answer,
                "confidence": 0.85,
            }
        ).execute()

        # Update analytics
        supabase.table("document_analytics").update(
            {"qa_count": supabase.table("document_analytics")
             .select("qa_count")
             .eq("document_id", request.document_id)
             .execute().data[0]["qa_count"] + 1}
        ).eq("document_id", request.document_id).execute()

        return {
            "status": "success",
            "question": request.question,
            "answer": answer,
            "confidence": 0.85,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/semantic-search")
async def semantic_search_endpoint(request: SearchRequest):
    """
    Perform semantic search across all user documents
    """
    try:
        # Generate embedding for search query
        query_embedding = semantic_search.embed_query(request.query)

        # Search in vector database (using pgvector in Supabase)
        # This would use RPC or direct similarity search
        results = supabase.rpc(
            "search_documents",
            {
                "query_embedding": query_embedding,
                "user_id": request.user_id,
                "limit": request.top_k,
            },
        ).execute()

        return {
            "status": "success",
            "query": request.query,
            "results": results.data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process")
async def batch_process_documents(requests: List[ProcessDocumentRequest]):
    """
    Process multiple documents in batch
    """
    results = []
    for request in requests:
        try:
            result = await process_document(request)
            results.append(result)
        except Exception as e:
            results.append({"status": "failed", "document_id": request.document_id, "error": str(e)})

    return {"status": "completed", "results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
