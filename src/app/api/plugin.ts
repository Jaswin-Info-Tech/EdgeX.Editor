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

export const getDuts = async () => {
  const { data } = await axiosClient.get("/plugins/duts");
  return data;
};