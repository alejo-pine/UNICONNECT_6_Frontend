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
    const moCode = d?.moderationCode ?? d?.codigoError;
    if (
      d?.valido === false &&
      typeof moCode === 'string' &&
      moCode.startsWith('MO_')
    ) {
      const message =
        typeof d.ruleExplanation === 'string' ? d.ruleExplanation :
        typeof d.detalle === 'string' ? d.detalle :
        'Error de moderación';
      const err = Object.assign(new Error(message), { response: { data: d } });
      return Promise.reject(err);
    }
    return response;
  },
  (error: unknown) => Promise.reject(error),
);

export default chatApi;
