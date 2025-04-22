# Express.js Boilerplate

Welcome to your **Express.js Boilerplate**, generated using [Fast Express Gen](https://www.npmjs.com/package/fast-express-gen). This boilerplate provides a minimal and modular starting point for building scalable backend applications.

---

## 📂 Project Structure

Here's an overview of the project structure:

```
<project-name>/
├── nodemon.json            # Configuration for nodemon (hot reloading)
├── package.json            # Project dependencies and scripts
├── README.md               # Documentation for your project
└── src/
    ├── app.js              # Express application setup
    ├── controllers/        # Business logic for your app
    │   └── homeController.js
    ├── middleware/         # Custom middleware (e.g., logger)
    │   └── logger.js
    ├── routes/             # Define API routes
    │   └── index.js
    └── server.js           # Server entry point
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run the following command to install all required dependencies:
```bash
npm install
```

### 2. Start the Development Server
Use the following script to start the server in development mode:
```bash
npm run dev
```

This uses **nodemon** for hot reloading.

### 3. Start the Production Server
For production, you can use:
```bash
npm start
```

---

## 🔧 Configuration

### Environment Variables
Use the `.env` file in the root directory to configure environment-specific variables. For example:
```
PORT=3000
```

---

## 🌟 Features

1. **Security**:
   - `helmet` for HTTP headers security.
   - `cors` for cross-origin requests.

2. **Performance**:
   - `compression` for Gzip compression.

3. **Logging**:
   - `morgan` for HTTP request logging.

4. **Error Handling**:
   - Centralized error handling middleware.

5. **Development Friendly**:
   - `nodemon` for automatic server restarts during development.

---

## 🤝 Contributing

Feel free to extend or modify this boilerplate to suit your project's needs. Contributions to the boilerplate are always welcome.

---

## 📝 License

This boilerplate is licensed under the **MIT License**.