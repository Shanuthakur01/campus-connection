# Real-Time Chat System

This document outlines the real-time chat system implementation using WebSockets for the Campus Connection dating app.

## Features

- **Instant Messaging**: Messages are delivered instantly without page refresh
- **Typing Indicators**: See when the other person is typing
- **Read Receipts**: Know when your messages have been read
- **Online Status**: See when users are online/offline
- **Real-time Notifications**: Get notified of new messages even when not on the chat page

## Technical Implementation

### Backend (Node.js + Socket.IO)

The chat system utilizes Socket.IO on the backend to handle WebSocket connections. The main components are:

1. **Socket Authentication**: Users are authenticated via JWT tokens
2. **Conversation Rooms**: Users join specific conversation rooms
3. **Message Persistence**: All messages are stored in MongoDB
4. **Online Status Tracking**: User online status is tracked and broadcast to relevant users
5. **Typing Indicators**: Real-time typing status updates

### Frontend (React + Socket.IO Client)

The frontend implementation includes:

1. **Socket Service**: A singleton service to manage WebSocket connections
2. **Message Context**: Enhanced context to handle real-time updates
3. **Chat UI**: Interactive UI with typing indicators and read receipts
4. **Notifications**: Real-time toast notifications for new messages

## Setup Instructions

### Backend Setup

1. Make sure MongoDB is running
2. Install dependencies:
   ```
   cd backend
   npm install
   ```
3. Set environment variables (JWT_SECRET, MONGODB_URI)
4. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```
2. Make sure socket.io-client is installed:
   ```
   npm install socket.io-client
   ```
3. Start the frontend:
   ```
   npm run dev
   ```

## How It Works

1. When a user logs in, the socket connection is established and authenticated
2. The user joins their active conversation rooms
3. When sending a message:
   - Message is sent through the socket
   - Stored in the database
   - Broadcast to conversation participants
4. Typing indicators are sent when the user starts typing and cleared after inactivity
5. Read receipts are sent when a user views a conversation
6. Online status is updated on connect/disconnect events

## Testing

To test the real-time functionality:

1. Open the app in two different browsers or browser tabs
2. Log in with two different accounts
3. Start a conversation between the accounts
4. Observe real-time message delivery, typing indicators, and read receipts

## Future Enhancements

- **Media Messages**: Support for images, videos, and files
- **Message Reactions**: Allow users to react to messages with emojis
- **Video Chat Integration**: Add video chat capabilities
- **Message Search**: Search through conversation history
- **Voice Messages**: Support for audio messages 
