# Contributing to ANTARES

Thank you for your interest in contributing to ANTARES! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful, inclusive, and constructive in all interactions.

## Getting Started

ANTARES is a multi-component repository with three main parts:

1. **antares** - Rust simulation engine
2. **antares-python** - Python client SDK
3. **antares-web** - React web interface

Choose the component(s) you'd like to contribute to and follow the respective setup instructions.

## Development Setup

### Prerequisites

- **Rust**: 1.70+ ([Install Rust](https://www.rust-lang.org/tools/install))
- **Python**: 3.13+ ([Install Python](https://www.python.org/downloads/))
- **Node.js**: 18+ ([Install Node.js](https://nodejs.org/))
- **Git**: For version control

### Setting Up the Development Environment

#### 1. Clone the Repository

```bash
git clone https://github.com/thesoftwaredesignlab/ANTARES.git
cd ANTARES
```

#### 2. Component-Specific Setup

**Rust Simulator:**
```bash
cd antares
cargo build
cargo test  # Run tests (when available)
cargo run   # Start the simulator
```

**Python SDK:**
```bash
cd antares-python

# Install uv (recommended package manager)
pip install uv

# Install in editable mode with dev dependencies
uv pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check src/ tests/
ruff format src/ tests/

# Type checking
mypy src/
```

**Web Interface:**
```bash
cd antares-web

# Install dependencies
npm install

# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Fix issues in existing code
- **New features** - Add new functionality
- **Tests** - Improve test coverage
- **Documentation** - Improve or add documentation
- **Performance** - Optimize existing code
- **Refactoring** - Improve code quality

### Before You Start

1. **Check existing issues** - See if someone is already working on it
2. **Open an issue** - Discuss major changes before implementing
3. **Fork the repository** - Create your own fork to work in
4. **Create a branch** - Use descriptive branch names

### Branch Naming Convention

Use the following prefixes for branch names:

- `feature/` - New features (e.g., `feature/add-sonar-detection`)
- `fix/` - Bug fixes (e.g., `fix/tracker-speed-calculation`)
- `docs/` - Documentation (e.g., `docs/api-reference`)
- `test/` - Test additions (e.g., `test/add-movement-tests`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-radar-logic`)

## Coding Standards

### Rust

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Add doc comments (`///`) for all public APIs
- Include examples in doc comments where helpful
- Document units for numeric parameters
- Handle errors explicitly (avoid excessive `unwrap()`)

**Example:**
```rust
/// Calculates the distance between two points in meters.
///
/// # Arguments
/// * `p1` - First point (x, y) in meters
/// * `p2` - Second point (x, y) in meters
///
/// # Returns
/// Distance in meters
///
/// # Example
/// ```
/// let distance = calculate_distance((0.0, 0.0), (3.0, 4.0));
/// assert_eq!(distance, 5.0);
/// ```
pub fn calculate_distance(p1: (f64, f64), p2: (f64, f64)) -> f64 {
    let dx = p2.0 - p1.0;
    let dy = p2.1 - p1.1;
    (dx * dx + dy * dy).sqrt()
}
```

### Python

- Follow [PEP 8](https://pep8.org/)
- Use type hints for all function signatures
- Use `ruff` for linting and formatting
- Use `mypy` for type checking (strict mode)
- Write docstrings for all public functions/classes
- Use Pydantic models for data validation

**Example:**
```python
def add_ship(
    ship_type: str,
    initial_position: tuple[float, float],
    speed: float,
) -> Ship:
    """
    Adds a ship to the simulation.

    Args:
        ship_type: Type of ship ("line", "circle", "random", "stationary")
        initial_position: Starting (x, y) coordinates in meters
        speed: Ship speed in meters per second

    Returns:
        Created Ship instance

    Raises:
        ValueError: If ship_type is invalid or speed is negative

    Example:
        >>> ship = add_ship("line", (0.0, 0.0), 10.5)
        >>> ship.type
        'line'
    """
    if speed < 0:
        raise ValueError("Speed must be non-negative")
    # Implementation...
```

### TypeScript/React

- Follow [TypeScript Guidelines](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Use ESLint for linting
- Use TypeScript strict mode
- Add JSDoc comments for complex functions
- Use functional components with hooks
- Properly type all props and state

**Example:**
```typescript
/**
 * Parses a CSV line into a Track object
 * @param line - CSV formatted track data (25 comma-separated fields)
 * @returns Parsed Track object or null if parsing fails
 */
export function parseTrackFromCSV(line: string): Track | null {
  const fields = line.split(',');
  if (fields.length !== 25) {
    console.error(`Invalid CSV line: expected 25 fields, got ${fields.length}`);
    return null;
  }
  // Implementation...
}
```

## Testing Requirements

All contributions must include appropriate tests. We aim for 80%+ code coverage.

### Rust Testing

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name
```

**Test Structure:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_movement() {
        let movement = LineMovement {
            angle: std::f64::consts::PI / 4.0,  // 45 degrees
            speed: 10.0,
        };
        let (dx, dy) = movement.calculate(1.0);
        // Use approx for floating point comparisons
        assert!((dx - 7.071).abs() < 0.01);
        assert!((dy - 7.071).abs() < 0.01);
    }
}
```

### Python Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=src --cov-report=term-missing

# Run specific test
pytest tests/test_file.py::test_function
```

**Test Structure:**
```python
import pytest
from antares.client import AntaresClient

def test_add_ship_success(mock_response):
    """Test successful ship addition."""
    client = AntaresClient()
    ship = client.add_ship("line", (0.0, 0.0), angle=0.0, speed=10.0)
    assert ship.type == "line"
    assert ship.speed == 10.0

def test_add_ship_invalid_type():
    """Test that invalid ship type raises ValueError."""
    client = AntaresClient()
    with pytest.raises(ValueError, match="Invalid ship type"):
        client.add_ship("invalid", (0.0, 0.0))
```

### TypeScript/React Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { parseTrackFromCSV } from './radarDataParser';

describe('parseTrackFromCSV', () => {
  it('should parse valid CSV line', () => {
    const csvLine = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
    const track = parseTrackFromCSV(csvLine);

    expect(track).not.toBeNull();
    expect(track?.id).toBe(1);
    expect(track?.range).toBe(500.5);
  });

  it('should return null for invalid CSV', () => {
    const track = parseTrackFromCSV('invalid,csv');
    expect(track).toBeNull();
  });
});
```

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main

### 2. Commit Message Format

Use clear, descriptive commit messages:

```
type: brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 characters).
Explain the problem this commit solves and why you chose
this approach.

Fixes #123
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add circular movement strategy for ships

Implements a new movement pattern where ships move in circles
with configurable radius and angular velocity. Useful for
patrol patterns and loitering behavior.

Fixes #45
```

```
fix: correct azimuth calculation in detector

The previous implementation didn't account for angle wrapping
at 2π. This caused incorrect azimuth values for tracks in the
fourth quadrant.

Fixes #67
```

### 3. Creating a Pull Request

1. Push your branch to your fork
2. Open a PR against the `main` branch
3. Fill out the PR template completely
4. Link related issues
5. Request review from maintainers

### 4. PR Review Process

- Maintainers will review your code
- Address any requested changes
- Once approved, your PR will be merged
- Delete your branch after merge

### 5. PR Checklist

- [ ] PR title is clear and descriptive
- [ ] Description explains what and why
- [ ] Tests pass in CI
- [ ] Code coverage maintained or improved
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Commits are clean and logical

## Reporting Issues

### Bug Reports

When reporting bugs, include:

1. **Description** - Clear summary of the bug
2. **Steps to reproduce** - Detailed steps
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - OS, versions, configuration
6. **Logs** - Relevant error messages or logs
7. **Screenshots** - If applicable

**Template:**
```markdown
**Description**
Brief description of the bug

**Steps to Reproduce**
1. Start the simulator with config X
2. Add a ship with parameters Y
3. Observe behavior Z

**Expected Behavior**
The ship should move in a circle

**Actual Behavior**
The ship moves in a straight line

**Environment**
- OS: Ubuntu 22.04
- Rust: 1.75
- ANTARES version: 1.0.0

**Logs**
```
[paste relevant logs here]
```

**Additional Context**
Any other relevant information
```

### Feature Requests

When requesting features, include:

1. **Use case** - Why you need this feature
2. **Proposed solution** - Your idea for implementation
3. **Alternatives** - Other approaches considered
4. **Additional context** - Examples, mockups, etc.

## Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:

1. Email security concerns to [security contact - TBD]
2. Include detailed description and reproduction steps
3. Allow time for fix before public disclosure

See SECURITY.md for more details (to be created).

## Development Workflow

### Typical Workflow

1. **Find or create an issue**
2. **Fork and clone** the repository
3. **Create a feature branch** from `main`
4. **Make your changes** with tests
5. **Run all checks** (tests, linting, formatting)
6. **Commit** with clear messages
7. **Push** to your fork
8. **Open a Pull Request**
9. **Address review feedback**
10. **Celebrate** when merged! 🎉

### Running All Checks Locally

**Rust:**
```bash
cd antares
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo build --release
```

**Python:**
```bash
cd antares-python
ruff check src/ tests/
ruff format --check src/ tests/
mypy src/
pytest --cov=src --cov-report=term-missing
```

**TypeScript:**
```bash
cd antares-web
npm run lint
npm test
npm run build
```

## Questions?

If you have questions:

- Check existing issues and discussions
- Open a new issue with the "question" label
- Reach out to maintainers

## License

By contributing to ANTARES, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to ANTARES! Your efforts help make naval radar simulation more accessible to researchers and developers worldwide.
