import React from 'react';
import { Box, Paper, Typography, Button, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              py: 4
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                width: '100%',
                maxWidth: 500
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 60,
                  color: '#ef5350',
                  mb: 2
                }}
              />
              
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ color: '#ef5350' }}
              >
                Oops! Something went wrong
              </Typography>
              
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 2, mb: 3 }}
              >
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    bgcolor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                    textAlign: 'left',
                    maxHeight: 200,
                    overflow: 'auto',
                    borderLeft: '4px solid #ef5350'
                  }}
                >
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontFamily: 'monospace', color: '#d32f2f' }}
                  >
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo?.componentStack && (
                    <Typography
                      variant="caption"
                      component="div"
                      sx={{
                        mt: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: '#666'
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  }
                }}
              >
                Try Again
              </Button>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
