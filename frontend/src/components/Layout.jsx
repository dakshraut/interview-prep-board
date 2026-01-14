import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider,
  Badge
} from '@mui/material';
import {
  Dashboard,
  Logout,
  Person,
  Settings,
  SchoolOutlined
} from '@mui/icons-material';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getInitials = (username) => {
    if (!username) return 'U';
    return username
      .split(/[\s-_]/)
      .slice(0, 2)
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f7f9fc' }}>
      {/* Header/Navigation */}
      <AppBar
        position="sticky"
        elevation={2}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ py: 1 }}>
            {/* Logo and Title */}
            <SchoolOutlined sx={{ mr: 1.5, fontSize: 28 }} />
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
              >
                Interview Prep Board
              </Typography>
            </Link>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* User Section */}
            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Profile">
                  <IconButton
                    onClick={handleMenu}
                    size="small"
                    sx={{
                      p: 0,
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      {getInitials(user.username)}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Dropdown Menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      width: 280,
                      mt: 1,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  {/* User Info */}
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Logged in as
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* Menu Items */}
                  <MenuItem
                    onClick={() => {
                      navigate('/dashboard');
                      handleClose();
                    }}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    <Dashboard sx={{ mr: 1.5, color: '#667eea' }} />
                    Dashboard
                  </MenuItem>

                  <MenuItem
                    onClick={handleClose}
                    sx={{
                      '&:hover': {
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    <Settings sx={{ mr: 1.5, color: '#667eea' }} />
                    Settings
                  </MenuItem>

                  <Divider sx={{ my: 1 }} />

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      '&:hover': {
                        bgcolor: '#ffebee'
                      }
                    }}
                  >
                    <Logout sx={{ mr: 1.5, color: '#d32f2f' }} />
                    <Typography sx={{ color: '#d32f2f' }}>
                      Logout
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{
                    textTransform: 'none',
                    fontSize: 16,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  component={Link}
                  to="/register"
                  sx={{
                    textTransform: 'none',
                    fontSize: 16,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          py: { xs: 2, md: 4 }
        }}
      >
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Interview Prep Board. Built with MERN & Socket.IO
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;