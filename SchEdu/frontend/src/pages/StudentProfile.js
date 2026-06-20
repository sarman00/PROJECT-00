import React from 'react';
import { Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const mockStudentProfile = {
  name: 'John Doe',
  email: 'john.doe@student.edu',
};

const StudentProfile = () => {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    alert('Profile updated:\n' + JSON.stringify(data, null, 2));
    // Here: replace with API call to save in backend when available
  };

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
<Button variant="contained" color="secondary" onClick={() => navigate('/student/dashboard')} sx={{ mb: 3 }}>
        Back to Dashboard
      </Button>
      <ProfileForm initialData={mockStudentProfile} onSubmit={handleSubmit} />
    </Container>
  );
};

export default StudentProfile;
