from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

app = FastAPI(
    title="DriveAI Python Vehicle Recommendation Service",
    description="FastAPI microservice for AI vehicle scoring and ranking.",
    version="1.0.0",
)

class CandidateVehicle(BaseModel):
    id: str
    pricePerDay: float = Field(..., ge=0, description="Daily rental price in INR")
    rating: float = Field(4.5, ge=0, le=5, description="Vehicle rating out of 5")
    distanceFromUser: float = Field(..., ge=0, description="Distance in km from user location")
    type: str = Field(..., description="Vehicle type: SUV, Sedan, Hatchback, Bike")
    transmission: str = Field(..., description="Transmission: Automatic or Manual")

class RecommendRequest(BaseModel):
    preferredType: Optional[str] = None
    preferredTransmission: Optional[str] = None
    maxPrice: Optional[float] = None
    userLat: Optional[float] = None
    userLng: Optional[float] = None
    candidates: List[CandidateVehicle]

class RecommendResponse(BaseModel):
    rankedVehicleIds: List[str]
    scores: Dict[str, float]

def calculate_recommendation_score(v: CandidateVehicle, req: RecommendRequest) -> float:
    # 1. Rating Score (Weight: 35%)
    rating_score = (min(5.0, max(1.0, v.rating)) / 5.0) * 35.0

    # 2. Distance Score (Weight: 35%) - closer is better
    max_dist = 50.0
    distance_score = max(0.0, 1.0 - (v.distanceFromUser / max_dist)) * 35.0

    # 3. Price Score (Weight: 20%) - lower price relative to 5000 INR budget is better
    price_ref = req.maxPrice if req.maxPrice and req.maxPrice > 0 else 5000.0
    price_score = max(0.0, 1.0 - (v.pricePerDay / (price_ref * 1.5))) * 20.0

    # 4. Preference Match Bonus (10%)
    preference_bonus = 0.0
    if req.preferredType and v.type.lower() == req.preferredType.lower():
        preference_bonus += 5.0
    if req.preferredTransmission and v.transmission.lower() == req.preferredTransmission.lower():
        preference_bonus += 5.0

    total_score = rating_score + distance_score + price_score + preference_bonus
    return round(total_score, 2)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "DriveAI Python Vehicle Recommendation Service"}

@app.on_event("startup")
def startup_event():
    try:
        get_policy_index()._ready()
    except Exception as e:
        print(f"Policy index warmup warning: {e}")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/recommend", response_model=RecommendResponse)
def recommend_vehicles(payload: RecommendRequest):
    if not payload.candidates:
        return RecommendResponse(rankedVehicleIds=[], scores={})

    scored_candidates = []
    scores_dict = {}

    for v in payload.candidates:
        score = calculate_recommendation_score(v, payload)
        scored_candidates.append((v.id, score))
        scores_dict[v.id] = score

    # Sort candidates by score descending
    scored_candidates.sort(key=lambda x: x[1], reverse=True)
    ranked_ids = [item[0] for item in scored_candidates]

    return RecommendResponse(rankedVehicleIds=ranked_ids, scores=scores_dict)

# NestJS owns policy documents; Python embeds and indexes the supplied corpus.
from app.rag import get_policy_index

class PolicyDocument(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=20000)

class IngestRequest(BaseModel):
    documents: List[PolicyDocument] = Field(..., min_length=1, max_length=100)

class PolicySearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    corpusId: str = Field(..., pattern=r'^driveai_policy_[a-f0-9]{24}$')

@app.post('/rag/ingest')
def ingest_policies(payload: IngestRequest):
    try:
        return get_policy_index().ingest([d.model_dump() for d in payload.documents])
    except Exception:
        raise HTTPException(status_code=503, detail='Policy embeddings or vector database unavailable')

@app.post('/rag/search')
def search_policies(payload: PolicySearchRequest):
    try:
        return {'sources': get_policy_index().search(payload.query, payload.corpusId)}
    except Exception:
        raise HTTPException(status_code=503, detail='Policy retrieval unavailable; policy terms could not be verified')
