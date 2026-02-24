import axiosClient from "./axiosClient";

export const getRoles = () => axiosClient.get("/roles/");
export const getRoleById = (id) => axiosClient.get(`/roles/${id}`);
