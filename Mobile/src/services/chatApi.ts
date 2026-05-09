import axios from "axios";
import { getChatServiceUrl } from "../config/api";
import { useAuthStore } from "../store/authStore";

const chatApi = axios.create({
  baseURL: getChatServiceUrl(),
});

chatApi.interceptors.request.use((config) => {
  const userId = useAuthStore.getState().userId;
  if (userId) {
    config.headers["x-user-id"] = userId;
  }
  return config;
});

export default chatApi;
