# LLM & RAG Based Document Question Answering System

An AI-powered web application that allows users to upload PDF documents and interact with them using natural language questions. The system uses Retrieval-Augmented Generation (RAG) to retrieve relevant content from uploaded documents and generate accurate, context-aware answers using Large Language Models (LLMs).

---

## Features

- PDF Upload and Processing
- Document-based Question Answering
- Retrieval-Augmented Generation (RAG)
- Semantic Search using FAISS
- Source Page References
- PDF Summarization
- Voice Input Support
- Chat History Management
- Export Chat to PDF
- Dark / Light Theme
- Responsive Chat-style UI

---

## Tech Stack

### Frontend
- React
- CSS
- Axios
- React Markdown
- React Icons

### Backend
- Flask
- Flask-CORS

### AI & NLP
- Google Gemini 2.5 Flash API
- SentenceTransformers
- FAISS Vector Database

### PDF Processing
- PyMuPDF
- ReportLab

---

## Project Architecture

```text
User Query
     ↓
React Frontend
     ↓
Flask Backend
     ↓
PDF Text Extraction
     ↓
Semantic Chunking
     ↓
Sentence Embeddings
     ↓
FAISS Vector Search
     ↓
Relevant Context Retrieval
     ↓
Gemini API
     ↓
Document-based Answer
