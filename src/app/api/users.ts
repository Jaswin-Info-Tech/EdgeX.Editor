// api/users.js

import axiosClient from "./client";

export const getUsers = async () => {
  const { data } = await axiosClient.get("/users");
  return data;
};