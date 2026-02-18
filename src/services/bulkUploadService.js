import api from '@/config/axiosConfig';

const uploadFile = async (url, file, setProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setProgress(percentCompleted);
            },
        });
        return response;
    } catch (error) {
        return error.response;
    }
};

const uploadStudents = (file, setProgress) => uploadFile('/bulk-upload/students', file, setProgress);
const uploadAttendance = (file, setProgress) => uploadFile('/bulk-upload/attendance', file, setProgress);
const uploadExams = (file, setProgress) => uploadFile('/bulk-upload/exams', file, setProgress);
const uploadResults = (file, setProgress) => uploadFile('/bulk-upload/results', file, setProgress);
const uploadLibrarySections = (file, setProgress) => uploadFile('/bulk-upload/library-sections', file, setProgress);
const uploadBooks = (file, setProgress) => uploadFile('/bulk-upload/books', file, setProgress);

const bulkUploadService = {
    uploadStudents,
    uploadAttendance,
    uploadExams,
    uploadResults,
    uploadLibrarySections,
    uploadBooks
};

export default bulkUploadService;
