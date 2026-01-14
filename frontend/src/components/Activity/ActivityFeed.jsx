import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Grid,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Download,
  MoreVert,
  CheckCircle,
  PlayCircle,
  AccessTime,
  Add,
  Edit,
  Delete,
  Share,
  PersonAdd,
  Group,
  Assignment,
  Timeline,
  TrendingUp,
  CalendarToday,
  Dashboard,
  ViewList,
  ViewModule,
  Sort
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('list');
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, searchQuery, filter, sortBy]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [tasksRes, boardsRes] = await Promise.all([
        api.get('/tasks/user/all'),
        api.get('/boards')
      ]);
      
      const taskActivities = tasksRes.data.map(task => ({
        id: task._id,
        type: 'task',
        action: getTaskAction(task),
        title: task.title,
        description: task.description,
        entity: task,
        timestamp: task.updatedAt || task.createdAt,
        user: task.createdBy,
        board: task.board,
        meta: {
          type: task.type,
          difficulty: task.difficulty,
          column: task.column,
          company: task.company
        }
      }));
      
      const boardActivities = boardsRes.data.map(board => ({
        id: board._id,
        type: 'board',
        action: 'created',
        title: board.title,
        description: board.description,
        entity: board,
        timestamp: board.createdAt,
        user: board.owner,
        meta: {
          members: board.members?.length || 1,
          visibility: board.visibility
        }
      }));
      
      const allActivities = [...taskActivities, ...boardActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskAction = (task) => {
    if (task.column === 'done') return 'completed';
    if (task.column === 'inprogress') return 'started';
    if (task.column === 'review') return 'submitted_for_review';
    return 'created';
  };

  const applyFilters = () => {
    let filtered = [...activities];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.meta?.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'tasks') {
        filtered = filtered.filter(activity => activity.type === 'task');
      } else if (filter === 'boards') {
        filtered = filtered.filter(activity => activity.type === 'board');
      } else if (filter === 'completed') {
        filtered = filtered.filter(activity => 
          activity.type === 'task' && activity.action === 'completed'
        );
      } else if (filter === 'inprogress') {
        filtered = filtered.filter(activity => 
          activity.type === 'task' && activity.action === 'started'
        );
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });
    
    setFilteredActivities(filtered);
  };

  const getActionIcon = (activity) => {
    switch (activity.action) {
      case 'completed':
        return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'started':
        return <PlayCircle sx={{ color: '#F59E0B' }} />;
      case 'submitted_for_review':
        return <Timeline sx={{ color: '#3B82F6' }} />;
      case 'created':
        return activity.type === 'board' ? 
          <Dashboard sx={{ color: '#8B5CF6' }} /> : 
          <Add sx={{ color: '#667eea' }} />;
      case 'updated':
        return <Edit sx={{ color: '#F59E0B' }} />;
      case 'deleted':
        return <Delete sx={{ color: '#EF4444' }} />;
      case 'shared':
        return <Share sx={{ color: '#8B5CF6' }} />;
      case 'joined':
        return <PersonAdd sx={{ color: '#10B981' }} />;
      default:
        return <Assignment sx={{ color: '#6B7280' }} />;
    }
  };

  const getActionText = (activity) => {
    const user = activity.user?.username || 'Someone';
    
    switch (activity.action) {
      case 'completed':
        return `${user} completed`;
      case 'started':
        return `${user} started working on`;
      case 'submitted_for_review':
        return `${user} submitted for review`;
      case 'created':
        return `${user} created ${activity.type === 'board' ? 'board' : 'task'}`;
      case 'updated':
        return `${user} updated`;
      case 'deleted':
        return `${user} deleted`;
      case 'shared':
        return `${user} shared`;
      case 'joined':
        return `${user} joined`;
      default:
        return `${user} updated`;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DSA': return '#3B82F6';
      case 'HR': return '#8B5CF6';
      case 'System Design': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };

  const handleExportActivities = () => {
    const exportData = filteredActivities.map(activity => ({
      Type: activity.type === 'task' ? 'Task' : 'Board',
      Action: activity.action,
      Title: activity.title,
      Description: activity.description || '',
      User: activity.user?.username || 'Unknown',
      Timestamp: new Date(activity.timestamp).toLocaleString(),
      Board: activity.board?.title || 'N/A',
      ...(activity.type === 'task' && {
        'Task Type': activity.meta.type,
        Difficulty: activity.meta.difficulty,
        Status: activity.meta.column,
        Company: activity.meta.company || 'N/A'
      }),
      ...(activity.type === 'board' && {
        'Member Count': activity.meta.members,
        Visibility: activity.meta.visibility
      })
    }));

    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-prep-activities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Activity Feed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track all your interview preparation activities
            </Typography>
          </Box>
          <Badge badgeContent={activities.length} color="primary" showZero>
            <Timeline sx={{ fontSize: 40, color: '#667eea' }} />
          </Badge>
        </Box>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="all">All Activities</MenuItem>
                  <MenuItem value="tasks">Tasks Only</MenuItem>
                  <MenuItem value="boards">Boards Only</MenuItem>
                  <MenuItem value="completed">Completed Tasks</MenuItem>
                  <MenuItem value="inprogress">In Progress</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="type">By Type</MenuItem>
                </Select>
              </FormControl>
              
              <Box display="flex">
                <Tooltip title="List View">
                  <IconButton
                    onClick={() => setViewMode('list')}
                    color={viewMode === 'list' ? 'primary' : 'default'}
                  >
                    <ViewList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Grid View">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    color={viewMode === 'grid' ? 'primary' : 'default'}
                  >
                    <ViewModule />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Button
                startIcon={<Refresh />}
                onClick={fetchActivities}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
              
              <Button
                startIcon={<Download />}
                onClick={handleExportActivities}
                variant="contained"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#3B82F6">
                {activities.filter(a => a.type === 'task').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
              <Assignment sx={{ mt: 2, color: '#3B82F6' }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#10B981">
                {activities.filter(a => a.action === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
              <CheckCircle sx={{ mt: 2, color: '#10B981' }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#8B5CF6">
                {activities.filter(a => a.type === 'board').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Boards
              </Typography>
              <Dashboard sx={{ mt: 2, color: '#8B5CF6' }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h3" fontWeight={700} color="#F59E0B">
                {activities.filter(a => a.action === 'started').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
              <PlayCircle sx={{ mt: 2, color: '#F59E0B' }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Feed */}
      {filteredActivities.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
          <Timeline sx={{ fontSize: 60, color: '#e5e7eb', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No activities found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start by creating boards and tasks to see activities here'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Go to Dashboard
          </Button>
        </Paper>
      ) : viewMode === 'list' ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {filteredActivities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem 
                alignItems="flex-start"
                sx={{
                  py: 3,
                  px: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    transform: 'translateX(4px)'
                  },
                  borderRadius: 2
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: activity.type === 'task' ? '#3B82F620' : '#8B5CF620' }}>
                    {getActionIcon(activity)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {activity.title}
                      </Typography>
                      <Chip
                        label={activity.type === 'task' ? 'Task' : 'Board'}
                        size="small"
                        sx={{
                          bgcolor: activity.type === 'task' ? '#3B82F620' : '#8B5CF620',
                          color: activity.type === 'task' ? '#3B82F6' : '#8B5CF6',
                          fontWeight: 500
                        }}
                      />
                      {activity.meta?.type && (
                        <Chip
                          label={activity.meta.type}
                          size="small"
                          sx={{
                            bgcolor: `${getTypeColor(activity.meta.type)}20`,
                            color: getTypeColor(activity.meta.type)
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        {getActionText(activity)}
                        {activity.description && `: ${activity.description}`}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          <AccessTime sx={{ fontSize: 14, verticalAlign: 'text-bottom', mr: 0.5 }} />
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                        
                        {activity.meta?.difficulty && (
                          <Chip
                            label={activity.meta.difficulty}
                            size="small"
                            sx={{
                              bgcolor: `${getDifficultyColor(activity.meta.difficulty)}20`,
                              color: getDifficultyColor(activity.meta.difficulty),
                              height: 20,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        
                        {activity.meta?.company && (
                          <Chip
                            label={activity.meta.company}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        
                        {activity.meta?.column && activity.meta.column !== 'todo' && (
                          <Chip
                            label={activity.meta.column}
                            size="small"
                            sx={{
                              bgcolor: 
                                activity.meta.column === 'done' ? '#10B98120' :
                                activity.meta.column === 'inprogress' ? '#F59E0B20' :
                                activity.meta.column === 'review' ? '#3B82F620' : '#6B728020',
                              color: 
                                activity.meta.column === 'done' ? '#10B981' :
                                activity.meta.column === 'inprogress' ? '#F59E0B' :
                                activity.meta.column === 'review' ? '#3B82F6' : '#6B7280',
                              height: 20,
                              fontSize: '0.7rem',
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      </Box>
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => {
                      if (activity.type === 'task' && activity.board?._id) {
                        navigate(`/board/${activity.board._id}`);
                      } else if (activity.type === 'board') {
                        navigate(`/board/${activity.id}`);
                      }
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    View
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              {index < filteredActivities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        // Grid View
        <Grid container spacing={3}>
          {filteredActivities.map(activity => (
            <Grid item xs={12} sm={6} md={4} key={activity.id}>
              <Card sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ 
                      bgcolor: activity.type === 'task' ? '#3B82F620' : '#8B5CF620',
                      color: activity.type === 'task' ? '#3B82F6' : '#8B5CF6'
                    }}>
                      {getActionIcon(activity)}
                    </Avatar>
                  }
                  title={
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {activity.title}
                    </Typography>
                  }
                  subheader={
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(activity.timestamp)}
                    </Typography>
                  }
                  action={
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {getActionText(activity)}
                  </Typography>
                  
                  {activity.description && (
                    <Typography variant="body2" sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {activity.description}
                    </Typography>
                  )}
                  
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip
                      label={activity.type === 'task' ? 'Task' : 'Board'}
                      size="small"
                      sx={{
                        bgcolor: activity.type === 'task' ? '#3B82F620' : '#8B5CF620',
                        color: activity.type === 'task' ? '#3B82F6' : '#8B5CF6'
                      }}
                    />
                    
                    {activity.meta?.type && (
                      <Chip
                        label={activity.meta.type}
                        size="small"
                        sx={{
                          bgcolor: `${getTypeColor(activity.meta.type)}20`,
                          color: getTypeColor(activity.meta.type)
                        }}
                      />
                    )}
                    
                    {activity.meta?.difficulty && (
                      <Chip
                        label={activity.meta.difficulty}
                        size="small"
                        sx={{
                          bgcolor: `${getDifficultyColor(activity.meta.difficulty)}20`,
                          color: getDifficultyColor(activity.meta.difficulty)
                        }}
                      />
                    )}
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (activity.type === 'task' && activity.board?._id) {
                        navigate(`/board/${activity.board._id}`);
                      } else if (activity.type === 'board') {
                        navigate(`/board/${activity.id}`);
                      }
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination/Load More */}
      {filteredActivities.length > 0 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredActivities.length} of {activities.length} activities
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchActivities}
            startIcon={<Refresh />}
          >
            Load More Activities
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default ActivityFeed;