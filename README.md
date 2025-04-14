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

## Real-Time Chat System

### Features

- **Instant Messaging**: Messages are delivered instantly without page refresh
- **Typing Indicators**: See when the other person is typing
- **Read Receipts**: Know when your messages have been read
- **Online Status**: See when users are online/offline
- **Real-time Notifications**: Get notified of new messages even when not on the chat page

### Technical Implementation

#### Socket.IO Integration

The chat system utilizes Socket.IO to handle WebSocket connections. The main components are:

1. **Socket Authentication**: Users are authenticated via JWT tokens
2. **Conversation Rooms**: Users join specific conversation rooms
3. **Message Persistence**: All messages are stored in the database
4. **Online Status Tracking**: User online status is tracked and broadcast to relevant users
5. **Typing Indicators**: Real-time typing status updates

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

Remember to set up environment variables for both frontend and backend. The following variables are required:

```env
# Frontend (.env in client directory)
VITE_API_URL=your_api_url

# Backend (.env in backend directory)
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

## License

This project is licensed under the MIT License.
