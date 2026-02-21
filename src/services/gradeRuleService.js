import api from '@/config/axiosConfig';

const gradeRuleService = {
    getGradeRules: async () => {
        return await api.get('/grade-rules');
    },

    getGradeRuleById: async (id) => {
        return await api.get(`/grade-rules/${id}`);
    },

    createGradeRule: async (data) => {
        return await api.post('/grade-rules', data);
    },

    bulkCreateGradeRules: async (data) => {
        return await api.post('/grade-rules/bulk', data);
    },

    updateGradeRule: async (id, data) => {
        return await api.put(`/grade-rules/${id}`, data);
    },

    deleteGradeRule: async (id) => {
        return await api.delete(`/grade-rules/${id}`);
    },

    calculateGrade: async (percentage) => {
        return await api.get('/grade-rules/calculate', { params: { percentage } });
    }
};

export default gradeRuleService;
