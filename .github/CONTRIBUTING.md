# Contributing to Metal

Thank you for your interest in contributing to Metal! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/metal.git
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-owner/metal.git
   ```
4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the project:

   ```bash
   pnpm build
   ```

3. Run tests:
   ```bash
   pnpm test
   ```

## Project Structure

```
metal/
├── apps/                    # Application packages
│   ├── cli/                # CLI application
│   └── daemon/             # Daemon application
├── packages/               # Shared packages
│   ├── core/              # Core functionality
│   └── types/             # Shared types
├── tools/                 # Development tools
└── docs/                 # Documentation
```

## Development Workflow

1. Follow the TypeScript standards defined in `.cursor/rules/typescript-standards.mdc`
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass
5. Submit a pull request

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the USAGE.md with any new commands or features
3. The PR will be merged once you have the sign-off of at least one maintainer

## Code Style

- Follow the TypeScript standards in `.cursor/rules/typescript-standards.mdc`
- Use Prettier for code formatting
- Follow ESLint rules
- Write meaningful commit messages

## Testing

- Write unit tests for new features
- Ensure all tests pass
- Update tests for bug fixes
- Follow testing standards in `.cursor/rules/testing-standards.mdc`

## Documentation

- Update documentation for new features
- Follow documentation standards in `.cursor/rules/documentation-standards.mdc`
- Include examples in documentation
- Update README.md if needed

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:

- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding or updating tests
- chore: Maintenance tasks

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing to Metal, you agree that your contributions will be licensed under the project's MIT License.
