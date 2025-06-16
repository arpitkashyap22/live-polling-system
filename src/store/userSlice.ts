import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  role: 'student' | 'teacher' | null;
  studentId: string | null;
  studentName: string | null;
  isConnected: boolean;
}

const initialState: UserState = {
  role: null,
  studentId: null,
  studentName: null,
  isConnected: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<'student' | 'teacher'>) => {
      state.role = action.payload;
    },
    setStudent: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.studentId = action.payload.id;
      state.studentName = action.payload.name;
      state.role = 'student';
    },
    setTeacher: (state) => {
      state.role = 'teacher';
      state.studentId = null;
      state.studentName = null;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    clearUser: (state) => {
      state.role = null;
      state.studentId = null;
      state.studentName = null;
      state.isConnected = false;
    },
  },
});

export const { setRole, setStudent, setTeacher, setConnected, clearUser } = userSlice.actions;

export default userSlice.reducer;