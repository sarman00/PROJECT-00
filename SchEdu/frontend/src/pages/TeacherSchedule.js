import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  useTheme,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EventNoteIcon from '@mui/icons-material/EventNote';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PERIODS = [1, 2, 3, 4, 5, 6];

// Helpers: week day dates and time slots (same as student view)
function getCurrentWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 5; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); days.push(d); }
  return days;
}
function fmtHM(h, m) { return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
function addMinutes(h, m, add) { const t = h*60+m+add; return [Math.floor(t/60)%24, t%60]; }
function buildTimeSlots(periodCount, startHour=9, startMinute=0, periodMinutes=50, breakMinutes=10) {
  const slots = []; let h=startHour, m=startMinute;
  for (let i=0;i<periodCount;i++){ const [eh,em]=addMinutes(h,m,periodMinutes); slots.push(`${fmtHM(h,m)} – ${fmtHM(eh,em)}`); [h,m]=addMinutes(eh,em,breakMinutes);} return slots;
}

const TeacherSchedule = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [overrideTeacherId, setOverrideTeacherId] = useState('');

  const isDev = (process.env.NODE_ENV !== 'production') || process.env.REACT_APP_DEV_TOOLS === '1';

  const loadForTeacher = async (teacherId) => {
    const [ttRes, quotaRes] = await Promise.all([
      fetch(`${API}/timetables/teacher/${teacherId}`),
      fetch(`${API}/leaves/quota/${teacherId}`),
    ]);
    try {
      const [tt, quotaData] = await Promise.all([ttRes.json(), quotaRes.json()]);
      if (!tt || !tt.schedule) {
        setSchedule({});
      } else {
        setSchedule(tt.schedule);
      }
      setQuota(quotaData);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setSchedule({});
      setQuota(null);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) { setLoading(false); return; }
    const init = async () => {
      if (isDev) {
        // load a small list of teachers for dev picker
        try {
          const res = await fetch(`${API}/users`);
          const all = await res.json();
          setTeachers(all.filter(u => u.role === 'teacher'));
        } catch (_) {}
      }
      await loadForTeacher(overrideTeacherId || userId);
      setLoading(false);
    };
    init().catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;
    if (overrideTeacherId) {
      loadForTeacher(overrideTeacherId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideTeacherId]);

  const isEmpty = useMemo(() => {
    if (!schedule) return true;
    return DAYS.every(d => (schedule[d] || []).length === 0);
  }, [schedule]);

  const renderCell = (day, period) => {
    const dayArr = schedule?.[day] || [];
    const sess = dayArr.find((s) => s.period === period);
    if (!sess) return null;
    return (
      <>
        <Chip label={sess.subject_name} size="small" variant="outlined" sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main }} />
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{sess.class_name}{sess.room ? ` • ${sess.room}` : ''}</Typography>
      </>
    );
  };

  return (
    <Container sx={{ mt: 6, mb: 6 }}>
      <PageHeader
        role="teacher"
        icon={<EventNoteIcon sx={{ fontSize: 40 }} />}
        title="Teacher Schedule"
        subtitle="Your weekly periods across classes"
        action={(
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {quota && (
              <Typography variant="subtitle2" color="text.secondary">
                Remaining leave days: {quota.remaining}/{quota.limit}
              </Typography>
            )}
            {isDev && teachers.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="teacher-picker-label">Preview teacher</InputLabel>
                <Select
                  labelId="teacher-picker-label"
                  label="Preview teacher"
                  value={overrideTeacherId}
                  onChange={(e) => setOverrideTeacherId(e.target.value)}
                >
                  <MenuItem value="">(Logged-in)</MenuItem>
                  {teachers.map(t => (
                    <MenuItem key={t.id} value={String(t.id)}>{`${t.first_name || ''} ${t.last_name || ''}`.trim()} — #{t.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button variant="contained" color="secondary" onClick={() => navigate('/teacher/leave')}>
              Apply Leave
            </Button>
          </Box>
        )}
      />

      {isEmpty && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have no assigned classes in the current timetable. If this is unexpected, ask an admin to regenerate timetables or try a different teacher via the preview picker (dev only).
        </Alert>
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
                    {DAYS.map((day) => (
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

export default TeacherSchedule;
