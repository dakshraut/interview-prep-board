# Quick Start Guide

Get the Interview Prep Board running in 5 minutes!

## Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git installed

## Setup Steps

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd interview-prep-board

# Install all dependencies
npm run install-all
```

### 2. Configure Backend

```bash
# Navigate to backend
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your details:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/interview-prep-board
# JWT_SECRET=your_super_secret_key_here
```

### 3. Configure Frontend (Optional)

```bash
# Navigate to frontend
cd ../frontend

# Create .env.local (optional, defaults to localhost:5000)
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
```

### 4. Start Development Servers

**Option A: Run Both Together**
```bash
# From root directory
npm run dev
```

**Option B: Run Separately**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## First Steps

1. **Register a new account**
   - Visit http://localhost:5173
   - Click "Create Account"
   - Fill in username, email, password

2. **Create your first board**
   - Click "Create New Board"
   - Enter board title and description
   - Start adding tasks!

3. **Invite team members**
   - Get the invite link from board settings
   - Share with teammates
   - They can join using the link

4. **Manage tasks**
   - Create tasks with type, difficulty, priority
   - Drag tasks between columns
   - Add comments, attachments, time logs
   - Track progress with analytics

## Useful Commands

```bash
# Backend
cd backend
npm run dev              # Development mode with auto-reload
npm run start            # Production mode

# Frontend
cd frontend
npm run dev              # Development mode
npm run build            # Build for production
npm run preview          # Preview production build

# Root (from project root)
npm run dev              # Run both simultaneously
npm run install-all      # Install all dependencies
```

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/interview-prep-board
JWT_SECRET=your_secret_key_min_32_chars
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Ensure credentials are correct

### "Port already in use"
- Backend: Change PORT in .env
- Frontend: Vite auto-increments port

### "CORS error"
- Ensure FRONTEND_URL matches your frontend URL
- Clear browser cache
- Restart servers

### "Module not found"
- Run `npm install` in the affected directory
- Delete node_modules and reinstall
- Check import paths

## Project Structure

```
interview-prep-board/
├── backend/              # Express.js server
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, error handling
│   ├── utils/           # Validators, helpers
│   └── server.js        # Server entry point
│
├── frontend/            # React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth, Socket context
│   │   ├── services/    # API client
│   │   └── App.jsx      # Main component
│   └── vite.config.js   # Vite config
│
├── README.md            # Main documentation
├── FEATURES.md          # Features list
├── DEPLOYMENT.md        # Deployment guide
└── IMPROVEMENTS.md      # Changes summary
```

## Next Steps

1. **Explore Features**
   - See [FEATURES.md](./FEATURES.md) for complete feature list
   - Try creating boards and tasks
   - Test real-time collaboration

2. **Understand Code**
   - Read API documentation in README
   - Check component structure in frontend
   - Review database models in backend

3. **Customize**
   - Modify colors in Material-UI theme
   - Add more task types
   - Create custom columns

4. **Deploy**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Choose hosting platform
   - Set up environment variables

## Documentation

- **[README.md](./README.md)** - Complete documentation
- **[FEATURES.md](./FEATURES.md)** - Feature overview
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - What was improved

## Support

- Check error messages carefully
- Review logs in browser console
- Check backend logs in terminal
- See troubleshooting section above

## Tips

1. **Development**: Use `npm run dev` to run both servers
2. **Database**: MongoDB Atlas free tier is sufficient for testing
3. **Testing**: Create test accounts to test collaboration features
4. **Real-time**: Open app in multiple browsers to see real-time updates

---

**You're all set!** 🚀

Start building your interview prep board now!
