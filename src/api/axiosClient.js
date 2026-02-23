import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});
// INTERCEPTOR DE REQUEST
// Antes de cada request, lee el token del localStorage y lo agrega al header
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// INTERCEPTOR DE RESPONSE
// Si el servidor devuelve 401 (token expirado o inválido),
// limpiamos la sesión y redirigimos al login automáticamente
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirección dura
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
