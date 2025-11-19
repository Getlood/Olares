import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // GitHub
  analyzeGitHub: (repoUrl, branch = 'main') =>
    axios.post(`${API_BASE}/github/analyze`, { repoUrl, branch }),

  // Generation
  generateFiles: (config) =>
    axios.post(`${API_BASE}/generate`, config),

  validateConfig: (config) =>
    axios.post(`${API_BASE}/generate/validate`, config),

  packageChart: (config) =>
    axios.post(`${API_BASE}/generate/package`, config, {
      responseType: 'blob'
    }),

  // Projects
  listProjects: () =>
    axios.get(`${API_BASE}/projects`),

  getProject: (id) =>
    axios.get(`${API_BASE}/projects/${id}`),

  saveProject: (config) =>
    axios.post(`${API_BASE}/projects`, config),

  updateProject: (id, config) =>
    axios.put(`${API_BASE}/projects/${id}`, config),

  deleteProject: (id) =>
    axios.delete(`${API_BASE}/projects/${id}`),

  importProject: (config) =>
    axios.post(`${API_BASE}/projects/import`, config),

  // Templates
  listTemplates: () =>
    axios.get(`${API_BASE}/templates`),

  getTemplate: (id) =>
    axios.get(`${API_BASE}/templates/${id}`),
};

export default api;
