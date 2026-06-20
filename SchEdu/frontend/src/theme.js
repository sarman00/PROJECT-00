import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0ea5a6' }, // single accent (teal)
    secondary: { main: '#475569' }, // slate for text accents
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    divider: '#e5e7eb',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800, letterSpacing: -0.4, color: '#0f172a' },
    h4: { fontWeight: 800, letterSpacing: -0.2, color: '#0f172a' },
    h5: { fontWeight: 700, color: '#0f172a' },
    subtitle2: { color: '#334155' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Clean, minimal background
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { fontWeight: 700, borderRadius: 10, textTransform: 'none' },
        containedPrimary: {
          color: '#0b3f3f',
          backgroundColor: '#99f6e4',
          '&:hover': { backgroundColor: '#67e8f9' },
          boxShadow: 'none',
        },
        containedSecondary: {
          color: '#0b3f3f',
          backgroundColor: '#e2e8f0',
          '&:hover': { backgroundColor: '#cbd5e1' },
          boxShadow: 'none',
        },
        outlinedPrimary: { borderColor: '#0ea5a6', color: '#0ea5a6' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48 },
        indicator: { height: 3, borderRadius: 3, backgroundColor: '#0ea5a6' },
      },
    },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        outlined: { borderColor: '#0ea5a6', color: '#0ea5a6' },
      },
    },
  },
});

export default theme;

