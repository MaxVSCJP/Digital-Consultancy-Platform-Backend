# Digital-Consultancy-Platform-Backend
This repo contains the backend code for a Digital Consultancy Platform for Entrepreneurs in Ethiopia project

## Contributing Standards & Conventions

### General Standards
- Write clean, readable, and well-documented code.
- Use meaningful variable and function names.
- Keep functions and files focused and modular.
- Write error handling and input validation for all endpoints.
- Add comments for complex logic or non-obvious code.
- Use ES6+ features and syntax.
- Keep dependencies up to date and avoid unnecessary packages.

### Naming Conventions
- **File and folder names:** Use PascalCase (e.g., `UserModel.js`, `AuthRoutes/`).
- **Code (variables, functions, methods):** Use camelCase (e.g., `getUserById`, `userProfile`).
- **Class names:** Use PascalCase (e.g., `UserController`).

### File Naming & Pluralization
- If a file provides multiple different functions, classes, or objects, use the plural form (e.g., `AuthRoutes.js`, `AuthServices.js`).
- Middlewares and config files may export multiple items of similar concerns, so they remain singular (e.g., `AuthorizationMW.js`, `DatabaseConfig.js`).

### Folder Structure
- Group related files in folders (e.g., `Controllers/`, `Models/`, `Routes/`).
- Keep folder and file names consistent with the above conventions.

### Pull Requests & Code Review
- Write clear, descriptive commit messages.
- Reference related issues or features in your PR description.

---
Please follow these standards to keep the codebase consistent and maintainable. Thank you for contributing!
