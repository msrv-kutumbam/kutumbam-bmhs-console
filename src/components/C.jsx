import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, addDoc, getDoc, setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { app } from '../firebase-config'; // Ensure this path is correct relative to your project structure
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Box, Snackbar, Alert, MenuItem, Select, FormControl,
  InputLabel, Checkbox, ListItemText, Tooltip, IconButton, Paper
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
  FileDownload as FileDownloadIcon, ContentCopy, Share
} from '@mui/icons-material';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Report_betweenDates from './shortComponents/Report_betweenDates'; // Ensure this path is correct
import DetailsShowPopUP from './shortComponents/DetailsShowPopUP'; // Ensure this path is correct
import AddItemDialog from './shortComponents/AddItemDialog'; // Ensure this path is correct
import EditItemDialog from './shortComponents/EditItemDialog'; // Ensure this path is correct


// Constants
const COLUMN_NAME_MAPPING = {
  Vessel_name: 'Vessel Name',
  quantity: 'Quantity',
  remarks: 'Notes',
  u_validation: 'Validation Status',
  typeOfMaterial: 'Material Type',
  berthing_time: 'Berthing Time',
  completion_time: 'Completion Time',
  total_time: 'Total Time',
  conv_start: 'Start',
  wlPlaced:'Placed', wlLoaded:'Loaded', numberOfSick : 'Sicks', manualLoaded:'Manual',
  sr: 'SR Operator', totalTon:'Total Ton', stopTime:'Stop Time', actualTime:'Actual Time',
  wl: 'WL Operator', startTime:'Start Time', totalTime:'Total TIme',
};

// DataTable Component
const DataTable = ({
  data,
  setData,
  fields,
  columns,
  collectionName,
  currentTheme,
  canCreate,
  canRead,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onOpenDownloadDialog,
  navigate,
  startDateV,
  setStartDateV,
  endDateV,
  setEndDateV,
  fetchCollections,
  settings,
  onRowDoubleClick, // Added new prop for double click, now correctly passed from C
}) => {

  const tableColumns = useMemo(() => [
    ...columns.map((col) => {
      const columnConfig = {
        ...col,
        header: COLUMN_NAME_MAPPING[col.accessorKey] || col.header,
      };

      // Apply different colors to important fields
      const importantFields = ['rakeNo', 'Vessel_name', 'material', 'quantity', 'date'];
      if (importantFields.includes(col.accessorKey)) {
        columnConfig.muiTableBodyCellProps = ({ row }) => {
          let backgroundColor = 'transparent';
          let textColor = 'inherit';

          // Example colors - adjust as needed
          if (col.accessorKey === 'rakeNo') {
            // backgroundColor = '#E3F2FD'; // Light Blue
            textColor = '#ed6c02';
          } else if (col.accessorKey === 'Vessel_name') {
            // backgroundColor = '#FFF3E0'; // Light Orange
            textColor = '#EF6C00';
          } else if (col.accessorKey === 'material' || col.accessorKey === 'typeOfMaterial') { // 'material' for vessel, 'typeOfMaterial' for rake
            // backgroundColor = '#E8F5E9'; // Light Green
            textColor = '#2E7D32';
          } else if (col.accessorKey === 'quantity') {
            // backgroundColor = '#FBE9E7'; // Light Red/Pink
            textColor = '#C62828';
          } else if (col.accessorKey === 'date') {
            // backgroundColor = '#E1F5FE'; // Lighter Blue
            textColor = '#0277BD';
          }

          return {
            sx: {
              backgroundColor: backgroundColor,
              color: textColor,
              fontWeight: 'bold',
              borderLeft: `1px solid ${backgroundColor}`, // Add a subtle border for separation
              borderRight: `1px solid ${backgroundColor}`,
              borderRadius: '4px', // Rounded corners for individual cells
              padding: '8px 12px',
            },
          };
        };
      }


      // Base64 Image Handling
      if (col.accessorKey === 'profileImageUrl') {
        return {
          ...columnConfig,
          Cell: ({ row }) => (
            <img
              src={row.original[col.accessorKey]}
              alt="Profile"
              style={{ width: 50, height: 50, borderRadius: '50%' }}
              onError={(e) => e.target.style.display = 'none'}
            />
          ),
        };
      }

      // PDF Handling
      if (col.accessorKey === 'pdfField') {
        return {
          ...columnConfig,
          Cell: ({ row }) => (
            <Button
              variant="outlined"
              size="small"
              onClick={() => window.open(row.original[col.accessorKey], '_blank')}
            >
              View PDF
            </Button>
          ),
        };
      }

      // Validation Status
      if (col.accessorKey === 'u_validation') {
        return {
          ...columnConfig,
          Cell: ({ row }) => (
            <Box
              sx={{
                color: row.original[col.accessorKey] ? 'success.main' : 'info.main',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}
            >
              {String(row.original[col.accessorKey])}
            </Box>
          ),
        };
      }

      // Remarks Field
      if (col.accessorKey === 'remarks') {
        return {
          ...columnConfig,
          Cell: ({ row }) => (
            <Tooltip title={row.original[col.accessorKey] || ''}>
              <Box
                sx={{
                  color: row.original[col.accessorKey]?.toLowerCase() === 'nill'
                    ? 'success.main'
                    : 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row?.original[col?.accessorKey]?.length > 20 ? row?.original[col?.accessorKey].substring(0, 20) + '...' : row?.original[col?.accessorKey]}
              </Box>
            </Tooltip>
          ),
        };
      }
      // delay Field
      if (col.accessorKey === 'delays') {
        return {
          ...columnConfig,
          Cell: ({ row }) => {
            const delays = row.original[col.accessorKey] || [];

            // Format the delays array for display
            const formattedDelays = delays.map(delay => (
              `${delay.reason || 'Unknown'}: ${delay.duration || 'N/A'}`
            )).join(', ');

            return (
              <Tooltip
                title={
                  <Box>
                    {delays.length === 0 ? 'No delays' : (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {delays.map((delay, index) => (
                          <li key={index}>
                            <strong>Reason:</strong> {delay.reason || 'Unknown'}<br />
                            <strong>Duration:</strong> {delay.duration || 'N/A'}<br />
                            <strong>Date:</strong> {delay.date || 'Not specified'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Box>
                }
              >
                <Box
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: delays.length === 0 ? 'success.main' : 'warning.main'
                  }}
                >
                  {delays.length === 0
                    ? 'No delays'
                    : `${delays.length} delay${delays.length > 1 ? 's' : ''}`
                  }
                </Box>
              </Tooltip>
            );
          },
        };
      }
      return columnConfig;
    }),
    {
      id: 'actions',
      header: 'Actions',
      size: 150,
      Cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              onClick={() => onRowDoubleClick(row.original)} // Directly use onRowDoubleClick prop
              color="primary"
              size="small"
            >
              <TextSnippetIcon />
            </IconButton>
          </Tooltip>

          {canUpdate() && (
            <Tooltip title="Edit">
              <IconButton
                onClick={() => onEdit(row.original)}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}

          {canDelete() && (
            <Tooltip title="Delete">
              <IconButton
                onClick={() => onDelete(row.original.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ], [columns, canUpdate, canDelete, onEdit, onDelete, onRowDoubleClick]); // Added onRowDoubleClick to dependencies

  // Configure the MaterialReactTable
  const table = useMaterialReactTable({
    data,
    columns: tableColumns,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    enableRowSelection: false,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: 'compact',
    },
    muiTableHeadCellProps: {
      sx: {
        fontWeight: 'bold',
        backgroundColor: currentTheme.tableHeaderColor,
        color: currentTheme.textColor,
        border: currentTheme.border,
        borderRadius: currentTheme.borderRadius,
        boxShadow: currentTheme.boxShadow
      },
    },
    renderEmptyRowsFallback: () => (
      <Box sx={{
        display: 'flex',
        // justifyContent: 'center',
        p: 2,
        backgroundColor: currentTheme.tableHeaderColor,
        color: currentTheme.textColor,
        border: currentTheme.border,
        borderRadius: currentTheme.borderRadius,
        boxShadow: currentTheme.boxShadow
      }}>
        <Typography
          onClick={() => {
            navigate('/Main');
          }}
          sx={{
            cursor: 'pointer',
            color: currentTheme.buttonColor, // Use a theme color for interactive text
            '&:hover': {
              textDecoration: 'underline',
              color: currentTheme.buttonHoverColor, // Adjust hover color for better feedback
            },
          }}
        >
          No data available. Click here to redirect to the home page./Main
        </Typography>
      </Box>
    ),
    renderTopToolbarCustomActions: () => (
      <Box sx={{
        display: 'flex',
        gap: 2,
        p: 1,
        backgroundColor: currentTheme.tableHeaderColor,
        color: currentTheme.textColor,
        border: currentTheme.border,
        borderRadius: currentTheme.borderRadius,
        boxShadow: currentTheme.boxShadow
      }}>
        {canRead() && (
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={onOpenDownloadDialog}
          />
        )}
        {canCreate() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onEdit(null)}
          />
        )}
      </Box>
    ),
    // Add onRowDoubleClick handler here
    muiTableBodyRowProps: ({ row }) => ({
      onDoubleClick: () => onRowDoubleClick(row.original),
      sx: {
        cursor: 'pointer', // Indicate it's clickable
      },
    }),
  });

  return (
    <>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        color: currentTheme.textColor
      }}>
        <Typography variant="h6" component="h1" sx={{
          fontSize: 22,
          flexBasis: { xs: '100%', md: 'auto' },
          mb: { xs: 2, md: 0 },
          color: currentTheme.textColor
        }}>
          {collectionName?.charAt(0).toUpperCase() + collectionName?.slice(1)}
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: 2,
          flexBasis: { xs: '100%', md: 'auto' },
          alignItems: 'center',
          color: currentTheme.textColor
        }}>
          <TextField
            type="date"
            value={startDateV}
            onChange={(e) => setStartDateV(e.target.value)}
            sx={{
              width: { xs: '45%', md: '30%' },
              '& .MuiInputBase-root': {
                height: 36,
                backgroundColor: currentTheme.paperBackground,
                color: currentTheme.textColor,
                border: currentTheme.border,
              },
            }}
          />
          <TextField
            type="date"
            value={endDateV}
            onChange={(e) => setEndDateV(e.target.value)}
            sx={{
              width: { xs: '45%', md: '30%' },
              '& .MuiInputBase-root': {
                height: 36,
                backgroundColor: currentTheme.paperBackground,
                color: currentTheme.textColor,
                border: currentTheme.border,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setData([]) ;
              fetchCollections(collectionName, startDateV, endDateV);
            }}
            sx={{
              width: { xs: '10%', md: '10%' },
              height: 36,
              minWidth: 'fit-content',
              backgroundColor: currentTheme.buttonColor,
              color: currentTheme.textColor,
              '&:hover': {
                backgroundColor: currentTheme.buttonHoverColor
              }
            }}
          >
            Go
          </Button>
        </Box>
      </Box>

      {/* MaterialReactTable Component */}
      <MaterialReactTable
        table={table}
        sx={{
          backgroundColor: currentTheme.backgroundColor,
          color: currentTheme.textColor,
          border: currentTheme.border,
          borderRadius: currentTheme.borderRadius,
          boxShadow: currentTheme.boxShadow
        }}
      />

      {/* Analytical data */}
      <Report_betweenDates
        themeStyles={currentTheme}
        settings={settings}
        data={data}
        collectionName={collectionName}
      />
    </>
  );
};

// Main Component
function C({ settings, setShowHeadder, userData, fetchCollections, colletionsData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const collectionName = queryParams.get('collection');
  const [data, setData] = useState(colletionsData[collectionName] || [] );

  // Moved detailPopup state to the C component's scope
  const [detailPopup, setDetailPopup] = useState({ open: false, data: null, currentIndex: -1 });

  const dealyStrucure = {
    type: "array",
    label: "Delays",
    itemStructure: {
      from: {
        type: "datetime-local",
        label: "From",
        required: true
      },
      to: {
        type: "datetime-local",
        label: "To",
        required: true
      },
      reason: {
        type: "text",
        label: "Reason",
        required: true
      },
      total: {
        type: "text",
        label: "Duration",
        readonly: true
      }
    }
  }

  const formStructures = {
    vessel_data: {
      Vessel_name :{ type: 'text', label: 'Vessel Name', required: true },
      material: { type: 'text', label: 'Materials', required: true },
      quantity: { type: 'number', label: 'Quantity', required: true },
      // Ensured these are datetime-local
      berthing_time: { type: 'datetime-local', label: 'Berthing Date-Time', required: true },
      clearance: { type: 'datetime-local', label: 'Clearance Date-Time', required: true },
      conv_start: { type: 'datetime-local', label: 'Conveyor Start Date-Time', required: true },
      completion_time: { type: 'datetime-local', label: 'Completion Date-Time', required: true },
      path: { type: 'text', structure:"array separated with coma", label: 'Path SR-SP-BAY&BAY, ', required: true },
      total_time: { type: 'text', structure:"nn:nn", label: 'Total Time 00:00', required: true },
      remarks:{ type: 'textarea', label: 'Remarks', required: false, defaultValue: '' },
      delays: dealyStrucure,
    },
    reclamationData: {
      date: { type: 'date', label: 'Date', required: true },
      rakeNo: { type: 'text', label: "RakeNo ED.00 00-00-00", required: true },
      typeOfMaterial: { type: 'text', structure:"array separated with coma", label: 'Type of Material', required: true },
      path: { type: 'text', structure:"array separated with coma", label: 'Path SR-SP-BAY&BAY, ', required: true },
      totalTon: { type: 'number', structure:"nn:nn", label: 'Total Tonnage', required: true },
      average: { type: 'number', structure:"Avarage", label: 'Average', required: true },
      placement: { type: 'datetime-local', label: 'Placement', required: true },
      clearance: { type: 'datetime-local', label: 'Clearance', required: true },
      startTime: { type: 'datetime-local', label: 'Start Time', required: true },
      stopTime: { type: 'datetime-local', label: 'Stop Time', required: true },
      totalTime: { type: 'text', label: 'Total Time 00:00', required: true },
      actualTime: { type: 'text', label: 'Actual Time 00:00', required: true },
      wlPlaced: { default:0, type: 'number', label: 'WL Placed', required: true },
      manualLoaded: { default:0, type: 'number', label: 'Manual Loaded', required: true },
      numberOfSick: { default:0, type: 'number', label: 'Number of Sick', required: true },
      wlLoaded: { default:0, type: 'number', label: 'WL Loaded', required: true },
      sr: { type: 'text', structure:"array separated with coma", label: 'SR oporator', required: true },
      wl: { type: 'text', structure:"array separated with coma", label: 'WL oporator', required: true },
      CRoomOPerator: { type: 'text', structure:"array separated with coma", label: 'CRO', required: false },
      ShiftIncharge: { type: 'text', structure:"array separated with coma", label: 'Shift Incharge', required: false },
      delays: dealyStrucure,
      remarks:{ type: 'textarea', label: 'Remarks', required: false, defaultValue: '' }
    }
  };

  useEffect(() => {
    setData(colletionsData[collectionName] || []);
    // console.log( "colletionsData --", colletionsData)
  }, [colletionsData, collectionName]);

  const [editingItem, setEditingItem] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Download options state
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  // From to dates
  const [startDateV, setStartDateV] = useState(() => {
    return localStorage.getItem(`${collectionName}-startDate`) || '';
  });
  const [endDateV, setEndDateV] = useState(() => {
    return localStorage.getItem(`${collectionName}-endDate`) || '';
  });
  useEffect(() => {
    if (startDateV) {
      localStorage.setItem(`${collectionName}-startDate`, startDateV);
    }
    if (endDateV) {
      localStorage.setItem(`${collectionName}-endDate`, endDateV);
    }
  }, [startDateV, endDateV, collectionName]);

  const db = getFirestore(app);
  useEffect(() => {
    setShowHeadder(false);
  }, []);

  const fields = useMemo(() => {
    if (collectionName === "reclamationData" || collectionName === "vessel_data") {
      return Object.keys(formStructures[collectionName]);
    } else {
      return data.length > 0 ? Object.keys(data[0]).filter((key) => key !== 'id') : [];
    }
  }, [data, collectionName]);

  // Helper functions to check permissions
  const canCreate = () => userData?.access.includes('C');
  const canUpdate = () => userData?.access.includes('U');
  const canDelete = () => userData?.access.includes('D');
  const canRead = () => userData?.access.includes('R');

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Modified handleAdd to accept itemToAdd directly
  const handleAdd = async (itemToAdd) => { // Accept itemToAdd as argument
    if (!canCreate()) {
      showSnackbar('You do not have permission to create items', 'error');
      return;
    }

    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, itemToAdd); // Use itemToAdd here
      setData([...data, { id: docRef.id, ...itemToAdd }]); // Use itemToAdd here
      setIsAddDialogOpen(false);
      // Removed setNewItem({}) as newItem state is no longer used
      showSnackbar('Item added successfully');
    } catch (error) {
      showSnackbar('Error adding item', 'error');
      console.error('Error adding document: ', error);
    }
  };

  // Modified handleUpdate to accept itemToUpdate directly
  const handleUpdate = async (itemToUpdate) => {
    if (!canUpdate()) {
      showSnackbar('You do not have permission to update items', 'error');
      return;
    }

    try {
      const docRef = doc(db, collectionName, itemToUpdate.id); // Use itemToUpdate.id
      const updateData = { ...itemToUpdate, u_validation: itemToUpdate.u_validation === 'true' }; // Use itemToUpdate
      delete updateData.id;
      await updateDoc(docRef, updateData);
      setData(data.map((item) => (item.id === itemToUpdate.id ? { ...itemToUpdate } : item))); // Use itemToUpdate
      setIsEditDialogOpen(false);
      setEditingItem(null);
      showSnackbar('Item updated successfully');
    } catch (error) {
      showSnackbar('Error updating item', 'error');
      console.error('Error updating document: ', error);
    }
  };

  const handleDelete = async () => {
    if (!canDelete()) {
      showSnackbar('You do not have permission to delete items', 'error');
      return;
    }
    const delCollectionName = `del_${collectionName}`;
    try {
      const docRef = doc(db, collectionName, selectedId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Document does not exist');
      }
      const delDocRef = doc(db, delCollectionName, selectedId);
      await setDoc(delDocRef, docSnap.data());
      await deleteDoc(docRef);
      setData(data.filter((item) => item.id !== selectedId));
      setIsDeleteDialogOpen(false);
      showSnackbar('Item moved to archive and deleted successfully');
    } catch (error) {
      showSnackbar('Error moving/deleting item', 'error');
      console.error('Error in delete operation: ', error);
    }
  };

  // Download as CSV
  const downloadCSV = () => {
    if (!canRead()) {
      showSnackbar('You do not have permission to download data', 'error');
      return;
    }

    const filteredData = filterData(data);
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${collectionName}_${new Date().toISOString()}.csv`;
    link.click();
    showSnackbar('CSV downloaded successfully');
  };

  // Download as PDF
  const downloadPDF = () => {
    if (!canRead()) {
      showSnackbar('You do not have permission to download data', 'error');
      return;
    }

    // Mapping of original column names to custom names
    const headerNameMapping = {
      manualLoaded: 'Manual',
      wlLoaded: 'Loaded',
      typeOfMaterial: 'Material',
      wlPlaced: 'Placed',
      numberOfSick: 'sick',
      // Add more mappings as needed
    };

    // Transform the selectedColumns to custom header names
    const customHeaders = selectedColumns.map((col) => {
      return headerNameMapping[col] || col.charAt(0).toUpperCase() + col.slice(1);
    });

    const filteredData = filterData(data);
    const doc = new jsPDF();
    doc.autoTable({
      head: [customHeaders], // Use the custom headers here
      body: filteredData.map((row) => selectedColumns.map((col) => row[col])),
    });
    doc.save(`${collectionName}_${new Date().toISOString()}.pdf`);
    showSnackbar('PDF downloaded successfully');
  };

  // Filter data based on selected columns and date range
  const filterData = (data) => {
    let filtered = data;

    // Filter by date range if applicable
    if (startDate && endDate) {
      filtered = filtered.filter(
        (item) => item.date >= startDate && item.date <= endDate
      );
    }

    // Filter by selected columns
    if (selectedColumns.length > 0) {
      filtered = filtered.map((item) => {
        const newItem = {};
        selectedColumns.forEach((col) => {
          newItem[col] = item[col];
        });
        return newItem;
      });
    }

    return filtered;
  };

  // Enhanced columns with renamed headers
  const columns = useMemo(() => {
    if (fields.length === 0) return [];

    return fields.map((field) => ({
      accessorKey: field,
      header: COLUMN_NAME_MAPPING[field] ||
             field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
      size: 50,
    }));
  }, [fields]);

  const themeStyles = {
    dark: {
      backgroundColor: '#1e1e1e',
      textColor: '#d4d4d4',
      paperBackground: '#252526',
      buttonColor: '#569cd6',
      buttonHoverColor: '#3c6d9e',
      errorColor: '#ff4444',
      tableHeaderColor: '#333333',
      tableBorderColor: '#555555',
      border: '1px solid #f8f8f8',
      borderRadius: '5px',
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      paperBackground: '#f5f5f5',
      buttonColor: '#1976d2',
      buttonHoverColor: '#115293',
      errorColor: '#d32f2f',
      tableHeaderColor: '#f0f0f0',
      tableBorderColor: '#dddddd',
      border: '1px solid #dddddd',
      borderRadius: '5px',
      boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
    },
  };

  const currentTheme = settings.theme === 'dark' ? themeStyles.dark : themeStyles.light;

  const handleOpenDownloadDialog = () => {
    setIsDownloadDialogOpen(true);
  };

  const handleEditClick = (item) => {
    if (item === null) {
      // Add new item
      setIsAddDialogOpen(true);
    } else {
      // Edit existing item
      setEditingItem(item);
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle double click on a row to open details popup
  const handleRowDoubleClick = useCallback((rowData) => {
    const index = data.findIndex(item => item.id === rowData.id);
    setSnackbar({ open: false, message: '' }); // Clear any existing snackbar
    setSnackbar({ open: true, message: `Opening details for: ${rowData.rakeNo || rowData.Vessel_name || 'Item'}`, severity: 'info' });
    // Open the detail popup with the clicked row's data and its index
    setDetailPopup({ open: true, data: rowData, currentIndex: index });
  }, [data, setDetailPopup, showSnackbar]); // Added setDetailPopup to dependencies


  const handleCopyData = () => {
    navigator.clipboard.writeText(JSON.stringify(detailPopup.data, null, 2));
    showSnackbar('Data copied to clipboard!');
  };

  const handleShareData = async () => {
    try {
      await navigator.share({
        title: 'Record Details',
        text: JSON.stringify(detailPopup.data, null, 2),
      });
    } catch (err) {
      showSnackbar('Sharing failed: ' + err.message, 'error');
    }
  };


  return (
    <Box sx={{ p: 2 }}>
      {/* Data Table Component */}
      <DataTable
        data={data}
        setData={setData}
        fields={fields}
        columns={columns}
        collectionName={collectionName}
        currentTheme={currentTheme}
        canCreate={canCreate}
        canRead={canRead}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onOpenDownloadDialog={handleOpenDownloadDialog}
        navigate={navigate}
        startDateV={startDateV}
        setStartDateV={setStartDateV}
        endDateV={endDateV}
        setEndDateV={setEndDateV}
        fetchCollections={fetchCollections}
        settings={settings}
        onRowDoubleClick={handleRowDoubleClick} // Pass the new handler
      />

      {/* Download Dialog */}
      <Dialog open={isDownloadDialogOpen} onClose={() => setIsDownloadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Download Options</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Columns</InputLabel>
              <Select
                multiple
                value={selectedColumns}
                onChange={(e) => setSelectedColumns(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {fields.map((field) => (
                  <MenuItem key={field} value={field}>
                    <Checkbox checked={selectedColumns.includes(field)} />
                    <ListItemText primary={field} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDownloadDialogOpen(false)}>Cancel</Button>
          <Button onClick={downloadCSV} variant="contained" color="primary">
            CSV
          </Button>
          <Button onClick={downloadPDF} variant="contained" color="secondary">
            PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <AddItemDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        fields={fields}
        collectionName={collectionName}
        formStructures={formStructures}
        // Removed newItem and setNewItem props
        handleAdd={handleAdd}
        // Optional:
        title={collectionName} // defaults to "Add New Item"
      />

      {/* Edit Dialog */}
      {/* <ErrorBoundary> */}
        <EditItemDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          fields={fields}
          handleUpdate={handleUpdate} // Now passes the updated item directly
          formStructure={formStructures[collectionName]} // Changed prop name to singular 'formStructure'
          collectionName={collectionName}
          title={editingItem?.rakeNo || editingItem?.Vessel_name || 'Edit Item'} // Safe title access
        />
      {/* </ErrorBoundary> */}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Detail Popup - Rendered here using the state from C component */}
      <Dialog open={detailPopup.open} onClose={() => setDetailPopup({ open: false, data: null, currentIndex: -1 })} fullWidth maxWidth="lg">
        {/* DialogTitle, DialogContent, DialogActions should be part of this Dialog */}
        <DialogTitle>Record Details</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, minWidth: 300 }}>
            {detailPopup.data && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DetailsShowPopUP
                  dataArray={data} // Pass the entire data array
                  initialIndex={detailPopup.currentIndex} // Pass the index of the current item
                  onClose={() => setDetailPopup({ open: false, data: null, currentIndex: -1 })}
                  isLoading = {false}
                  error = {null}
                  collectionType ={collectionName}
                />
              </Box>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ContentCopy />}
            onClick={handleCopyData}
          >
            Copy
          </Button>
          <Button
            startIcon={<Share />}
            onClick={handleShareData}
            disabled={!navigator.share}
          >
            Share
          </Button>
          <Button onClick={() => setDetailPopup({ open: false, data: null, currentIndex: -1 })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default C;
