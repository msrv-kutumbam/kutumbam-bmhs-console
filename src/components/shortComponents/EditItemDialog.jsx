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
import Clock from '@mui/icons-material/AccessTime'; // Import Clock icon for consistency

// Tailwind CSS is assumed to be available in the environment.

const EditItemDialog = ({
  open,
  onClose,
  editingItem, // The item currently being edited
  setEditingItem, // Function to update the parent's editing item state (optional, for direct state management)
  formStructure, // FIX: Now directly accepting the specific form structure (singular)
  collectionName,
  handleUpdate, // This prop now receives the updated item directly
  title = 'Edit Item',
}) => {
  // --- Helper Functions (Moved inside component for guaranteed scope) ---
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

  // The problematic one that was undefined
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

  // --- End Helper Functions ---


  // --- ERROR FIX START ---
  // Early return if crucial props are missing to prevent TypeError
  // Now checking for formStructure (singular) directly
  if (!formStructure || !collectionName) {
    console.error("EditItemDialog: formStructure or collectionName is undefined. Cannot render dialog.");
    return null;
  }

  const currentFormStructure = formStructure; // FIX: Directly use the passed formStructure
  // --- ERROR FIX END ---


  const LOCAL_STORAGE_KEY_PREFIX = 'ops_management_edit_draft_'; // Different key for edit dialog
  // Use item ID for unique key to avoid conflicts with other edited items
  const localStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${collectionName}_${editingItem?.id || 'new'}`;

  const [localEditingItem, setLocalEditingItem] = useState({});
  const [delays, setDelays] = useState([]);
  const [newDelay, setNewDelay] = useState({ from: '', to: '', reason: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);

  // State to track if fields have been manually set (for initial propagation only)
  const [isClearanceManuallySet, setIsClearanceManuallySet] = useState(false);
  const [isStartTimeManuallySet, setIsStartTimeManuallySet] = useState(false);
  const [isStopTimeManuallySet, setIsStopTimeManuallySet] = useState(false);


  // Effect to load draft data or initial item data on dialog open/editingItem change
  useEffect(() => {
    if (open && editingItem) {
      try {
        const savedDraft = localStorage.getItem(localStorageKey);
        if (savedDraft) {
          const parsedDraft = JSON.parse(savedDraft);
          setLocalEditingItem(parsedDraft.localEditingItem || {});
          setDelays(parsedDraft.delays || []);
        } else {
          // If no draft, initialize with editingItem data
          setLocalEditingItem(editingItem);
          setDelays(editingItem.delays || []);
        }
        // Reset manual flags on new item load or dialog open
        setIsClearanceManuallySet(false);
        setIsStartTimeManuallySet(false);
        setIsStopTimeManuallySet(false);
      } catch (e) {
        console.error("Failed to load draft from localStorage:", e);
        // Fallback to initial item data on error
        setLocalEditingItem(editingItem);
        setDelays(editingItem.delays || []);
      }
    } else if (!open) {
      // Reset all states when dialog closes
      setLocalEditingItem({});
      setDelays([]);
      setNewDelay({ from: '', to: '', reason: '' });
      setEditingDelayIndex(null);
      setIsClearanceManuallySet(false);
      setIsStartTimeManuallySet(false);
      setIsStopTimeManuallySet(false);
    }
  }, [open, editingItem, localStorageKey, collectionName]); // Depend on relevant props for re-initialization

  // Effect to save draft data to local storage on every localEditingItem or delays change
  useEffect(() => {
    if (open && localEditingItem) { // Only save if dialog is open and an item is being edited
      try {
        localStorage.setItem(localStorageKey, JSON.stringify({ localEditingItem, delays }));
      } catch (e) {
        console.error("Failed to save draft to localStorage:", e);
      }
    }
  }, [localEditingItem, delays, open, localStorageKey]); // Depend on localEditingItem, delays, and open state

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
  }, [newDelay, delays, editingDelayIndex, calculateDelayDuration]); // Add calculateDelayDuration to deps

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
    const value = localEditingItem[fieldKey] || '';

    // Determine if the field is calculated and should be readOnly
    const isCalculatedField = ['totalTime', 'actualTime', 'wlLoaded', 'average'].includes(fieldKey);
    const isReadOnly = isCalculatedField; // Only calculated fields are truly read-only in terms of direct input

    const isRemarksField = fieldKey === 'remarks';

    // Determine if the field should be a datetime-local input
    const isDateTimeLocalField = ['placement', 'clearance', 'startTime', 'stopTime'].includes(fieldKey);


    // Styling for the TextField to make it appear as plain text but interactive
    const customInputProps = {
      disableUnderline: true, // Remove the standard Material-UI underline
      sx: {
        padding: '0 !important', // Remove internal padding for the input element
        '&.MuiInputBase-root': {
          '&:before': { borderBottom: 'none !important' }, // Remove default underline
          '&:after': { borderBottom: 'none !important' }, // Remove focused underline
          '&:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
          ...(isRemarksField && {
            alignItems: 'start', // Align text to top for textarea
          }),
        },
      }
    };

    return (
      <Box className="flex justify-between items-start mb-2"> {/* Tailwind styling for spacing and alignment */}
        {/* Render the label as Typography for better control over styling like DetailsShowPopUP */}
        {fieldKey !== "remarks" && (
          <Typography
            variant="body1"
            component="label"
            htmlFor={fieldKey}
            className="font-medium text-gray-600 mr-2 w-full"
          >
            {fieldConfig.label}:
          </Typography>
        )}
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
            className: `text-gray-800 ${isCalculatedField ? 'font-semibold' : ''} text-left` // Conditional styling
          }}
          type={isDateTimeLocalField ? "datetime-local" : (fieldConfig.type === 'textarea' ? 'text' : fieldConfig.type)} // Use datetime-local or text/fieldConfig.type
          multiline={isRemarksField}
          rows={isRemarksField ? 3 : undefined}
          maxRows={isRemarksField ? 8 : undefined}
          // Remove margin for the TextField component itself and handle spacing with parent Box
          sx={{
            m: 0,
            minHeight: isRemarksField ? '80px' : undefined,
            maxHeight: isRemarksField ? '100px' : undefined,
            overflowY: isRemarksField ? 'auto' : undefined,
            '& .MuiInputBase-input': {
              padding: '4px 8px !important', // Ensures no padding inside the input text
              minWidth: isRemarksField ? '80px' : 'auto', // Set minWidth for remarks textarea
              resize: 'vertical',
              ...(isRemarksField && {
                minHeight: '80px',
                overflowY: 'auto',
                maxHeight: '200px',
              }),
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
              <Box className="flex items-center mb-4 space-x-4"> {/* Added space-x-4 for spacing */}
                <Clock className="mr-2 text-yellow-800" size={20} /> {/* Clock icon */}
                <Typography variant="h6" className="text-yellow-800 font-semibold">Delays</Typography>

                {/* Total number of delays */}
                <Typography
                  variant="body2"
                  className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full"
                >
                  Count: {delays.length}
                </Typography>

                {/* Total delay duration */}
                <Typography
                  variant="body2"
                  className="text-sm font-medium text-red-700 bg-red-100 px-3 py-1 rounded-full"
                >
                  Total: {minutesToDuration(
                    delays.reduce((sum, d) => sum + durationToMinutes(d.duration), 0)
                  )}
                </Typography>
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
                          alignItems: 'start',
                        },
                      },
                      className: 'text-gray-800'
                    }}
                    sx={{
                      m: 0,
                      '& .MuiInputBase-input': {
                        padding: '0 !important',
                        minHeight: '80px',
                        overflowY: 'auto',
                        minWidth: '80px', // Set minWidth for reason textarea
                      }
                    }}
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
        <Button onClick={onClose} variant="outlined" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150 ease-in-out" aria-label="Cancel editing item">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-150 ease-in-out" aria-label="Save updated item">
          Update Item</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
