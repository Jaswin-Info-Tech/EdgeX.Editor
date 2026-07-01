import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { getStepSchema } from "../../api/plugin";
import type { RootState } from "../index";

interface PropertiesState {
  cache: Record<string, any>;
  resolvedTypeNames: Record<string, string>;
  loadingTypeName: string | null;
  errorsByTypeName: Record<string, string | null>;
}

const initialState: PropertiesState = {
  cache: {},
  resolvedTypeNames: {},
  loadingTypeName: null,
  errorsByTypeName: {},
};

interface FetchStepSchemaResult {
  stepTypeName: string;
  data: any;
  fromCache: boolean;
}

interface FetchStepSchemaError {
  stepTypeName: string;
  error: string;
}

interface ThunkApiConfig {
  state: RootState;
  rejectValue: FetchStepSchemaError;
}

export const fetchStepSchema = createAsyncThunk<FetchStepSchemaResult, string, ThunkApiConfig>(
  "properties/fetchStepSchema",
  async (stepTypeName, thunkApi) => {
    const state = thunkApi.getState();
    const cached = state.properties.cache[stepTypeName];
    if (cached) {
      return { stepTypeName, data: cached, fromCache: true };
    }
    try {
      const data = await getStepSchema(stepTypeName);
      return { stepTypeName, data, fromCache: false };
    } catch (err) {
      return thunkApi.rejectWithValue({ stepTypeName, error: String(err) });
    }
  }
);

const propertiesSlice = createSlice({
  name: "properties",
  initialState,
  reducers: {
    lockResolvedTypeName: (
      state,
      action: PayloadAction<{ stepId: string; stepTypeName: string }>
    ) => {
      const { stepId, stepTypeName } = action.payload;
      if (!state.resolvedTypeNames[stepId]) {
        state.resolvedTypeNames[stepId] = stepTypeName;
      }
    },
    clearSchemaCache: (state) => {
      state.cache = {};
      state.errorsByTypeName = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStepSchema.pending, (state, action) => {
        state.loadingTypeName = action.meta.arg;
      })
      .addCase(fetchStepSchema.fulfilled, (state, action) => {
        const { stepTypeName, data } = action.payload;
        state.cache[stepTypeName] = data;
        state.errorsByTypeName[stepTypeName] = null;
        state.loadingTypeName = null;
      })
      .addCase(fetchStepSchema.rejected, (state, action) => {
        const payload = action.payload;
        if (payload?.stepTypeName) {
          state.errorsByTypeName[payload.stepTypeName] = payload.error;
        }
        state.loadingTypeName = null;
      });
  },
});

export const { lockResolvedTypeName, clearSchemaCache } = propertiesSlice.actions;
export default propertiesSlice.reducer;