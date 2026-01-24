import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  Typography,
  Slider,
  Avatar
} from '@mui/material';
import {
  Close,
  AttachFile,
  Person,
  AccessTime,
  Flag,
  Label as LabelIcon,
  CalendarToday,
  ViewColumn
} from '@mui/icons-material';
import api from '../../services/api';

const CreateTaskModal = ({ open, onClose, boardId, onCreate }) => {
  // Default columns if none from API
  const defaultColumns = [
    { type: 'todo', title: 'To Do', color: '#3B82F6' },
    { type: 'inprogress', title: 'In Progress', color: '#F59E0B' },
    { type: 'review', title: 'Review', color: '#8B5CF6' },
    { type: 'done', title: 'Done', color: '#10B981' }
  ];

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'General',
    difficulty: 'Medium',
    priority: 'Medium',
    company: '',
    tags: [],
    column: 'todo', // Default to 'todo'
    dueDate: '',
    estimatedTime: 1,
    status: 'Not Started',
    assignedTo: []
  });

  const [taskTypes, setTaskTypes] = useState([]);
  const [columns, setColumns] = useState(defaultColumns); // Initialize with defaults
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [members, setMembers] = useState([]);
  const [companies] = useState([
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple',
    'Netflix', 'Twitter', 'Uber', 'Airbnb', 'LinkedIn',
    'Adobe', 'Oracle', 'Intel', 'IBM', 'Salesforce',
    'Spotify', 'Zoom', 'Slack', 'GitHub', 'Stripe'
  ]);

  useEffect(() => {
    if (boardId && open) {
      fetchBoardData();
    }
  }, [boardId, open]);

  const fetchBoardData = async () => {
    try {
      const boardRes = await api.get(`/boards/${boardId}`);
      setMembers(boardRes.data.members || []);
      
      // Set columns from board OR use defaults
      if (boardRes.data.columns && boardRes.data.columns.length > 0) {
        setColumns(boardRes.data.columns);
        // Set default column to first one if not already set
        if (!form.column && boardRes.data.columns.length > 0) {
          const firstColumn = boardRes.data.columns[0];
          setForm(prev => ({ 
            ...prev, 
            column: firstColumn.type || firstColumn.id || 'todo' 
          }));
        }
      } else {
        // Use default columns
        setColumns(defaultColumns);
        // Set default to first column
        setForm(prev => ({ ...prev, column: 'todo' }));
      }
      
      // Get task types from board or use default
      const types = boardRes.data.taskTypes || [
        { name: 'DSA Problem', color: '#3B82F6', isActive: true },
        { name: 'HR Question', color: '#8B5CF6', isActive: true },
        { name: 'System Design', color: '#10B981', isActive: true },
        { name: 'Coding Challenge', color: '#F59E0B', isActive: true },
        { name: 'Behavioral', color: '#EF4444', isActive: true },
        { name: 'Project', color: '#EC4899', isActive: true },
        { name: 'Research', color: '#14B8A6', isActive: true },
        { name: 'Revision', color: '#6366F1', isActive: true },
        { name: 'Mock Interview', color: '#F97316', isActive: true },
        { name: 'General', color: '#6B7280', isActive: true }
      ];
      
      setTaskTypes(types.filter(t => t.isActive !== false));
      
      // Set default task type
      if (types.length > 0 && !form.type) {
        setForm(prev => ({ ...prev, type: types[0].name }));
      }
    } catch (error) {
      console.error('Failed to fetch board data:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.warn('Authentication required - user may not be logged in');
      }
      // On error, use defaults
      setColumns(defaultColumns);
      setTaskTypes([
        { name: 'DSA Problem', color: '#3B82F6', isActive: true },
        { name: 'HR Question', color: '#8B5CF6', isActive: true },
        { name: 'System Design', color: '#10B981', isActive: true },
        { name: 'Coding Challenge', color: '#F59E0B', isActive: true },
        { name: 'Behavioral', color: '#EF4444', isActive: true },
        { name: 'Project', color: '#EC4899', isActive: true },
        { name: 'Research', color: '#14B8A6', isActive: true },
        { name: 'Revision', color: '#6366F1', isActive: true },
        { name: 'Mock Interview', color: '#F97316', isActive: true },
        { name: 'General', color: '#6B7280', isActive: true }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      // Map column to status
      const statusMap = {
        'todo': 'Not Started',
        'inprogress': 'In Progress',
        'review': 'In Review',
        'done': 'Completed',
        'blocked': 'Blocked'
      };

      const taskData = {
        title: form.title,
        description: form.description,
        type: form.type,
        difficulty: form.difficulty,
        priority: form.priority,
        company: form.company,
        boardId,
        column: form.column,
        tags: form.tags.map(tag => tag.trim()).filter(tag => tag),
        assignedTo: form.assignedTo.map(user => user._id || user),
        dueDate: form.dueDate || null,
        status: statusMap[form.column] || 'Not Started',
        estimatedTime: form.estimatedTime
      };

      const response = await api.post('/tasks', taskData);
      
      // Handle both direct response and {success, data} format
      const createdTask = response.data?._id ? response.data : response.data?.data || response.data;
      
      if (createdTask && createdTask._id) {
        onCreate(createdTask);
        handleClose();
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      title: '',
      description: '',
      type: 'General',
      difficulty: 'Medium',
      priority: 'Medium',
      company: '',
      tags: [],
      column: 'todo', // Reset to default
      dueDate: '',
      estimatedTime: 1,
      status: 'Not Started',
      assignedTo: []
    });
    setTagInput('');
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm({ ...form, tags: form.tags.filter(tag => tag !== tagToRemove) });
  };

  const getTypeColor = (typeName) => {
    const type = taskTypes.find(t => t.name === typeName);
    return type?.color || '#6B7280';
  };

  const getColumnColor = (columnId) => {
    const column = columns.find(c => 
      c.type === columnId || c.id === columnId || c._id === columnId
    );
    return column?.color || '#6B7280';
  };

  const getColumnTitle = (columnId) => {
    const column = columns.find(c => 
      c.type === columnId || c.id === columnId || c._id === columnId
    );
    return column?.title || columnId;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" fontWeight={600}>
          Create New Task
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Left Column - Basic Info */}
          <Grid item xs={12} md={8}>
            <Box>
              <TextField
                fullWidth
                label="Task Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., Solve Two Sum Problem"
              />
              
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                margin="normal"
                placeholder="Describe the task in detail..."
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Task Type</InputLabel>
                    <Select
                      value={form.type}
                      label="Task Type"
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            bgcolor: getTypeColor(selected), 
                            borderRadius: '50%',
                            mr: 1
                          }} />
                          {selected}
                        </Box>
                      )}
                    >
                      {taskTypes.map((type) => (
                        <MenuItem key={type.name} value={type.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: type.color, 
                              borderRadius: '50%',
                              mr: 1
                            }} />
                            {type.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status Column</InputLabel>
                    <Select
                      value={form.column}
                      label="Status Column"
                      onChange={(e) => setForm({ ...form, column: e.target.value })}
                      renderValue={(selected) => {
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: getColumnColor(selected), 
                              borderRadius: '50%',
                              mr: 1
                            }} />
                            {getColumnTitle(selected)}
                          </Box>
                        );
                      }}
                      startAdornment={
                        <InputAdornment position="start">
                          <ViewColumn fontSize="small" />
                        </InputAdornment>
                      }
                    >
                      {columns.map((column) => (
                        <MenuItem 
                          key={column.type || column.id || column._id} 
                          value={column.type || column.id || column._id}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: column.color, 
                              borderRadius: '50%',
                              mr: 1
                            }} />
                            {column.title}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={form.difficulty}
                      label="Difficulty"
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    >
                      <MenuItem value="Easy">Easy</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Hard">Hard</MenuItem>
                      <MenuItem value="Very Hard">Very Hard</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={form.priority}
                      label="Priority"
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Autocomplete
                freeSolo
                options={companies}
                value={form.company}
                onChange={(event, newValue) => setForm({ ...form, company: newValue || '' })}
                onInputChange={(event, newInputValue) => setForm({ ...form, company: newInputValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Flag fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              <Autocomplete
                multiple
                options={members}
                getOptionLabel={(option) => option.user?.username || option.username || ''}
                value={form.assignedTo}
                onChange={(event, newValue) => setForm({ ...form, assignedTo: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign To"
                    margin="normal"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <MenuItem {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: 12 }}>
                        {option.user?.username?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      {option.user?.username || option.username}
                    </Box>
                  </MenuItem>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.user?.username || option.username}
                      {...getTagProps({ index })}
                      size="small"
                      avatar={
                        <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                          {option.user?.username?.charAt(0).toUpperCase() || '?'}
                        </Avatar>
                      }
                    />
                  ))
                }
              />
            </Box>
          </Grid>

          {/* Right Column - Additional Details */}
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Due Date
              </Typography>
              <TextField
                type="datetime-local"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />

              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Estimated Time (hours)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccessTime sx={{ color: 'text.secondary' }} />
                <Slider
                  value={form.estimatedTime}
                  onChange={(e, newValue) => setForm({ ...form, estimatedTime: newValue })}
                  min={0.5}
                  max={20}
                  step={0.5}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2">
                  {form.estimatedTime}h
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                Tags
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag and press Enter"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LabelIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  size="small"
                  onClick={handleAddTag}
                  sx={{ mt: 1 }}
                >
                  Add Tag
                </Button>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}>
                {form.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>

              {/* Show status preview based on selected column */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Status Preview
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ 
                    width: 10, 
                    height: 10, 
                    bgcolor: getColumnColor(form.column), 
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  <Typography variant="body2" fontWeight={500}>
                    {getColumnTitle(form.column)} Column
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Task will be created with status: 
                  <Box component="span" fontWeight={600} sx={{ ml: 0.5 }}>
                    {form.column === 'todo' ? 'Not Started' :
                     form.column === 'inprogress' ? 'In Progress' :
                     form.column === 'review' ? 'In Review' :
                     form.column === 'done' ? 'Completed' :
                     form.column === 'blocked' ? 'Blocked' : 'Not Started'}
                  </Box>
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!form.title.trim() || loading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskModal;