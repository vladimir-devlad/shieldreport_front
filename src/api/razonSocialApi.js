import axiosClient from "./axiosClient";

export const getRazonesSociales = () => axiosClient.get("/razon-social/");
export const getRazonSocialByUser = (id) =>
  axiosClient.get(`/razon-social/user/${id}`);
export const createRazonSocial = (data) =>
  axiosClient.post("/razon-social/", data);
export const updateRazonSocial = (id, data) =>
  axiosClient.put(`/razon-social/${id}`, data);
export const toggleRazonSocial = (id) =>
  axiosClient.patch(`/razon-social/${id}/toggle`);
export const deleteRazonSocial = (id) =>
  axiosClient.delete(`/razon-social/${id}`);
export const assignRazonSocial = (data) =>
  axiosClient.post("/razon-social/assign", data);
// export const removeRazonSocial = (user_id, razon_social_id) =>
// axiosClient.delete(`/razon-social/assign/${user_id}/${razon_social_id}`);

export const removeRazonSocial = (userId, rsId) =>
  axiosClient.delete(`/razon-social/assign/${userId}/${rsId}`);
