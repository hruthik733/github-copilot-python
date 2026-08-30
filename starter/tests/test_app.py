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


def test_check_solution_marks_completed_board_as_solved(client):
    client.get("/new?clues=35")

    response = client.post("/check", json={"board": [row[:] for row in CURRENT["solution"]]})

    assert response.status_code == 200
    data = response.get_json()
    assert data["solved"] is True
    assert data["incorrect"] == []


def test_check_solution_rejects_full_incorrect_board(client):
    client.get("/new?clues=35")
    board = [row[:] for row in CURRENT["solution"]]
    board[0][0] = 1 if board[0][0] != 1 else 2

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    data = response.get_json()
    assert data["solved"] is False


def test_check_solution_rejects_partially_filled_board(client):
    client.get("/new?clues=35")
    board = [[0] * 9 for _ in range(9)]
    board[0][0] = CURRENT["solution"][0][0]

    response = client.post("/check", json={"board": board})

    assert response.status_code == 200
    data = response.get_json()
    assert data["solved"] is False


def test_check_solution_requires_active_game(client):
    CURRENT["solution"] = None
    CURRENT["puzzle"] = None

    response = client.post("/check", json={"board": [[0] * 9 for _ in range(9)]})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_hint_requires_active_game(client):
    CURRENT["solution"] = None
    CURRENT["puzzle"] = None

    response = client.post("/hint", json={"board": [[0] * 9 for _ in range(9)], "row": 0, "col": 0})

    assert response.status_code == 400
    assert response.get_json() == {"error": "No game in progress"}


def test_hint_returns_correct_value_for_empty_cell(client):
    client.get("/new?clues=35")
    row, col = next((r, c) for r in range(9) for c in range(9) if CURRENT["puzzle"][r][c] == 0)
    board = [[0] * 9 for _ in range(9)]

    response = client.post("/hint", json={"board": board, "row": row, "col": col})

    assert response.status_code == 200
    data = response.get_json()
    assert data["row"] == row
    assert data["col"] == col
    assert data["value"] == CURRENT["solution"][row][col]
    assert set(data) == {"row", "col", "value"}


def test_hint_rejects_prefilled_cell(client):
    client.get("/new?clues=35")
    row, col = next((r, c) for r in range(9) for c in range(9) if CURRENT["puzzle"][r][c] != 0)
    board = [[0] * 9 for _ in range(9)]

    response = client.post("/hint", json={"board": board, "row": row, "col": col})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Target cell was a prefilled clue"}


def test_hint_rejects_already_filled_user_cell(client):
    client.get("/new?clues=35")
    row, col = next((r, c) for r in range(9) for c in range(9) if CURRENT["puzzle"][r][c] == 0)
    board = [[0] * 9 for _ in range(9)]
    board[row][col] = 1

    response = client.post("/hint", json={"board": board, "row": row, "col": col})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Target cell is already filled"}


def test_hint_rejects_invalid_coordinates(client):
    client.get("/new?clues=35")
    row, col = next((r, c) for r in range(9) for c in range(9) if CURRENT["puzzle"][r][c] == 0)
    board = [[0] * 9 for _ in range(9)]

    response = client.post("/hint", json={"board": board, "row": 9, "col": col})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid coordinates"}


def test_new_game_does_not_expose_solution(client):
    response = client.get("/new?clues=35")

    assert response.status_code == 200
    payload = response.get_json()
    assert "puzzle" in payload
    assert "solution" not in payload
