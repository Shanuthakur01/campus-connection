# Campus Connection

A modern dating and networking app designed specifically for college students.

## Project Overview

Campus Connection is a full-stack web application that helps college students connect with each other based on shared interests, courses, and campus locations. The app features a swipe-based matching system, real-time chat, profile customization, and more.

## Repository Structure

This repository consists of two main components:

- **`/client`**: Frontend React application
- **`/backend`**: Backend API server

## Frontend (Client)

The frontend is built with React, TypeScript, and Vite. It features:

- User authentication and profile management
- Swipe-based matching system
- Real-time chat functionality
- Profile customization with photos
- Interest-based matching

### Frontend Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Context API for state management

For more details on the frontend, please see the [client README](./client/README.md).

## Backend

The backend provides API endpoints for user authentication, profile management, matching algorithm, and messaging.

### Backend Tech Stack

- Node.js
- Express
- MongoDB
- JWT for authentication
- Socket.IO for real-time communication

## Deployment

The application is configured for deployment on Vercel:

- Frontend: Deployed as a static site
- Backend: Deployed as serverless functions

## Getting Started

To run the full application locally:

1. Clone the repository
2. Set up the backend (see backend README)
3. Set up the frontend (see client README)
4. Start both servers

## Environment Variables

Remember to set up environment variables for both frontend and backend. See the respective README files for details.

## License

This project is licensed under the MIT License. 