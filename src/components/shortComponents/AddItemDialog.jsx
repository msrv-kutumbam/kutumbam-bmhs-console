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

// Light Theme
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


const AddItemDialog = ({
  open,
  onClose,
  fields,
  collectionName,
  formStructures, // This now contains all form structures
  handleAdd,
  title = 'Add New Item',
}) => {
  const isMobile = useMediaQuery(lightTheme.breakpoints.down('sm'));
  const [newItem, setNewItem] = useState({});
  const [delays, setDelays] = useState([]);
  const [newDelay, setNewDelay] = useState({ from: '', to: '', reason: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);

  // State to track if fields have been manually set
  const [isClearanceManuallySet, setIsClearanceManuallySet] = useState(false);
  const [isStartTimeManuallySet, setIsStartTimeManuallySet] = useState(false);
  const [isStopTimeManuallySet, setIsStopTimeManuallySet] = useState(false);

  // Get the specific form structure for the current collection
  const currentFormStructure = formStructures[collectionName];

  // Initialize numeric fields to 0 if they exist in the form structure
  useEffect(() => {
    if (open && currentFormStructure) {
      const initialNumericValues = {};
      const numericFields = ['wlLoaded', 'wlPlaced', 'manualLoaded', 'numberOfSick'];
      numericFields.forEach(field => {
        if (currentFormStructure[field] && (newItem[field] === undefined || newItem[field] === null || newItem[field] === '')) {
          initialNumericValues[field] = 0;
        }
      });
      setNewItem(prev => ({ ...prev, ...initialNumericValues }));
    }
  }, [open, currentFormStructure]);


  useEffect(() => {
    if (!open) {
      // Reset all states when dialog closes
      setNewItem({});
      setDelays([]);
      setNewDelay({ from: '', to: '', reason: '' });
      setEditingDelayIndex(null);
      // Reset manual set flags
      setIsClearanceManuallySet(false);
      setIsStartTimeManuallySet(false);
      setIsStopTimeManuallySet(false);
    }
  }, [open]);

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

  // --- Automatic Time Propagation (Initial Only) ---
  useEffect(() => {
    // Placement -> Clearance
    if (newItem.placement && !isClearanceManuallySet && !newItem.clearance) {
      setNewItem(prev => ({ ...prev, clearance: newItem.placement }));
    }
  }, [newItem.placement, isClearanceManuallySet, newItem.clearance]);

  useEffect(() => {
    // Clearance -> Start Time
    if (newItem.clearance && !isStartTimeManuallySet && !newItem.startTime) {
      setNewItem(prev => ({ ...prev, startTime: newItem.clearance }));
    }
  }, [newItem.clearance, isStartTimeManuallySet, newItem.startTime]);

  useEffect(() => {
    // Start Time -> Stop Time
    if (newItem.startTime && !isStopTimeManuallySet && !newItem.stopTime) {
      setNewItem(prev => ({ ...prev, stopTime: newItem.startTime }));
    }
  }, [newItem.startTime, isStopTimeManuallySet, newItem.stopTime]);


  // --- Calculated Fields ---
  // Calculate total_time (stopTime - startTime)
  useEffect(() => {
    if (newItem.startTime && newItem.stopTime) {
      const start = new Date(newItem.startTime);
      const stop = new Date(newItem.stopTime);
      if (!isNaN(start.getTime()) && !isNaN(stop.getTime())) {
        const diffMs = stop - start;
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        setNewItem(prev => ({ ...prev, totalTime: minutesToDuration(totalMinutes) }));
      } else {
        setNewItem(prev => ({ ...prev, totalTime: '00:00' }));
      }
    } else {
      setNewItem(prev => ({ ...prev, totalTime: '00:00' }));
    }
  }, [newItem.startTime, newItem.stopTime]);

  // Calculate actualTime (totalTime - sum of all delays)
  useEffect(() => {
    const totalTimeMinutes = durationToMinutes(newItem.totalTime);
    const sumOfDelaysMinutes = delays.reduce((sum, delay) => sum + durationToMinutes(delay.duration), 0);
    const actualTimeMinutes = totalTimeMinutes - sumOfDelaysMinutes;
    setNewItem(prev => ({ ...prev, actualTime: minutesToDuration(actualTimeMinutes) }));
  }, [newItem.totalTime, delays]);

  // Calculate wlLoaded (wlPlaced - manualLoaded - numberOfSick)
  useEffect(() => {
    const wlPlaced = parseFloat(newItem.wlPlaced) || 0;
    const manualLoaded = parseFloat(newItem.manualLoaded) || 0;
    const numberOfSick = parseFloat(newItem.numberOfSick) || 0;
    const calculatedWlLoaded = wlPlaced - manualLoaded - numberOfSick;
    setNewItem(prev => ({ ...prev, wlLoaded: calculatedWlLoaded }));
  }, [newItem.wlPlaced, newItem.manualLoaded, newItem.numberOfSick]);

  // Calculate average (totalTon / wlLoaded)
  useEffect(() => {
    const totalTon = parseFloat(newItem.totalTon) || 0;
    const wlLoaded = parseFloat(newItem.wlLoaded) || 0;
    if (wlLoaded > 0) {
      setNewItem(prev => ({ ...prev, average: (totalTon / wlLoaded).toFixed(2) }));
    } else {
      setNewItem(prev => ({ ...prev, average: '0.00' }));
    }
  }, [newItem.totalTon, newItem.wlLoaded]);


  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Set manual override flags if the user changes these fields
    if (name === 'clearance') setIsClearanceManuallySet(true);
    if (name === 'startTime') setIsStartTimeManuallySet(true);
    if (name === 'stopTime') setIsStopTimeManuallySet(true);

    setNewItem((prev) => ({
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
    // Combine newItem with delays before passing to handleAdd
    handleAdd({ ...newItem, delays: delays });
    onClose(); // Close the dialog after saving
  };

  // Helper to render fields based on currentFormStructure
  const renderField = (fieldKey, fieldConfig) => {
    const value = newItem[fieldKey] || '';
    const isAutoSet = (
      (fieldKey === 'clearance' && newItem.clearance === newItem.placement && !isClearanceManuallySet) ||
      (fieldKey === 'startTime' && newItem.startTime === newItem.clearance && !isStartTimeManuallySet) ||
      (fieldKey === 'stopTime' && newItem.stopTime === newItem.startTime && !isStopTimeManuallySet) ||
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

    if (!currentFormStructure) return groups;

    Object.entries(currentFormStructure).forEach(([fieldKey, fieldConfig]) => {
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
            {currentFormStructure?.delays && (
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
          <Button onClick={onClose} variant="outlined" color="inherit" size="medium" aria-label="Cancel adding item">Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="medium" startIcon={<SaveIcon />} aria-label="Save new item">Save Item</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default AddItemDialog;
