import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { setStudent } from './store/userSlice';
import { socketService } from './services/socket';

// Pages
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';

// Components
import { StudentNameForm } from './components/StudentNameForm';

function App() {
  const dispatch = useDispatch();
  const { role, studentId, studentName } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // Check if student data exists in sessionStorage
    const savedStudentId = sessionStorage.getItem('studentId');
    const savedStudentName = sessionStorage.getItem('studentName');
    
    if (savedStudentId && savedStudentName) {
      dispatch(setStudent({ id: savedStudentId, name: savedStudentName }));
      // Connect to socket and join as student
      socketService.connect();
      socketService.joinAsStudent(savedStudentId, savedStudentName);
    }
  }, [dispatch]);

  useEffect(() => {
    // Connect to socket when role is set
    if (role && !socketService) {
      socketService.connect();
    }

    return () => {
      // Cleanup on unmount
      if (socketService) {
        socketService.disconnect();
      }
    };
  }, [role]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/student" 
          element={
            role === 'student' && studentName ? (
              <StudentPage />
            ) : role === 'student' && !studentName ? (
              <StudentNameForm onSubmit={(name) => {
                const newStudentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('studentId', newStudentId);
                sessionStorage.setItem('studentName', name);
                dispatch(setStudent({ id: newStudentId, name }));
                socketService.connect();
                socketService.joinAsStudent(newStudentId, name);
              }} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/teacher" 
          element={
            role === 'teacher' ? (
              <TeacherPage />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;