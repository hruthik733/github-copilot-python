# GitHub Copilot Instructions for the Flask Sudoku Project

## Project Overview

This project is a Python Flask Sudoku game that is being refactored from a legacy codebase into a modern, modular, maintainable web application.

The final application should support:

- Sudoku puzzles with exactly one unique solution.
- Easy, Medium, and Hard difficulty levels.
- Different numbers of prefilled cells for each difficulty.
- Locked prefilled cells.
- Immediate visual feedback for invalid moves.
- A Check button that highlights incorrect entries.
- A Hint button that fills one correct empty cell and locks it.
- A timer for each game.
- A completion message when the puzzle is solved.
- A Top 10 leaderboard.
- Player names, completion times, difficulty levels, and hint usage.
- Persistent Top 10 scores using browser localStorage.
- Light mode and dark mode.
- Responsive desktop and mobile layouts.
- Alternating visual styles for the nine 3x3 Sudoku regions.

## Code Style

When generating Python code:

- Follow modern Python conventions and PEP 8.
- Prefer clear, readable code over unnecessarily complex code.
- Use descriptive function and variable names.
- Keep functions focused on one responsibility.
- Add comments when the logic is non-obvious.
- Avoid unnecessary global variables.
- Use consistent error handling.
- Do not introduce unnecessary dependencies.

## Architecture

Keep responsibilities separated whenever possible.

Suggested responsibilities:

- Flask routes should handle HTTP requests and responses.
- Sudoku generation logic should be separated from Flask route logic.
- Sudoku solving and unique solution validation should be modular.
- Frontend interaction should be handled primarily with JavaScript.
- Styling should be handled with CSS.
- Tests should be kept separate from application code.

Do not create unnecessary files or abstractions if the existing project structure does not require them.

## Testing

Before changing existing behavior:

- Understand the current behavior.
- Preserve existing functionality unless the project requirements require a change.
- Add or update tests for important functionality.
- Prefer pytest for Python testing unless the existing project already uses another testing framework.
- Run tests after significant refactoring or feature additions.

Important features that should be tested include:

- Sudoku board validation.
- Puzzle generation.
- Unique solution detection.
- Difficulty-based puzzle generation.
- Prefilled cell behavior.
- Flask routes.

## GitHub Copilot Behavior

When making a significant change:

1. First explain the proposed approach.
2. Identify which files will be modified.
3. Avoid changing unrelated files.
4. Make the smallest reasonable change.
5. Explain the generated code if the logic is complex.

Do not rewrite the entire application when a smaller change is sufficient.

If requirements are unclear, explain assumptions before generating code.

## Code Quality

Prioritize:

- Readability.
- Maintainability.
- Modularity.
- Correctness.
- Testability.
- Responsive design.
- Accessibility.

Do not blindly follow suggestions that conflict with existing project requirements.
Preserve working functionality and avoid unnecessary complexity.