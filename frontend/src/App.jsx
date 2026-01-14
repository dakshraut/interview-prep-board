import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Board from './components/Kanban/Board';
import JoinBoard from './components/JoinBoard';
import { CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Placeholder components for missing pages
const ActivityPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Activity Feed
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
      Track all your recent activity and updates here.
    </Typography>
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" color="primary">
        Coming Soon!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        This feature is currently under development.
      </Typography>
    </Box>
  </Box>
);

const TemplatesPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Board Templates
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
      Choose from pre-made templates to kickstart your interview prep.
    </Typography>
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" color="primary">
        Coming Soon!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Template library will be available in the next update.
      </Typography>
    </Box>
  </Box>
);

const JoinBoardPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Join Board
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
      Enter an invite link to join an existing study board.
    </Typography>
    <Box sx={{ mt: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" color="primary">
        How to join:
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        1. Get an invite link from a board admin
        <br />
        2. Click the link or enter it here
        <br />
        3. You'll be automatically added to the board
      </Typography>
    </Box>
  </Box>
);

const AnalyticsPage = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4" gutterBottom>
      Board Analytics
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
      Detailed analytics and insights for your boards.
    </Typography>
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" color="primary">
        Coming Soon!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Analytics dashboard will be available in the next update.
      </Typography>
    </Box>
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="invite/:inviteLink" element={<JoinBoard />} />
              
              {/* Protected Routes */}
              <Route path="dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              <Route path="board/:boardId" element={
                <PrivateRoute>
                  <Board />
                </PrivateRoute>
              } />

              <Route path="board/:boardId/analytics" element={
                <PrivateRoute>
                  <AnalyticsPage />
                </PrivateRoute>
              } />
              
              {/* Placeholder Routes */}
              <Route path="activity" element={
                <PrivateRoute>
                  <ActivityPage />
                </PrivateRoute>
              } />
              
              <Route path="templates" element={
                <PrivateRoute>
                  <TemplatesPage />
                </PrivateRoute>
              } />
              
              <Route path="invite" element={
                <PrivateRoute>
                  <JoinBoardPage />
                </PrivateRoute>
              } />
              
              {/* 404 Catch-all Route */}
              <Route path="*" element={
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h4" gutterBottom>
                    404 - Page Not Found
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    The page you're looking for doesn't exist.
                  </Typography>
                </Box>
              } />
            </Route>
          </Routes>
        </SocketProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;