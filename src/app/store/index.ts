import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import propertiesReducer from "./slices/propertiesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
     properties: propertiesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
