# Contributing to Aqua Nexus

Welcome to the Aqua Nexus project. This document provides guidelines for contributing to the project during development.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Branching Strategy](#branching-strategy)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Code Style Guidelines](#code-style-guidelines)
7. [Testing Standards](#testing-standards)
8. [Documentation Requirements](#documentation-requirements)
9. [Code Review Checklist](#code-review-checklist)

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn package manager
- PostgreSQL 14 or higher
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/[organization]/aqua-nexus.git
cd aqua-nexus

# Install dependencies (when project is ready)
npm install

# Create environment file (copy from .env.example)
cp .env.example .env.local

# Update .env.local with your local development values
# Configure database connection, API keys, etc.

# Setup database (when schema is created)
npm run db:migrate

# Start development servers
npm run dev
```

---

## Development Environment

### Directory Structure Reference

```
aqua-nexus/
├── frontend/        # React frontend application
├── backend/         # Node.js/Express backend
├── shared/          # Shared types and constants
└── docs/            # Project documentation
```

### Running Locally

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Backend will run on http://localhost:5000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Frontend will run on http://localhost:3000
```

#### Database

```bash
# Ensure PostgreSQL is running locally or via Docker

# If using Docker Compose (when configured):
docker-compose up -d postgres

# Run Prisma migrations
cd backend
npx prisma migrate dev --name initial_setup

# View database GUI (optional)
npx prisma studio
```

---

## Branching Strategy

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
[type]/[scope]/[description]

type:   feature, bugfix, hotfix, docs, refactor, test
scope:  module name or area (e.g., auth, inventory, orders)
description: hyphen-separated summary
```

### Examples

```
feature/auth/jwt-token-refresh
bugfix/inventory/stock-calculation-error
hotfix/payments/decimal-precision
docs/architecture/rbac-model
refactor/backend/database-queries
test/employees/attendance-validation
```

### Branch Lifecycle

```
main (production)
├─ Merged PRs only, tagged with versions
│
└─ develop (integration branch)
   ├─ All feature branches merge here first
   ├─ Pre-release testing
   │
   └─ feature/auth/login (example)
       ├─ Created from: develop
       ├─ Work in progress
       ├─ Push frequently
       └─ Merge back to: develop (via PR)
```

### Branch Protection Rules

- `main`: Requires PR review, all checks passing
- `develop`: Requires at least 1 approval, all checks passing
- Direct push to main/develop is blocked

---

## Commit Conventions

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature/fix
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, or config changes
- **ci**: CI/CD configuration changes

### Scope

The scope specifies what part of the project is affected:

```
auth, users, employees, attendance, leave, overtime, payroll,
production, inventory, distributors, distribution, orders, sales,
returns, invoices, payments, suppliers, purchases, expenses,
reports, notifications, audit, frontend, backend, database
```

### Subject

- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period (.) at the end
- Max 50 characters

### Body

- Explain WHAT and WHY, not HOW
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple related changes

### Footer

- Reference issues: `Closes #123`, `Fixes #456`
- Note breaking changes: `BREAKING CHANGE: description`

### Examples

```
feat(auth): add JWT token refresh mechanism

Add ability to refresh expired JWT tokens without re-login.
Implement refresh token rotation and store secure HttpOnly cookies.

- Add refresh endpoint /api/v1/auth/refresh
- Implement token rotation logic
- Add refresh token expiry

Closes #42
```

```
fix(inventory): calculate stock correctly with decimals

Fix decimal precision issue when calculating remaining stock.
Now using proper decimal arithmetic instead of floating-point.

Closes #156
```

```
docs(architecture): update RBAC permission model
```

---

## Pull Request Process

### Before Creating a PR

1. **Update Your Branch**
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

2. **Run Tests Locally**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Ensure No Merge Conflicts**
   ```bash
   # If conflicts exist, resolve them
   git rebase --continue
   ```

### Creating a PR

1. **Push Your Branch**
   ```bash
   git push origin feature/auth/jwt-refresh
   ```

2. **Create Pull Request on GitHub**
   - Title: Follow commit convention
   - Description: Provide context and details

### PR Description Template

```markdown
## Description
Brief explanation of changes.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Describe how changes were tested:
- Unit tests added: Yes/No
- Manual testing: Describe
- Test results: Pass/Fail

## Related Issues
Closes #123, Fixes #456

## Screenshots (if applicable)
Attach UI changes screenshots.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings
```

### PR Review Process

1. **Automatic Checks**
   - GitHub Actions runs tests
   - Linting checks pass
   - Code coverage maintained

2. **Code Review**
   - At least 1 reviewer approval required
   - Reviewers check for:
     - Code quality and style
     - Logical correctness
     - Test coverage
     - Documentation completeness
     - Security implications

3. **Review Comments**
   - Address all reviewer comments
   - Respond to questions
   - Push additional commits to address feedback
   - Request re-review when ready

4. **Merging**
   - Ensure all checks pass
   - Squash commits if needed (keep history clean)
   - Delete branch after merge

### PR Rules

- All checks must pass (tests, linting)
- At least 1 approval required
- No merge conflicts
- Documentation updated if needed

---

## Code Style Guidelines

### TypeScript / JavaScript

#### Naming Conventions

```typescript
// Classes: PascalCase
class UserRepository { }
class AuthService { }

// Functions/Methods: camelCase
function getUserByEmail() { }
const validateLeaveRequest = () => { }

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_TIMEOUT = 5000;

// Interfaces/Types: PascalCase
interface User { }
type UserRole = 'admin' | 'manager';

// Private members: _camelCase
class User {
  private _password: string;
  private _secretKey: string;
}

// Boolean variables: is/has prefix
const isActive = true;
const hasPermission = false;
```

#### File Organization

```typescript
// 1. Import statements
import { Router } from 'express';
import { UserService } from '../services';

// 2. Types/Interfaces
interface UserRequest {
  email: string;
  password: string;
}

// 3. Constants
const DEFAULT_PAGE_SIZE = 20;

// 4. Main code
class UserController {
  // ...
}

// 5. Exports
export default UserController;
```

#### Code Formatting

- **Indentation**: 2 spaces
- **Line length**: Max 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, backticks for templates
- **Arrow functions**: Preferred over function keyword

```typescript
// Good
const mapUsers = (users: User[]): string[] => {
  return users
    .filter(user => user.isActive)
    .map(user => user.email);
};

// Bad
function mapUsers(users: User[]) {
  return users.filter(function(user) {
    return user.isActive;
  }).map(function(user) {
    return user.email;
  });
}
```

### React / JSX

#### Component Structure

```typescript
// Imports
import React from 'react';
import { useSelector } from 'react-redux';

// Types
interface UserListProps {
  title: string;
  onSelect: (userId: string) => void;
}

// Component
const UserList: React.FC<UserListProps> = ({ title, onSelect }) => {
  // Hooks
  const users = useSelector(state => state.users.list);

  // Handlers
  const handleUserClick = (userId: string) => {
    onSelect(userId);
  };

  // Render
  return (
    <div className="user-list">
      <h2>{title}</h2>
      <ul>
        {users.map(user => (
          <li key={user.id} onClick={() => handleUserClick(user.id)}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Export
export default UserList;
```

#### Naming Conventions

- Components: PascalCase
- Props interfaces: `{ComponentName}Props`
- Event handlers: `handle{EventName}` (e.g., `handleClick`, `handleSubmit`)
- Custom hooks: `use{HookName}` (e.g., `useAuth`, `useFetch`)

### CSS / Styling

- Use Tailwind CSS for utilities
- Use CSS modules for component-specific styles
- BEM methodology for custom CSS

```tsx
import styles from './UserCard.module.css';

<div className={styles['user-card']}>
  <div className={styles['user-card__header']}>
    <h3 className={styles['user-card__title']}>{name}</h3>
  </div>
</div>
```

---

## Testing Standards

### Test Coverage Targets

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: Critical user paths
- **E2E Tests**: Happy path scenarios

### Backend Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

#### Unit Test Example

```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: MockUserRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    authService = new AuthService(userRepository);
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const result = await authService.login({
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result).toHaveProperty('token');
      expect(result.token).toBeTruthy();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password'
        })
      ).rejects.toThrow('User not found');
    });
  });
});
```

### Frontend Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test UserList.test.tsx
```

#### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import UserList from './UserList';

describe('UserList', () => {
  it('should render user list', () => {
    const users = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' }
    ];

    render(<UserList users={users} />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });
});
```

---

## Documentation Requirements

### Code Comments

Comment on the WHY, not the WHAT.

```typescript
// Good
// Calculate overtime pay at 1.5x for hours over 40
const overtimePay = (hours - 40) * hourlyRate * 1.5;

// Bad - obvious from code
// Calculate overtime
const overtimePay = (hours - 40) * hourlyRate * 1.5;
```

### Function Documentation

Use JSDoc for complex functions:

```typescript
/**
 * Calculates monthly payroll for an employee
 * 
 * @param employee - Employee record with salary details
 * @param month - Month in YYYY-MM format
 * @param overtimeHours - Additional hours worked
 * @returns Monthly salary amount after deductions
 * 
 * @throws {EmployeeNotFoundError} If employee doesn't exist
 * @throws {InvalidMonthError} If month format is invalid
 */
function calculateMonthlyPayroll(
  employee: Employee,
  month: string,
  overtimeHours: number
): number {
  // Implementation
}
```

### README Updates

Update relevant README.md files when:
- Adding new modules
- Changing API endpoints
- Modifying database schema
- Introducing new dependencies

### API Documentation

When adding new endpoints, update the API documentation in `docs/api/`:

```markdown
## POST /api/v1/orders

Create a new sales order.

### Request
```json
{
  "customerId": "cust-123",
  "items": [{ "itemId": "item-1", "quantity": 10 }],
  "deliveryDate": "2026-09-15"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "orderId": "order-123",
    "status": "pending",
    "createdAt": "2026-08-31T10:30:00Z"
  }
}
```

### Permissions
- Required: `orders:create`
- Area-scoped: Available for assigned areas
```

---

## Code Review Checklist

### Reviewer Checklist

- [ ] Code follows style guidelines
- [ ] Commit messages follow conventions
- [ ] No unnecessary duplication
- [ ] Error handling implemented
- [ ] Input validation present
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Database migrations if applicable
- [ ] No console logs or debug code

### Author Checklist

- [ ] Self-reviewed code
- [ ] All tests pass locally
- [ ] Lint and format checks pass
- [ ] No merge conflicts
- [ ] Branch is updated with main/develop
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete
- [ ] Screenshots/examples included (if applicable)
- [ ] Related issues linked

---

## Getting Help

- **Questions?** Create a discussion or ask in team channels
- **Found a bug?** Create an issue with reproduction steps
- **Need review?** Tag the relevant code owners
- **Documentation unclear?** Update it and create a PR

---

## Code of Conduct

- Be respectful and professional in all interactions
- Welcome and support newcomers
- Constructive feedback only
- Respect diverse perspectives
- Report unacceptable behavior

---

Thank you for contributing to Aqua Nexus!

**Last Updated:** August 31, 2026
