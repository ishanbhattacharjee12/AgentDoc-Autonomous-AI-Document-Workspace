# Contributing Guidelines

We welcome contributions to AgentDoc! Follow these guidelines to set up your environment, follow code standards, and submit pull requests.

---

## 1. Development Environment Setup

### Prerequisites
*   Python 3.11+
*   Node.js 20+

### Setup Commands
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ishanbhattacharjee/AgentDoc.git
    cd AgentDoc
    ```
2.  **Initialize Backend**:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```
3.  **Initialize Frontend**:
    ```bash
    cd frontend-react
    npm install
    ```

---

## 2. Coding Standards & Quality

### TypeScript & React
*   Always write type-safe components. Avoid the use of broad `any` typings.
*   Keep logic modular; extract common hooks and types.
*   Execute build verification checks prior to committing:
    ```bash
    npm run build
    ```

### Code Style
*   Formatting rules are enforced via Prettier and ESLint.
*   Do not leave commented-out console debugging lines in production-ready files.

---

## 3. Pull Request Submission Checklist

Before submitting a Pull Request, ensure:
1.  All TypeScript files compile with zero warnings or errors.
2.  The production build executes successfully.
3.  Unit and E2E verification test suites pass completely.
4.  Commit messages follow the semantic prefix structure:
    *   `feat(...)`: New feature additions.
    *   `fix(...)`: General bug fixes.
    *   `chore(...)`: Quality adjustments or updates to dependencies.
    *   `docs(...)`: Documentation files edits.
