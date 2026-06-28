// api/users.js

import axiosClient from "./client";

export const getSteps = async () => {
  const { data } = await axiosClient.get("/plugins/test-steps");
  return data;
};

export const getInstruments = async () => {
  const { data } = await axiosClient.get("/plugins/instruments");
  return data;
};

export const getStepSchema = async (stepTypeName: string) => {
  const { data } = await axiosClient.get("/testplans/steps/schema", {
    params: {
      stepTypeName,
    },
  });

  return data;
};

export const composeTestPlan = async (payload: any) => {
  const { data } = await axiosClient.post("/testplans/compose", payload);
  return data;
};
