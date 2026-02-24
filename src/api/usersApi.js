import axiosClient from "./axiosClient";

export const getUsers = (params) => axiosClient.get("/users/", { params });
export const getUserMe = () => axiosClient.get("/users/me");
export const getUserById = (id) => axiosClient.get(`/users/${id}`);
export const getUsersSinSuper = (params) =>
  axiosClient.get("/users/sin-supervisor", { params });

export const createUser = (payload) => axiosClient.post("/users/", payload);
export const updateUser = (id, payload) =>
  axiosClient.put(`/users/${id}`, payload);
export const deleteUser = (id) => axiosClient.delete(`/users/${id}`);
export const changePassword = (payload) =>
  axiosClient.put("/users/me/password", payload);
