# Nyaya AI - Python NLP Backend

This is the Python backend service for Nyaya AI, handling all NLP processing tasks including text extraction, summarization, entity extraction, and semantic search.

## Architecture

The backend is a separate FastAPI service that runs independently and processes documents asynchronously. It communicates with the Next.js frontend through REST APIs and accesses Supabase for data persistence.

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- pip or poetry package manager
- Supabase project with API keys
- CUDA (optional, for GPU acceleration)

### 2. Installation

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download ML models (run once)
python download_models.py
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# Backend API URL (for frontend)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4. Running the Backend

```bash
# Development mode with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Document Processing
- **POST** `/process-document` - Process a document for analysis
  ```json
  {
    "document_id": "uuid",
    "user_id": "uuid",
    "file_path": "documents/user-id/filename",
    "file_type": "pdf|docx|txt|pptx"
  }
  ```

### Question Answering
- **POST** `/ask-question` - Ask a question about a document
  ```json
  {
    "document_id": "uuid",
    "user_id": "uuid",
    "question": "What are the payment terms?"
  }
  ```

### Semantic Search
- **POST** `/semantic-search` - Search across all user documents
  ```json
  {
    "user_id": "uuid",
    "query": "search term",
    "top_k": 10
  }
  ```

### Batch Processing
- **POST** `/batch-process` - Process multiple documents
  ```json
  [
    {
      "document_id": "uuid",
      "user_id": "uuid",
      "file_path": "path",
      "file_type": "pdf"
    }
  ]
  ```

## NLP Models Used

### 1. Text Extraction
- **PDF**: pdfplumber + pytesseract (OCR)
- **DOCX**: python-docx
- **PPTX**: python-pptx
- **Images**: Tesseract OCR

### 2. Summarization
- **Model**: Facebook BART (`facebook/bart-large-cnn`)
- **Approach**: Abstractive summarization
- **Output**: Concise summary of document content

### 3. Named Entity Recognition (NER)
- **Model**: BERT Large Cased (`dbmdz/bert-large-cased-finetuned-conll03-english`)
- **Entities**: PER, ORG, LOC, MISC + custom legal entities
- **Output**: Extracted parties, dates, amounts, contract types

### 4. Question Answering
- **Model**: RoBERTa Base SQuAD2 (`deepset/roberta-base-squad2`)
- **Approach**: Extractive QA
- **Output**: Answers extracted from document context

### 5. Semantic Search
- **Model**: Sentence Transformers (`all-MiniLM-L6-v2`)
- **Approach**: Vector embeddings + cosine similarity
- **Database**: Supabase pgvector

## Performance Optimization

### Model Caching
Models are loaded once and cached in memory for subsequent requests.

### Batch Processing
Multiple documents can be processed together to improve throughput.

### GPU Acceleration
Install CUDA and update transformers to use GPU:
```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

### Model Quantization
Use quantized versions for faster inference:
```
facebook/bart-large-cnn-quantized
```

## Deployment

### Local Development
See "Running the Backend" section above

### Docker Deployment
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment Options
1. **Render**: Easy deployment with free tier
2. **Railway**: Pay-as-you-go with auto-scaling
3. **Heroku**: Simple push-to-deploy (paid)
4. **AWS EC2**: Full control and scalability
5. **DigitalOcean**: Affordable VPS option

## Monitoring and Logging

The backend includes structured logging for all operations:

```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

Monitor these metrics:
- API response times
- Model inference times
- Error rates
- Queue length (for async tasks)

## Troubleshooting

### CUDA Out of Memory
Reduce batch size or use quantized models

### Slow Document Processing
- Check document size
- Verify GPU availability
- Monitor CPU/memory usage

### Model Download Failures
Download models manually:
```bash
python -c "from transformers import pipeline; pipeline('summarization')"
```

### Supabase Connection Issues
- Verify API credentials
- Check network connectivity
- Review Supabase logs

## Future Enhancements

1. **Async Processing**: Background task queue with Celery
2. **Caching**: Redis for embedding cache
3. **Fine-tuning**: Custom models trained on legal documents
4. **Real-time Updates**: WebSocket support for live processing
5. **Multi-language**: Support for documents in multiple languages
6. **Advanced NER**: Custom legal entity recognition models
7. **Document Comparison**: Compare similar documents
8. **Compliance Checking**: Automated compliance validation

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.
