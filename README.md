# AI Interview Preparation App

A beginner-friendly MERN stack project for practicing mock interviews with AI-generated questions and feedback.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt, planned for the next feature
- AI: OpenAI-compatible API, planned after sessions are in place

## Project Structure

```txt
client/
  src/
    components/
    pages/
    context/
    hooks/
    services/
    utils/
    App.jsx
    main.jsx

server/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
  server.js
```

## Getting Started

### 1. Install dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 2. Create environment files

Copy the examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Update `server/.env` with your MongoDB connection string.

### 3. Run the backend

```bash
cd server
npm run dev
```

Backend default URL:

```txt
http://localhost:5001
```

Health check:

```txt
http://localhost:5001/api/health
```

### 4. Run the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

Frontend default URL:

```txt
http://localhost:5173
```

## Current Features

- Starter React app with Tailwind CSS
- Express server
- MongoDB connection helper
- Health check API route
- Environment variable examples

## Next Step

Build authentication:

- User model
- Register route
- Login route
- JWT protected `GET /api/auth/me` route

