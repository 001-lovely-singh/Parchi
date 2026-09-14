import api from './api';

export const patientService = {
  getGrowth: async () => {
    const response = await api.get('/patient/growth');
    return response.data;
  },
  getTrend: async (analyteKey) => {
    const response = await api.get(`/patient/trend/${analyteKey}`);
    return response.data;
  },
  getBrief: async (analyteKey) => {
    const response = await api.get(`/patient/brief/${analyteKey}`);
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/patient/summary');
    return response.data;
  },
  getSummaryPdf: async () => {
    const response = await api.get('/patient/summary/pdf', { responseType: 'blob' });
    return response.data;
  },
};
