import { v4 as uuidv4 } from 'uuid';

// In-memory storage (in production, use a database)
let currentPoll = null;
let students = new Map(); // studentId -> { name, socketId, hasAnswered }
let answers = new Map(); // answerId -> { studentId, answer, timestamp }
let pollTimer = null;

// Helper function to get poll results
export function getPollResults() {
  if (!currentPoll) return null;

  const results = {
    pollId: currentPoll.id,
    question: currentPoll.question,
    options: currentPoll.options,
    totalVotes: answers.size,
    totalStudents: students.size,
    votes: {},
    status: currentPoll.status,
    correctAnswer: currentPoll.correctAnswer,
    correctAnswers: 0,
    correctPercentage: 0
  };

  // Initialize vote counts
  currentPoll.options.forEach(option => {
    results.votes[option] = 0;
  });

  // Count votes and track correct answers
  for (const answer of answers.values()) {
    if (results.votes.hasOwnProperty(answer.answer)) {
      results.votes[answer.answer]++;
      if (answer.answer === currentPoll.correctAnswer) {
        results.correctAnswers++;
      }
    }
  }

  // Calculate correct answer percentage
  if (results.totalVotes > 0) {
    results.correctPercentage = Math.round((results.correctAnswers / results.totalVotes) * 100);
  }

  return results;
}

export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Teacher joins
    socket.on('teacher:join', (data, callback) => {
      console.log('Teacher attempting to join...');
      socket.join('teachers');
      socket.emit('poll:current', currentPoll);
      // Send current student list
      const studentList = Array.from(students.entries()).map(([id, student]) => ({
        id,
        name: student.name
      }));
      socket.emit('student:list', studentList);
      console.log('Teacher successfully joined room:', socket.id);
      if (callback) {
        callback({ success: true, message: 'Successfully joined as teacher' });
      }
    });

    // Student joins
    socket.on('student:join', (data, callback) => {
      console.log('Student attempting to join:', data);
      const { studentId, studentName } = data;
      
      if (!studentId || !studentName) {
        console.error('Invalid student data:', data);
        if (callback) {
          callback({ error: 'Invalid student data' });
        }
        return;
      }

      // Store student info
      students.set(studentId, {
        socketId: socket.id,
        name: studentName,
        hasAnswered: false
      });

      console.log('Student registered:', {
        socketId: socket.id,
        studentId,
        studentName
      });

      // Join student room
      socket.join('students');
      
      // Send current poll if exists
      if (currentPoll) {
        console.log('Sending current poll to new student:', currentPoll);
        socket.emit('poll:new', currentPoll);
      }

      // Notify teachers of new student
      io.to('teachers').emit('student:joined', {
        id: socket.id,
        name: studentName
      });

      if (callback) {
        callback({ success: true, message: 'Successfully joined as student' });
      }
    });

    // Create new poll
    socket.on('poll:create', (poll) => {
      console.log('Creating new poll:', poll);
      
      // If there's an active poll, close it first
      if (currentPoll && currentPoll.status === 'active') {
        console.log('Closing previous poll before creating new one');
        currentPoll.status = 'closed';
        const results = getPollResults();
        io.emit('poll:closed', results);
      }

      // Create new poll
      currentPoll = {
        ...poll,
        id: crypto.randomUUID(),
        status: 'active',
        createdAt: new Date().toISOString(),
        answers: new Map(),
        timeLimit: poll.timeLimit,
        correctAnswer: poll.correctAnswer
      };

      // Clear previous answers
      answers.clear();

      console.log('Broadcasting new poll to all clients:', currentPoll);
      io.emit('poll:new', currentPoll);

      // Set timer to close poll after timeLimit seconds
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
      pollTimer = setTimeout(() => {
        if (currentPoll && currentPoll.status === 'active') {
          currentPoll.status = 'closed';
          const results = getPollResults();
          io.emit('poll:closed', results);
        }
      }, poll.timeLimit * 1000); // Convert seconds to milliseconds for setTimeout
    });

    // Teacher kicks a student
    socket.on('teacher:kick', ({ studentId }) => {
      console.log(`Teacher attempting to kick student with ID: ${studentId}`);
      let kickedStudentSocketId = null;
      let kickedStudentName = null;

      // Find the student by their unique ID (studentId) in the students Map
      for (const [sId, studentData] of students.entries()) {
        if (sId === studentId) {
          kickedStudentSocketId = studentData.socketId;
          kickedStudentName = studentData.name;
          break;
        }
      }

      if (kickedStudentSocketId) {
        // Notify the kicked student if they are still connected
        io.to(kickedStudentSocketId).emit('student:kicked');
        
        // Remove student from the list
        students.delete(studentId);
        // Remove their answer if they had submitted one
        answers.delete(studentId);
        
        console.log(`Student ${kickedStudentName} (ID: ${studentId}) was kicked by teacher`);

        // Notify teachers about the updated student list
        const studentList = Array.from(students.entries()).map(([id, student]) => ({ id, name: student.name }));
        io.to('teachers').emit('student:list', studentList);

        // Also send updated poll progress to teachers if a poll is active
        if (currentPoll && currentPoll.status === 'active') {
          const results = getPollResults();
          io.to('teachers').emit('poll:results', results);
        }
      } else {
        console.log(`Student with ID: ${studentId} not found or already disconnected.`);
      }
    });

    // Student submits answer
    socket.on('poll:answer', (data, callback) => {
      console.log('Received answer from student:', data);
      if (!currentPoll || currentPoll.status !== 'active') {
        console.log('No active poll to answer');
        if (callback) {
          callback({ error: 'No active poll to answer' });
        }
        return;
      }

      let studentData = null;
  let studentId = null;
  
  // Find student by socket.id
  for (const [id, student] of students.entries()) {
    if (student.socketId === socket.id) {
      studentData = student;
      studentId = id;
      break;
    }
  }
  
  if (!studentData) {
    callback({ error: 'Student not found' });
    return;
  }
  

      // Store the answer
      // Use studentId as key for answers
  answers.set(studentId, {
    studentId: studentId,
    studentName: studentData.name,
    answer: data.answer,
    isCorrect: data.answer === currentPoll.correctAnswer,
    timestamp: new Date().toISOString()
  });

      console.log('Answer recorded for student:', studentData.name);
      if (callback) {
        callback({ 
          success: true,
          isCorrect: data.answer === currentPoll.correctAnswer
        });
      }

      // Notify teacher of new answer
      io.to('teachers').emit('poll:answer:new', {
        pollId: currentPoll.id,
        studentId: socket.id,
        studentName: studentData.name,
        answer: data.answer,
        isCorrect: data.answer === currentPoll.correctAnswer
      });

      // Send updated results to all clients
      const results = getPollResults();
      io.emit('poll:results', results);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Find and remove student by socket.id
      for (const [studentId, student] of students.entries()) {
        if (student.socketId === socket.id) {
          students.delete(studentId);
          console.log(`Student ${student.name} disconnected`);
          
          // Notify teachers
          io.to('teachers').emit('student:left', {
            id: studentId,
            name: student.name
          });
          break;
        }
      }
    });
  });
}

export function getCurrentPoll() {
  return currentPoll;
} 