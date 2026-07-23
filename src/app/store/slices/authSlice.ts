import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    id: number
    name: string
  } | null
  token: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export default authSlice.reducer;
