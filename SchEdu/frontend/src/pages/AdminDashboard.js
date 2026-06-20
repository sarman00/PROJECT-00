import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  AppBar,
  Tabs,
  Tab,
  Box,
  useTheme,
  Button,
  Alert,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const tabProps = (index) => ({
  id: `admin-tab-${index}`,
  'aria-controls': `admin-tabpanel-${index}`,
});

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [genMsg, setGenMsg] = useState('');
  const [genErr, setGenErr] = useState('');
  const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const handleChange = (event, newValue) => {
    setGenMsg('');
    setGenErr('');
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/admin/schedule');
        break;
      case 1:
        navigate('/admin/notifications');
        break;
      case 2:
        navigate('/admin/profile');
        break;
      case 3:
        navigate('/');
        break;
      default:
        break;
    }
  };

  const handleGenerate = async () => {
    setGenMsg('');
    setGenErr('');
    try {
      const res = await fetch(`${API}/timetables/generate-all`, { method: 'POST' });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) { /* HTML error page */ }
      if (!res.ok) throw new Error(data.error || text || `Failed to generate timetables (HTTP ${res.status})`);
      setGenMsg(`Generated timetables for ${data.created} classes.`);
    } catch (e) {
      setGenErr(e.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <PageHeader
        role="admin"
        icon={<SchoolIcon sx={{ fontSize: 48 }} />}
        title="Your School Name"
        subtitle="Smart timetabling and leave-aware scheduling for your institute"
        action={<Button variant="contained" color="primary" onClick={handleGenerate} sx={{ px: 3 }}>Generate Timetables</Button>}
      />
      {genMsg && <Alert severity="success" sx={{ mb: 2 }}>{genMsg}</Alert>}
      {genErr && <Alert severity="error" sx={{ mb: 2 }}>{genErr}</Alert>}
      <Typography variant="h3" fontWeight="bold" gutterBottom color={theme.palette.primary.main}>
        Admin Dashboard
      </Typography>
      <Paper elevation={8} sx={{ borderRadius: 3 }}>
        <AppBar position="static" sx={{ bgcolor: theme.palette.background.paper }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="admin dashboard tabs"
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ '& .MuiTab-root': { fontWeight: 'bold', fontSize: 16 } }}
          >
            <Tab icon={<ScheduleIcon />} iconPosition="start" label="Manage Schedule" {...tabProps(0)} />
            <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label="Notifications" {...tabProps(1)} />
            <Tab icon={<AccountCircleIcon />} iconPosition="start" label="Profile" {...tabProps(2)} />
            <Tab icon={<LogoutIcon />} iconPosition="start" label="Logout" {...tabProps(3)} />
          </Tabs>
        </AppBar>
        <Box sx={{ p: 4 }}>
          {value === 0 && <Typography>Use the tabs to manage schedules.</Typography>}
          {value === 1 && <Typography>Check Notifications.</Typography>}
          {value === 2 && <Typography>Manage your Profile.</Typography>}
          {value === 3 && <Typography>Logging out...</Typography>}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
