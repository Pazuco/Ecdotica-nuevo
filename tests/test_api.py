from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_analyze_endpoint():
    response = client.post(
        "/api/v1/text/analyze",
        json={"text": "Hola mundo editorial", "options": {}}
    )
    assert response.status_code == 200
    assert "word_count" in response.json()
    assert response.json()["word_count"] == 3
