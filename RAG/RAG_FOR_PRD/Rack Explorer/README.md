# VWO.com Basic RAG Explorer

A React + FastAPI application demonstrating a local, end-to-end retrieval-augmented generation pipeline over the supplied VWO.com product requirements PDF.

## Pipeline

1. FastAPI reads `../data/Product Requirements Document (PRD) VWO.com.pdf` with PyMuPDF and splits text into paragraph-aware chunks with configurable overlap.
2. `nomic-ai/nomic-embed-text-v1.5` creates normalized document vectors. Query vectors use Nomic's `search_query:` prefix; stored passages use `search_document:`.
3. Vectors and page/source metadata are persisted in local ChromaDB at `chroma_db/`.
4. Each query searches by cosine similarity and returns the four most relevant passages, including page numbers and similarity scores.
5. Groq generates a grounded answer using those passages. The UI displays both the answer and its retrieved context.

The source PDF lives at `RAG/basic_RAG/data/Product Requirements Document (PRD) VWO.com.pdf`, outside this app package. On first backend startup the index is built automatically. Subsequent startups reuse the local index; select **Re-index document** after changing the source PDF.

## Setup

Prerequisites: Python 3.10+ and Node.js 18+.

```bash
cd RAG/basic_RAG
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
cp .env.example .env
```

Add a Groq API key in `.env`:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

The prompt says “OpenGPT 120B,” which is not a canonical Groq model ID. The configurable default uses Groq's OpenAI-compatible `openai/gpt-oss-120b`; set `GROQ_MODEL` to another ID available to your Groq account if needed. The Nomic embedding model runs locally through Sentence Transformers and downloads its model weights on first launch. `NOMIC_API_KEY` is optional and only needed if your model access requires it.

Start both services:

```bash
npm run dev
```

Open the Vite address printed in the terminal (normally `http://127.0.0.1:5173`). The API runs at `http://127.0.0.1:8000`; ingestion state is at `/api/status`.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | empty | Required to generate answers |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq chat model ID |
| `CHROMA_PATH` | `./chroma_db` | Persistent vector-store directory |
| `COLLECTION_NAME` | `vwo_prd` | Chroma collection name |
| `CHUNK_SIZE` | `850` | Target chunk size in characters |
| `CHUNK_OVERLAP` | `150` | Chunk overlap in characters |

The browser never handles model secrets. `.env` is excluded from version control.

