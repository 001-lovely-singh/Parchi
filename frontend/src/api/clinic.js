import api from './api';

export const clinicService = {
  getPatients: async () => {
    const response = await api.get('/clinic/patients');
    return response.data;
  },
};
