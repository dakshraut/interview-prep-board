import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';

const JoinBoard = () => {
  const { inviteLink } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    joinBoard();
  }, [inviteLink]);

  const joinBoard = async () => {
    try {
      const response = await api.post(`/boards/join/${inviteLink}`);
      setSuccess(true);
      
      // Redirect to board after 2 seconds
      setTimeout(() => {
        navigate(`/board/${response.data._id}`);
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to join board');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          {success ? (
            <>
              <CheckCircle sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Successfully Joined!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Redirecting to the board...
              </Typography>
              <CircularProgress size={24} />
            </>
          ) : (
            <>
              <Error sx={{ fontSize: 60, color: '#f44336', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Unable to Join
              </Typography>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinBoard;