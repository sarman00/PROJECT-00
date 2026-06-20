import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';

import AdminDashboard from './pages/AdminDashboard';
import AdminSchedule from './pages/AdminSchedule';
import AdminNotifications from './pages/AdminNotifications';
import AdminProfile from './pages/AdminProfile';

import TeacherDashboard from './pages/TeacherDashboard';
import TeacherSchedule from './pages/TeacherSchedule';
import TeacherNotifications from './pages/TeacherNotifications';
import TeacherProfile from './pages/TeacherProfile';
import TeacherLeave from './pages/TeacherLeave';
import TeacherLeaveHistory from './pages/TeacherLeaveHistory';

import StudentDashboard from './pages/StudentDashboard';
import StudentTimetable from './pages/StudentTimetable';
import StudentNotifications from './pages/StudentNotifications';
import StudentProfile from './pages/StudentProfile';

import ProtectedRoute from './components/ProtectedRoute';
import { getRole } from './services/authService';

function App() {
  // State to hold user role after login/token parse
  const [userRole, setUserRole] = useState(null);

  // On mount, try to get role from localStorage (set after login)
  useEffect(() => {
    const role = getRole(); // get role from authService/localStorage
    if (role) {
      setUserRole(role);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login setUserRole={setUserRole} />} />

        {/* Admin routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['admin']}>
              <AdminSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['admin']}>
              <AdminNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/schedule"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/notifications"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/leave"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/leave/history"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['teacher']}>
              <TeacherLeaveHistory />
            </ProtectedRoute>
          }
        />

        {/* Student routes */}
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/timetable"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['student']}>
              <StudentTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['student']}>
              <StudentNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Default fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
