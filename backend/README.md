# Campus Connection - Backend

The backend API for Campus Connection, a social networking app designed for college students.

## Features

- User authentication with JWT
- Email verification system
- Profile management
- Match management (Tinder-like swiping functionality)
- Real-time messaging
- Compatibility quiz system
- Anonymous confession management
- Admin panel for content moderation

## Technology Stack

- Node.js with Express
- MongoDB with Mongoose
- JSON Web Tokens for authentication
- Express-validator for request validation
- Multer for file uploads

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   PORT=5002
   MONGODB_URI=mongodb://localhost:27017/campus-connection
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```

3. Start the server:
   ```
   npm start
   ```

4. For development with auto-restart:
   ```
   npm run dev
   ```

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify user email

### User Profiles
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user

### Matching
- `POST /api/match/swipe` - Swipe on a user
- `GET /api/match` - Get all matches
- `GET /api/match/potential` - Get potential matches
- `DELETE /api/match/:matchId` - Unmatch with a user
- `GET /api/match/stats` - Get matching statistics

### Messaging
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send a message

### Confessions
- `POST /api/confessions` - Create a confession
- `GET /api/confessions` - Get all approved confessions
- `GET /api/confessions/my/confessions` - Get user's confessions
- `GET /api/confessions/:id` - Get confession by ID
- `PUT /api/confessions/:id` - Update a confession
- `DELETE /api/confessions/:id` - Delete a confession

### Comments
- `POST /api/comments` - Create a comment
- `GET /api/comments/confession/:confessionId` - Get comments for a confession
- `PUT /api/comments/:id` - Update a comment
- `DELETE /api/comments/:id` - Delete a comment 