import api from "./api";

export const getUsers = () => api.get("/users");
export const getUserStats = () => api.get("/users/stats");
export const getLockedUsers = () => api.get("/users/locked");
