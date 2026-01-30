import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  PersonAdd,
  Close,
  Search
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TaskMembersDialog = ({ open, onClose, taskId, assignedMembers, onMembersChange }) => {
  const [boardMembers, setBoardMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchBoardMembers();
    }
  }, [open, taskId]);

  const fetchBoardMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tasks/${taskId}/board-members`);
      setBoardMembers(response.data.members || []);
    } catch (err) {
      console.error('Error fetching board members:', err);
      setError('Failed to load board members');
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = (memberId) => {
    return assignedMembers.some(m => m.user._id === memberId || m.user === memberId);
  };

  const handleToggleMember = async (memberId) => {
    try {
      if (isAssigned(memberId)) {
        // Remove member
        await api.delete(`/tasks/${taskId}/assign/${memberId}`);
        toast.success('Member removed from task');
      } else {
        // Add member
        await api.post(`/tasks/${taskId}/assign`, { memberId });
        toast.success('Member assigned to task');
      }
      fetchBoardMembers();
      onMembersChange();
    } catch (error) {
      console.error('Error updating task member:', error);
      toast.error(error.response?.data?.error || 'Failed to update member');
    }
  };

  const filteredMembers = boardMembers.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (username) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          Assign Members
        </Box>
        <Button
          size="small"
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredMembers.length === 0 ? (
              <Alert severity="info">
                {searchTerm ? 'No members found matching your search' : 'No members available'}
              </Alert>
            ) : (
              <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredMembers.map((member) => {
                  const assigned = isAssigned(member._id);
                  return (
                    <ListItemButton
                      key={member._id}
                      onClick={() => handleToggleMember(member._id)}
                      selected={assigned}
                      sx={{
                        mb: 1,
                        borderRadius: 1,
                        border: assigned ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        backgroundColor: assigned ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: assigned ? '#1976d2' : '#90caf9',
                            width: 40,
                            height: 40
                          }}
                        >
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.username} />
                          ) : (
                            getInitials(member.username)
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.username}
                        secondary={member.email}
                        primaryTypographyProps={{
                          sx: { fontWeight: assigned ? 600 : 400 }
                        }}
                      />
                      {assigned && (
                        <Chip
                          label="Assigned"
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      )}
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </>
        )}

        {assignedMembers.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <DialogTitle sx={{ p: 0, mb: 1 }}>
              Assigned Members ({assignedMembers.length})
            </DialogTitle>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {assignedMembers.map((member) => {
                const memberData = member.user || member;
                const username = typeof memberData === 'object' ? memberData.username : memberData;
                return (
                  <Chip
                    key={typeof memberData === 'object' ? memberData._id : memberData}
                    label={username}
                    onDelete={() => handleToggleMember(typeof memberData === 'object' ? memberData._id : memberData)}
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: '#1976d2',
                          width: 24,
                          height: 24
                        }}
                      >
                        {getInitials(username)}
                      </Avatar>
                    }
                    color="primary"
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskMembersDialog;
