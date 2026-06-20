import React, { useState } from 'react';
import {
  Container,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Notifications from '../components/Notifications';

const mockStudentNotifications = [
  { title: 'Exam Schedule', message: 'Mid-term exams start next Monday.' },
  { title: 'Library Due Date', message: 'Your book is due this Friday.' },
];

const StudentNotifications = () => {
  const [notifications] = useState(mockStudentNotifications);
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
<Button variant="contained" color="secondary" onClick={() => navigate('/student/dashboard')} sx={{ mb: 3 }}>
        Back to Dashboard
      </Button>
      <Notifications notifications={notifications} />
    </Container>
  );
};

export default StudentNotifications;
