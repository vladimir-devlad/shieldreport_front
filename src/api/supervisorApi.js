import axiosClient from "./axiosClient";

export const agregarUsuario = (supervisor_id, user_id) =>
  axiosClient.post("/supervisor/agregar-usuario", { supervisor_id, user_id });

export const removerUsuario = (supervisor_id, user_id) =>
  axiosClient.delete("/supervisor/remover-usuario", {
    data: { supervisor_id, user_id },
  });
