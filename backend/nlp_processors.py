"""
NLP Processing modules for Nyaya AI
Handles text extraction, summarization, entity extraction, and semantic search
"""

import io
import numpy as np
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

import pdfplumber
from docx import Document as DocxDocument
from pptx import Presentation
from PIL import Image
import pytesseract

from transformers import (
    pipeline,
    AutoTokenizer,
    AutoModelForSequenceClassification,
)
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class DocumentProcessor(ABC):
    """Base class for document processors"""

    @abstractmethod
    def process(self, data: bytes) -> str:
        """Process document and return extracted text"""
        pass


class TextExtractor:
    """Extract text from various document formats"""

    def extract(self, file_data: bytes, file_type: str) -> str:
        """
        Extract text from document based on file type
        """
        if file_type.lower() == "pdf":
            return self._extract_pdf(file_data)
        elif file_type.lower() == "txt":
            return file_data.decode("utf-8")
        elif file_type.lower() == "docx":
            return self._extract_docx(file_data)
        elif file_type.lower() == "pptx":
            return self._extract_pptx(file_data)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_pdf(self, file_data: bytes) -> str:
        """Extract text from PDF"""
        text = ""
        with pdfplumber.open(io.BytesIO(file_data)) as pdf:
            for page in pdf.pages:
                text += page.extract_text()

                # Try OCR on images if text extraction is minimal
                for image in page.images:
                    try:
                        img = Image.open(io.BytesIO(image["stream"].get_data()))
                        text += pytesseract.image_to_string(img)
                    except:
                        pass

        return text

    def _extract_docx(self, file_data: bytes) -> str:
        """Extract text from DOCX"""
        text = ""
        doc = DocxDocument(io.BytesIO(file_data))
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

    def _extract_pptx(self, file_data: bytes) -> str:
        """Extract text from PPTX"""
        text = ""
        prs = Presentation(io.BytesIO(file_data))
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text


class Summarizer:
    """Generate abstractive summaries using BART model"""

    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        """Initialize summarizer with BART model"""
        self.pipeline = pipeline("summarization", model=model_name)

    def summarize(self, text: str, max_length: int = 150, min_length: int = 50) -> str:
        """
        Generate abstractive summary of text
        """
        # Split text into chunks if too long
        max_chunk_length = 1024
        chunks = self._split_text(text, max_chunk_length)

        summaries = []
        for chunk in chunks:
            try:
                summary = self.pipeline(chunk, max_length=max_length, min_length=min_length)
                summaries.append(summary[0]["summary_text"])
            except:
                # If summary fails, use extractive approach
                summaries.append(chunk[:max_length])

        return " ".join(summaries)

    def _split_text(self, text: str, max_length: int) -> List[str]:
        """Split text into chunks"""
        sentences = text.split(". ")
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence + ". "

        if current_chunk:
            chunks.append(current_chunk)

        return chunks


class EntityExtractor:
    """Extract legal entities and key information using NER"""

    def __init__(self):
        """Initialize entity extractor with NER model"""
        self.ner_pipeline = pipeline(
            "token-classification",
            model="dbmdz/bert-large-cased-finetuned-conll03-english",
            aggregation_strategy="simple",
        )
        self.qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")

    def extract(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract legal entities from text
        """
        entities = []

        # Use NER for entity extraction
        ner_results = self.ner_pipeline(text[:512])  # Limit input length

        for entity in ner_results:
            entity_dict = {
                "type": entity["entity_group"],
                "value": entity["word"],
                "confidence": entity["score"],
                "context": self._get_context(text, entity["word"]),
            }
            entities.append(entity_dict)

        # Add custom legal entity patterns
        legal_entities = self._extract_legal_patterns(text)
        entities.extend(legal_entities)

        return entities

    def _extract_legal_patterns(self, text: str) -> List[Dict[str, Any]]:
        """Extract legal entities using pattern matching"""
        import re

        legal_entities = []

        # Patterns for common legal entities
        patterns = {
            "Party": r"(?:Party|Client|Defendant|Plaintiff|Respondent)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*",
            "Date": r"\d{1,2}(?:/|-)\d{1,2}(?:/|-)\d{2,4}",
            "Contract Type": r"(?:Agreement|Contract|Deed|Lease|License|Accord|Settlement)",
            "Amount": r"\$[\d,]+(?:\.\d{2})?",
        }

        for entity_type, pattern in patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                legal_entities.append(
                    {
                        "type": entity_type,
                        "value": match.group(),
                        "confidence": 0.8,
                        "context": self._get_context(text, match.group()),
                    }
                )

        return legal_entities

    def _get_context(self, text: str, entity: str, context_length: int = 50) -> str:
        """Get surrounding context for an entity"""
        try:
            idx = text.find(entity)
            start = max(0, idx - context_length)
            end = min(len(text), idx + len(entity) + context_length)
            return text[start:end].strip()
        except:
            return ""

    def answer_question(self, context: str, question: str) -> str:
        """
        Answer a question about the document using QA model
        """
        try:
            result = self.qa_pipeline(question=question, context=context[:512])
            return result["answer"]
        except:
            return "Unable to find answer in document."


class SemanticSearch:
    """Perform semantic search using sentence embeddings"""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize semantic search with embedding model"""
        self.model = SentenceTransformer(model_name)

    def embed_text(self, text: str, chunk_size: int = 512) -> List[Dict[str, Any]]:
        """
        Generate embeddings for text chunks
        """
        chunks = self._chunk_text(text, chunk_size)
        embeddings = []

        for i, chunk in enumerate(chunks):
            try:
                vector = self.model.encode(chunk)
                embeddings.append(
                    {
                        "text": chunk,
                        "vector": vector.tolist(),
                        "index": i,
                    }
                )
            except:
                pass

        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for query"""
        return self.model.encode(query).tolist()

    def search(self, query_embedding: List[float], document_embeddings: List[Dict], top_k: int = 5) -> List[Dict]:
        """
        Search for similar chunks using cosine similarity
        """
        query_vec = np.array([query_embedding])
        results = []

        for embedding_data in document_embeddings:
            chunk_vec = np.array([embedding_data["vector"]])
            similarity = cosine_similarity(query_vec, chunk_vec)[0][0]

            results.append(
                {
                    "text": embedding_data["text"],
                    "similarity": float(similarity),
                    "index": embedding_data["index"],
                }
            )

        # Sort by similarity and return top-k
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def _chunk_text(self, text: str, chunk_size: int) -> List[str]:
        """Split text into chunks"""
        sentences = text.split(". ")
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) < chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence + ". "

        if current_chunk:
            chunks.append(current_chunk)

        return chunks
