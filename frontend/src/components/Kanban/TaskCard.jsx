import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Avatar,
  AvatarGroup,
  Tooltip,
  LinearProgress,
  Divider,
  Badge
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Label as LabelIcon,
  Business,
  Timeline,
  AccessTime,
  Person,
  Flag,
  Star,
  AttachFile,
  Comment,
  CheckCircle,
  Error,
  Warning,
  CalendarToday,
  Alarm,
  FileCopy
} from '@mui/icons-material';
import api from '../../services/api';

const TaskCard = ({ task, onUpdate, style }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const [anchorEl, setAnchorEl] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description,
    type: task.type,
    difficulty: task.difficulty,
    priority: task.priority,
    company: task.company,
    status: task.status,
    tags: task.tags?.join(', ') || '',
    estimatedTime: task.estimatedTime || 1,
    timeSpent: task.timeSpent || 0
  });

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setOpenEdit(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setOpenDelete(true);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    try {
      const updatedTask = {
        ...editForm,
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await api.put(`/tasks/${task._id}`, updatedTask);
      onUpdate();
      setOpenEdit(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/tasks/${task._id}`);
      onUpdate();
      setOpenDelete(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      case 'Very Hard': return '#7C2D12';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      case 'Critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle sx={{ fontSize: 14, color: '#10B981' }} />;
      case 'In Progress': return <Timeline sx={{ fontSize: 14, color: '#3B82F6' }} />;
      case 'Blocked': return <Error sx={{ fontSize: 14, color: '#EF4444' }} />;
      case 'On Hold': return <Warning sx={{ fontSize: 14, color: '#F59E0B' }} />;
      default: return <Star sx={{ fontSize: 14, color: '#6B7280' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'In Progress': return '#3B82F6';
      case 'Blocked': return '#EF4444';
      case 'On Hold': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      'DSA Problem': '#3B82F6',
      'HR Question': '#8B5CF6',
      'System Design': '#10B981',
      'Coding Challenge': '#F59E0B',
      'Behavioral': '#EF4444',
      'Project': '#EC4899',
      'Research': '#14B8A6',
      'Revision': '#6366F1',
      'Mock Interview': '#F97316',
      'Algorithm': '#8B5CF6',
      'Database': '#10B981',
      'API Design': '#F59E0B',
      'Security': '#EF4444',
      'Testing': '#8B5CF6',
      'Deployment': '#10B981',
      'Documentation': '#6B7280',
      'Bug Fix': '#DC2626',
      'Code Review': '#3B82F6',
      'Refactoring': '#8B5CF6',
      'Performance': '#F59E0B',
      'General': '#6B7280'
    };
    return typeColors[type] || '#6B7280';
  };

  const getProgress = () => {
    if (task.checklist && task.checklist.length > 0) {
      const completed = task.checklist.filter(item => item.completed).length;
      return Math.round((completed / task.checklist.length) * 100);
    }
    return task.status === 'Completed' ? 100 : 0;
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    const now = new Date();
    const due = new Date(task.dueDate);
    return now > due && task.status !== 'Completed';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    ...style
  };

  return (
    <>
      <Paper
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        elevation={isDragging ? 6 : 2}
        sx={{
          p: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          },
          borderLeft: `4px solid ${getTypeColor(task.type)}`,
          ...dragStyle
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            {/* Task Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mr: 1, flex: 1 }}>
                {task.title}
              </Typography>
              
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ ml: 1 }}
              >
                <MoreVert />
              </IconButton>
            </Box>

            {/* Task Description */}
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {task.description.length > 100 
                  ? `${task.description.substring(0, 100)}...` 
                  : task.description}
              </Typography>
            )}

            {/* Progress Bar */}
            {(task.checklist && task.checklist.length > 0) && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgress()} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    mb: 0.5,
                    backgroundColor: `${getTypeColor(task.type)}20`
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {getProgress()}% complete
                </Typography>
              </Box>
            )}

            {/* Tags and Labels */}
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mb={2}>
              <Chip
                label={task.type}
                size="small"
                sx={{
                  bgcolor: `${getTypeColor(task.type)}20`,
                  color: getTypeColor(task.type),
                  fontWeight: '600',
                  fontSize: '0.7rem'
                }}
              />
              
              <Chip
                label={task.difficulty}
                size="small"
                sx={{
                  bgcolor: `${getDifficultyColor(task.difficulty)}20`,
                  color: getDifficultyColor(task.difficulty),
                  fontWeight: '600',
                  fontSize: '0.7rem'
                }}
              />
              
              <Chip
                label={task.priority}
                size="small"
                sx={{
                  bgcolor: `${getPriorityColor(task.priority)}20`,
                  color: getPriorityColor(task.priority),
                  fontWeight: '600',
                  fontSize: '0.7rem'
                }}
              />
              
              {task.company && (
                <Chip
                  icon={<Business fontSize="small" />}
                  label={task.company}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              
              {task.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  icon={<LabelIcon fontSize="small" />}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Stack>

            {/* Metadata */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              {/* Left Side - Status and Assignees */}
              <Box display="flex" alignItems="center" gap={1}>
                {getStatusIcon(task.status)}
                <Typography variant="caption" color="text.secondary">
                  {task.status}
                </Typography>
                
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: 10 } }}>
                      {task.assignedTo.map((assignee, index) => (
                        <Tooltip key={index} title={assignee.user?.username || 'Unknown'}>
                          <Avatar sx={{ bgcolor: getTypeColor(task.type), fontSize: 8 }}>
                            {assignee.user?.username?.charAt(0).toUpperCase() || '?'}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </>
                )}
              </Box>

              {/* Right Side - Time and Date */}
              <Box display="flex" alignItems="center" gap={1}>
                {task.estimatedTime && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(task.estimatedTime * 60)}
                    </Typography>
                  </Box>
                )}
                
                {task.timeSpent > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Timeline sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(task.timeSpent)}
                    </Typography>
                  </Box>
                )}
                
                {task.dueDate && (
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={!isOverdue()}
                    sx={{ mr: 0.5 }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CalendarToday sx={{ fontSize: 14, color: isOverdue() ? '#EF4444' : 'text.secondary' }} />
                      <Typography 
                        variant="caption" 
                        color={isOverdue() ? 'error' : 'text.secondary'}
                        fontWeight={isOverdue() ? 600 : 400}
                      >
                        {formatDate(task.dueDate)}
                      </Typography>
                    </Box>
                  </Badge>
                )}
              </Box>
            </Box>

            {/* Attachments and Comments Count */}
            {(task.attachments?.length > 0 || task.comments?.length > 0) && (
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                {task.attachments?.length > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AttachFile sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {task.attachments.length}
                    </Typography>
                  </Box>
                )}
                
                {task.comments?.length > 0 && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Comment sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {task.comments.length}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Task Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Task
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
        <Divider />
        <MenuItem>
          <FileCopy fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem>
          <AttachFile fontSize="small" sx={{ mr: 1 }} />
          Add Attachment
        </MenuItem>
        <MenuItem>
          <Comment fontSize="small" sx={{ mr: 1 }} />
          Add Comment
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={editForm.type}
                label="Type"
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              >
                <MenuItem value="DSA Problem">DSA Problem</MenuItem>
                <MenuItem value="HR Question">HR Question</MenuItem>
                <MenuItem value="System Design">System Design</MenuItem>
                <MenuItem value="Coding Challenge">Coding Challenge</MenuItem>
                <MenuItem value="Behavioral">Behavioral</MenuItem>
                <MenuItem value="Project">Project</MenuItem>
                <MenuItem value="Research">Research</MenuItem>
                <MenuItem value="Revision">Revision</MenuItem>
                <MenuItem value="Mock Interview">Mock Interview</MenuItem>
                <MenuItem value="Algorithm">Algorithm</MenuItem>
                <MenuItem value="Database">Database</MenuItem>
                <MenuItem value="API Design">API Design</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Deployment">Deployment</MenuItem>
                <MenuItem value="Documentation">Documentation</MenuItem>
                <MenuItem value="Bug Fix">Bug Fix</MenuItem>
                <MenuItem value="Code Review">Code Review</MenuItem>
                <MenuItem value="Refactoring">Refactoring</MenuItem>
                <MenuItem value="Performance">Performance</MenuItem>
                <MenuItem value="General">General</MenuItem>
              </Select>
            </FormControl>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={editForm.difficulty}
                  label="Difficulty"
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                  <MenuItem value="Very Hard">Very Hard</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={editForm.priority}
                  label="Priority"
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            
            <TextField
              fullWidth
              label="Company"
              value={editForm.company}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Blocked">Blocked</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              margin="normal"
              helperText="Enter tags separated by commas"
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Estimated Time (hours)"
                type="number"
                value={editForm.estimatedTime}
                onChange={(e) => setEditForm({ ...editForm, estimatedTime: parseFloat(e.target.value) || 0 })}
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 0.5 } }}
              />
              
              <TextField
                fullWidth
                label="Time Spent (minutes)"
                type="number"
                value={editForm.timeSpent}
                onChange={(e) => setEditForm({ ...editForm, timeSpent: parseInt(e.target.value) || 0 })}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </Typography>
          {task.attachments?.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This task has {task.attachments.length} attachment(s) that will also be deleted.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskCard;