from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    clues = int(request.args.get('clues', 35))
    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    incorrect = sudoku_logic.find_incorrect_cells(board, solution)
    board_is_full = all(all(cell != 0 for cell in row) for row in board)
    solved = board_is_full and len(incorrect) == 0
    return jsonify({'incorrect': incorrect, 'solved': solved})


def is_valid_board(board):
    if not isinstance(board, list) or len(board) != 9:
        return False

    for row in board:
        if not isinstance(row, list) or len(row) != 9:
            return False
        for value in row:
            if not isinstance(value, int) or isinstance(value, bool):
                return False
            if value < 0 or value > 9:
                return False
    return True


@app.route('/hint', methods=['POST'])
def get_hint():
    solution = CURRENT.get('solution')
    puzzle = CURRENT.get('puzzle')
    if solution is None or puzzle is None:
        return jsonify({'error': 'No game in progress'}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({'error': 'Invalid board'}), 400

    board = data.get('board')
    if not is_valid_board(board):
        return jsonify({'error': 'Invalid board'}), 400

    row = data.get('row')
    col = data.get('col')
    if not isinstance(row, int) or isinstance(row, bool) or not isinstance(col, int) or isinstance(col, bool):
        return jsonify({'error': 'Invalid coordinates'}), 400
    if row < 0 or row > 8 or col < 0 or col > 8:
        return jsonify({'error': 'Invalid coordinates'}), 400

    if puzzle[row][col] != 0:
        return jsonify({'error': 'Target cell was a prefilled clue'}), 400

    if board[row][col] != 0:
        return jsonify({'error': 'Target cell is already filled'}), 400

    if not any(board[r][c] == 0 and puzzle[r][c] == 0 for r in range(9) for c in range(9)):
        return jsonify({'error': 'No valid hint target'}), 400

    return jsonify({'row': row, 'col': col, 'value': solution[row][col]})


if __name__ == '__main__':
    app.run(debug=True)