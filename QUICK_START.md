# Nyaya AI - Quick Start Guide

## ⚡ Fast Setup (5 minutes)

### Step 1: Clone & Install Frontend

```bash
# Navigate to project
cd nyaya-ai

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase URL and Key
# Get these from https://app.supabase.com/projects
```

### Step 2: Start Frontend

```bash
pnpm dev
```

Frontend running at: **http://localhost:3000**

### Step 3: Backend Setup (Separate Terminal)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with Supabase credentials
echo "SUPABASE_URL=your_url" > .env
echo "SUPABASE_KEY=your_key" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_role_key" >> .env

# Run backend
python -m uvicorn main:app --reload
```

Backend running at: **http://localhost:8000**
API Documentation at: **http://localhost:8000/docs**

---

## 🚀 First-Time User Flow

### 1. Create Account
- Go to http://localhost:3000
- Click "Get Started"
- Sign up with email/password

### 2. Upload Document
- Click "Upload Document"
- Drag and drop or select a PDF/DOCX/TXT file
- Wait for upload to complete

### 3. View Analysis
- Click on document in dashboard
- Switch between Summary/Entities/Q&A tabs
- Ask questions in the sidebar

### 4. Try Search
- Use the sidebar search to find information
- Results ranked by relevance

---

## 📁 Project Structure Quick Reference

```
Frontend:
├── app/page.tsx              # Landing page
├── app/auth/                 # Login/signup
├── app/dashboard/            # Main app area
└── lib/auth-context.tsx      # Auth provider

Backend:
├── main.py                   # FastAPI server
├── nlp_processors.py         # NLP models
└── requirements.txt          # Python dependencies

Database:
├── Supabase PostgreSQL       # Primary database
└── pgvector                  # Vector search
```

---

## 🔌 API Endpoints

### Frontend Routes
```
POST /api/documents/process   # Process document
POST /api/qa                  # Ask question
POST /api/search              # Search documents
```

### Backend Routes
```
GET  /health                  # Health check
POST /process-document        # Process doc
POST /ask-question            # Q&A
POST /semantic-search         # Vector search
POST /batch-process           # Bulk process
```

---

## 🛠️ Common Commands

### Frontend
```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Check code
pnpm test             # Run tests
```

### Backend
```bash
python -m uvicorn main:app --reload
# With different port:
python -m uvicorn main:app --reload --port 8001
```

### Database
```bash
# Access Supabase dashboard
# https://app.supabase.com

# View schema
# Go to SQL Editor in Supabase dashboard
```

---

## 🔑 Environment Variables Needed

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
BACKEND_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get these from:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API → Copy keys

---

## 🧪 Test Document Processing

### Create Test Document
```bash
echo "This is a sample legal document about payment terms. The buyer shall pay within 30 days of invoice. Late payments subject to 5% interest." > test.txt
```

### Upload & Process
1. Go to http://localhost:3000
2. Click "Upload Document"
3. Select test.txt
4. Wait for "completed" status

### Check Results
1. Click on document
2. View auto-generated summary
3. See extracted entities (dates, amounts, etc.)
4. Ask: "What are the payment terms?"

---

## 🚀 Deploy to Production

### Frontend (Vercel)
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect repo to Vercel
# https://vercel.com/new

# 3. Add environment variables
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# BACKEND_URL (your deployed backend)

# 4. Deploy
# Automatic on push to main
```

### Backend (Render)
```bash
# 1. Create account on Render
# https://render.com

# 2. New Web Service
# Connect GitHub repository
# Runtime: Python 3.10
# Build command: pip install -r requirements.txt
# Start command: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app

# 3. Add environment variables
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

# 4. Deploy
```

---

## ❌ Troubleshooting

### "Cannot find module" Error
```bash
cd nyaya-ai
pnpm install
pnpm dev
```

### Auth Not Working
```bash
# Check .env.local has correct Supabase keys
# Verify email/password at https://app.supabase.com/auth
# Check browser console for errors
```

### Backend Not Responding
```bash
# Check if running: curl http://localhost:8000/health
# Kill process: lsof -i :8000 (macOS/Linux)
# Restart: python -m uvicorn main:app --reload
```

### Models Downloading Fails
```bash
# Download manually in backend:
python -c "from transformers import pipeline; pipeline('summarization')"
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Out of Memory
```bash
# Edit backend/nlp_processors.py
# Use smaller models:
# - facebook/distilbart-12-6  (faster, smaller)
# - all-MiniLM-L6-v2 (already small)
```

---

## 📊 Performance Tips

### Faster Document Processing
- Use smaller PDF files (< 10 MB)
- Check GPU is available: `python -c "import torch; print(torch.cuda.is_available())"`
- Process documents in batch

### Faster Search
- Ensure embeddings are cached
- Use top_k parameter to limit results
- Index frequently searched terms

### Better Q&A
- Ask specific questions
- Include context from document
- Avoid ambiguous pronouns

---

## 🔐 Security Checklist

- ✅ Change default Supabase password
- ✅ Enable 2FA on Supabase account
- ✅ Use environment variables (never hardcode keys)
- ✅ Enable HTTPS in production
- ✅ Add rate limiting to API
- ✅ Monitor access logs
- ✅ Keep dependencies updated

---

## 📚 Documentation Links

- **Full README**: See README.md
- **Backend Setup**: See backend/README.md
- **Implementation Details**: See IMPLEMENTATION_SUMMARY.md
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com

---

## 💡 Tips & Tricks

### Use Test Database
```sql
-- Add test document directly in Supabase
INSERT INTO documents (user_id, title, filename, file_path, file_type, file_size, status)
VALUES ('user_id', 'Test Doc', 'test.pdf', 'path', 'pdf', 1000, 'completed');
```

### Monitor Processing
```bash
# Check all documents
curl http://localhost:3000/api/documents

# Check specific document
curl http://localhost:3000/api/documents/[id]
```

### View Logs
```bash
# Frontend logs: Browser DevTools Console
# Backend logs: Terminal running `pnpm dev`
# Database logs: Supabase Dashboard → Logs
```

---

## 🎯 Next Steps

1. ✅ Complete local setup
2. ✅ Upload and process a document
3. ✅ Test Q&A functionality
4. ✅ Try semantic search
5. ✅ Review code in `/app` and `/backend`
6. ✅ Customize for your use case
7. ✅ Deploy to production

---

**Questions?** Check README.md or backend/README.md for detailed docs.

**Ready to start?** Run `pnpm dev` in the project root! 🚀
