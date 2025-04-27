import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Card, Chip, Divider, useMediaQuery, Tooltip, TextareaAutosize
} from '@mui/material'; 
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon, 
} from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Enhanced dark theme with better UI colors
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf5', // Brighter blue for better visibility
    },
    secondary: {
      main: '#f673ab', // Brighter pink for better visibility
    },
    background: {
      paper: '#2d2d2d', // Slightly darker for better contrast
      default: '#1e1e1e', // Darker background for better contrast
    },
    text: {
      primary: '#e0e0e0', // Brighter text for better readability
      secondary: '#b0b0b0', // Lighter secondary text
    },
    divider: 'rgba(255, 255, 255, 0.15)', // More visible divider
  },
  typography: {
    fontSize: 12,
    fontFamily: "'Roboto', 'Arial', sans-serif",
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#333333', // Darker card background
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
        head: {
          backgroundColor: '#383838', // Darker table header
          color: '#e0e0e0',
        },
      },
    },
  },
});

const EditItemDialog = ({
  open,
  onClose,
  editingItem,
  setEditingItem,
  fields,
  handleUpdate,
  formStructures,
  collectionName,
  title = "rakeNo"
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const inputRefs = useRef({});
  
  const [delays, setDelays] = useState([]);
  const [currentDelay, setCurrentDelay] = useState({
    from: '',
    to: '',
    reason: '',
    total: ''
  });
  const [editMode, setEditMode] = useState({});
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);
  const [totalDelayTime, setTotalDelayTime] = useState('00:00');

  // Initialize delays when editingItem changes
  useEffect(() => {
    if (editingItem?.delays) {
      setDelays(editingItem.delays);
      // Calculate total delay time
      calculateTotalDelayTime(editingItem.delays);
    } else {
      setDelays([]);
      setTotalDelayTime('00:00');
    }
    
    const initialEditMode = {};
    fields.forEach(field => {
      initialEditMode[field] = false;
    });
    setEditMode(initialEditMode);
  }, [editingItem, fields]);

  // Calculate the total of all delay durations
  const calculateTotalDelayTime = (delayList) => {
    if (!delayList || delayList.length === 0) {
      setTotalDelayTime('00:00');
      return;
    }
    
    let totalMinutes = 0;
    
    delayList.forEach(delay => {
      if (delay.total) {
        const [hours, minutes] = delay.total.split(':').map(Number);
        totalMinutes += (hours * 60) + minutes;
      }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    setTotalDelayTime(`${totalHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`);
  };

  const calculateDuration = (from, to) => {
    if (!from || !to) return '00:00';
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    const totalMins = (toDate - fromDate) / (1000 * 60);
    if (totalMins < 0) return '00:00';
    
    const hours = Math.floor(totalMins / 60);
    const mins = Math.floor(totalMins % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeOnly = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelayChange = (field, value) => {
    const updatedDelay = {
      ...currentDelay,
      [field]: value
    };
    
    if ((field === 'from' || field === 'to') && updatedDelay.from && updatedDelay.to) {
      updatedDelay.total = calculateDuration(
        field === 'from' ? value : updatedDelay.from,
        field === 'to' ? value : updatedDelay.to
      );
    }
    
    setCurrentDelay(updatedDelay);
  };

  const addDelay = () => {
    if (currentDelay.from && currentDelay.to && currentDelay.reason) {
      let newDelays;
      
      if (editingDelayIndex !== null) {
        newDelays = [...delays];
        newDelays[editingDelayIndex] = currentDelay;
        setEditingDelayIndex(null);
      } else {
        newDelays = [...delays, currentDelay];
      }
      
      setDelays(newDelays);
      calculateTotalDelayTime(newDelays);
      setEditingItem(prev => ({ ...prev, delays: newDelays }));
      setCurrentDelay({ from: '', to: '', reason: '', total: '' });
    }
  };

  const removeDelay = (index) => {
    const newDelays = delays.filter((_, i) => i !== index);
    setDelays(newDelays);
    calculateTotalDelayTime(newDelays);
    setEditingItem(prev => ({ ...prev, delays: newDelays }));
  };

  const editDelay = (index) => {
    setCurrentDelay(delays[index]);
    setEditingDelayIndex(index);
  };

  const toggleEditMode = (field) => {
    // Update the edit mode state
    setEditMode(prev => {
      const newEditMode = { ...prev };
      
      // First turn off all other edit modes
      Object.keys(newEditMode).forEach(key => {
        if (key !== field) newEditMode[key] = false;
      });
      
      // Then toggle the current field
      newEditMode[field] = !prev[field];
      return newEditMode;
    });
  };

  const updateField = (field, value) => {
    setEditingItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderField = (field) => {
    const fieldConfig = formStructures?.[field] || {
      type: 'text',
      label: field.charAt(0).toUpperCase() + field.slice(1),
      required: false
    };
    
    const fieldValue = editingItem?.[field] || '';
    
    // Special handling for remarks field
    if (field === 'remarks') {
      return renderRemarksField(field, fieldConfig, fieldValue);
    }
    
    // Edit mode
    if (editMode[field]) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            key={`edit-${field}`}
            required={fieldConfig.required}
            type={fieldConfig.type || 'text'}
            label={fieldConfig.label}
            fullWidth
            size="small"
            multiline={fieldConfig.type === 'textarea'}
            rows={fieldConfig.type === 'textarea' ? 3 : 1}
            InputLabelProps={{
              shrink: true
            }}
            value={fieldValue}
            onChange={(e) => {
              updateField(field, e.target.value);
            }}
            inputRef={(input) => {
              // Store the reference and focus it
              if (input) {
                inputRefs.current[field] = input;
                input.focus();
              }
            }}
            onKeyDown={(e) => {
              // Save on Enter key
              if (e.key === 'Enter' && fieldConfig.type !== 'textarea') {
                toggleEditMode(field);
              }
            }}
            onBlur={() => {
              // Keep focus if we're still editing (prevents auto-closing when clicking within the field)
              if (editMode[field] && inputRefs.current[field]) {
                inputRefs.current[field].focus();
              }
            }}
          />
          <IconButton 
            size="small" 
            onClick={() => toggleEditMode(field)}
          >
            <SaveIcon fontSize="small" color="primary" />
          </IconButton>
        </Box>
      );
    }
    
    // Display mode
    return (
      <Box 
        sx={{ 
          py: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } 
        }}
        onClick={() => toggleEditMode(field)}
      >
        <Box>
          <Typography variant="caption" color="textSecondary">
            {fieldConfig.label}
          </Typography>
          <Typography 
            variant="body1"
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: fieldConfig.type === 'textarea' ? 'pre-wrap' : 'normal'
            }}
          >
            {fieldValue || '—'}
          </Typography>
        </Box>
        {/* <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            toggleEditMode(field);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton> */}
      </Box> 
    );
  };

  // Special rendering for the remarks field to make it more spacious
  const renderRemarksField = (field, fieldConfig, fieldValue) => {
    if (editMode[field]) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          <Typography variant="caption" color="textSecondary">
            {fieldConfig.label}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <TextareaAutosize
              minRows={3}
              maxRows={10}
              placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.23)',
                backgroundColor: 'transparent',
                color: '#e0e0e0',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical'
              }}
              ref={(input) => {
                if (input) {
                  inputRefs.current[field] = input;
                  input.focus();
                }
              }}
            />
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode(field)}
            >
              <SaveIcon fontSize="small" color="primary" />
            </IconButton>
          </Box>
        </Box>
      );
    }
    
    // Display mode for remarks
    return (
      <Box 
        sx={{ 
          py: 1,
          width: '100%',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
        }}
        onClick={() => toggleEditMode(field)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            {fieldConfig.label}
          </Typography>
          {/* <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              toggleEditMode(field);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton> */}
        </Box>
        <Paper
          variant="outlined"
          sx={{ 
            p: 1.5,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            maxHeight: '150px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          <Typography variant="body2">
            {fieldValue || '—'}
          </Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            bgcolor: darkTheme.palette.background.default,
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.dark',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="subtitle1" component="div" fontWeight="bold">{title}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1 : 2 }}>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Main Fields */}
            <Card elevation={3} sx={{ borderRadius: 1 }}>
              <Box sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                  General Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 1.5
                }}>
                  {fields.filter(f => f !== 'delays' && f !== 'remarks').map((field) => (
                    <Box key={field} sx={{ 
                      p: 0.5, 
                      bgcolor: editMode[field] ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      borderRadius: 1
                    }}>
                      {renderField(field)}
                    </Box>
                  ))}
                </Box>

                {/* Remarks field given special treatment for more space */}
                {fields.includes('remarks') && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ 
                      p: 0.5,
                      bgcolor: editMode['remarks'] ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      borderRadius: 1
                    }}>
                      {renderField('remarks')}
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Delays Section */}
            {fields.includes('delays') && (
              <Card elevation={3} sx={{ borderRadius: 1 }}>
                <Box sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1.5
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold" color="primary">
                        Delays
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`${delays.length} record${delays.length !== 1 ? 's' : ''}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                      <Tooltip title="Total delay duration">
                        <Chip 
                          label={`Total: ${totalDelayTime}`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Add Delay Form */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1.5, 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}>
                    <TextField
                      type="datetime-local"
                      label="From"
                      size="small"
                      value={currentDelay.from}
                      onChange={(e) => handleDelayChange('from', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                    <TextField
                      type="datetime-local"
                      label="To"
                      size="small"
                      value={currentDelay.to}
                      onChange={(e) => handleDelayChange('to', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                    <TextField
                      label="Reason"
                      size="small"
                      value={currentDelay.reason}
                      onChange={(e) => handleDelayChange('reason', e.target.value)}
                      sx={{ flex: isMobile ? 1 : 2 }}
                      InputProps={{ sx: { fontSize: '0.875rem' } }}
                    />
                    <TextField
                      label="Duration"
                      size="small"
                      value={currentDelay.total}
                      InputProps={{ readOnly: true, sx: { fontSize: '0.875rem' } }}
                      sx={{ flex: isMobile ? 1 : 0.5 }}
                    />
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={addDelay}
                      fullWidth={isMobile}
                      size="small"
                      sx={{ 
                        minWidth: 'auto',
                        fontSize: '0.75rem',
                        px: 2,
                        py: 1
                      }}
                    >
                      {editingDelayIndex !== null ? 'Update' : 'Add'}
                    </Button>
                  </Box>
                  
                  {/* Delays Table */}
                  {delays.length > 0 ? (
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        mb: 1,
                        maxHeight: 300,
                        overflowY: 'auto',
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Reason</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {delays.map((delay, index) => (
                            <TableRow key={index} hover>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Tooltip 
                                  title={
                                    <Box>
                                      <Typography variant="caption">From: {new Date(delay.from).toLocaleString()}</Typography>
                                      <br />
                                      <Typography variant="caption">To: {new Date(delay.to).toLocaleString()}</Typography>
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box>
                                    {formatTimeOnly(delay.from)} - {formatTimeOnly(delay.to)}
                                  </Box>
                                </Tooltip>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Chip 
                                  label={delay.total} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ 
                                fontSize: '0.75rem',
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                <Tooltip title={delay.reason}>
                                  <Typography noWrap variant="body2">
                                    {delay.reason}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => editDelay(index)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => removeDelay(index)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                    }}>
                      <Typography variant="caption" color="textSecondary">No delays recorded</Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          px: 2, 
          py: 1.5, 
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            size="small"
            startIcon={<SaveIcon />}
            sx={{ fontSize: '0.75rem' }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default EditItemDialog;