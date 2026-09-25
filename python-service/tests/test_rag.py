"""Vector storage tests use explicit deterministic test embeddings, never production fallbacks."""
import numpy as np
from qdrant_client import QdrantClient
from app.rag import PolicyIndex, chunk_text

class TestEncoder:
    def encode(self, texts, **kwargs):
        return np.array([[1., 0., 0.] if 'cancel' in text.lower() else [0., 1., 0.] for text in texts])

DOCS = [
    {'id': 'cancel', 'title': 'Cancellation', 'category': 'Cancellation', 'content': 'Cancel at least 24 hours before pickup for a full refund.'},
    {'id': 'fuel', 'title': 'Fuel', 'category': 'Fuel policy', 'content': 'Return with the same tank level.'},
]

def test_chunking_overlap_and_empty():
    assert chunk_text('') == []
    chunks = chunk_text(' '.join(str(i) for i in range(180)))
    assert len(chunks) == 2
    assert chunks[0].split()[-20:] == chunks[1].split()[:20]

def test_real_qdrant_upsert_is_idempotent_and_retrieval_has_sources():
    index = PolicyIndex(QdrantClient(':memory:'), TestEncoder())
    first = index.ingest(DOCS)
    second = index.ingest(DOCS)
    assert first == second
    assert index.client.count(first['corpusId']).count == 2
    results = index.search('Can I cancel?', first['corpusId'])
    assert results[0]['id'] == 'cancel'
    assert results[0]['source'] == 'rental-policy:cancel'
    assert results[0]['score'] > .99
    index.client.close()

def test_changed_document_does_not_retrieve_stale_content():
    index = PolicyIndex(QdrantClient(':memory:'), TestEncoder())
    first = index.ingest(DOCS)
    revised = [{**DOCS[0], 'content': 'Cancel 48 hours before pickup.'}]
    second = index.ingest(revised)
    assert first['corpusId'] != second['corpusId']
    assert '48 hours' in index.search('cancel', second['corpusId'])[0]['content']
    index.client.close()
