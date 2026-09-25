"""Real sentence embeddings and Qdrant retrieval; no keyword fallback."""
import hashlib
import os
import threading
import uuid
from functools import lru_cache
from pathlib import Path

from qdrant_client import QdrantClient, models

MODEL_NAME = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')
DATA_DIR = Path(os.getenv('AI_DATA_DIR', str(Path(__file__).resolve().parents[1] / 'data')))


def chunk_text(text: str, size: int = 100, overlap: int = 20) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    for start in range(0, len(words), size - overlap):
        chunks.append(' '.join(words[start:start + size]))
        if start + size >= len(words):
            break
    return chunks


class PolicyIndex:
    def __init__(self, client=None, encoder=None):
        self.client = client
        self.encoder = encoder
        self.lock = threading.RLock()

    def _ready(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if self.encoder is None:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer(MODEL_NAME, device='cpu', cache_folder=str(DATA_DIR / 'models'))
        if self.client is None:
            url = os.getenv('QDRANT_URL')
            if url and 'qdrant:6333' not in url:
                try:
                    self.client = QdrantClient(url=url, timeout=10)
                    self.client.get_collections()
                except Exception:
                    self.client = None
            if self.client is None:
                try:
                    qdrant_path = DATA_DIR / 'qdrant'
                    qdrant_path.mkdir(parents=True, exist_ok=True)
                    self.client = QdrantClient(path=str(qdrant_path))
                except Exception:
                    self.client = QdrantClient(location=":memory:")

    def ingest(self, documents: list[dict]):
        import json
        # Content/model-addressed collection: updates cannot return old policy chunks.
        fingerprint = hashlib.sha256((MODEL_NAME + json.dumps(sorted(documents, key=lambda d: d['id']), sort_keys=True)).encode()).hexdigest()[:24]
        collection = 'driveai_policy_' + fingerprint
        with self.lock:
            self._ready()
            chunks = []
            for doc in documents:
                for index, content in enumerate(chunk_text(doc['content'])):
                    chunks.append({**doc, 'content': content, 'chunkIndex': index,
                                   'source': f"rental-policy:{doc['id']}"})
            if not chunks:
                raise ValueError('No policy content supplied')
            texts = [f"{c['title']} ({c['category']}): {c['content']}" for c in chunks]
            if self.client.collection_exists(collection):
                count = self.client.count(collection, exact=True).count
                if count == len(chunks):
                    return {'corpusId': collection, 'chunks': count, 'model': MODEL_NAME}
            vectors = self.encoder.encode(texts, normalize_embeddings=True).tolist()
            if not self.client.collection_exists(collection):
                self.client.create_collection(collection, vectors_config=models.VectorParams(size=len(vectors[0]), distance=models.Distance.COSINE))
            points = [models.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"{collection}:{chunk['id']}:{chunk['chunkIndex']}")),
                vector=vector, payload=chunk,
            ) for chunk, vector in zip(chunks, vectors)]
            self.client.upsert(collection, points=points, wait=True)
            return {'corpusId': collection, 'chunks': len(points), 'model': MODEL_NAME}

    def search(self, query: str, corpus_id: str):
        if not corpus_id.startswith('driveai_policy_') or len(corpus_id) != 39:
            raise ValueError('Invalid policy corpus')
        with self.lock:
            self._ready()
            if not self.client.collection_exists(corpus_id):
                raise ValueError('Policy corpus not ingested')
            vector = self.encoder.encode([query], normalize_embeddings=True).tolist()[0]
            points = self.client.query_points(
                collection_name=corpus_id, query=vector, limit=3,
                score_threshold=0.30, with_payload=True,
            ).points
            return [{**point.payload, 'score': round(point.score, 4)} for point in points]


@lru_cache(maxsize=1)
def get_policy_index():
    return PolicyIndex()
