/** Backend origin for /convert. Empty = same origin (Docker/nginx or Vite dev proxy). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
