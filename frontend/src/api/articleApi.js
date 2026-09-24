import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

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