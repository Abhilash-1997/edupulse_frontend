import api from "../config/axiosConfig";

// TODO: No SchoolController exists in the Spring Boot backend yet.
// These endpoints will return 404 until the backend is implemented.
// Backend needs: GET /school, POST /school/upload-logo
const schoolService = {
    getSchoolDetails: async () => {
        try {
            const response = await api.get("/school");
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    uploadLogo: async (formData) => {
        try {
            const response = await api.post("/school/upload-logo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
};

export default schoolService;
