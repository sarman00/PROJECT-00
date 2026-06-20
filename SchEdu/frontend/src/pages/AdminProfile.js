import React from 'react';
import { Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm';

const mockAdminProfile = {
  name: 'Admin User',
  email: 'admin@example.com',
};

const AdminProfile = () => {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    alert('Profile saved for Admin:\n' + JSON.stringify(data, null, 2));
  };

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
<Button variant="contained" color="secondary" onClick={() => navigate('/admin/dashboard')} sx={{ mb: 3 }}>
        Back to Dashboard
      </Button>
      <ProfileForm initialData={mockAdminProfile} onSubmit={handleSubmit} />
    </Container>
  );
};

export default AdminProfile;
