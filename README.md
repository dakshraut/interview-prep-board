# Interview Prep Board

A modern, full-stack Kanban board application designed specifically for interview preparation. Organize, track, and manage your interview prep activities with real-time collaboration features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v18+-green.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)

## Features

### Core Features
- **Kanban Board**: Visual task management with drag-and-drop functionality
- **Real-time Collaboration**: WebSocket-based real-time updates across boards
- **User Authentication**: Secure JWT-based authentication with password hashing
- **Board Management**: Create, update, and delete boards with invite links
- **Task Management**: Create tasks with priority, difficulty, and company tracking
- **Progress Tracking**: Visual analytics and progress statistics
- **Time Tracking**: Log time spent on each task
- **Task Comments**: Collaborate on tasks with comments
- **File Attachments**: Upload and manage attachments

### Advanced Features
- **Task Types**: Customizable task categories (DSA, HR, System Design, etc.)
- **Labels & Tags**: Organize tasks with custom labels
- **Due Dates & Reminders**: Track deadlines and get notifications
- **Difficulty Levels**: Track task difficulty (Easy, Medium, Hard, Very Hard)
- **Activity Feed**: Monitor all board activities
- **Board Analytics**: Detailed statistics and insights
- **Multi-user Support**: Invite and collaborate with team members

## Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite** - Build tool
- **Material-UI (MUI)** - Component library
- **Socket.io Client** - Real-time communication
- **React Router** - Navigation
- **Axios** - HTTP client
- **Formik & Yup** - Form validation
- **DnD Kit** - Drag and drop functionality
- **Chart.js** - Data visualization

### Backend
- **Node.js & Express** - Server framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File uploads

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Git

### Backend Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd interview-prep-board/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB URI and JWT secret:
```
4. **Start the server:**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (optional):**
Create `.env.local` in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Start the development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Project Structure

```
interview-prep-board/
├── backend/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── authMiddleware.js (new)
│   ├── models/
│   │   ├── Board.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── boards.js
│   │   ├── tasks.js
│   │   ├── progress.js
│   │   ├── activities.js
│   │   └── taskTypes.js
│   ├── utils/
│   │   ├── errorHandler.js (new)
│   │   └── validators.js (new)
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   ├── Dashboard/
    │   │   ├── Kanban/
    │   │   ├── Activity/
    │   │   ├── ErrorBoundary.jsx (new)
    │   │   └── Layout.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── services/
    │   │   └── api.js (new)
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Board Endpoints

#### Create Board
```
POST /api/boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Interview Prep 2024",
  "description": "Preparing for interviews",
  "visibility": "private"
}
```

#### Get All Boards
```
GET /api/boards
Authorization: Bearer <token>
```

#### Get Board by ID
```
GET /api/boards/:id
Authorization: Bearer <token>
```

#### Join Board
```
POST /api/boards/join/:inviteLink
Authorization: Bearer <token>
```

#### Get Analytics
```
GET /api/boards/:id/analytics
Authorization: Bearer <token>
```

### Task Endpoints

#### Create Task
```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Solve LeetCode Medium Problem",
  "description": "Two pointer approach",
  "type": "DSA",
  "difficulty": "Medium",
  "priority": "High",
  "boardId": "board-id",
  "column": "todo",
  "dueDate": "2024-01-20T00:00:00Z"
}
```

#### Get Task by ID
```
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Task
```
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### Progress Endpoints

#### Get User Stats
```
GET /api/progress/stats
Authorization: Bearer <token>
```

## Security Features

- **Password Hashing**: Bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured origin restrictions
- **Input Validation**: Comprehensive server-side validation
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Database Indexing**: Optimized queries with proper indexes
- **Authorization Checks**: Role-based access control

## Performance Optimizations

- **Database Indexing**: Indexes on frequently queried fields
- **Query Optimization**: Lean queries and field selection
- **Response Compression**: Gzip compression via middleware
- **Caching**: Strategic caching of static assets
- **Socket.io Namespaces**: Efficient real-time communication
- **Lazy Loading**: Frontend component lazy loading

## Development Best Practices

- **Error Handling**: Try-catch blocks with proper error propagation
- **Code Organization**: Modular structure with separation of concerns
- **Validation**: Input validation on both client and server
- **Logging**: Console logging for debugging (production-ready)
- **Comments**: Code comments for complex logic
- **Async/Await**: Modern async patterns throughout

## Deployment

### Backend Deployment (Heroku, Railway, Render)

1. Add `Procfile` to backend root:
```
web: node server.js
```

2. Set environment variables in deployment platform
3. Push to repository or connect git

### Frontend Deployment (Vercel, Netlify)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- [ ] Email notifications for task updates
- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Advanced filtering and search
- [ ] Task templates
- [ ] Integration with LeetCode/HackerRank APIs
- [ ] Video call integration for team meetings
- [ ] Performance analytics dashboard
- [ ] Export reports (PDF/CSV)
- [ ] Two-factor authentication

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Contact: support@interviewprepboard.com

## Changelog

### v1.0.0 (Current)
- Initial release with core features
- Real-time collaboration
- Kanban board functionality
- Task analytics
- User authentication
- Improved error handling and validation


