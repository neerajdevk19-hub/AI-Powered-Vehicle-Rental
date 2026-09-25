import hashlib
import json
import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def chunk_text(text: str, size: int = 80, overlap: int = 15) -> List[str]:
    words = text.split()
    if not words:
        return []
    chunks = []
    for start in range(0, len(words), max(1, size - overlap)):
        chunks.append(' '.join(words[start:start + size]))
        if start + size >= len(words):
            break
    return chunks

class PolicyIndex:
    def __init__(self):
        self.corpora: Dict[str, Dict[str, Any]] = {}

    def _ready(self):
        pass

    def ingest(self, documents: List[dict]):
        fingerprint = hashlib.sha256(json.dumps(sorted(documents, key=lambda d: d['id']), sort_keys=True).encode()).hexdigest()[:24]
        collection = 'driveai_policy_' + fingerprint

        chunks = []
        for doc in documents:
            for index, content in enumerate(chunk_text(doc['content'])):
                chunks.append({
                    **doc,
                    'content': content,
                    'chunkIndex': index,
                    'source': f"rental-policy:{doc['id']}"
                })

        if not chunks:
            raise ValueError('No policy content supplied')

        texts = [f"{c['title']} {c['category']} {c['content']}" for c in chunks]
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(texts)

        self.corpora[collection] = {
            'chunks': chunks,
            'vectorizer': vectorizer,
            'matrix': matrix
        }

        return {'corpusId': collection, 'chunks': len(chunks), 'model': 'tfidf-cosine-vectorizer'}

    def search(self, query: str, corpus_id: str) -> List[dict]:
        corpus = self.corpora.get(corpus_id)
        if not corpus:
            if self.corpora:
                corpus = list(self.corpora.values())[-1]
            else:
                return []

        vectorizer = corpus['vectorizer']
        matrix = corpus['matrix']
        chunks = corpus['chunks']

        query_vec = vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, matrix)[0]

        results = []
        for idx, score in enumerate(similarities):
            if score > 0.01:
                results.append({
                    **chunks[idx],
                    'score': round(float(score), 4)
                })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:3]

_policy_index_instance = PolicyIndex()

def get_policy_index():
    return _policy_index_instance
