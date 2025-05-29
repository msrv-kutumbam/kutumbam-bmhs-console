import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Card, Chip, Divider, useMediaQuery, Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// --- Time Calculation Utilities (Common for both dialogs) ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const calculateTimeDifference = (start, end) => {
  if (!start || !end) return '00:00';
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '00:00';
    const totalMins = Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60));
    return minutesToTime(Math.round(totalMins)); // Round to nearest minute
  } catch (error) {
    console.error("Error calculating time difference:", error);
    return '00:00';
  }
};

// --- AddItemDialog Component ---
const AddItemDialog = ({
  open,
  onClose,
  fields = [],
  collectionName,
  formStructures, // This is the full formStructures from C.jsx
  newItem = {},
  setNewItem, // Callback to update newItem in parent (C.jsx)
  handleAdd,  // Callback to finalize adding in parent (C.jsx)
  title = "Add New Item"
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [delays, setDelays] = useState(newItem?.delays || []); // Initialize from newItem if present
  const [currentDelay, setCurrentDelay] = useState({ from: '', to: '', reason: '', total: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);

  // Get the specific form structure for the current collection
  const currentCollectionFormStructure = formStructures?.[collectionName] || {};


  // Sync delays back to newItem prop when local delays change
  useEffect(() => {
    setNewItem(prev => ({ ...prev, delays: delays }));
  }, [delays, setNewItem]);

  // Initialize newItem with defaults from formStructure if it's empty
   useEffect(() => {
    if (Object.keys(newItem).length === 0 && Object.keys(currentCollectionFormStructure).length > 0) {
      const defaultValues = {};
      fields.forEach(fieldKey => {
        if (fieldKey !== 'delays' && currentCollectionFormStructure[fieldKey]) {
          defaultValues[fieldKey] = currentCollectionFormStructure[fieldKey].defaultValue ??
                                    (currentCollectionFormStructure[fieldKey].type === 'number' ? '' : '');
        }
      });
      setNewItem(prev => ({...prev, ...defaultValues}));
    }
  }, [fields, currentCollectionFormStructure, newItem, setNewItem]);


  // Handle automatic calculations based on newItem (which includes delays)
  useEffect(() => {
    // Ensure newItem is defined and not empty before proceeding
    if (!newItem || Object.keys(newItem).length === 0) return;

    const updatedItem = { ...newItem }; // Operate on a copy

    if (collectionName === 'reclamationData') {
      const wlPlaced = parseFloat(updatedItem.wlPlaced) || 0;
      const manualLoaded = parseFloat(updatedItem.manualLoaded) || 0;
      const numberOfSick = parseFloat(updatedItem.numberOfSick) || 0;
      const totalTon = parseFloat(updatedItem.totalTon) || 0;

      updatedItem.wlLoaded = Math.max(0, wlPlaced - manualLoaded - numberOfSick);
      updatedItem.average = updatedItem.wlLoaded > 0 ? (totalTon / updatedItem.wlLoaded).toFixed(2) : '0.00';

      if (updatedItem.startTime && updatedItem.stopTime) {
        updatedItem.totalTime = calculateTimeDifference(updatedItem.startTime, updatedItem.stopTime);
        const totalDelaysMins = (updatedItem.delays || []).reduce((sum, delay) => sum + timeToMinutes(delay.total), 0);
        const actualTimeMins = Math.max(0, timeToMinutes(updatedItem.totalTime) - totalDelaysMins);
        updatedItem.actualTime = minutesToTime(actualTimeMins);
      }
    } else if (collectionName === 'vessel_data') {
      if (updatedItem.conv_start && updatedItem.completion_time) {
        updatedItem.total_time = calculateTimeDifference(updatedItem.conv_start, updatedItem.completion_time);
      }
    }
    
    // Only update if there are actual changes to avoid infinite loops
    if (JSON.stringify(updatedItem) !== JSON.stringify(newItem)) {
        setNewItem(updatedItem);
    }

  }, [newItem, collectionName, setNewItem]); // Removed 'delays' from here as it's part of newItem

  const handleFieldChange = useCallback((field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  }, [setNewItem]);

  const handleDelayChange = useCallback((field, value) => {
    const updatedCurrentDelay = { ...currentDelay, [field]: value };
    if ((field === 'from' || field === 'to') && updatedCurrentDelay.from && updatedCurrentDelay.to) {
      updatedCurrentDelay.total = calculateTimeDifference(updatedCurrentDelay.from, updatedCurrentDelay.to);
    }
    setCurrentDelay(updatedCurrentDelay);
  }, [currentDelay]);

  const addOrUpdateDelay = useCallback(() => {
    if (!currentDelay.from || !currentDelay.to || !currentDelay.reason) {
        alert("Please fill in all fields for the delay (From, To, Reason)."); // User feedback
        return;
    }
    let newDelaysList;
    if (editingDelayIndex !== null) {
      newDelaysList = delays.map((d, i) => i === editingDelayIndex ? currentDelay : d);
    } else {
      newDelaysList = [...delays, currentDelay];
    }
    setDelays(newDelaysList);
    setCurrentDelay({ from: '', to: '', reason: '', total: '' });
    setEditingDelayIndex(null);
  }, [currentDelay, delays, editingDelayIndex]);

  const startEditDelay = useCallback((index) => {
    setCurrentDelay(delays[index]);
    setEditingDelayIndex(index);
  }, [delays]);

  const removeListedDelay = useCallback((index) => {
    setDelays(prevDelays => prevDelays.filter((_, i) => i !== index));
  }, []);
  
  const renderMainField = (fieldKey) => {
    const fieldConfig = currentCollectionFormStructure?.[fieldKey] || {
      type: 'text',
      label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' '),
      required: false,
    };
    const value = newItem?.[fieldKey] ?? (fieldConfig.type === 'number' ? '' : '');

    return (
        <TextField
            key={fieldKey}
            required={fieldConfig.required}
            type={fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date' ? fieldConfig.type : (fieldConfig.type === 'number' ? 'number' : 'text')}
            label={fieldConfig.label}
            fullWidth
            size="small"
            multiline={fieldConfig.type === 'textarea'}
            minRows={fieldConfig.type === 'textarea' ? 3 : 1}
            InputLabelProps={(fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date') ? { shrink: true } : {}}
            value={value}
            onChange={(e) => handleFieldChange(fieldKey, fieldConfig.type === 'number' && e.target.value !== '' ? parseFloat(e.target.value) : e.target.value)}
            helperText={fieldConfig.structure || ''}
        />
    );
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { maxHeight: isMobile ? '100vh' : '90vh' } }}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white', py: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">{title}</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'common.white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: isMobile ? 1.5 : 2.5 }}>
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <Card elevation={2} sx={{overflow: 'visible'}}> {/* Allow overflow for date pickers */}
              <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.dark">
                  General Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={isMobile ? 1.5 : 2}>
                  {fields.filter(f => f !== 'delays').map((field) => (
                    <Grid item xs={12} sm={field === 'remarks' ? 12 : 6} md={field === 'remarks' ? 12 : (currentCollectionFormStructure[field]?.type === 'textarea' ? 12 : 4)} key={field}>
                      {renderMainField(field)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>
          </Grid>

          {fields.includes('delays') && currentCollectionFormStructure.delays && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary.dark" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                       <AccessTimeIcon fontSize="small"/> Delays
                    </Typography>
                    <Chip label={`${delays.length} record${delays.length !== 1 ? 's' : ''}`} size="small" color="primary" />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={isMobile ? 1 : 1.5} alignItems="flex-end" sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField type="datetime-local" label="From" size="small" fullWidth value={currentDelay.from} onChange={(e) => handleDelayChange('from', e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField type="datetime-local" label="To" size="small" fullWidth value={currentDelay.to} onChange={(e) => handleDelayChange('to', e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={12} md={3}>
                      <TextField label="Reason" size="small" fullWidth value={currentDelay.reason} onChange={(e) => handleDelayChange('reason', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField label="Duration" size="small" fullWidth value={currentDelay.total} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={1} sx={{ textAlign: isMobile ? 'right' : 'left', pt: isMobile ? 1: 0 }}>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={addOrUpdateDelay} size="small" fullWidth={isMobile}>
                        {editingDelayIndex !== null ? 'Update' : 'Add'}
                      </Button>
                    </Grid>
                  </Grid>
                  
                  {delays.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ maxHeight: 280 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>From</TableCell>
                            <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>To</TableCell>
                            <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Duration</TableCell>
                            <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Reason</TableCell>
                            <TableCell align="center" sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...delays].reverse().map((delay, index) => {
                            const originalIndex = delays.length - 1 - index; // Calculate original index for actions
                            return (
                            <TableRow key={originalIndex} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell>{delay.from ? new Date(delay.from).toLocaleString() : 'N/A'}</TableCell>
                              <TableCell>{delay.to ? new Date(delay.to).toLocaleString() : 'N/A'}</TableCell>
                              <TableCell><Chip label={delay.total || '00:00'} size="small" color="default" variant="outlined" /></TableCell>
                              <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delay.reason}</TableCell>
                              <TableCell align="center">
                                <IconButton size="small" onClick={() => startEditDelay(originalIndex)} color="primary"><EditIcon fontSize="inherit" /></IconButton>
                                <IconButton size="small" onClick={() => removeListedDelay(originalIndex)} color="error"><DeleteIcon fontSize="inherit" /></IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No delays recorded.</Typography>
                  )}
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: isMobile ? 1.5 : 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit">Cancel</Button>
        <Button onClick={handleAdd} variant="contained" size="small" startIcon={<SaveIcon />} color="primary">Save Item</Button>
      </DialogActions>
    </Dialog>
  );
};

// --- EditItemDialog Component ---
const EditItemDialog = ({
  open,
  onClose,
  editingItem = {},
  setEditingItem,
  fields = [],
  handleUpdate,
  formStructures,
  collectionName,
  title = "Edit Item"
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [delays, setDelays] = useState(editingItem?.delays || []);
  const [currentDelay, setCurrentDelay] = useState({ from: '', to: '', reason: '', total: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);
  const [currentlyEditingField, setCurrentlyEditingField] = useState(null);
  const [totalDelayTimeDisplay, setTotalDelayTimeDisplay] = useState('00:00');

  const currentCollectionFormStructure = formStructures || {};

  useEffect(() => {
    if (open) {
      setDelays(editingItem?.delays || []);
      setCurrentlyEditingField(null);
    }
  }, [editingItem, open]);

  useEffect(() => {
    setEditingItem(prev => ({ ...prev, delays: delays }));
  }, [delays, setEditingItem]);

  useEffect(() => {
    const totalMinutes = delays.reduce((sum, delay) => sum + timeToMinutes(delay.total), 0);
    setTotalDelayTimeDisplay(minutesToTime(totalMinutes));
  }, [delays]);

  useEffect(() => {
    if (!editingItem || Object.keys(editingItem).length === 0) return;

    const updatedItem = { ...editingItem };

    if (collectionName === 'reclamationData') {
      const wlPlaced = parseFloat(updatedItem.wlPlaced) || 0;
      const manualLoaded = parseFloat(updatedItem.manualLoaded) || 0;
      const numberOfSick = parseFloat(updatedItem.numberOfSick) || 0;
      const totalTon = parseFloat(updatedItem.totalTon) || 0;

      updatedItem.wlLoaded = Math.max(0, wlPlaced - manualLoaded - numberOfSick);
      updatedItem.average = updatedItem.wlLoaded > 0 ? (totalTon / updatedItem.wlLoaded).toFixed(2) : '0.00';

      if (updatedItem.startTime && updatedItem.stopTime) {
        updatedItem.totalTime = calculateTimeDifference(updatedItem.startTime, updatedItem.stopTime);
        const totalDelaysMins = delays.reduce((sum, delay) => sum + timeToMinutes(delay.total), 0);
        const actualTimeMins = Math.max(0, timeToMinutes(updatedItem.totalTime) - totalDelaysMins);
        updatedItem.actualTime = minutesToTime(actualTimeMins);
      }
    } else if (collectionName === 'vessel_data') {
      if (updatedItem.conv_start && updatedItem.completion_time) {
        updatedItem.total_time = calculateTimeDifference(updatedItem.conv_start, updatedItem.completion_time);
      }
    }
    
    if (JSON.stringify(updatedItem) !== JSON.stringify(editingItem)) {
        setEditingItem(updatedItem);
    }
  }, [editingItem, collectionName, delays, setEditingItem]);

  const handleItemFieldChange = useCallback((field, value) => {
    setEditingItem(prev => ({ ...prev, [field]: value }));
  }, [setEditingItem]);

  const handleDelayChange = useCallback((field, value) => {
    const updatedCurrentDelay = { ...currentDelay, [field]: value };
    if ((field === 'from' || field === 'to') && updatedCurrentDelay.from && updatedCurrentDelay.to) {
      updatedCurrentDelay.total = calculateTimeDifference(updatedCurrentDelay.from, updatedCurrentDelay.to);
    }
    setCurrentDelay(updatedCurrentDelay);
  }, [currentDelay]);

  const addOrUpdateDelay = useCallback(() => {
     if (!currentDelay.from || !currentDelay.to || !currentDelay.reason) {
        alert("Please fill in all fields for the delay (From, To, Reason).");
        return;
    }
    let newDelaysList;
    if (editingDelayIndex !== null) {
      newDelaysList = delays.map((d, i) => i === editingDelayIndex ? currentDelay : d);
    } else {
      newDelaysList = [...delays, currentDelay];
    }
    setDelays(newDelaysList);
    setCurrentDelay({ from: '', to: '', reason: '', total: '' });
    setEditingDelayIndex(null);
  }, [currentDelay, delays, editingDelayIndex]);

  const startEditDelay = useCallback((index) => {
    setCurrentDelay(delays[index]);
    setEditingDelayIndex(index);
  }, [delays]);

  const removeListedDelay = useCallback((index) => {
    setDelays(prevDelays => prevDelays.filter((_, i) => i !== index));
  }, []);

  const toggleFieldEditMode = useCallback((fieldKey) => {
    setCurrentlyEditingField(prev => (prev === fieldKey ? null : fieldKey));
  }, []);

  const RenderEditableField = ({ fieldKey }) => {
    const fieldInputRef = useRef(null);
    const fieldConfig = currentCollectionFormStructure?.[fieldKey] || {
      type: 'text',
      label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' '),
      required: false,
    };
    const value = editingItem?.[fieldKey] ?? (fieldConfig.type === 'number' ? '' : '');
    const isEditingThisField = currentlyEditingField === fieldKey;

    useEffect(() => {
      if (isEditingThisField && fieldInputRef.current) {
        // Use requestAnimationFrame for safer focus management after re-renders
        requestAnimationFrame(() => {
          fieldInputRef.current.focus();
          if (fieldInputRef.current.select && (fieldConfig.type === 'text' || fieldConfig.type === 'number' || fieldConfig.type === 'textarea')) {
            fieldInputRef.current.select();
          }
        });
      }
    }, [isEditingThisField, fieldKey, fieldConfig.type]);

    return (
      <Box
        sx={{
          py: 0.5, width: '100%',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, minHeight: '58px',
          px: isEditingThisField ? 0 : 1 // Adjust padding when editing to make space for IconButton
        }}
        onClick={isEditingThisField ? undefined : () => toggleFieldEditMode(fieldKey)} // Prevent click on non-editable area during edit
        role="button" tabIndex={isEditingThisField ? -1 : 0} // Make it not focusable with tab when editing
        onKeyDown={(e) => e.key === 'Enter' && !isEditingThisField && toggleFieldEditMode(fieldKey)}
        aria-label={`edit ${fieldConfig.label}`}
      >
        {isEditingThisField ? (
          <>
            <TextField
                key={`${fieldKey}-edit`} // Crucial for maintaining instance identity
                required={fieldConfig.required}
                type={fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date' ? fieldConfig.type : (fieldConfig.type === 'number' ? 'number' : 'text')}
                label={fieldConfig.label}
                fullWidth
                size="small"
                multiline={fieldConfig.type === 'textarea'}
                minRows={fieldConfig.type === 'textarea' ? 3 : 1}
                InputLabelProps={(fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date' || value) ? { shrink: true } : {}}
                value={value}
                onChange={(e) => handleItemFieldChange(fieldKey, fieldConfig.type === 'number' && e.target.value !== '' ? parseFloat(e.target.value) : e.target.value)}
                inputRef={fieldInputRef}
                // Removed onBlur to prevent unintended closing/focus issues.
                // Rely on explicit save button or Enter key.
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fieldConfig.type !== 'textarea' && !e.shiftKey) {
                    e.preventDefault();
                    toggleFieldEditMode(fieldKey);
                  } else if (e.key === 'Escape') {
                    toggleFieldEditMode(fieldKey); // Close edit mode without saving current char
                  }
                }}
                helperText={fieldConfig.structure || ''}
            />
            <IconButton size="small" onClick={() => toggleFieldEditMode(fieldKey)} color="primary" aria-label={`save ${fieldKey}`}>
              <SaveIcon fontSize="inherit" />
            </IconButton>
          </>
        ) : (
          <>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {fieldConfig.label}
              </Typography>
              <Typography variant="body1" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                {String(value) === '' || value === null || value === undefined ? <span style={{color: 'grey'}}>N/A</span> : String(value)}
              </Typography>
            </Box>
            <EditIcon fontSize="small" color="disabled" />
          </>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { maxHeight: isMobile ? '100vh' : '90vh' } }}>
      <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'common.white', py: 1.5, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">{title}</Typography>
         <IconButton onClick={onClose} size="small" sx={{ color: 'common.white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: isMobile ? 1.5 : 2.5 }}>
        <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
                <Card elevation={2} sx={{overflow: 'visible'}}>
                    <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="secondary.dark">
                        General Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={isMobile ? 1.5 : 2}>
                        {fields.filter(f => f !== 'delays').map((fieldKey) => (
                            <Grid item xs={12} sm={fieldKey === 'remarks' ? 12 : 6} md={fieldKey === 'remarks' ? 12 : (currentCollectionFormStructure[fieldKey]?.type === 'textarea' ? 12 : 4)} key={fieldKey}>
                                <RenderEditableField fieldKey={fieldKey} />
                            </Grid>
                        ))}
                        </Grid>
                    </Box>
                </Card>
            </Grid>

          {fields.includes('delays') && currentCollectionFormStructure?.delays && (
             <Grid item xs={12}>
                <Card elevation={2}>
                    <Box sx={{ p: isMobile ? 1.5 : 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="secondary.dark" sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                           <AccessTimeIcon fontSize="small"/> Delays
                        </Typography>
                        <Box sx={{display: 'flex', gap: 1}}>
                            <Chip label={`${delays.length} record${delays.length !== 1 ? 's' : ''}`} size="small" color="secondary" />
                            <Chip label={`Total: ${totalDelayTimeDisplay}`} size="small" color="default" variant="outlined"/>
                        </Box>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={isMobile ? 1 : 1.5} alignItems="flex-end" sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Grid item xs={12} sm={6} md={3}>
                        <TextField type="datetime-local" label="From" size="small" fullWidth value={currentDelay.from} onChange={(e) => handleDelayChange('from', e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                        <TextField type="datetime-local" label="To" size="small" fullWidth value={currentDelay.to} onChange={(e) => handleDelayChange('to', e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12} sm={12} md={3}>
                        <TextField label="Reason" size="small" fullWidth value={currentDelay.reason} onChange={(e) => handleDelayChange('reason', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                        <TextField label="Duration" size="small" fullWidth value={currentDelay.total} InputProps={{ readOnly: true }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={1} sx={{ textAlign: isMobile ? 'right' : 'left', pt: isMobile ? 1: 0 }}>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={addOrUpdateDelay} size="small" color="secondary" fullWidth={isMobile}>
                            {editingDelayIndex !== null ? 'Update' : 'Add'}
                        </Button>
                        </Grid>
                    </Grid>
                    
                    {delays.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ maxHeight: 280 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                            <TableRow>
                                <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>From</TableCell>
                                <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>To</TableCell>
                                <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Duration</TableCell>
                                <TableCell sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Reason</TableCell>
                                <TableCell align="center" sx={{fontWeight: 'bold', bgcolor: 'grey.100'}}>Actions</TableCell>
                            </TableRow>
                            </TableHead>
                            <TableBody>
                            {[...delays].reverse().map((delay, index) => {
                                const originalIndex = delays.length - 1 - index;
                                return (
                                <TableRow key={originalIndex} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell>{delay.from ? new Date(delay.from).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}</TableCell>
                                <TableCell>{delay.to ? new Date(delay.to).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'N/A'}</TableCell>
                                <TableCell><Chip label={delay.total || '00:00'} size="small" color="default" variant="outlined" /></TableCell>
                                <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delay.reason}</TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => startEditDelay(originalIndex)} color="secondary"><EditIcon fontSize="inherit" /></IconButton>
                                    <IconButton size="small" onClick={() => removeListedDelay(originalIndex)} color="error"><DeleteIcon fontSize="inherit" /></IconButton>
                                </TableCell>
                                </TableRow>
                            );
                            })}
                            </TableBody>
                        </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No delays recorded.</Typography>
                    )}
                    </Box>
                </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: isMobile ? 1.5 : 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" size="small" color="inherit">Cancel</Button>
        <Button onClick={handleUpdate} variant="contained" size="small" startIcon={<SaveIcon />} color="secondary">Update Item</Button>
      </DialogActions>
    </Dialog>
  );
};

export { AddItemDialog, EditItemDialog };
 