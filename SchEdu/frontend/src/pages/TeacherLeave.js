import React, { useState } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/lab';

const TeacherLeave = () => {
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [daysApplied, setDaysApplied] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!weekStartDate) {
      setError('Please select the start date of the week.');
      return false;
    }
    if (!daysApplied) {
      setError('Please enter number of leave days.');
      return false;
    }
    if (daysApplied < 1 || daysApplied > 4) {
      setError('You can apply for up to 4 working days per month.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

      try {
        const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API}/leaves`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            // Map UI fields to API fields
            teacher_id: Number(localStorage.getItem('user_id')) || 0,
            leave_type: 'casual',
            start_date: weekStartDate.toISOString().split('T')[0],
            end_date: new Date(weekStartDate.getTime() + (Number(daysApplied)-1)*24*60*60*1000).toISOString().split('T')[0],
            reason: `Auto-submitted ${Number(daysApplied)} day(s)`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to apply for leave.');
        } else {
          setSuccess('Leave applied successfully and automatically approved.');
          setWeekStartDate(null);
          setDaysApplied('');
        }
      } catch (e) {
        setError('Network error. Please try again later.');
      }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Apply for Leave
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DatePicker
          label="Week Start Date"
          value={weekStartDate}
          onChange={(newValue) => setWeekStartDate(newValue)}
          renderInput={(params) => <TextField fullWidth {...params} margin="normal" />}
        />

        <TextField
          label="Days Applied"
          type="number"
          inputProps={{ min: 1, max: 4 }}
          value={daysApplied}
          onChange={(e) => setDaysApplied(e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
          Policy: up to 4 working days per month (Mon–Fri). Requests within the remaining quota are auto-approved and timetables are auto-adjusted.
        </Typography>

        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Submit Leave Application
        </Button>
      </Box>
    </Container>
  );
};

export default TeacherLeave;
