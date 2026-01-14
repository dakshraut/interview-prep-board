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
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  IconButton,
  InputAdornment,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
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
  Timeline,
  Star
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

const CreateTaskModal = ({ open, onClose, boardId, onCreate }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'General',
    difficulty: 'Medium',
    priority: 'Medium',
    company: '',
    tags: [],
    column: 'todo',
    dueDate: null,
    estimatedTime: 1,
    status: 'Not Started',
    assignedTo: []
  });

  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [members, setMembers] = useState([]);
  const [file, setFile] = useState(null);
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
      const [boardRes, taskTypesRes] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get(`/task-types/board/${boardId}`)
      ]);
      
      setMembers(boardRes.data.members || []);
      
      // Get task types from board or use default
      const types = taskTypesRes.data.length > 0 
        ? taskTypesRes.data 
        : boardRes.data.taskTypes || [
            { name: 'DSA Problem', color: '#3B82F6' },
            { name: 'HR Question', color: '#8B5CF6' },
            { name: 'System Design', color: '#10B981' },
            { name: 'Coding Challenge', color: '#F59E0B' },
            { name: 'Behavioral', color: '#EF4444' },
            { name: 'Project', color: '#EC4899' },
            { name: 'Research', color: '#14B8A6' },
            { name: 'Revision', color: '#6366F1' },
            { name: 'Mock Interview', color: '#F97316' },
            { name: 'General', color: '#6B7280' }
          ];
      
      setTaskTypes(types.filter(t => t.isActive !== false));
      
      // Set default task type
      if (types.length > 0 && !form.type) {
        setForm(prev => ({ ...prev, type: types[0].name }));
      }
    } catch (error) {
      console.error('Failed to fetch board data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Append task data
      const taskData = {
        ...form,
        boardId,
        tags: form.tags.map(tag => tag.trim()).filter(tag => tag),
        assignedTo: form.assignedTo.map(user => user._id || user),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      };
      
      formData.append('data', JSON.stringify(taskData));
      
      // Append file if exists
      if (file) {
        formData.append('attachment', file);
      }

      const response = await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onCreate(response.data);
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(error.response?.data?.error || 'Failed to create task');
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
      column: 'todo',
      dueDate: null,
      estimatedTime: 1,
      status: 'Not Started',
      assignedTo: []
    });
    setTagInput('');
    setFile(null);
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const getTypeColor = (typeName) => {
    const type = taskTypes.find(t => t.name === typeName);
    return type?.color || '#6B7280';
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      case 'Very Hard': return '#7C2D12';
      default: return '#6B7280';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                </Grid>

                <Grid container spacing={2}>
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

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={form.status}
                        label="Status"
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <MenuItem value="Not Started">Not Started</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Blocked">Blocked</MenuItem>
                        <MenuItem value="On Hold">On Hold</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
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
                <DatePicker
                  value={form.dueDate}
                  onChange={(newValue) => setForm({ ...form, dueDate: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday fontSize="small" />
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
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

                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Attachment
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFile />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                {file && (
                  <Chip
                    label={file.name}
                    onDelete={() => setFile(null)}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
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
    </LocalizationProvider>
  );
};

export default CreateTaskModal;