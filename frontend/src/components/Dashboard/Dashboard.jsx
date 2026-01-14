import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
  IconButton,
  CardActions,
  Divider,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Add,
  People,
  TrendingUp,
  Dashboard as DashboardIcon,
  ArrowForward,
  ContentCopy,
  Done,
  AccessTime,
  PlayCircle,
  Description,
  Code,
  Engineering,
  School,
  CalendarToday,
  Star,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Rocket,
  Timer,
  Assessment,
  GroupWork
} from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import CreateBoardModal from './CreateBoardModal';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    byType: { DSA: 0, HR: 0, SystemDesign: 0, CodingChallenge: 0, Behavioral: 0, Project: 0, General: 0 },
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0, VeryHard: 0 }
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch boards
      const boardsRes = await api.get('/boards');
      // API interceptor normalizes response, so data is now directly the array
      setBoards(Array.isArray(boardsRes.data) ? boardsRes.data : []);
      
      // Try to fetch stats, but don't fail if endpoint doesn't exist
      try {
        const statsRes = await api.get('/progress/stats');
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (statsError) {
        console.log('Stats endpoint not available, using default stats');
        // Use default empty stats
      }
      
      // Get recent tasks from first board if exists
      if (boardsRes.data && Array.isArray(boardsRes.data) && boardsRes.data.length > 0) {
        try {
          const firstBoardId = boardsRes.data[0]._id;
          const boardTasksRes = await api.get(`/tasks/board/${firstBoardId}`);
          setRecentTasks(Array.isArray(boardTasksRes.data) ? boardTasksRes.data.slice(0, 5) : []);
        } catch (taskError) {
          console.log('Could not fetch recent tasks:', taskError);
          setRecentTasks([]);
        }
      } else {
        setRecentTasks([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      case 'Very Hard': return '#7C2D12';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DSA Problem': return <Code />;
      case 'HR Question': return <People />;
      case 'System Design': return <Engineering />;
      case 'Coding Challenge': return <Code />;
      case 'Behavioral': return <People />;
      case 'Project': return <Description />;
      default: return <Description />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DSA Problem': return '#3B82F6';
      case 'HR Question': return '#8B5CF6';
      case 'System Design': return '#10B981';
      case 'Coding Challenge': return '#F59E0B';
      case 'Behavioral': return '#EF4444';
      case 'Project': return '#EC4899';
      case 'Research': return '#14B8A6';
      case 'Revision': return '#6366F1';
      case 'Mock Interview': return '#F97316';
      default: return '#6B7280';
    }
  };

  const chartData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [
      {
        data: [stats.completedTasks, stats.inProgressTasks, stats.pendingTasks],
        backgroundColor: ['#10B981', '#F59E0B', '#3B82F6'],
        borderColor: ['#059669', '#D97706', '#2563EB'],
        borderWidth: 2,
        hoverOffset: 20
      },
    ],
  };

  const typeChartData = {
    labels: ['DSA', 'HR', 'System Design', 'Coding', 'Behavioral', 'Project'],
    datasets: [
      {
        label: 'Tasks by Type',
        data: [
          stats.byType.DSA || 0,
          stats.byType.HR || 0,
          stats.byType.SystemDesign || 0,
          stats.byType.CodingChallenge || 0,
          stats.byType.Behavioral || 0,
          stats.byType.Project || 0
        ],
        backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'],
        borderColor: ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#DB2777'],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} tasks`;
          }
        }
      }
    }
  };

  const handleCreateBoardSuccess = (newBoard) => {
    console.log('Board created successfully:', newBoard);
    console.log('Board ID:', newBoard?._id);
    
    // Close modal
    setOpenCreateModal(false);
    
    // Refresh the boards list
    fetchDashboardData();
    
    // Navigate to the new board after a short delay
    if (newBoard && newBoard._id) {
      console.log('Navigating to board:', newBoard._id);
      setTimeout(() => {
        navigate(`/board/${newBoard._id}`);
      }, 100);
    }
  };

  const handleCreateBoardError = (error) => {
    console.error('Failed to create board:', error);
    setError('Failed to create board. Please try again.');
    setOpenCreateModal(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" flexDirection="column">
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Welcome Header */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Interview Prep Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
              Track your progress, organize tasks, and ace your interviews
            </Typography>
            <Chip 
              label={`${completionRate}% Completion Rate`} 
              sx={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 500
              }} 
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ 
              bgcolor: 'white', 
              color: '#667eea',
              fontWeight: 600,
              '&:hover': { 
                bgcolor: '#f5f5f5',
                transform: 'translateY(-2px)',
                boxShadow: 4
              },
              transition: 'all 0.3s ease'
            }}
          >
            New Board
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #3B82F6',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: '#3B82F620', 
                  borderRadius: 2,
                  mr: 2 
                }}>
                  <Description sx={{ color: '#3B82F6' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Tasks
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ color: '#3B82F6' }}>
                {stats.totalTasks}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={completionRate} 
                sx={{ mt: 2, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #10B981',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: '#10B98120', 
                  borderRadius: 2,
                  mr: 2 
                }}>
                  <CheckCircle sx={{ color: '#10B981' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ color: '#10B981' }}>
                {stats.completedTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {completionRate}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #F59E0B',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: '#F59E0B20', 
                  borderRadius: 2,
                  mr: 2 
                }}>
                  <PlayCircle sx={{ color: '#F59E0B' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ color: '#F59E0B' }}>
                {stats.inProgressTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Keep going! 💪
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #8B5CF6',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Box sx={{ 
                  p: 1, 
                  bgcolor: '#8B5CF620', 
                  borderRadius: 2,
                  mr: 2 
                }}>
                  <AccessTime sx={{ color: '#8B5CF6' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} sx={{ color: '#8B5CF6' }}>
                {stats.pendingTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Ready to start
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column - Boards & Charts */}
        <Grid item xs={12} lg={8}>
          {/* Your Boards */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 1, color: '#667eea' }} />
                Your Study Boards
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setOpenCreateModal(true)}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    bgcolor: '#667eea10'
                  }
                }}
              >
                New Board
              </Button>
            </Box>

            {boards.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#f3f4f6', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <DashboardIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No boards yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                  Create your first board to organize interview preparation tasks
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setOpenCreateModal(true)}
                  startIcon={<Add />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Create Your First Board
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {boards.map(board => (
                  <Grid item xs={12} sm={6} key={board._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e5e7eb',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                          borderColor: '#667eea'
                        }
                      }}
                      onClick={() => navigate(`/board/${board._id}`)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {board.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {board.description || 'No description provided'}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center">
                            <People sx={{ fontSize: 16, color: '#6b7280', mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              {board.members?.length || 1} members
                            </Typography>
                          </Box>
                          <Chip
                            label={board.visibility === 'public' ? 'Public' : 'Private'}
                            size="small"
                            sx={{ 
                              bgcolor: board.visibility === 'public' ? '#10B98110' : '#6B728010',
                              color: board.visibility === 'public' ? '#10B981' : '#6B7280',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button 
                          size="small" 
                          endIcon={<ArrowForward />}
                          sx={{ color: '#667eea' }}
                        >
                          Open Board
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* Progress Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Progress Distribution
                </Typography>
                {stats.totalTasks > 0 ? (
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <Doughnut data={chartData} options={chartOptions} />
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No tasks yet. Create your first task to see progress!
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tasks by Type
                </Typography>
                {stats.totalTasks > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <Bar data={typeChartData} options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false }
                      }
                    }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Create tasks to see type distribution
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Activity & Quick Actions */}
        <Grid item xs={12} lg={4}>
          {/* Recent Activity */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ mr: 1, color: '#667eea' }} />
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentTasks.length === 0 ? (
              <Box textAlign="center" py={4}>
                <AccessTime sx={{ fontSize: 40, color: '#e5e7eb', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Create tasks to see activity here
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentTasks.map((task, index) => (
                  <React.Fragment key={task._id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: `${getTypeColor(task.type)}20`, 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getTypeIcon(task.type)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {task.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={task.type}
                              size="small"
                              sx={{ 
                                mr: 1,
                                bgcolor: `${getTypeColor(task.type)}20`,
                                color: getTypeColor(task.type),
                                height: 20,
                                fontSize: '0.7rem'
                              }}
                            />
                            <Chip
                              label={task.difficulty}
                              size="small"
                              sx={{ 
                                bgcolor: `${getDifficultyColor(task.difficulty)}20`,
                                color: getDifficultyColor(task.difficulty),
                                height: 20,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            <Button 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={() => {
                if (boards.length > 0) {
                  navigate(`/board/${boards[0]._id}`);
                }
              }}
              disabled={boards.length === 0}
            >
              View All Activity
            </Button>
          </Paper>

          {/* Quick Stats */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1, color: '#667eea' }} />
              Quick Stats
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="#EF4444">
                    {stats.byDifficulty.Hard || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hard Problems
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="#3B82F6">
                    {stats.byType.DSA || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    DSA Tasks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="#8B5CF6">
                    {stats.byType.HR || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    HR Questions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="#F59E0B">
                    {stats.byType.SystemDesign || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    System Design
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Actions */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Star sx={{ mr: 1, color: '#667eea' }} />
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ p: 0 }}>
              <ListItem 
                button 
                onClick={() => setOpenCreateModal(true)} 
                sx={{ borderRadius: 1, mb: 1 }}
              >
                <ListItemIcon>
                  <Add />
                </ListItemIcon>
                <ListItemText 
                  primary="Create New Board" 
                  secondary="Start a new study session" 
                />
              </ListItem>
              <ListItem 
                button 
                component={Link}
                to="/invite"
                sx={{ borderRadius: 1, mb: 1 }}
              >
                <ListItemIcon>
                  <ContentCopy />
                </ListItemIcon>
                <ListItemText 
                  primary="Join with Invite Link" 
                  secondary="Join existing study groups" 
                />
              </ListItem>
              <ListItem 
                button 
                onClick={() => {
                  if (boards.length > 0) {
                    navigate(`/board/${boards[0]._id}`);
                  }
                }}
                disabled={boards.length === 0}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <GroupWork />
                </ListItemIcon>
                <ListItemText 
                  primary="Browse Templates" 
                  secondary="Use pre-made study plans" 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Create Board Modal */}
      <CreateBoardModal
        open={openCreateModal}
        onClose={() => {
          console.log('Closing modal');
          setOpenCreateModal(false);
        }}
        onSuccess={handleCreateBoardSuccess}
      />
    </Box>
  );
};

export default Dashboard;