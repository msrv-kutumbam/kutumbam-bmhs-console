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

const EditItemDialog = ({
  open,
  onClose,
  editingItem,
  setEditingItem,
  fields,
  handleUpdate,
  formStructures,
  title = "Edit Item"
}) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const inputRefs = useRef({});
  
  const [delays, setDelays] = useState(editingItem?.delays || []);
  const [currentDelay, setCurrentDelay] = useState({ from: '', to: '', reason: '', total: '' });
  const [editingDelayIndex, setEditingDelayIndex] = useState(null);
  const [totalDelayTime, setTotalDelayTime] = useState('00:00');

  useEffect(() => {
    if (editingItem?.delays) {
      setDelays(editingItem.delays);
      calculateTotalDelayTime(editingItem.delays);
    }
  }, [editingItem]);

  const calculateTotalDelayTime = (delayList) => {
    const totalMinutes = delayList.reduce((total, delay) => {
      const [hours, minutes] = delay.total.split(':').map(Number);
      return total + (hours * 60) + minutes;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTotalDelayTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const calculateDuration = (from, to) => {
    const totalMins = (new Date(to) - new Date(from)) / (1000 * 60);
    return totalMins < 0 ? '00:00' : `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  };

  const handleDelayChange = (field, value) => {
    const updatedDelay = { ...currentDelay, [field]: value };
    if ((field === 'from' || field === 'to') && updatedDelay.from && updatedDelay.to) {
      updatedDelay.total = calculateDuration(updatedDelay.from, updatedDelay.to);
    }
    setCurrentDelay(updatedDelay);
  };

  const addOrUpdateDelay = () => {
    if (currentDelay.from && currentDelay.to && currentDelay.reason) {
      const newDelays = editingDelayIndex !== null 
        ? delays.map((delay, i) => (i === editingDelayIndex ? currentDelay : delay))
        : [...delays, currentDelay];
      setDelays(newDelays);
      setEditingItem(prev => ({ ...prev, delays: newDelays }));
      setCurrentDelay({ from: '', to: '', reason: '', total: '' });
      setEditingDelayIndex(null);
      calculateTotalDelayTime(newDelays);
    }
  };

  const removeDelay = (index) => {
    const newDelays = delays.filter((_, i) => i !== index);
    setDelays(newDelays);
    setEditingItem(prev => ({ ...prev, delays: newDelays }));
    calculateTotalDelayTime(newDelays);
  };

  const editDelay = (index) => {
    setCurrentDelay(delays[index]);
    setEditingDelayIndex(index);
  };

  const renderField = (field) => {
    const fieldConfig = formStructures?.[field] || { type: 'text', label: field.charAt(0).toUpperCase() + field.slice(1) };
    const fieldValue = editingItem?.[field] || '';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          required={fieldConfig.required}
          type={fieldConfig.type}
          label={fieldConfig.label}
          fullWidth
          size="small"
          value={fieldValue}
          onChange={(e) => setEditingItem(prev => ({ ...prev, 
                      [field]: e.target.value }))
          }
        />
        {/* <IconButton size="small" onClick={addOrUpdateDelay}>
          <SaveIcon fontSize="small" color="primary" />
        </IconButton> */}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">General Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 1 }}>
                {fields.filter(f => f !== 'delays').map(field => (
                  <Box key={field}>{renderField(field)}</Box>
                ))}
              </Box>
            </Box>
          </Card>

          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Delays</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  type="datetime-local"
                  label="From"
                  size="small"
                  value={currentDelay.from}
                  onChange={(e) => handleDelayChange('from', e.target.value)}
                />
                <TextField
                  type="datetime-local"
                  label="To"
                  size="small"
                  value={currentDelay.to}
                  onChange={(e) => handleDelayChange('to', e.target.value)}
                />
                <TextField
                  label="Reason"
                  size="small"
                  value={currentDelay.reason}
                  onChange={(e) => handleDelayChange('reason', e.target.value)}
                />
                <TextField
                  label="Duration"
                  size="small"
                  value={currentDelay.total}
                  InputProps={{ readOnly: true }}
                />
                <Button variant="contained" onClick={addOrUpdateDelay}>
                  {editingDelayIndex !== null ? 'Update' : 'Add'}
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {delays.map((delay, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(delay.from).toLocaleString()}</TableCell>
                        <TableCell>{new Date(delay.to).toLocaleString()}</TableCell>
                        <TableCell>{delay.total}</TableCell>
                        <TableCell>{delay.reason}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => editDelay(index)} color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => removeDelay(index)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleUpdate} color="primary">Update</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;

