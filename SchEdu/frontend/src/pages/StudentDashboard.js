import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  AppBar,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const tabToIndex = {
  '/student/timetable': 0,
  '/student/notifications': 1,
  '/student/profile': 2,
  '/': 3,
};

const indexToTab = {
  0: '/student/timetable',
  1: '/student/notifications',
  2: '/student/profile',
  3: '/',
};

const StudentDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [value, setValue] = useState(tabToIndex[location.pathname] || 0);

  useEffect(() => {
    setValue(tabToIndex[location.pathname] ?? 0);
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(indexToTab[newValue]);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <PageHeader
        role="student"
        icon={<SchoolIcon sx={{ fontSize: 44 }} />}
        title="Student Dashboard"
        subtitle="Check your timetable and notifications"
        action={null}
      />
      <Paper elevation={8} sx={{ borderRadius: 3 }}>
        <AppBar position="static" sx={{ bgcolor: theme.palette.background.paper }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="student dashboard navigation"
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ '& .MuiTab-root': { fontWeight: 'bold', fontSize: 16 } }}
          >
            <Tab icon={<SchoolIcon />} iconPosition="start" label="View Timetable" />
            <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<AccountCircleIcon />} iconPosition="start" label="Profile" />
            <Tab icon={<LogoutIcon />} iconPosition="start" label="Logout" />
          </Tabs>
        </AppBar>
      </Paper>
    </Container>
  );
};

export default StudentDashboard;
