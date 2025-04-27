import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Card, Chip, Divider, useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon, 
} from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      paper: '#424242',
      default: '#303030',
    },
  },
  typography: {
    fontSize: 12,
  },
});

const AddItemDialog = ({
  open,
  onClose,
  fields,
  collectionName,
  formStructures,
  newItem,
  setNewItem,
  handleAdd,
  title = "Add New Item",
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const [delays, setDelays] = useState([]);
  const [currentDelay, setCurrentDelay] = useState({
    from: '',
    to: '',
    reason: '',
    total: ''
  });
  const [editMode, setEditMode] = useState({});
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);

  // Time calculation utilities
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateTimeDifference = (start, end) => {
    if (!start || !end) return '00:00';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const totalMins = (endDate - startDate) / (1000 * 60);
    if (totalMins < 0) return '00:00';
    return minutesToTime(totalMins);
  };

  // Calculate sum of all delay durations
  const calculateTotalDelays = () => {
    return delays.reduce((total, delay) => {
      return total + timeToMinutes(delay.total);
    }, 0);
  };

  // Handle all automatic calculations
  useEffect(() => {
    const updatedItem = { ...newItem };

    if (collectionName === 'reclamationData') {
      // Calculate WL Loaded
      const wlLoaded = Math.max(0, 
        (parseFloat(updatedItem.wlPlaced) || 0) - 
        (parseFloat(updatedItem.manualLoaded) || 0) - 
        (parseFloat(updatedItem.numberOfSick) || 0));
      updatedItem.wlLoaded = wlLoaded;

      // Calculate Average
      updatedItem.average = wlLoaded > 0 
        ? ((parseFloat(updatedItem.totalTon) || 0) / wlLoaded).toFixed(2)
        : '0.00';

      // Calculate Actual Time
      if (updatedItem.totalTime) {
        const totalTimeMins = timeToMinutes(updatedItem.totalTime);
        const totalDelaysMins = calculateTotalDelays();
        const actualTimeMins = Math.max(0, totalTimeMins - totalDelaysMins);
        updatedItem.actualTime = minutesToTime(actualTimeMins);
      }
    }

    // Vessel data calculations
    if (collectionName === 'vessel_data') {
      if (updatedItem.berthing_time && updatedItem.completion_time) {
        updatedItem.total_time = calculateTimeDifference(
          updatedItem.berthing_time,
          updatedItem.completion_time
        );
      }
    }

    setNewItem(updatedItem);
  }, [newItem, delays, collectionName]);

  const handleFieldChange = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  const handleDelayChange = (field, value) => {
    const updatedDelay = {
      ...currentDelay,
      [field]: value
    };
    
    if ((field === 'from' || field === 'to') && updatedDelay.from && updatedDelay.to) {
      updatedDelay.total = calculateTimeDifference(updatedDelay.from, updatedDelay.to);
    }
    
    setCurrentDelay(updatedDelay);
  };

  const addDelay = () => {
    if (currentDelay.from && currentDelay.to && currentDelay.reason) {
      const newDelays = editingDelayIndex !== null
        ? delays.map((delay, i) => i === editingDelayIndex ? currentDelay : delay)
        : [...delays, currentDelay];
      
      setDelays(newDelays);
      setNewItem(prev => ({ ...prev, delays: newDelays }));
      setCurrentDelay({ from: '', to: '', reason: '', total: '' });
      setEditingDelayIndex(null);
    }
  };

  const removeDelay = (index) => {
    const newDelays = delays.filter((_, i) => i !== index);
    setDelays(newDelays);
    setNewItem(prev => ({ ...prev, delays: newDelays }));
  };

  const editDelay = (index) => {
    setCurrentDelay(delays[index]);
    setEditingDelayIndex(index);
  };

  const toggleEditMode = (field) => {
    setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderField = (field) => {
    const fieldConfig = formStructures?.[collectionName]?.[field] || {
      type: 'text',
      label: field.charAt(0).toUpperCase() + field.slice(1),
      required: false
    };

    const fieldValue = newItem?.[field] ?? '';

    if (editMode[field]) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            required={fieldConfig.required}
            type={fieldConfig.type || 'text'}
            label={fieldConfig.label}
            fullWidth
            size="small"
            multiline={fieldConfig.type === 'textarea'}
            rows={fieldConfig.type === 'textarea' ? 3 : 1}
            InputLabelProps={
              fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date' 
                ? { shrink: true } 
                : {}
            }
            value={fieldValue}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            autoFocus
          />
          <IconButton size="small" onClick={() => toggleEditMode(field)}>
            <SaveIcon fontSize="small" color="primary" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Box 
        sx={{ 
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
              whiteSpace: fieldConfig.type === 'textarea' ? 'pre-wrap' : 'normal',
              color: ['average', 'wlLoaded', 'actualTime', 'total_time'].includes(field) 
                ? 'primary.main' 
                : 'inherit'
            }}
          >
            {fieldValue } 
            {/* fieldValue || '—' */}
          </Typography>
        </Box>
        <IconButton size="small">
          {/* <EditIcon fontSize="small" /> */}
        </IconButton>
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
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.dark',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1,
          px: 2
        }}>
          <Typography variant="subtitle1" component="div">{title}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 0.5 : 2 }}>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Card elevation={1}>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  General Information
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 1 
                }}>
                  {fields.filter(f => f !== 'delays').map((field) => (
                    <Box key={field} sx={{ p: 0.5 }}>
                      {renderField(field)}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>

            {fields.includes('delays') && (
              <Card elevation={1}>
                <Box sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">Delays</Typography>
                    </Box>
                    <Chip label={`${delays.length} records`} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1, 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.default'
                  }}>
                    <TextField
                      type="datetime-local"
                      label="From"
                      size="small"
                      value={currentDelay.from}
                      onChange={(e) => handleDelayChange('from', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      type="datetime-local"
                      label="To"
                      size="small"
                      value={currentDelay.to}
                      onChange={(e) => handleDelayChange('to', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Reason"
                      size="small"
                      value={currentDelay.reason}
                      onChange={(e) => handleDelayChange('reason', e.target.value)}
                      sx={{ flex: isMobile ? 1 : 2 }}
                    />
                    <TextField
                      label="Duration"
                      size="small"
                      value={currentDelay.total}
                      InputProps={{ readOnly: true }}
                      sx={{ flex: isMobile ? 1 : 0.5 }}
                    />
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={addDelay}
                      fullWidth={isMobile}
                      size="small"
                    >
                      {editingDelayIndex !== null ? 'Update' : 'Add'}
                    </Button>
                  </Box>
                  
                  {delays.length > 0 ? (
                    <TableContainer component={Paper} sx={{ mb: 1, maxHeight: 250, overflowY: 'auto' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>From</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>To</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {delays.map((delay, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{new Date(delay.from).toLocaleString()}</TableCell>
                              <TableCell>{new Date(delay.to).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip label={delay.total} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {delay.reason}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton size="small" onClick={() => editDelay(index)} color="primary">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => removeDelay(index)} color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2, borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary">No delays recorded</Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleAdd} variant="contained" size="small" startIcon={<SaveIcon />}>Save</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default AddItemDialog;