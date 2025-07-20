# Contributing to AI Interview Platform

We welcome contributions to the AI Interview Platform! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment
4. Create a new branch for your feature or bug fix

## Development Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Git

### Installation
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ai-interview-platform.git
cd ai-interview-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and optional OpenAI API key

# Set up database
npm run db:push

# Start development server
npm run dev
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code formatting and structure
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all imports are properly organized

### Frontend Development
- Use React functional components with hooks
- Implement responsive design with Tailwind CSS
- Use shadcn/ui components when possible
- Ensure accessibility compliance (ARIA attributes, keyboard navigation)
- Test voice interface functionality

### Backend Development
- Follow RESTful API conventions
- Implement proper error handling and logging
- Use TypeScript interfaces for all data structures
- Validate input data using Zod schemas
- Maintain database schema consistency

### Database Changes
- Use Drizzle ORM for all database operations
- Update schema definitions in `shared/schema.ts`
- Run `npm run db:push` to apply changes
- Test with both PostgreSQL and fallback systems

## Testing

### Manual Testing
- Test complete interview flow (upload → questions → answers → results)
- Verify voice interface functionality
- Test admin dashboard statistics and data
- Check mobile responsiveness
- Validate error handling scenarios

### AI System Testing
- Test with valid OpenAI API key
- Test fallback system when API is unavailable
- Verify question generation for different job roles
- Check answer evaluation accuracy

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Test your changes thoroughly
   - Update documentation if necessary

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Submit a Pull Request**
   - Go to GitHub and create a pull request
   - Provide a clear description of your changes
   - Reference any related issues

### Pull Request Guidelines
- Use descriptive commit messages
- Keep changes focused and atomic
- Update README.md if you add new features
- Ensure backward compatibility
- Test edge cases and error scenarios

## Types of Contributions

### Bug Fixes
- Fix existing functionality that doesn't work as expected
- Improve error handling and user feedback
- Address security vulnerabilities

### New Features
- Add new interview question types
- Enhance AI evaluation algorithms
- Improve user interface and experience
- Add new dashboard analytics

### Documentation
- Improve README.md and setup instructions
- Add code comments and API documentation
- Create user guides and tutorials

### Performance
- Optimize database queries
- Improve frontend loading times
- Enhance AI response speeds

## Code Review Process

1. All contributions require review before merging
2. Maintainers will provide feedback within 48 hours
3. Address review comments promptly
4. Squash commits before merging if requested

## Issue Reporting

When reporting bugs:
- Use the issue template
- Provide steps to reproduce
- Include error messages and logs
- Specify your environment details

When requesting features:
- Describe the use case clearly
- Explain expected behavior
- Consider implementation complexity

## Community Guidelines

- Be respectful and constructive in discussions
- Help others learn and grow
- Focus on the project's goals and values
- Follow the code of conduct

## Questions and Support

- Check existing documentation first
- Search closed issues for similar problems
- Create a discussion for general questions
- Contact maintainers for urgent matters

Thank you for contributing to the AI Interview Platform! 🚀