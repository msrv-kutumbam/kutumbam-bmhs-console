import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Typography, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid
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
import Clock from '@mui/icons-material/AccessTime'; // Import Clock icon for consistency with DetailsShowPopUP

// Tailwind CSS is assumed to be available in the environment.

// Helper function to format a Date object into ISO string for datetime-local input
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

// Helper to format date-time for display (from DetailsShowPopUP)
const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  return date.toLocaleString();
};

// Helper to format delay duration for display (from DetailsShowPopUP)
const formatDelayDuration = (delay) => {
  if (!delay.from || !delay.to) return 'N/A';

  try {
    const from = new Date(delay.from);
    const to = new Date(delay.to);
    const diffMs = to - from;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  } catch (e) {
    return 'N/A';
  }
};


const AddItemDialog = ({
  open,
  onClose,
  collectionName,
  formStructures,
  handleAdd,
  title = 'Add New Item',
}) => {
  const LOCAL_STORAGE_KEY_PREFIX = 'ops_management_draft_';
  const localStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${collectionName}`;

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

  // Effect to load draft data from local storage on dialog open
  useEffect(() => {
    if (open) {
      try {
        const savedDraft = localStorage.getItem(localStorageKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          setNewItem(parsedDraft.newItem || {});
          setDelays(parsedDraft.delays || []);
          // Reset manual flags as data is loaded, not manually set by user yet
          setIsClearanceManuallySet(false);
          setIsStartTimeManuallySet(false);
          setIsStopTimeManuallySet(false);
        } else {
          // If no draft, initialize numeric fields to 0
          const initialNumericValues = {};
          const numericFields = ['wlLoaded', 'wlPlaced', 'manualLoaded', 'numberOfSick', 'totalTon', 'average'];
          numericFields.forEach(field => {
            if (currentFormStructure?.[field]) { // Check if field exists in structure
              initialNumericValues[field] = 0;
            }
          });
          setNewItem(initialNumericValues);
          setDelays([]);
        }
      } catch (e) {
        console.error("Failed to load draft from localStorage:", e);
        // Fallback to empty state on error
        setNewItem({});
        setDelays([]);
      }
    } else {
      // Reset all states when dialog closes
      setNewItem({});
      setDelays([]);
      setNewDelay({ from: '', to: '', reason: '' });
      setEditingDelayIndex(null);
      setIsClearanceManuallySet(false);
      setIsStartTimeManuallySet(false);
      setIsStopTimeManuallySet(false);
    }
  }, [open, collectionName, currentFormStructure]); // Re-run when dialog opens/closes or collection changes

  // Effect to save draft data to local storage on every newItem or delays change
  useEffect(() => {
    if (open) { // Only save if dialog is open
      try {
        localStorage.setItem(localStorageKey, JSON.stringify({ newItem, delays }));
      } catch (e) {
        console.error("Failed to save draft to localStorage:", e);
      }
    }
  }, [newItem, delays, open, localStorageKey]); // Depend on newItem, delays, and open state

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
    // Clear the draft from local storage after successful save
    try {
      localStorage.removeItem(localStorageKey);
    } catch (e) {
      console.error("Failed to clear draft from localStorage:", e);
    }
    onClose(); // Close the dialog after saving
  };

  // Helper to render fields based on currentFormStructure
  const renderField = (fieldKey, fieldConfig) => {
    const value = newItem[fieldKey] || '';

    // Determine if the field is calculated and should be readOnly
    const isCalculatedField = ['totalTime', 'actualTime', 'wlLoaded', 'average'].includes(fieldKey);
    // Allow editing for clearance, startTime, stopTime
    const isReadOnly = isCalculatedField; // Only calculated fields are truly read-only in terms of direct input

    // Styling for the TextField to make it appear as plain text but interactive
    const customInputProps = {
      disableUnderline: true, // Remove the standard Material-UI underline
      sx: {
        padding: '0 !important', // Remove internal padding for the input element
        '&.MuiInputBase-root': {
          '&:before': { borderBottom: 'none !important' }, // Remove default underline
          '&:after': { borderBottom: 'none !important' }, // Remove focused underline
          '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' }, // Remove hover underline
        },
      }
    };

    return (
      <Box className="flex justify-between items-center mb-2"> {/* Tailwind styling for spacing and alignment */}
        {/* Render the label as Typography for better control over styling like DetailsShowPopUP */}
        <Typography variant="body1" component="label" htmlFor={fieldKey} className="font-medium text-gray-600 mr-2 w-full">
          {fieldConfig.label}:
        </Typography>
        <TextField
          fullWidth
          variant="standard" // Use standard variant to remove default borders/backgrounds easily
          name={fieldKey}
          id={fieldKey} // Link label to input
          value={value}
          onChange={handleChange}
          required={fieldConfig.required}
          InputLabelProps={{
            shrink: true, // Always shrink the label so it acts as a header
            sx: {
              position: 'relative', // Position label relatively
              transform: 'none !important', // Prevent default transform
              top: 'unset',
              left: 'unset',
              mb: 0.5, // Add a small margin below the label
              fontWeight: '600', // Make label bold like in DetailsShowPopUP
              color: 'rgb(75 85 99)', // text-gray-600 from DetailsShowPopUP
              display: 'none' // Hide Material UI's default label as we're using Typography
            }
          }} // Apply custom label props
          InputProps={{ // Apply custom input props
            ...customInputProps,
            readOnly: isReadOnly, // Control editability here
            className: `text-gray-800 ${isCalculatedField ? 'font-semibold' : ''} ${fieldConfig.type === 'datetime-local' || fieldConfig.type === 'date' ? 'text-right' : 'text-left'}` // Conditional styling
          }}
          type={fieldConfig.type === 'textarea' ? 'text' : fieldConfig.type} // Use type="text" for textarea visual
          multiline={fieldConfig.type === 'textarea'} // Enable multiline for textarea
          rows={fieldConfig.type === 'textarea' ? 1 : undefined} // Start with 1 row for textarea
          maxRows={fieldConfig.type === 'textarea' ? 6 : undefined} // Max rows for textarea expansion
          // Remove margin for the TextField component itself and handle spacing with parent Box
          sx={{
            m: 0,
            '& .MuiInputBase-input': {
              padding: '0 !important', // Ensures no padding inside the input text
              minWidth: 'auto', // Allow input to shrink if needed
            },
            // Hide the default label from TextField component, as we're rendering it with Typography
            '& .MuiInputLabel-root': {
                display: 'none'
            }
          }}
          aria-label={fieldConfig.label}
        />
      </Box>
    );
  };

  // Render Delays Section (Modified to match DetailsShowPopUP style)
  const renderDelaysDisplay = (delaysToDisplay) => {
    if (!delaysToDisplay || delaysToDisplay.length === 0) {
      return (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800 font-medium">No delays recorded</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {delaysToDisplay.map((delay, index) => (
          <div key={index} className="border-l-4 border-yellow-500 pl-3 py-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">Reason:</span>
              <span className="text-gray-800">{delay.reason || 'Not specified'}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-700">Period:</span>
              <span className="text-gray-800">
                {delay.from ? formatDateTime(delay.from) : 'N/A'} -
                {delay.to ? formatDateTime(delay.to) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Duration:</span>
              <span className="text-gray-800 font-semibold">
                {delay.duration || formatDelayDuration(delay)} {/* Use delay.duration if available, fallback to calc */}
              </span>
            </div>
            <div className="flex justify-end mt-2 space-x-2"> {/* Buttons for edit/delete */}
              <IconButton size="small" onClick={() => editDelay(index)} color="primary" aria-label={`Edit delay ${index + 1}`}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => removeDelay(index)} color="error" aria-label={`Remove delay ${index + 1}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    );
  };


  // Grouping fields for better UI
  const getGroupedFields = () => {
    const groups = {
      main: [], // Operational/Vessel Info (now includes Material & Path)
      operatorSection: [], // Responsible Persons
      timeAnalysisSection: [], // Time Details (placement, clearance, start, stop, total, actual)
      loadingDetailsSection: [], // Renamed from wlSection
      remarksSection: [], // Remarks
    };

    if (!currentFormStructure) return groups;

    Object.entries(currentFormStructure).forEach(([fieldKey, fieldConfig]) => {
      if (fieldConfig.type === 'array') return; // Delays handled separately

      // Combined into main for Operational/Vessel Info: date, rakeNo, Vessel_name, material, quantity, typeOfMaterial, path
      if (['date', 'rakeNo', 'Vessel_name', 'material', 'quantity', 'typeOfMaterial', 'path'].includes(fieldKey)) {
        groups.main.push({ fieldKey, fieldConfig });
      } else if (['ShiftIncharge', 'CRoomOPerator', 'sr', 'wl'].includes(fieldKey)) { // Operators
        groups.operatorSection.push({ fieldKey, fieldConfig });
      } else if (['placement', 'clearance', 'startTime', 'stopTime', 'totalTime', 'actualTime', 'berthing_time', 'completion_time', 'conv_start', 'total_time', 'u_validation'].includes(fieldKey)) { // Time fields
        groups.timeAnalysisSection.push({ fieldKey, fieldConfig });
      } else if (['wlLoaded', 'wlPlaced', 'manualLoaded', 'numberOfSick', 'totalTon', 'average'].includes(fieldKey)) { // Loading/Material fields
        groups.loadingDetailsSection.push({ fieldKey, fieldConfig }); // Changed group name
      } else if (fieldKey === 'remarks') {
        groups.remarksSection.push({ fieldKey, fieldConfig });
      }
      // Explicitly removed the 'other' group. Fields not in these categories will not be rendered.
    });
    return groups;
  };

  const groupedFields = getGroupedFields();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        className: "rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white",
      }}
    >
      <DialogTitle className="bg-blue-600 text-white font-bold py-3 px-6 rounded-t-lg">
        {title}
      </DialogTitle>
      <DialogContent className="p-6 overflow-y-auto bg-gray-50 flex-1">
        <Box component="form" noValidate autoComplete="off" className="space-y-6">

          {/* Operational/Vessel Information & Responsible Persons Section (First Row, two columns) */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedFields.main.length > 0 && (
              <div className="bg-blue-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  {collectionName === 'vessel_data' ? 'Vessel Information' : 'Operational Information'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {groupedFields.main.map(({ fieldKey, fieldConfig }) => (
                    <div key={fieldKey}>
                      {renderField(fieldKey, fieldConfig)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedFields.operatorSection.length > 0 && (
              <div className="bg-green-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Responsible Persons</h3>
                <div className="grid grid-cols-1 gap-3">
                  {groupedFields.operatorSection.map(({ fieldKey, fieldConfig }) => (
                    <div key={fieldKey}>
                      {renderField(fieldKey, fieldConfig)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delays Section (Second Row) */}
          {currentFormStructure?.delays && (
            <div className="bg-yellow-50 p-5 rounded-lg mb-6">
              <Box className="flex items-center mb-4">
                <Clock className="mr-2 text-yellow-800" size={20} /> {/* Clock icon */}
                <Typography variant="h6" className="text-yellow-800 font-semibold">Delays</Typography>
              </Box>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" component="label" htmlFor="newDelayFrom" className="font-medium text-gray-600 mb-1 block">
                    From (Date & Time):
                  </Typography>
                  <TextField
                    fullWidth
                    variant="standard"
                    type="datetime-local"
                    name="from"
                    id="newDelayFrom"
                    value={newDelay.from}
                    onChange={handleDelayChange}
                    InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        padding: '0 !important',
                        '&.MuiInputBase-root': {
                          '&:before': { borderBottom: 'none !important' },
                          '&:after': { borderBottom: 'none !important' },
                          '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
                        },
                      },
                      className: 'text-gray-800'
                    }}
                    sx={{ m: 0, '& .MuiInputBase-input': { padding: '0 !important' } }}
                    aria-label="Delay start date and time"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" component="label" htmlFor="newDelayTo" className="font-medium text-gray-600 mb-1 block">
                    To (Date & Time):
                  </Typography>
                  <TextField
                    fullWidth
                    variant="standard"
                    type="datetime-local"
                    name="to"
                    id="newDelayTo"
                    value={newDelay.to}
                    onChange={handleDelayChange}
                    InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        padding: '0 !important',
                        '&.MuiInputBase-root': {
                          '&:before': { borderBottom: 'none !important' },
                          '&:after': { borderBottom: 'none !important' },
                          '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
                        },
                      },
                      className: 'text-gray-800'
                    }}
                    sx={{ m: 0, '& .MuiInputBase-input': { padding: '0 !important' } }}
                    aria-label="Delay end date and time"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body1" component="label" htmlFor="newDelayReason" className="font-medium text-gray-600 mb-1 block">
                    Reason:
                  </Typography>
                  <TextField
                    fullWidth
                    variant="standard"
                    name="reason"
                    id="newDelayReason"
                    value={newDelay.reason}
                    onChange={handleDelayChange}
                    multiline
                    rows={1}
                    maxRows={6}
                    InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        padding: '0 !important',
                        '&.MuiInputBase-root': {
                          '&:before': { borderBottom: 'none !important' },
                          '&:after': { borderBottom: 'none !important' },
                          '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
                        },
                      },
                      className: 'text-gray-800'
                    }}
                    sx={{ m: 0, '& .MuiInputBase-input': { padding: '0 !important' } }}
                    aria-label="Reason for delay"
                  />
                </Grid>
                <Grid item xs={12} className="mt-2">
                  <Typography variant="body2" className="text-gray-700 ml-1">
                    Duration: {calculateDelayDuration(newDelay.from, newDelay.to)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addDelay}
                    disabled={!newDelay.from || !newDelay.to || !newDelay.reason}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md py-2 px-4"
                    aria-label={editingDelayIndex !== null ? 'Update Delay' : 'Add Delay'}
                  >
                    {editingDelayIndex !== null ? 'Update Delay' : 'Add Delay'}
                  </Button>
                </Grid>
              </Grid>

              <Box className="mt-6">
                {renderDelaysDisplay(delays)} {/* Use the new display function here */}
              </Box>
            </div>
          )}

          {/* Remarks Section (Third Row) */}
          {groupedFields.remarksSection.length > 0 && (
            <div className="bg-red-50 p-5 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Remarks</h3>
              {groupedFields.remarksSection.map(({ fieldKey, fieldConfig }) => (
                <div key={fieldKey}>
                  {renderField(fieldKey, fieldConfig)}
                </div>
              ))}
            </div>
          )}

          {/* Loading Details Section (Fourth Row) */}
          {groupedFields.loadingDetailsSection.length > 0 && (
            <div className="bg-amber-50 p-5 rounded-lg mb-6">
              <Box className="flex items-center mb-4">
                <WarehouseIcon color="primary" className="mr-2 text-amber-800" />
                <Typography variant="h6" className="text-amber-800 font-semibold">Loading Details</Typography> {/* Renamed heading */}
              </Box>
              <Grid container spacing={2}>
                {groupedFields.loadingDetailsSection.map(({ fieldKey, fieldConfig }) => (
                  <Grid item xs={12} sm={6} key={fieldKey}>
                    {renderField(fieldKey, fieldConfig)}
                  </Grid>
                ))}
              </Grid>
            </div>
          )}

          {/* Time Details Section (Fifth Row) */}
          {groupedFields.timeAnalysisSection.length > 0 && (
            <div className="bg-purple-50 p-5 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Time Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedFields.timeAnalysisSection.map(({ fieldKey, fieldConfig }) => (
                  <div key={fieldKey}>
                    {renderField(fieldKey, fieldConfig)}
                  </div>
                ))}
              </div>
            </div>
          )}

        </Box>
      </DialogContent>
      <DialogActions className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
        <Button onClick={onClose} variant="outlined" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out" aria-label="Cancel adding item">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150 ease-in-out" aria-label="Save new item">
          Save Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemDialog;
