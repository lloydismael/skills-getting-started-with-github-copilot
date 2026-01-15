import copy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)
_default_activities = copy.deepcopy(activities)


def _reset_activities() -> None:
    activities.clear()
    activities.update(copy.deepcopy(_default_activities))


@pytest.fixture(autouse=True)
def reset_db():
    _reset_activities()


def test_get_activities_returns_all_participants():
    response = client.get("/activities")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert all("description" in info for info in response.json().values())
    assert response.json()["soccer"]["participants"] == []


def test_signup_adds_participant():
    email = "student@example.com"

    response = client.post(f"/activities/soccer/signup?email={email}")

    assert response.status_code == 200
    assert email in activities["soccer"]["participants"]
    assert "Signed up" in response.json()["message"]


def test_duplicate_signup_is_rejected():
    email = "student@example.com"

    client.post(f"/activities/soccer/signup?email={email}")
    response = client.post(f"/activities/soccer/signup?email={email}")

    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()


def test_unregister_participant():
    email = "student@example.com"
    activities["soccer"]["participants"].append(email)

    response = client.delete(f"/activities/soccer/participants?email={email}")

    assert response.status_code == 200
    assert email not in activities["soccer"]["participants"]
    assert "Unregistered" in response.json()["message"]


def test_unregister_missing_participant_returns_404():
    response = client.delete("/activities/soccer/participants?email=missing@example.com")

    assert response.status_code == 404
    assert "not registered" in response.json()["detail"].lower()
