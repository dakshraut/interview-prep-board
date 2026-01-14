import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip
} from '@mui/material';
import { Close, ViewQuilt, Person, Public } from '@mui/icons-material';
import api from '../../services/api';

const steps = ['Basic Info', 'Visibility', 'Review'];

const CreateBoardModal = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    visibility: 'private'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
  if (!form.title.trim()) {
    setError('Board title is required');
    return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    const response = await api.post('/boards', {
      title: form.title,
      description: form.description,
      visibility: form.visibility
    });
    
    console.log('Board created successfully:', response.data);
    
    // Reset form
    handleClose();
    
    // Call success callback - response.data is already the board object after interceptor
    if (onSuccess) {
      onSuccess(response.data);
    }
    
  } catch (error) {
    console.error('Failed to create board:', error);
    setError(error.response?.data?.error || 'Failed to create board. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const handleClose = () => {
    setForm({
      title: '',
      description: '',
      visibility: 'private'
    });
    setActiveStep(0);
    setError('');
    setLoading(false);
    onClose();
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Board Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              margin="normal"
              required
              placeholder="e.g., Google Interview Prep, DSA Practice"
              error={!form.title.trim() && activeStep === 0}
              helperText={!form.title.trim() ? 'Board title is required' : 'Give your board a descriptive name'}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              margin="normal"
              placeholder="Describe what this board is for (optional)..."
              helperText="You can add goals, focus areas, or any notes"
            />
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Board Visibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose who can see and join your board
            </Typography>

            <RadioGroup
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <FormControlLabel
                value="private"
                control={<Radio />}
                label={
                  <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Person sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body1" fontWeight={500}>
                        Private Board
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Only invited members can view and edit
                    </Typography>
                  </Box>
                }
                sx={{ p: 0 }}
              />
              
              <FormControlLabel
                value="public"
                control={<Radio />}
                label={
                  <Box sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Public sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="body1" fontWeight={500}>
                        Public Board
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Anyone with the link can view and join
                    </Typography>
                  </Box>
                }
                sx={{ p: 0 }}
              />
            </RadioGroup>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Review Board Details
            </Typography>
            
            <Box sx={{ p: 3, bgcolor: '#f9fafb', borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Name:</Typography>
                <Typography variant="body2" fontWeight={500}>{form.title}</Typography>
              </Box>
              
              {form.description && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Description:</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 200, textAlign: 'right' }}>
                    {form.description}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Visibility:</Typography>
                <Chip 
                  label={form.visibility === 'private' ? 'Private' : 'Public'} 
                  size="small"
                  sx={{ 
                    bgcolor: form.visibility === 'private' ? '#6b7280' : '#10B981',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Your board will be created with default columns: To Do, In Progress, Review, and Done.
            </Typography>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" fontWeight={600}>
          Create New Board
        </Typography>
        <Button onClick={handleClose} size="small" sx={{ minWidth: 'auto' }}>
          <Close />
        </Button>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Box sx={{ 
            p: 2, 
            mb: 2, 
            bgcolor: '#fee', 
            borderRadius: 1,
            border: '1px solid #fcc'
          }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
        >
          Back
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={handleNext}
          variant="contained"
          disabled={loading || (activeStep === 0 && !form.title.trim())}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
            }
          }}
        >
          {loading ? 'Creating...' : activeStep === steps.length - 1 ? 'Create Board' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateBoardModal;