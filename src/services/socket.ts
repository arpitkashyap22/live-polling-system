import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { setPoll, setResults, setError, setTimeRemaining, setHasAnswered } from '../store/pollSlice';
import { setConnected } from '../store/userSlice';

export class SocketService {
  private socket: Socket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private isConnectedState = false;

  getSocket() {
    return this.socket;
  }

  connect() {
    const SOCKET_URL = 'http://localhost:3001';
    console.log('Connecting to socket server at:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server with socket ID:', this.socket?.id);
      store.dispatch(setConnected(true));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      store.dispatch(setConnected(false));
    });

    this.socket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      store.dispatch(setConnected(false));
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect:', attemptNumber);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      store.dispatch(setConnected(true));
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      store.dispatch(setConnected(false));
    });

    this.socket.on('poll:new', (poll) => {
      console.log('New poll received:', poll);
      store.dispatch(setPoll(poll));
      this.startTimer(poll.timeLimit);
    });

    this.socket.on('poll:current', (poll) => {
      if (poll) {
        console.log('Current poll:', poll);
        store.dispatch(setPoll(poll));
        
        // Calculate remaining time
        const elapsed = Date.now() - new Date(poll.createdAt).getTime();
        const remaining = Math.max(0, (poll.timeLimit - elapsed) / 1000);
        
        if (remaining > 0 && poll.status === 'active') {
          this.startTimer(remaining);
        }
      }
    });

    this.socket.on('poll:results', (results) => {
      console.log('Poll results:', results);
      store.dispatch(setResults(results));
    });

    this.socket.on('poll:closed', (results) => {
      console.log('Poll closed:', results);
      store.dispatch(setResults(results));
      this.clearTimer();
    });

    this.socket.on('poll:error', (error) => {
      console.error('Poll error:', error);
      store.dispatch(setError(error));
    });

    return this.socket;
  }

  private startTimer(seconds: number) {
    this.clearTimer();
    store.dispatch(setTimeRemaining(Math.floor(seconds)));

    this.timer = setInterval(() => {
      const state = store.getState();
      const remaining = state.poll.timeRemaining - 1;
      
      if (remaining <= 0) {
        this.clearTimer();
        store.dispatch(setTimeRemaining(0));
        // Request final results when timer ends
        if (this.socket) {
          this.socket.emit('poll:getResults');
        }
      } else {
        store.dispatch(setTimeRemaining(remaining));
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  joinAsTeacher() {
    if (this.socket) {
      console.log('Attempting to join as teacher...');
      if (!this.socket.connected) {
        console.log('Socket not connected, reconnecting...');
        this.socket.connect();
      }
      this.socket.emit('teacher:join', {}, (response: any) => {
        console.log('Teacher join response:', response);
      });
    } else {
      console.error('Socket not initialized');
    }
  }

  joinAsStudent(studentId: string, studentName: string) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Joining as student:', { studentId, studentName });
    this.socket.emit('student:join', { studentId, studentName }, (response: { success?: boolean; error?: string }) => {
      if (response?.error) {
        console.error('Student join error:', response.error);
        return;
      }
      console.log('Successfully joined as student');
    });
  }

  createPoll(poll: { question: string; options: string[]; timeLimit: number }) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Creating poll:', poll);
    this.socket.emit('poll:create', poll);
  }

  submitAnswer(answer: string) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Submitting answer:', answer);
    this.socket.emit('poll:answer', { answer }, (response: { success?: boolean; error?: string }) => {
      if (response?.error) {
        console.error('Poll error:', response.error);
        store.dispatch(setError(response.error));
        return;
      }
      if (response?.success) {
        console.log('Answer submitted successfully');
        store.dispatch(setHasAnswered(true));
      }
    });
  }

  onPollError(callback: (error: { message: string }) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on('poll:error', (error) => {
      console.error('Poll error:', error);
      callback(error);
    });
  }

  onAnswerReceived(callback: (response: { success: boolean }) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on('poll:answer:received', (response) => {
      console.log('Answer received response:', response);
      callback(response);
    });
  }

  onNewAnswer(callback: (data: { pollId: string; studentId: string; studentName: string; answer: string }) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on('poll:answer:new', (data) => {
      console.log('New answer received:', data);
      callback(data);
    });
  }

  kickStudent(studentId: string) {
    if (this.socket) {
      this.socket.emit('teacher:kick', { studentId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.clearTimer();
  }

  onPollClosed(callback: (results: {
    pollId: string;
    question: string;
    options: string[];
    totalVotes: number;
    totalStudents: number;
    results: Record<string, number>;
  }) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on('poll:closed', (results) => {
      console.log('Poll closed:', results);
      callback(results);
    });
  }

  onNewPoll(callback: (poll: {
    id: string;
    question: string;
    options: string[];
    status: 'active' | 'closed';
    createdAt: string;
    timeLimit?: number;
  }) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    this.socket.on('poll:new', (poll) => {
      console.log('New poll:', poll);
      callback(poll);
    });
  }

  isConnected(): boolean {
    return this.isConnectedState;
  }

  onStudentListUpdate(callback: (list: string[]) => void): void {
    this.socket?.on('student:list', callback);
  }
}

export const socketService = new SocketService();