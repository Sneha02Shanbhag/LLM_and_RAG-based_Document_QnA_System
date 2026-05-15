# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import os
# import numpy as np

# from pypdf import PdfReader
# from sentence_transformers import SentenceTransformer
# import faiss

# #  NEW GEMINI SDK
# from dotenv import load_dotenv
# from google import genai

# #  INIT
# app = Flask(__name__)
# CORS(app)

# UPLOAD_FOLDER = "uploads"
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# index = None
# chunks = []
# chunk_pages = []

# #  Embedding model
# embed_model = SentenceTransformer('all-MiniLM-L6-v2')

# #  Load API key
# load_dotenv()
# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# #  Extract text
# def extract_text(pdf_path):
#     reader = PdfReader(pdf_path)
#     docs = []

#     for i, page in enumerate(reader.pages):
#         text = page.extract_text()
#         if text:
#             docs.append((text, i + 1))

#     return docs



# #  Smart chunking
# def chunk_text_with_pages(docs, size=700):
#     text_chunks = []
#     pages = []

#     for text, page in docs:
#         lines = text.split("\n")

#         current_chunk = ""
#         for line in lines:
#             if len(current_chunk) + len(line) < size:
#                 current_chunk += line + " "
#             else:
#                 text_chunks.append(current_chunk.strip())
#                 pages.append(page)
#                 current_chunk = line + " "

#         if current_chunk:
#             text_chunks.append(current_chunk.strip())
#             pages.append(page)

#     return text_chunks, pages



# #  Upload API
# @app.route("/upload", methods=["POST"])
# def upload():
#     global index, chunks, chunk_pages

#     file = request.files["file"]
#     file_path = os.path.join(UPLOAD_FOLDER, file.filename)
#     file.save(file_path)

#     docs = extract_text(file_path)
#     chunks, chunk_pages = chunk_text_with_pages(docs)

#     embeddings = embed_model.encode(chunks)

#     dim = embeddings.shape[1]
#     index = faiss.IndexFlatL2(dim)
#     index.add(np.array(embeddings))

#     return jsonify({"message": "PDF processed successfully"})



# #  Ask API (NEW GEMINI)
# @app.route("/ask", methods=["POST"])
# def ask():
#     global index, chunks, chunk_pages

#     if index is None:
#         return jsonify({"error": "Upload document first"}), 400

#     question = request.json.get("question", "")

#     try:
#         #  Retrieve relevant chunks
#         q_embedding = embed_model.encode([question])
#         D, I = index.search(np.array(q_embedding), k=5)

#         context_chunks = []
#         source_pages = set()

#         for idx in I[0]:
#             chunk = chunks[idx]

#             #  keyword filtering
#             if any(word.lower() in chunk.lower() for word in question.split()):
#                 context_chunks.append(chunk)
#                 source_pages.add(chunk_pages[idx])

#         # fallback
#         if not context_chunks:
#             context_chunks = [chunks[I[0][0]]]
#             source_pages.add(chunk_pages[I[0][0]])

#         # limit context
#         context = "\n\n".join(context_chunks[:2])

#         #  Prompt
#         prompt = f"""
# Answer ONLY using the given context.

# STRICT RULES:
# - Do NOT use outside knowledge
# - Do NOT guess
# - If answer not found, say: Not found in document

# Context:
# {context}

# Question:
# {question}
# """

#         #  NEW GEMINI CALL
#         response = client.models.generate_content(
#             model="gemini-flash-latest",   # ✅ correct model
#             contents=prompt
#         )

#         answer = response.text

#         return jsonify({
#             "answer": answer.strip(),
#             "sources": sorted(list(source_pages))
#         })

#     except Exception as e:
#         print("ERROR:", e)
#         return jsonify({"answer": "⚠️ Error connecting to Gemini API"})



# #  Home
# @app.route("/")
# def home():
#     return "Backend running with Gemini (new SDK)!"



# #  Run
# if __name__ == "__main__":
#     app.run(debug=True)


from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

import os
import fitz
import faiss
import numpy as np
import tempfile

from sentence_transformers import SentenceTransformer
from google import genai

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import getSampleStyleSheet

# =====================================
# LOAD ENV
# =====================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# =====================================
# FLASK
# =====================================

app = Flask(__name__)
CORS(app)

# =====================================
# GEMINI
# =====================================

client = genai.Client(api_key=GEMINI_API_KEY)

# =====================================
# EMBEDDING MODEL
# =====================================

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

# =====================================
# GLOBAL STORAGE
# =====================================

document_chunks = []
document_sources = []

chat_history = []

faiss_index = None

# =====================================
# PDF TEXT EXTRACTION
# =====================================

def extract_text_from_pdf(pdf_path):

    doc = fitz.open(pdf_path)

    chunks = []
    sources = []

    for page_num in range(len(doc)):

        page = doc[page_num]

        text = page.get_text()

        text = text.replace("\n", " ")
        text = text.strip()

        chunk_size = 500
        overlap = 100

        start = 0

        while start < len(text):

            end = start + chunk_size

            chunk = text[start:end]

            if len(chunk.strip()) > 100:

                chunks.append(chunk)

                sources.append(page_num + 1)

            start += chunk_size - overlap

    return chunks, sources

# =====================================
# CREATE FAISS INDEX
# =====================================

def create_faiss_index(chunks):

    embeddings = embedding_model.encode(chunks)

    embeddings = np.array(
        embeddings
    ).astype("float32")

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    return index

# =====================================
# RETRIEVE CHUNKS
# =====================================

def retrieve_chunks(query, top_k=5):

    global faiss_index

    query_embedding = embedding_model.encode([query])

    query_embedding = np.array(
        query_embedding
    ).astype("float32")

    distances, indices = faiss_index.search(
        query_embedding,
        top_k
    )

    retrieved_chunks = []
    retrieved_pages = []

    for i, idx in enumerate(indices[0]):

        if idx < len(document_chunks):

            distance = distances[0][i]

            if distance < 1.5:

                retrieved_chunks.append(
                    document_chunks[idx]
                )

                retrieved_pages.append(
                    document_sources[idx]
                )

    return retrieved_chunks, retrieved_pages

# =====================================
# GEMINI RESPONSE
# =====================================

def generate_answer(question, context):

    prompt = f"""
You are a document question answering assistant.

STRICT RULES:
1. Answer ONLY from the provided context
2. If answer is not in context, say:
   "Not found in uploaded document."
3. Do NOT use external knowledge
4. Keep answer detailed and clean
5. Mention only information from context

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text

# =====================================
# HOME
# =====================================

@app.route("/")
def home():
    return "Backend Running"

# =====================================
# PDF UPLOAD
# =====================================

@app.route("/upload", methods=["POST"])
def upload_pdf():

    global document_chunks
    global document_sources
    global faiss_index

    if "file" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    temp_dir = tempfile.gettempdir()

    pdf_path = os.path.join(
        temp_dir,
        file.filename
    )

    file.save(pdf_path)

    chunks, sources = extract_text_from_pdf(
        pdf_path
    )

    document_chunks = chunks
    document_sources = sources

    faiss_index = create_faiss_index(
        document_chunks
    )

    return jsonify({
        "message": "PDF uploaded successfully",
        "chunks": len(document_chunks)
    })

# =====================================
# ASK QUESTION
# =====================================

@app.route("/ask", methods=["POST"])
def ask_question():

    global chat_history

    data = request.json

    question = data.get("question")

    if not question:

        return jsonify({
            "error": "Question missing"
        }), 400

    retrieved_chunks, pages = retrieve_chunks(
        question
    )

    if len(retrieved_chunks) == 0:

        answer = "Not found in uploaded document."

        response_data = {
            "question": question,
            "answer": answer,
            "pages": []
        }

        chat_history.append(response_data)

        return jsonify(response_data)

    context = "\n\n".join(retrieved_chunks)

    answer = generate_answer(
        question,
        context
    )

    unique_pages = sorted(list(set(pages)))

    response_data = {
        "question": question,
        "answer": answer,
        "pages": unique_pages
    }

    chat_history.append(response_data)

    return jsonify(response_data)

# =====================================
# CHAT HISTORY
# =====================================

@app.route("/history", methods=["GET"])
def history():

    return jsonify(chat_history)

# =====================================
# PDF SUMMARY
# =====================================

@app.route("/summarize", methods=["GET"])
def summarize_pdf():

    if len(document_chunks) == 0:

        return jsonify({
            "error": "Upload PDF first"
        }), 400

    full_text = " ".join(document_chunks[:50])

    prompt = f"""
Summarize this document in bullet points.

TEXT:
{full_text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return jsonify({
        "summary": response.text
    })

# =====================================
# EXPORT CHAT PDF
# =====================================

@app.route("/export-chat", methods=["GET"])
def export_chat():

    pdf_path = "chat_history.pdf"

    doc = SimpleDocTemplate(pdf_path)

    styles = getSampleStyleSheet()

    story = []

    story.append(
        Paragraph(
            "LLM + RAG Chat History",
            styles["Title"]
        )
    )

    story.append(Spacer(1, 20))

    for item in chat_history:

        story.append(
            Paragraph(
                f"<b>Question:</b> {item['question']}",
                styles["BodyText"]
            )
        )

        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                f"<b>Answer:</b> {item['answer']}",
                styles["BodyText"]
            )
        )

        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                f"<b>Pages:</b> {item['pages']}",
                styles["BodyText"]
            )
        )

        story.append(Spacer(1, 25))

    doc.build(story)

    return send_file(
        pdf_path,
        as_attachment=True
    )

# =====================================
# RUN
# =====================================

if __name__ == "__main__":
    app.run(debug=True)