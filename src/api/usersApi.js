import axiosClient from "./axiosClient";

export const getUsers = () => axiosClient.get("/users/");
export const getUserMe = () => axiosClient.get("/users/me");
export const getUserById = (id) => axiosClient.get(`/users/${id}`);
export const getUsersSinSuper = () => axiosClient.get("/users/sin-supervisor");
export const createUser = (data) => axiosClient.post("/users/", data);
export const updateUser = (id, data) => axiosClient.put(`/users/${id}`, data);
export const changeMyPassword = (password) =>
  axiosClient.put("/users/me/password", { new_password: password });
export const deleteUser = (id) => axiosClient.delete(`/users/${id}`);
