# Contributing to Tangtao

Thank you for your interest in contributing to Tangtao! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Run the setup script to install dependencies
4. Create a new branch for your feature or bug fix

## Development Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

### Installation
1. Run the setup script:
   - Windows: `setup.bat`
   - macOS/Linux: `./setup.sh`

2. Start the development servers:
   - Windows: `start_app.bat`
   - Manual: Follow the README instructions

## Code Standards

### Frontend (Next.js/TypeScript)
- Use TypeScript for all new code
- Follow React best practices
- Use Tailwind CSS for styling
- Components should be in PascalCase
- Use meaningful variable and function names
- Add proper TypeScript types

### Backend (Django/Python)
- Follow PEP 8 style guidelines
- Use Django best practices
- Write docstrings for functions and classes
- Use meaningful variable and function names
- Follow Django naming conventions

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples
```
feat(auth): add password reset functionality

- Add password reset form
- Implement email sending
- Add reset token validation

Closes #123
```

```
fix(restaurants): resolve image loading issue

- Fix broken image URLs
- Add fallback for missing images
- Improve error handling

Fixes #456
```

## Pull Request Process

1. **Create a descriptive branch name**:
   - `feature/user-profile-editing`
   - `fix/restaurant-search-bug`
   - `docs/api-documentation`

2. **Make your changes**:
   - Keep changes focused and atomic
   - Write clear, concise code
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**:
   - Ensure all existing tests pass
   - Test your feature thoroughly
   - Check for TypeScript errors
   - Verify both frontend and backend work

4. **Submit a Pull Request**:
   - Use a clear, descriptive title
   - Describe what your PR does
   - Reference any related issues
   - Include screenshots for UI changes

## Code Review Process

1. All PRs require at least one review
2. Address reviewer feedback promptly
3. Keep discussions constructive and professional
4. Update your PR based on feedback

## Issue Reporting

### Bug Reports
Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

### Feature Requests
Include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Any related issues or discussions

## Development Guidelines

### Database Changes
1. Create migrations for model changes
2. Test migrations on sample data
3. Document any manual migration steps

### API Changes
1. Maintain backward compatibility when possible
2. Update API documentation
3. Add appropriate tests
4. Consider versioning for breaking changes

### UI/UX Changes
1. Follow existing design patterns
2. Ensure responsive design
3. Test on multiple devices/browsers
4. Consider accessibility guidelines

## Testing

### Frontend Testing
- Component testing with React Testing Library
- Type checking with TypeScript
- Lint checking with ESLint

### Backend Testing
- Unit tests for models and views
- API endpoint testing
- Database migration testing

## Questions?

If you have questions about contributing:
1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Join our community discussions

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

Thank you for contributing to Tangtao! 🚀
