import { createSlice } from '@reduxjs/toolkit';

const parseJSON = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return value;
  }
};

const initialState = {
  user: {
    name: parseJSON(localStorage.getItem('name')) || 'Test User',
    group: parseJSON(localStorage.getItem('group')) || 'user',
  },
  session_id: parseJSON(localStorage.getItem('session_id')) || null,
  token: parseJSON(localStorage.getItem('token')) || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
    storeSessionId: (state, action) => {
      state.session_id = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    removeToken: (state) => {
      state.token = null;
    },
  },
});

export const { login, logout, setToken, removeToken, storeSessionId } =
  authSlice.actions;
export default authSlice.reducer;
