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

chatApi.interceptors.response.use(
  (response) => {
    const d = response.data as Record<string, unknown> | null;
    if (
      d?.valido === false &&
      typeof d?.codigoError === 'string' &&
      d.codigoError.startsWith('MO_')
    ) {
      const err = Object.assign(
        new Error(typeof d.detalle === 'string' ? d.detalle : 'Error de moderación'),
        { response: { data: d } },
      );
      return Promise.reject(err);
    }
    return response;
  },
  (error: unknown) => Promise.reject(error),
);

export default chatApi;
