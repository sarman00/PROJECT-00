import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  useTheme,
  Box,
  Chip,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@mui/material';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PERIODS = [1, 2, 3, 4, 5, 6];

// Helpers to compute current week dates (Mon-Fri) and period time ranges
function getCurrentWeekDays() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const monday = new Date(now);
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}
function fmtHM(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function addMinutes(h, m, add) {
  const total = h * 60 + m + add;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return [nh, nm];
}
function buildTimeSlots(periodCount, startHour = 9, startMinute = 0, periodMinutes = 50, breakMinutes = 10) {
  const slots = [];
  let h = startHour, m = startMinute;
  for (let i = 0; i < periodCount; i++) {
    const [eh, em] = addMinutes(h, m, periodMinutes);
    slots.push(`${fmtHM(h, m)} – ${fmtHM(eh, em)}`);
    // move to next start
    const [nh, nm] = addMinutes(eh, em, breakMinutes);
    h = nh; m = nm;
  }
  return slots;
}

const accentChip = (theme) => ({ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, backgroundColor: '#fff' });

const StudentTimetable = () => {
  const theme = useTheme();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const [subjects, setSubjects] = useState({});
  const [schedule, setSchedule] = useState({});
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load student's timetable directly using their ID
    const load = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Please log in to view your timetable');
        setLoading(false);
        return;
      }

      try {
        // Load subjects list for name mapping
        const subRes = await fetch(`${API}/subjects`);
        const subs = await subRes.json();
        const map = {};
        subs.forEach((s) => (map[s.id] = s.name));
        setSubjects(map);

        // Load student's timetable
        const ttRes = await fetch(`${API}/timetables/student/${userId}`);
        if (!ttRes.ok) {
          const errorData = await ttRes.json();
          setError(errorData.error || 'Failed to load timetable');
          setSchedule({});
        } else {
          const tt = await ttRes.json();
          setClassName(tt.class_name || 'Your Class');
          if (!tt || !tt.schedule) {
            setSchedule({});
          } else {
            setSchedule(tt.schedule);
          }
        }
      } catch (err) {
        console.error('Failed to load timetable:', err);
        setError('Failed to load timetable. Please try again.');
        setSchedule({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API]);

  // Single-accent design: no color legend needed

  const renderCell = (day, period) => {
    const dayArr = schedule?.[day] || [];
    const sess = dayArr.find((s) => s.period === period);
    if (!sess) return null;
const name = subjects[sess.subject_id] || `SUB-${sess.subject_id}`;
    return (
      <Tooltip title={sess.room ? `Room ${sess.room}` : ''} placement="top" arrow>
        <Chip label={name} size="small" variant="outlined" sx={accentChip(theme)} />
      </Tooltip>
    );
  };

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color={theme.palette.primary.main}>
        Student Timetable
      </Typography>

      {className && (
        <Typography variant="h6" gutterBottom color="text.secondary">
          Class: {className}
        </Typography>
      )}

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {loading && (
        <Box sx={{ mb: 2 }}>
          <Typography>Loading your timetable...</Typography>
        </Box>
      )}

      <Paper elevation={8} sx={{ p: 3, borderRadius: 3, overflowX: 'auto', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
        {(() => {
          const weekDates = getCurrentWeekDays();
          const slots = buildTimeSlots(PERIODS.length);
          return (
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  {weekDates.map((d, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 700 }}>
                      {d.toLocaleDateString(undefined, { weekday: 'short' })} {d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PERIODS.map((p, rowIdx) => (
                  <TableRow key={p} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{slots[rowIdx]}</TableCell>
                    {DAYS.map((day, colIdx) => (
                      <TableCell key={`${day}-${p}`} align="center">
                        {renderCell(day, p) || (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        })()}
      </Paper>
    </Container>
  );
};

export default StudentTimetable;
