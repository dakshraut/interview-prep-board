import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useDroppable
} from '@dnd-kit/core';
import TaskCard from './TaskCard';

const Column = ({ id, title, color, tasks, onTaskUpdate }) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      ref={setNodeRef}
      elevation={2}
      sx={{
        height: 'calc(100vh - 250px)',
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${isOver ? color : 'transparent'}`,
        transition: 'border 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {/* Column Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
          borderBottom: `1px solid ${color}30`
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="600" color={color}>
            {title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              bgcolor: color,
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: '12px',
              fontWeight: '600'
            }}
          >
            {tasks.length}
          </Typography>
        </Box>
      </Box>

      {/* Tasks List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: isOver ? `${color}10` : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        <SortableContext
          items={tasks.map(task => task._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <Box key={task._id} mb={2}>
              <TaskCard task={task} onUpdate={onTaskUpdate} />
            </Box>
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: theme.palette.text.disabled
            }}
          >
            <Typography variant="body2">No tasks yet</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default Column;