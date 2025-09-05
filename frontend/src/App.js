// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';

// A simple theme to match the Figma design
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green color for buttons
    },
    background: {
      default: '#f4f6f8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
         autoHideDuration={3000}
      >
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stack/:stackId" element={<BuilderPage />} />
        </Routes>
      </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;