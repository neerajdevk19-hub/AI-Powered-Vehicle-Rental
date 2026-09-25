from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_recommend_vehicles_success():
    payload = {
        "preferredType": "SUV",
        "preferredTransmission": "Automatic",
        "maxPrice": 3500,
        "userLat": 22.7196,
        "userLng": 75.8577,
        "candidates": [
            {
                "id": "veh-001",
                "pricePerDay": 3200,
                "rating": 4.9,
                "distanceFromUser": 4.2,
                "type": "SUV",
                "transmission": "Automatic"
            },
            {
                "id": "veh-006",
                "pricePerDay": 1500,
                "rating": 4.5,
                "distanceFromUser": 2.1,
                "type": "Hatchback",
                "transmission": "Manual"
            }
        ]
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "rankedVehicleIds" in data
    assert "scores" in data
    assert len(data["rankedVehicleIds"]) == 2
    # veh-001 matches both preferred SUV and Automatic bonus
    assert data["rankedVehicleIds"][0] == "veh-001"

def test_recommend_empty_candidates():
    payload = {
        "candidates": []
    }
    response = client.post("/recommend", json=payload)
    assert response.status_code == 200
    assert response.json() == {"rankedVehicleIds": [], "scores": {}}
