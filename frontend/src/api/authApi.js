import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const login = async (username, password) => {
  const response = await API.post("/auth/login", {
    username,
    password,
  });

  return response.data;
};

export const logout = () => {
  localStorage.removeItem("btc-token");
  localStorage.removeItem("btc-user");
};

export const getToken = () => {
  return localStorage.getItem("btc-token");
};

export const getStoredUser = () => {
  const user = localStorage.getItem("btc-user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};