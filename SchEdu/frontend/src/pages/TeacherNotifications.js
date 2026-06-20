import React, { useState } from 'react';
import {
  Container,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Notifications from '../components/Notifications';

const mockTeacherNotifications = [
  { title: 'Meeting Reminder', message: 'Department meeting on Friday at 3 PM' },
  { title: 'Grade Submission', message: 'Please submit grades by Monday' },
];

const TeacherNotifications = () => {
  const [notifications] = useState(mockTeacherNotifications);
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
<Button variant="contained" color="secondary" onClick={() => navigate('/teacher/dashboard')} sx={{ mb: 3 }}>
        Back to Dashboard
      </Button>
      <Notifications notifications={notifications} />
    </Container>
  );
};

export default TeacherNotifications;
