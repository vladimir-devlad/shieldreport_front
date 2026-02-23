import axiosClient from "./axiosClient";

export const getReportes = (params) =>
  axiosClient.get("/reportes/", { params });

export const getReporteById = (id) => axiosClient.get(`/reportes/${id}`);
