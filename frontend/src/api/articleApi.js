import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("btc-token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("btc-token");
      localStorage.removeItem("btc-user");

      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const getArticles = async () => {
  const response = await API.get("/articles");
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await API.get(`/articles/${id}`);
  return response.data;
};

export const getArticleBySlug = async (slug) => {
  const response = await API.get(`/articles/slug/${slug}`);
  return response.data;
};

export const createArticle = async (article) => {
  const response = await API.post("/articles", article);
  return response.data;
};

export const updateArticle = async (id, article) => {
  const response = await API.put(`/articles/${id}`, article);
  return response.data;
};

export const deleteArticle = async (id) => {
  await API.delete(`/articles/${id}`);
};