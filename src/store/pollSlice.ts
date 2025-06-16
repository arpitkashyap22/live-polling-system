import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Poll {
  id: string;
  question: string;
  options: string[];
  status: 'active' | 'closed';
  createdAt: string;
  timeLimit: number;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  totalVotes: number;
  totalStudents: number;
  votes: Record<string, number>;
  status: 'active' | 'closed';
}

interface PollState {
  currentPoll: Poll | null;
  results: PollResults | null;
  timeRemaining: number;
  hasAnswered: boolean;
  userAnswer: string | null;
  isAnswerCorrect: boolean | undefined;
  error: string | null;
}

const initialState: PollState = {
  currentPoll: null,
  results: null,
  timeRemaining: 0,
  hasAnswered: false,
  userAnswer: null,
  isAnswerCorrect: undefined,
  error: null,
};

const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    setPoll: (state, action: PayloadAction<Poll | null>) => {
      state.currentPoll = action.payload;
      state.hasAnswered = false;
      state.userAnswer = null;
      state.error = null;
      if (action.payload) {
        state.timeRemaining = action.payload.timeLimit; // timeLimit is already in seconds
      }
    },
    setResults: (state, action: PayloadAction<PollResults>) => {
      state.results = action.payload;
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    setHasAnswered: (state, action: PayloadAction<boolean>) => {
      state.hasAnswered = action.payload;
    },
    setUserAnswer: (state, action: PayloadAction<string>) => {
      state.userAnswer = action.payload;
      state.hasAnswered = true;
    },
    setAnswerCorrect: (state, action: PayloadAction<boolean>) => {
      state.isAnswerCorrect = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPoll: (state) => {
      state.currentPoll = null;
      state.results = null;
      state.hasAnswered = false;
      state.userAnswer = null;
      state.timeRemaining = 0;
      state.error = null;
    },
  },
});

export const {
  setPoll,
  setResults,
  setTimeRemaining,
  setHasAnswered,
  setUserAnswer,
  setAnswerCorrect,
  setError,
  clearPoll,
} = pollSlice.actions;

export default pollSlice.reducer;