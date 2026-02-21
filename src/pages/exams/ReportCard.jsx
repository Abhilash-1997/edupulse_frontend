import { PageHeader } from '@/components/common';
import { academicService, examService, studentService } from '@/services';
import { addToast, Button, Card, CardBody, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';

export default function ReportCard() {

    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [exams, setExams] = useState([]);
    const [students, setStudents] = useState([]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const selected = classes.find(c => c.id === selectedClass);
            setSections(selected?.sections || []);
            setSelectedSection('');
            setStudents([]);
            setSelectedStudent('');
        } else {
            setSections([]);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedSection) {
            fetchStudents(selectedSection);
        } else {
            setStudents([]);
        }
    }, [selectedSection]);

    const fetchInitialData = async () => {
        try {
            const [classRes, examRes] = await Promise.all([
                academicService.getAllClasses(),
                examService.getExams()
            ]);

            if (classRes.data?.success)
                setClasses(classRes.data?.data || []);

            if (examRes.data?.success)
                setExams(examRes.data?.data || []);

        } catch (error) {
            addToast({ title: "Error", description: "Failed to load options", color: "danger" });
        }
    };

    const fetchStudents = async (sectionId) => {
        try {
            const res = await studentService.getAllStudents({ sectionId });
            if (res.data?.success) {
                setStudents(res.data?.data || []);
            }
        } catch (error) {}
    };

    const handleDownload = async () => {
        if (!selectedStudent || !selectedExam) return;

        setLoading(true);
        try {
            const response = await examService.downloadReportCard({
                studentId: selectedStudent,
                examId: selectedExam
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const studentName = students.find(s => s.id === selectedStudent)?.name || 'Student';
                const examName = exams.find(e => e.id === selectedExam)?.name || 'Exam';

                link.setAttribute('download', `ReportCard_${studentName}_${examName}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                addToast({ title: "Success", description: "Report card downloaded", color: "success" });
            }
        } catch (error) {
            addToast({ title: "Error", description: "Failed to download", color: "danger" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div className="p-6 space-y-6">

            <PageHeader
                title="Download Report Card"
                subtitle="Select details to generate report"
            />

            <Card className="shadow-sm bg-content1 border border-default-200">
                <CardBody className="p-6 gap-6">

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Class */}
                        <Select
                            label="Select Class"
                            selectedKeys={selectedClass ? [selectedClass] : []}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            variant="bordered"
                            labelPlacement="outside"
                        >
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Section */}
                        <Select
                            label="Select Section"
                            selectedKeys={selectedSection ? [selectedSection] : []}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            variant="bordered"
                            labelPlacement="outside"
                            isDisabled={!selectedClass}
                        >
                            {sections.map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                    {section.name}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Exam */}
                        <Select
                            label="Select Exam"
                            selectedKeys={selectedExam ? [selectedExam] : []}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            variant="bordered"
                            labelPlacement="outside"
                        >
                            {exams.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id}>
                                    {exam.name}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Student */}
                        <Select
                            label="Select Student"
                            selectedKeys={selectedStudent ? [selectedStudent] : []}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            variant="bordered"
                            labelPlacement="outside"
                            isDisabled={!selectedSection}
                        >
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                    {`${student.name} (${student.admissionNumber})`}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button
                            color="primary"
                            onPress={handleDownload}
                            isLoading={loading}
                            isDisabled={!selectedStudent || !selectedExam}
                        >
                            Generate & Download PDF
                        </Button>
                    </div>

                </CardBody>
            </Card>

        </motion.div>
    );
}   

