---
name: material-ui
description: Build React UIs with Material UI (MUI v6+). Use when using MUI components like Button/TextField/Dialog/DataGrid, customizing MUI theme, using the sx prop, implementing MUI v6 theming with CSS variables, building forms with MUI inputs, or using MUI X components like DatePicker or DataGrid.
---

# Material UI (MUI) Expert Guide (v6+)

## Installation

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material  # icons
npm install @mui/x-data-grid    # DataGrid
npm install @mui/x-date-pickers # DatePicker
```

## Theme Setup (v6 with CSS Variables)

```typescript
// theme/theme.ts
import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,  // MUI v6 feature — enables CSS vars
  palette: {
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    body1: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',  // disable uppercase
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
  },
})

// main.tsx / _app.tsx
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* your app */}
    </ThemeProvider>
  )
}
```

## Common Components

```tsx
import {
  Button, IconButton, TextField, Select, MenuItem,
  FormControl, InputLabel, Checkbox, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions,
  Stack, Box, Grid, Container,
  Typography, Chip, Avatar, Badge,
  CircularProgress, LinearProgress,
  Alert, Snackbar,
  Divider, List, ListItem, ListItemText, ListItemIcon,
  Tooltip, Menu,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'

function ExampleUI() {
  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        {/* Buttons */}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<Add />}>Add User</Button>
          <Button variant="outlined" color="error">Cancel</Button>
          <IconButton color="primary"><Edit /></IconButton>
        </Stack>

        {/* Form Fields */}
        <TextField label="Email" type="email" fullWidth required />
        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value="user">
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>

        {/* Chips + Badges */}
        <Stack direction="row" spacing={1}>
          <Chip label="Active" color="success" size="small" />
          <Badge badgeContent={4} color="error">
            <Avatar>JD</Avatar>
          </Badge>
        </Stack>

        {/* Alerts */}
        <Alert severity="warning" onClose={() => {}}>
          Please verify your email.
        </Alert>

        {/* Progress */}
        <CircularProgress size={24} />
        <LinearProgress variant="determinate" value={60} />
      </Stack>
    </Container>
  )
}
```

## sx Prop (Styling)

```tsx
// sx prop accepts theme-aware values
<Box
  sx={{
    p: 2,             // padding: 16px (2 * 8px)
    px: 3, py: 1,     // paddingX, paddingY
    mt: 2,            // marginTop
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    borderRadius: 2,
    border: 1,
    borderColor: 'divider',
    boxShadow: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    // Responsive
    width: { xs: '100%', sm: 'auto' },
    flexDirection: { xs: 'column', md: 'row' },
    // Hover
    '&:hover': {
      bgcolor: 'primary.dark',
      cursor: 'pointer',
    },
    // Dark mode
    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
  }}
>
  Content
</Box>
```

## Dialog (Modal)

```tsx
import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'

function UserDialog({ open, onClose, onSave }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent dividers>
        <TextField label="Name" fullWidth sx={{ mb: 2 }} />
        <TextField label="Email" fullWidth type="email" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}
```

## DataGrid (MUI X)

```tsx
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', flex: 1, editable: true },
  { field: 'email', headerName: 'Email', flex: 1 },
  {
    field: 'role',
    headerName: 'Role',
    width: 120,
    renderCell: (params) => (
      <Chip label={params.value} color={params.value === 'admin' ? 'error' : 'default'} size="small" />
    ),
  },
  {
    field: 'actions',
    headerName: '',
    width: 100,
    renderCell: (params) => (
      <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
        <Delete fontSize="small" />
      </IconButton>
    ),
  },
]

function UsersTable() {
  return (
    <DataGrid
      rows={users}
      columns={columns}
      pageSizeOptions={[10, 25, 50]}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      slots={{ toolbar: GridToolbar }}
      slotProps={{ toolbar: { showQuickFilter: true } }}
      checkboxSelection
      disableRowSelectionOnClick
      sx={{ border: 0 }}
    />
  )
}
```

## Snackbar / Toast

```tsx
import { useState } from 'react'
import { Snackbar, Alert } from '@mui/material'

function useSnackbar() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  const show = (msg: string, sev: typeof severity = 'success') => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }

  const SnackbarComponent = () => (
    <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
      <Alert severity={severity} onClose={() => setOpen(false)} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  )

  return { show, SnackbarComponent }
}
```

## Dark Mode Toggle

```typescript
// theme/ThemeContext.tsx
import { createContext, useContext, useState, useMemo } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const ColorModeContext = createContext({ toggleColorMode: () => {} })

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  const colorMode = useMemo(() => ({
    toggleColorMode: () => setMode(prev => prev === 'light' ? 'dark' : 'light'),
  }), [])

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = () => useContext(ColorModeContext)
```
