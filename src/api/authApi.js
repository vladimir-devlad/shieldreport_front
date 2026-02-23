import axiosClient from "./axiosClient";

export const loginRequest = (username, password) =>
  axiosClient.post("/auth/login", { username, password });
