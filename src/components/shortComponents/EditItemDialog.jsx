import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@mui/icons-material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EngineeringIcon from '@mui/icons-material/Engineering'; // For operators
import WarehouseIcon from '@mui/icons-material/Warehouse'; // For WL/material
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Light Theme (Copied from AddItemDialog for consistency)
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Standard Material UI blue
    },
    secondary: {
      main: '#dc004e', // Standard Material UI pink
    },
    background: {
      paper: '#ffffff',
      default: '#f4f6f8',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
    },
    success: { // For auto-validation status
      main: '#4caf50',
    },
    info: { // For auto-validation status
      main: '#2196f3',
    },
    warning: { // For delays
      main: '#ff9800',
    },
    autofill: { // Custom color for auto-filled fields
      main: '#e8f0fe', // Light blue for auto-filled background
      text: 'rgba(0, 0, 0, 0.87)', // Standard text color
    }
  },
});

// Helper function to format a Date object into YYYY-MM-DDTHH:mm for datetime-local input
const formatDateTimeLocal = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to convert HH:mm duration string to minutes
const durationToMinutes = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  const parts = duration.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }
  return 0;
};

// Helper to convert minutes to HH:mm duration string
const minutesToDuration = (totalMinutes) => {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};


const EditItemDialog = ({
  open,
  onClose,
  editingItem,
  setEditingItem,
  fields,
  handleUpdate, // This prop will now receive the updated item directly
  formStructure, // Now receiving the specific form structure
  collectionName,
  title = 'Edit Item',
}) => {
  const isMobile = useMediaQuery(lightTheme.breakpoints.down('sm'));
  const [localEditingItem, setLocalEditingItem] = useState({});
  const [delays, setDelays] = useState([]);
  const [newDelay, setNewDelay] = useState({ from: '', to: '', reason: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);

  // State to track if fields have been manually set (for initial propagation only)
  // For EditItemDialog, these flags are mainly for consistency if a field is cleared and then re-entered.
  const [isClearanceManuallySet, setIsClearanceManuallySet] = useState(false);
  const [isStartTimeManuallySet, setIsStartTimeManuallySet] = useState(false);
  const [isStopTimeManuallySet, setIsStopTimeManuallySet] = useState(false);


  useEffect(() => {
    if (editingItem) {
      // Initialize local state with editingItem data
      setLocalEditingItem(editingItem);
      // Ensure delays are initialized as an array
      setDelays(editingItem.delays || []);
      // Reset manual set flags on new item load
      setIsClearanceManuallySet(false);
      setIsStartTimeManuallySet(false);
      setIsStopTimeManuallySet(false);
    } else {
      // Reset state when dialog is closed or no item is being edited
      setLocalEditingItem({});
      setDelays([]);
      setNewDelay({ from: '', to: '', reason: '' });
      setEditingDelayIndex(null);
      setIsClearanceManuallySet(false);
      setIsStartTimeManuallySet(false);
      setIsStopTimeManuallySet(false);
    }
  }, [editingItem, open]); // Depend on 'open' to reset when dialog closes

  // Effect for automatic 'To' time and sequential 'From' time in delays
  useEffect(() => {
    if (newDelay.from && !newDelay.to && editingDelayIndex === null) {
      const fromDate = new Date(newDelay.from);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setMinutes(fromDate.getMinutes() + 5);
        setNewDelay((prev) => ({ ...prev, to: formatDateTimeLocal(fromDate) }));
      }
    }
  }, [newDelay.from, newDelay.to, editingDelayIndex]);

  useEffect(() => {
    if (delays.length > 0 && editingDelayIndex === null) {
      const lastDelay = delays[delays.length - 1];
      if (lastDelay.to) {
        const lastToDate = new Date(lastDelay.to);
        if (!isNaN(lastToDate.getTime())) {
          lastToDate.setMinutes(lastToDate.getMinutes() + 5);
          setNewDelay((prev) => ({ ...prev, from: formatDateTimeLocal(lastToDate) }));
        }
      }
    }
  }, [delays, editingDelayIndex]);

  // --- Automatic Time Propagation (Initial Only for Edit, if fields are cleared) ---
  // This logic is slightly different for edit, it only propagates if the target field is empty
  useEffect(() => {
    // Placement -> Clearance
    if (localEditingItem.placement && !isClearanceManuallySet && !localEditingItem.clearance) {
      setLocalEditingItem(prev => ({ ...prev, clearance: localEditingItem.placement }));
    }
  }, [localEditingItem.placement, isClearanceManuallySet, localEditingItem.clearance]);

  useEffect(() => {
    // Clearance -> Start Time
    if (localEditingItem.clearance && !isStartTimeManuallySet && !localEditingItem.startTime) {
      setLocalEditingItem(prev => ({ ...prev, startTime: localEditingItem.clearance }));
    }
  }, [localEditingItem.clearance, isStartTimeManuallySet, localEditingItem.startTime]);

  useEffect(() => {
    // Start Time -> Stop Time
    if (localEditingItem.startTime && !isStopTimeManuallySet && !localEditingItem.stopTime) {
      setLocalEditingItem(prev => ({ ...prev, stopTime: localEditingItem.startTime }));
    }
  }, [localEditingItem.startTime, isStopTimeManuallySet, localEditingItem.stopTime]);


  // --- Calculated Fields ---
  // Calculate total_time (stopTime - startTime)
  useEffect(() => {
    if (localEditingItem.startTime && localEditingItem.stopTime) {
      const start = new Date(localEditingItem.startTime);
      const stop = new Date(localEditingItem.stopTime);
      if (!isNaN(start.getTime()) && !isNaN(stop.getTime())) {
        const diffMs = stop - start;
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        setLocalEditingItem(prev => ({ ...prev, totalTime: minutesToDuration(totalMinutes) }));
      } else {
        setLocalEditingItem(prev => ({ ...prev, totalTime: '00:00' }));
      }
    } else {
      setLocalEditingItem(prev => ({ ...prev, totalTime: '00:00' }));
    }
  }, [localEditingItem.startTime, localEditingItem.stopTime]);

  // Calculate actualTime (totalTime - sum of all delays)
  useEffect(() => {
    const totalTimeMinutes = durationToMinutes(localEditingItem.totalTime);
    const sumOfDelaysMinutes = delays.reduce((sum, delay) => sum + durationToMinutes(delay.duration), 0);
    const actualTimeMinutes = totalTimeMinutes - sumOfDelaysMinutes;
    setLocalEditingItem(prev => ({ ...prev, actualTime: minutesToDuration(actualTimeMinutes) }));
  }, [localEditingItem.totalTime, delays]);

  // Calculate wlLoaded (wlPlaced - manualLoaded - numberOfSick)
  useEffect(() => {
    const wlPlaced = parseFloat(localEditingItem.wlPlaced) || 0;
    const manualLoaded = parseFloat(localEditingItem.manualLoaded) || 0;
    const numberOfSick = parseFloat(localEditingItem.numberOfSick) || 0;
    const calculatedWlLoaded = wlPlaced - manualLoaded - numberOfSick;
    setLocalEditingItem(prev => ({ ...prev, wlLoaded: calculatedWlLoaded }));
  }, [localEditingItem.wlPlaced, localEditingItem.manualLoaded, localEditingItem.numberOfSick]);

  // Calculate average (totalTon / wlLoaded)
  useEffect(() => {
    const totalTon = parseFloat(localEditingItem.totalTon) || 0;
    const wlLoaded = parseFloat(localEditingItem.wlLoaded) || 0;
    if (wlLoaded > 0) {
      setLocalEditingItem(prev => ({ ...prev, average: (totalTon / wlLoaded).toFixed(2) }));
    } else {
      setLocalEditingItem(prev => ({ ...prev, average: '0.00' }));
    }
  }, [localEditingItem.totalTon, localEditingItem.wlLoaded]);


  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Set manual override flags
    if (name === 'clearance') setIsClearanceManuallySet(true);
    if (name === 'startTime') setIsStartTimeManuallySet(true);
    if (name === 'stopTime') setIsStopTimeManuallySet(true);

    setLocalEditingItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleDelayChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewDelay((prev) => ({ ...prev, [name]: value }));
  }, []);

  const calculateDelayDuration = (from, to) => {
    if (!from || !to) return '';
    const startDate = new Date(from);
    const endDate = new Date(to);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const diffMs = endDate - startDate;
    if (diffMs < 0) return 'Invalid Time';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const addDelay = useCallback(() => {
    if (newDelay.from && newDelay.to && newDelay.reason) {
      const duration = calculateDelayDuration(newDelay.from, newDelay.to);
      const delayToAdd = { ...newDelay, duration, date: new Date().toISOString().split('T')[0] }; // Add current date
      if (editingDelayIndex !== null) {
        const updatedDelays = [...delays];
        updatedDelays[editingDelayIndex] = delayToAdd;
        setDelays(updatedDelays);
        setEditingDelayIndex(null);
      } else {
        setDelays((prev) => [...prev, delayToAdd]);
      }
      setNewDelay({ from: '', to: '', reason: '' }); // Reset newDelay after adding/updating
    }
  }, [newDelay, delays, editingDelayIndex]);

  const editDelay = useCallback((index) => {
    setNewDelay(delays[index]);
    setEditingDelayIndex(index);
  }, [delays]);

  const removeDelay = useCallback((index) => {
    setDelays((prev) => prev.filter((_, i) => i !== index));
    if (editingDelayIndex === index) {
      setEditingDelayIndex(null);
      setNewDelay({ from: '', to: '', reason: '' });
    }
  }, [delays, editingDelayIndex]);

  const handleSave = () => {
    // Pass the complete localEditingItem (with updated delays) to handleUpdate
    handleUpdate({ ...localEditingItem, delays: delays });
    onClose(); // Close the dialog after saving
  };

  // Helper to render fields based on formStructure
  const renderField = (fieldKey, fieldConfig) => {
    const value = localEditingItem[fieldKey] || '';
    const isAutoSet = (
      (fieldKey === 'clearance' && localEditingItem.clearance === localEditingItem.placement && !isClearanceManuallySet) ||
      (fieldKey === 'startTime' && localEditingItem.startTime === localEditingItem.clearance && !isStartTimeManuallySet) ||
      (fieldKey === 'stopTime' && localEditingItem.stopTime === localEditingItem.startTime && !isStopTimeManuallySet) ||
      ['totalTime', 'actualTime', 'wlLoaded', 'average'].includes(fieldKey)
    );

    const commonProps = {
      fullWidth: true,
      margin: "normal",
      variant: "outlined",
      name: fieldKey,
      label: fieldConfig.label,
      value: value,
      onChange: handleChange,
      required: fieldConfig.required,
      InputLabelProps: { shrink: true }, // For accessibility and consistent label behavior
      // disabled: fieldConfig.readonly || isAutoSet, // Removed disabled to allow editing
      'aria-label': fieldConfig.label, // Accessibility
      sx: isAutoSet ? {
        backgroundColor: lightTheme.palette.autofill.main,
        '& .MuiInputBase-input': {
          color: lightTheme.palette.autofill.text,
        },
        '& .MuiInputLabel-root': {
          color: lightTheme.palette.autofill.text,
        },
      } : {},
    };

    switch (fieldConfig.type) {
      case 'text':
      case 'number':
      case 'datetime-local':
      case 'date':
        return <TextField {...commonProps} type={fieldConfig.type} />;
      case 'textarea':
        return <TextField {...commonProps} multiline rows={4} />; // Default rows, auto-height handled by MUI
      case 'array': // For delays, which is a special array type handled separately
        return null; // Handled by the dedicated delays section
      default:
        return <TextField {...commonProps} />;
    }
  };

  // Grouping fields for better UI
  const getGroupedFields = () => {
    const groups = {
      main: [],
      wlSection: [], // For wlLoaded, wlPlaced, manualLoaded, numberOfSick
      operatorSection: [], // For sr, wl, CRoomOPerator, ShiftIncharge
      other: [],
    };

    if (!formStructure) return groups;

    Object.entries(formStructure).forEach(([fieldKey, fieldConfig]) => {
      if (fieldConfig.type === 'array') return; // Delays handled separately

      if (['wlLoaded', 'wlPlaced', 'manualLoaded', 'numberOfSick', 'totalTon', 'average'].includes(fieldKey)) {
        groups.wlSection.push({ fieldKey, fieldConfig });
      } else if (['sr', 'wl', 'CRoomOPerator', 'ShiftIncharge'].includes(fieldKey)) {
        groups.operatorSection.push({ fieldKey, fieldConfig });
      } else {
        groups.main.push({ fieldKey, fieldConfig });
      }
    });
    return groups;
  };

  const groupedFields = getGroupedFields();

  return (
    <ThemeProvider theme={lightTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backgroundColor: (theme) => theme.palette.background.paper,
            color: (theme) => theme.palette.text.primary,
          },
        }}
      >
        <DialogTitle sx={{
          backgroundColor: (theme) => theme.palette.primary.main,
          color: '#fff',
          fontWeight: 'bold',
          py: 1.5,
          px: isMobile ? 1.5 : 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}>
          {title}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 1.5 : 3, backgroundColor: (theme) => theme.palette.background.default }}>
          <Box component="form" noValidate autoComplete="off" sx={{ '& .MuiTextField-root': { mb: 2 } }}>
            {/* Main Fields Section */}
            <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: (theme) => theme.palette.background.paper }}>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>General Information</Typography>
              <Grid container spacing={2}>
                {groupedFields.main.map(({ fieldKey, fieldConfig }) => (
                  <Grid item xs={12} sm={6} key={fieldKey}>
                    {renderField(fieldKey, fieldConfig)}
                  </Grid>
                ))}
              </Grid>
            </Card>

            {/* WL/Material Section (conditionally rendered) */}
            {groupedFields.wlSection.length > 0 && (
              <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: (theme) => theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarehouseIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">Material & Loading</Typography>
                </Box>
                <Grid container spacing={2}>
                  {groupedFields.wlSection.map(({ fieldKey, fieldConfig }) => (
                    <Grid item xs={12} sm={6} key={fieldKey}>
                      {renderField(fieldKey, fieldConfig)}
                    </Grid>
                  ))}
                </Grid>
              </Card>
            )}

            {/* Operators Section (conditionally rendered) */}
            {groupedFields.operatorSection.length > 0 && (
              <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: (theme) => theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EngineeringIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">Operators</Typography>
                </Box>
                <Grid container spacing={2}>
                  {groupedFields.operatorSection.map(({ fieldKey, fieldConfig }) => (
                    <Grid item xs={12} sm={6} key={fieldKey}>
                      {renderField(fieldKey, fieldConfig)}
                    </Grid>
                  ))}
                </Grid>
              </Card>
            )}

            {/* Delays Section (conditionally rendered if 'delays' is in formStructure) */}
            {formStructure?.delays && (
              <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: (theme) => theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">Delays</Typography>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      label="From (Date & Time)"
                      type="datetime-local"
                      name="from"
                      value={newDelay.from}
                      onChange={handleDelayChange}
                      InputLabelProps={{ shrink: true }}
                      aria-label="Delay start date and time"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      label="To (Date & Time)"
                      type="datetime-local"
                      name="to"
                      value={newDelay.to}
                      onChange={handleDelayChange}
                      InputLabelProps={{ shrink: true }}
                      aria-label="Delay end date and time"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      label="Reason"
                      name="reason"
                      value={newDelay.reason}
                      onChange={handleDelayChange}
                      multiline
                      rows={1} // Start with 1 row, let it expand
                      maxRows={6} // Max rows for expansion
                      InputLabelProps={{ shrink: true }}
                      aria-label="Reason for delay"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                      Duration: {calculateDelayDuration(newDelay.from, newDelay.to)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addDelay}
                      disabled={!newDelay.from || !newDelay.to || !newDelay.reason}
                      sx={{ mt: 1 }}
                      aria-label={editingDelayIndex !== null ? 'Update Delay' : 'Add Delay'}
                    >
                      {editingDelayIndex !== null ? 'Update Delay' : 'Add Delay'}
                    </Button>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  {delays.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {delays.map((delay, index) => (
                            <TableRow key={index}>
                              <TableCell>{delay.from ? new Date(delay.from).toLocaleString() : 'N/A'}</TableCell>
                              <TableCell>{delay.to ? new Date(delay.to).toLocaleString() : 'N/A'}</TableCell>
                              <TableCell>{delay.reason}</TableCell>
                              <TableCell>{delay.duration}</TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => editDelay(index)} color="primary" aria-label={`Edit delay ${index + 1}`}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => removeDelay(index)} color="error" aria-label={`Remove delay ${index + 1}`}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3, borderRadius: 1, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <Typography variant="body2" color="textSecondary">No delays recorded yet.</Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: isMobile ? 1.5 : 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', backgroundColor: (theme) => theme.palette.background.default }}>
          <Button onClick={onClose} variant="outlined" color="inherit" size="medium" aria-label="Cancel editing item">Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="medium" startIcon={<SaveIcon />} aria-label="Save updated item">Update Item</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default EditItemDialog;
