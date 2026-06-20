const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Test accounts
const ADMIN = { email: 'admin@example.com', password: 'admin123' };
const STUDENT = { email: 'john.student@example.com', password: 'pass123' };
const TEACHER = { email: 'alice.teacher@example.com', password: 'pass123' };

async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    console.error(`Login failed for ${credentials.email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testStudentTimetable() {
  console.log('\n=== Testing Student Timetable ===');
  
  // Login as student
  const studentAuth = await login(STUDENT);
  if (!studentAuth) {
    console.log('❌ Student login failed');
    return false;
  }
  
  console.log(`✅ Student logged in (ID: ${studentAuth.id})`);
  
  // Try to fetch timetable
  try {
    const response = await axios.get(`${API_URL}/timetables/student/${studentAuth.id}`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` }
    });
    
    if (response.data && response.data.schedule) {
      console.log('✅ Student timetable fetched successfully');
      console.log(`   Class: ${response.data.class_name}`);
      console.log(`   Has schedule: ${Object.keys(response.data.schedule).length > 0 ? 'Yes' : 'No'}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Failed to fetch student timetable:', error.response?.data || error.message);
    return false;
  }
}

async function testTeacherTimetable() {
  console.log('\n=== Testing Teacher Timetable ===');
  
  // Login as teacher
  const teacherAuth = await login(TEACHER);
  if (!teacherAuth) {
    console.log('❌ Teacher login failed');
    return false;
  }
  
  console.log(`✅ Teacher logged in (ID: ${teacherAuth.id})`);
  
  // Try to fetch timetable
  try {
    const response = await axios.get(`${API_URL}/timetables/teacher/${teacherAuth.id}`, {
      headers: { Authorization: `Bearer ${teacherAuth.token}` }
    });
    
    if (response.data && response.data.schedule) {
      console.log('✅ Teacher timetable fetched successfully');
      let totalSessions = 0;
      for (const day in response.data.schedule) {
        totalSessions += response.data.schedule[day].length;
      }
      console.log(`   Total sessions: ${totalSessions}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Failed to fetch teacher timetable:', error.response?.data || error.message);
    return false;
  }
}

async function generateTimetables() {
  console.log('\n=== Generating Timetables ===');
  
  // Login as admin
  const adminAuth = await login(ADMIN);
  if (!adminAuth) {
    console.log('❌ Admin login failed');
    return false;
  }
  
  console.log(`✅ Admin logged in`);
  
  // Generate timetables
  try {
    const response = await axios.post(`${API_URL}/timetables/generate-all`, {}, {
      headers: { Authorization: `Bearer ${adminAuth.token}` }
    });
    
    console.log('✅ Timetables generated successfully');
    console.log(`   Classes: ${response.data.classesWithTimetables}`);
    console.log(`   Sessions created: ${response.data.totalSessions}`);
    return true;
  } catch (error) {
    console.log('❌ Failed to generate timetables:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('=================================');
  console.log('TIMETABLE VISIBILITY TEST');
  console.log('=================================');
  
  // First generate timetables
  await generateTimetables();
  
  // Test student access
  const studentResult = await testStudentTimetable();
  
  // Test teacher access
  const teacherResult = await testTeacherTimetable();
  
  console.log('\n=== RESULTS ===');
  console.log(`Student Timetable: ${studentResult ? '✅ WORKING' : '❌ NOT WORKING'}`);
  console.log(`Teacher Timetable: ${teacherResult ? '✅ WORKING' : '❌ NOT WORKING'}`);
  
  if (!studentResult || !teacherResult) {
    console.log('\n⚠️  Some timetables are not visible. Checking backend routes...');
    
    // Check if routes exist
    try {
      const routesResponse = await axios.get(`${API_URL}-docs`);
      console.log('API documentation available at http://localhost:3001/api-docs');
    } catch (error) {
      console.log('Note: API documentation not available');
    }
  }
}

// Run the tests
runTests().catch(console.error);
