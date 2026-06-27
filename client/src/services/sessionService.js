import api from './api';

export const createSession = async (sessionData) => {
  const response = await api.post('/sessions', sessionData);
  return response.data;
};

export const getUserSessions = async () => {
  const response = await api.get('/sessions');
  return response.data;
};

export const getSessionDetails = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const saveDraftAnswers = async (sessionId, answers) => {
  const response = await api.put(`/sessions/${sessionId}/answers`, { answers });
  return response.data;
};

export const submitInterview = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/submit`);
  return response.data;
};
