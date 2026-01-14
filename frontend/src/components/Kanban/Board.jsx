import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Share,
  ContentCopy,
  People,
  MoreVert,
  Search,
  FilterList,
  ViewColumn,
  Settings,
  Refresh,
  Download,
  CalendarToday,
  TrendingUp,
  Email,
  ExitToApp
} from '@mui/icons-material';
import Column from './Column';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useSocket } from '../../context/SocketContext';

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const socket = useSocket();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBoardData = useCallback(async () => {
  try {
    setLoading(true);
    const [boardRes, tasksRes] = await Promise.all([
      api.get(`/boards/${boardId}`),
      api.get(`/tasks/board/${boardId}`)
    ]);
    
    setBoard(boardRes.data);
    setTasks(tasksRes.data);
    setFilteredTasks(tasksRes.data);
  } catch (error) {
    console.error('Failed to fetch board data:', error);
    setNotification({
      open: true,
      message: 'Failed to load board data',
      severity: 'error'
    });
    
    // If board doesn't exist or access denied, redirect to dashboard
    if (error.response?.status === 404 || error.response?.status === 403) {
      navigate('/dashboard');
    }
  } finally {
    setLoading(false);
  }
}, [boardId, navigate]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinBoard', boardId);

    socket.on('taskUpdated', (data) => {
      if (data.type === 'created') {
        const newTasks = [...tasks, data.task];
        setTasks(newTasks);
        applyFilters(newTasks, searchQuery, activeFilter);
      } else if (data.type === 'updated') {
        const updatedTasks = tasks.map(task => 
          task._id === data.task._id ? data.task : task
        );
        setTasks(updatedTasks);
        applyFilters(updatedTasks, searchQuery, activeFilter);
      } else if (data.type === 'deleted') {
        const filteredTasks = tasks.filter(task => task._id !== data.taskId);
        setTasks(filteredTasks);
        applyFilters(filteredTasks, searchQuery, activeFilter);
      } else if (data.type === 'reordered') {
        setTasks(data.tasks);
        applyFilters(data.tasks, searchQuery, activeFilter);
      }
    });

    return () => {
      socket.off('taskUpdated');
    };
  }, [socket, boardId, tasks, searchQuery, activeFilter]);

  const applyFilters = (taskList, query, filter) => {
    let filtered = taskList;
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description?.toLowerCase().includes(query.toLowerCase()) ||
        task.company?.toLowerCase().includes(query.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(task => task.type === filter);
    }
    
    setFilteredTasks(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(tasks, query, activeFilter);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(tasks, searchQuery, filter);
    setFilterMenuAnchor(null);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(tasks.find(task => task._id === active.id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const sourceColumn = tasks.find(t => t._id === taskId)?.column;
    const destinationColumn = over.id;

    if (sourceColumn === destinationColumn) {
      // Reorder within same column
      const columnTasks = tasks.filter(t => t.column === sourceColumn);
      const oldIndex = columnTasks.findIndex(t => t._id === taskId);
      const newIndex = columnTasks.findIndex(t => t._id === over.id);
      
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const updatedTasks = tasks.map(task => {
          if (task.column === sourceColumn) {
            const newTask = reordered.find(t => t._id === task._id);
            return newTask ? { ...newTask, order: reordered.indexOf(newTask) } : task;
          }
          return task;
        });
        
        setTasks(updatedTasks);
        
        try {
          await api.post('/tasks/reorder', {
            boardId,
            tasks: updatedTasks.map((t, idx) => ({ _id: t._id, column: t.column, order: idx }))
          });
        } catch (error) {
          console.error('Failed to reorder tasks:', error);
          fetchBoardData();
        }
      }
    } else {
      // Move to different column
      const updatedTasks = tasks.map(task => {
        if (task._id === taskId) {
          return { ...task, column: destinationColumn };
        }
        return task;
      });

      setTasks(updatedTasks);

      try {
        await api.put(`/tasks/${taskId}`, { column: destinationColumn });
        
        if (socket) {
          socket.emit('taskUpdate', {
            boardId,
            type: 'updated',
            task: { _id: taskId, column: destinationColumn }
          });
        }
      } catch (error) {
        console.error('Failed to update task:', error);
        fetchBoardData();
      }
    }
  };

  const handleCreateTask = (newTask) => {
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    applyFilters(updatedTasks, searchQuery, activeFilter);
    setOpenTaskModal(false);
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${board?.inviteLink}`;
    navigator.clipboard.writeText(inviteLink);
    setNotification({
      open: true,
      message: 'Invite link copied to clipboard!',
      severity: 'success'
    });
  };

  const handleExportBoard = () => {
    const boardData = {
      board: board,
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(boardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${board?.title?.replace(/\s+/g, '_') || 'board'}_export.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleLeaveBoard = async () => {
    if (window.confirm('Are you sure you want to leave this board?')) {
      try {
        await api.delete(`/boards/${boardId}/leave`);
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to leave board:', error);
        setNotification({
          open: true,
          message: 'Failed to leave board',
          severity: 'error'
        });
      }
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: '#667eea', icon: '📝' },
    { id: 'inprogress', title: 'In Progress', color: '#f6ad55', icon: '⚡' },
    { id: 'review', title: 'Review', color: '#68d391', icon: '👁️' },
    { id: 'done', title: 'Done', color: '#4fd1c7', icon: '✅' }
  ];

  const filters = [
    { value: 'all', label: 'All Tasks' },
    { value: 'DSA', label: 'DSA Problems' },
    { value: 'HR', label: 'HR Questions' },
    { value: 'System Design', label: 'System Design' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const getColumnStats = (columnId) => {
    const columnTasks = tasks.filter(task => task.column === columnId);
    const completed = columnId === 'done' ? columnTasks.length : 0;
    const total = columnTasks.length;
    return { completed, total };
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 6 }}>
      {/* Board Header */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 0
      }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h4" fontWeight={700} sx={{ mr: 2 }}>
                  {board?.title || 'Untitled Board'}
                </Typography>
                <Chip
                  label={board?.visibility === 'public' ? 'Public' : 'Private'}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Box>
              
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2, maxWidth: 600 }}>
                {board?.description || 'No description provided'}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" alignItems="center">
                  <People sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    {board?.members?.length || 1} members
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center">
                  <CalendarToday sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">
                    Created {board?.createdAt ? new Date(board.createdAt).toLocaleDateString() : 'Recently'}
                  </Typography>
                </Box>
                
                <Chip
                  icon={<ContentCopy sx={{ color: 'white !important' }} />}
                  label="Copy Invite"
                  onClick={handleCopyInviteLink}
                  size="small"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenTaskModal(true)}
                sx={{ 
                  bgcolor: 'white', 
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                Add Task
              </Button>
              
              <IconButton
                onClick={(e) => setBoardMenuAnchor(e.currentTarget)}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <MoreVert />
              </IconButton>
              
              <Menu
                anchorEl={boardMenuAnchor}
                open={Boolean(boardMenuAnchor)}
                onClose={() => setBoardMenuAnchor(null)}
              >
                <MenuItem onClick={handleCopyInviteLink}>
                  <Share sx={{ mr: 2 }} />
                  Share Board
                </MenuItem>
                <MenuItem onClick={handleExportBoard}>
                  <Download sx={{ mr: 2 }} />
                  Export Board
                </MenuItem>
                <MenuItem>
                  <Settings sx={{ mr: 2 }} />
                  Board Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLeaveBoard} sx={{ color: 'error.main' }}>
                  <ExitToApp sx={{ mr: 2 }} />
                  Leave Board
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          {/* Members Avatars */}
          {board?.members && board.members.length > 0 && (
            <Box display="flex" alignItems="center" mt={3}>
              <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
                Members:
              </Typography>
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 } }}>
                {board.members.map((member, index) => (
                  <Tooltip key={index} title={member.user?.username || 'Unknown'}>
                    <Avatar sx={{ bgcolor: '#4fd1c7' }}>
                      {member.user?.username?.charAt(0).toUpperCase() || '?'}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Box>
          )}
        </Container>
      </Paper>

      <Container maxWidth="xl">
        {/* Board Controls */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" flex={1} minWidth={300}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                startIcon={<FilterList />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                variant={activeFilter !== 'all' ? 'contained' : 'outlined'}
                sx={{ 
                  borderRadius: 2,
                  ...(activeFilter !== 'all' && {
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#5a6fd8' }
                  })
                }}
              >
                Filter
                {activeFilter !== 'all' && (
                  <Chip
                    label={activeFilter}
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Button>
              
              <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
              >
                {filters.map((filter) => (
                  <MenuItem
                    key={filter.value}
                    onClick={() => handleFilterChange(filter.value)}
                    selected={activeFilter === filter.value}
                  >
                    {filter.label}
                  </MenuItem>
                ))}
              </Menu>
              
              <Button
                startIcon={<Refresh />}
                onClick={fetchBoardData}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
              
              <Button
                startIcon={<TrendingUp />}
                onClick={() => navigate(`/board/${boardId}/analytics`)}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Analytics
              </Button>
            </Box>
          </Box>
          
          {/* Quick Stats */}
          <Box display="flex" gap={3} mt={2} flexWrap="wrap">
            {columns.map(column => {
              const stats = getColumnStats(column.id);
              return (
                <Box key={column.id} display="flex" alignItems="center">
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    bgcolor: column.color, 
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  <Typography variant="body2" sx={{ mr: 1, fontWeight: 500 }}>
                    {column.title}:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.total} tasks
                  </Typography>
                </Box>
              );
            })}
            <Box display="flex" alignItems="center">
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 500 }}>
                Total:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tasks.length} tasks
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Grid container spacing={3}>
            {columns.map(column => {
              const columnTasks = filteredTasks.filter(task => task.column === column.id);
              
              return (
                <Grid item xs={12} sm={6} md={3} key={column.id}>
                  <Column
                    id={column.id}
                    title={column.title}
                    color={column.color}
                    icon={column.icon}
                    tasks={columnTasks}
                    onTaskUpdate={fetchBoardData}
                  />
                </Grid>
              );
            })}
          </Grid>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                style={{
                  transform: 'rotate(5deg)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  opacity: 0.9
                }}
              />
            )}
          </DragOverlay>
        </DndContext>

        {/* Empty State */}
        {filteredTasks.length === 0 && tasks.length > 0 && (
          <Paper sx={{ p: 8, textAlign: 'center', mt: 4, borderRadius: 2 }}>
            <Search sx={{ fontSize: 60, color: '#e5e7eb', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search or filter criteria
            </Typography>
            <Button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
              Clear all filters
            </Button>
          </Paper>
        )}

        {/* Modals */}
        <CreateTaskModal
          open={openTaskModal}
          onClose={() => setOpenTaskModal(false)}
          boardId={boardId}
          onCreate={handleCreateTask}
        />

        {/* Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={4000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={notification.severity}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Board;