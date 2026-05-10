import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const ticketApi = {
    // Tickets
    getAll: () => api.get('tickets/'),
    getDetails: (id) => api.get(`tickets/${id}`),
    create: (data) => api.post('tickets/', data),
    update: (id, data) => api.patch(`tickets/${id}`, data),
    addComment: (id, comment) => api.post(`tickets/${id}/comments/`, comment),
    deleteComment: (ticketId, commentId) => api.delete(`tickets/${ticketId}/comments/${commentId}`),
    getAuditLog: (id) => api.get(`tickets/${id}/audit`),
    
    // Auth
    login: (username, password) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        return api.post('auth/login', params);
    },
    getMe: () => api.get('auth/me'),
    
    // Upload
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('upload', formData);
    },

    // Users
    getUsers: () => api.get('users/'),
    createUser: (userData) => api.post('users/', userData),
    updateUser: (userId, userData) => api.patch(`users/${userId}`, userData),

    // Departments
    getDepartments: () => api.get('departments/'),
    createDepartment: (data) => api.post('departments/', data),
    deleteDepartment: (id) => api.delete(`departments/${id}`),

    // Analytics
    getAnalyticsSummary: () => api.get('analytics/summary'),
    getAgentPerformance: () => api.get('analytics/performance'),
    getGlobalAudit: (params) => api.get('analytics/audit-logs', { params }),
    downloadReportPdf: () => api.get('analytics/report/pdf', { responseType: 'blob' }),
};

export default api;
