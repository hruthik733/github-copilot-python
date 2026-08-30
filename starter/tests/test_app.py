import pytest

from app import CURRENT, app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    CURRENT["puzzle"] = None
    CURRENT["solution"] = None

    with app.test_client() as client:
        yield client


def test_index_route_returns_html(client):
    response = client.get("/")

    assert response.status_code == 200
    assert b"<html" in response.data.lower()


def test_new_game_route_returns_puzzle(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    payload = response.get_json()

    assert "puzzle" in payload
    assert len(payload["puzzle"]) == 9
    assert all(len(row) == 9 for row in payload["puzzle"])
    assert CURRENT["puzzle"] == payload["puzzle"]
    assert CURRENT["solution"] is not None


def test_new_game_route_defaults_to_35_clues(client):
    response = client.get("/new")

    assert response.status_code == 200
    payload = response.get_json()
    clue_count = sum(1 for row in payload["puzzle"] for cell in row if cell != 0)

    assert clue_count == 35


@pytest.mark.parametrize("clues", [40, 35, 30])
def test_new_game_route_respects_requested_clue_counts(client, clues):
    response = client.get(f"/new?clues={clues}")

    assert response.status_code == 200
    payload = response.get_json()
    clue_count = sum(1 for row in payload["puzzle"] for cell in row if cell != 0)

    assert clue_count == clues


def test_check_solution_reports_incorrect_positions(client):
    client.get("/new?clues=35")
    solution = [row[:] for row in CURRENT["solution"]]
    original = solution[0][0]
    replacement = 1 if original != 1 else 2
    solution[0][0] = replacement

    response = client.post("/check", json={"board": solution})

    assert response.status_code == 200
    data = response.get_json()
    assert [0, 0] in data["incorrect"]


def test_check_solution_requires_active_game(client):
    CURRENT["solution"] = None
    CURRENT["puzzle"] = None

    response = client.post("/check", json={"board": [[0] * 9 for _ in range(9)]})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}
