import React from 'react';
import { Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const mockTeacherProfile = {
  name: 'Teacher User',
  email: 'teacher@example.com',
};

const TeacherProfile = () => {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    alert('Profile updated:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
<Button variant="contained" color="secondary" onClick={() => navigate('/teacher/dashboard')} sx={{ mb: 3 }}>
        Back to Dashboard
      </Button>
      <ProfileForm initialData={mockTeacherProfile} onSubmit={handleSubmit} />
    </Container>
  );
};

export default TeacherProfile;
