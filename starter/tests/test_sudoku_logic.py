import sudoku_logic


def is_valid_sudoku_board(board):
    expected = list(range(1, 10))

    for row in board:
        assert sorted(row) == expected

    for col in range(9):
        values = [board[row][col] for row in range(9)]
        assert sorted(values) == expected

    for row_start in range(0, 9, 3):
        for col_start in range(0, 9, 3):
            values = []
            for row in range(row_start, row_start + 3):
                for col in range(col_start, col_start + 3):
                    values.append(board[row][col])
            assert sorted(values) == expected


def test_create_empty_board_returns_9x9_zero_grid():
    board = sudoku_logic.create_empty_board()

    assert len(board) == 9
    assert all(len(row) == 9 for row in board)
    assert all(cell == 0 for row in board for cell in row)


def test_is_safe_rejects_conflicts_in_row_column_and_box():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    board[0][1] = 1

    assert sudoku_logic.is_safe(board, 0, 2, 5) is False
    assert sudoku_logic.is_safe(board, 0, 2, 4) is True


def test_find_incorrect_cells_returns_same_coordinates_as_route_logic():
    board = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 4, 5, 6, 7, 8, 9, 1],
        [5, 6, 7, 8, 9, 1, 2, 3, 4],
        [8, 9, 1, 2, 3, 4, 5, 6, 7],
        [3, 4, 5, 6, 7, 8, 9, 1, 2],
        [6, 7, 8, 9, 1, 2, 3, 4, 5],
        [9, 1, 2, 3, 4, 5, 6, 7, 8],
    ]
    solution = [row[:] for row in board]
    board[0][0] = 9
    board[8][8] = 1

    assert sudoku_logic.find_incorrect_cells(board, solution) == [[0, 0], [8, 8]]


def test_generate_puzzle_returns_valid_board_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert len(puzzle) == 9
    assert all(len(row) == 9 for row in puzzle)
    assert len(solution) == 9
    assert all(len(row) == 9 for row in solution)

    is_valid_sudoku_board(solution)

    clues = sum(1 for row in puzzle for cell in row if cell != 0)
    assert clues == 35


def test_generate_puzzle_has_expected_empty_cells():
    puzzle, _ = sudoku_logic.generate_puzzle(35)

    empty_cells = sum(1 for row in puzzle for cell in row if cell == 0)
    assert empty_cells == 81 - 35
