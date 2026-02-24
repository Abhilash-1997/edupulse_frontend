import { PageHeader } from "@/components/common";
import { academicService, examService, studentService } from "@/services";
import {
  addToast,
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
} from "@heroui/react";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function ReportCard() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoadingClasses(true);
    try {
      const [classRes, examRes] = await Promise.all([
        academicService.getAllClasses(),
        examService.getExams(),
      ]);

      if (classRes.data?.success) {
        setClasses(classRes.data.data || []);
      }

      if (examRes.data?.success) {
        setExams(examRes.data.data || []);
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load initial data",
        color: "danger",
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  // =========================
  // FETCH SECTIONS
  // =========================
  useEffect(() => {
    if (!selectedClass) {
      setSections([]);
      setSelectedSection("");
      setStudents([]);
      setSelectedStudent("");
      return;
    }

    fetchSections(selectedClass);
  }, [selectedClass]);

  const fetchSections = async (classId) => {
    setLoadingSections(true);
    try {
      const res = await academicService.getStandardDivisons(classId);

      if (res.data?.success) {
        setSections(res.data.data || []);
      } else {
        setSections([]);
      }

      setSelectedSection("");
      setStudents([]);
      setSelectedStudent("");
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load sections",
        color: "danger",
      });
    } finally {
      setLoadingSections(false);
    }
  };

  // =========================
  // FETCH STUDENTS
  // =========================
  useEffect(() => {
    if (!selectedSection) {
      setStudents([]);
      setSelectedStudent("");
      return;
    }

    fetchStudents(selectedSection);
  }, [selectedSection]);

  const fetchStudents = async (sectionId) => {
    setLoadingStudents(true);
    try {
      const res = await studentService.getAllStudents({ sectionId });

      if (res.data?.success) {
        setStudents(res.data.data || []);
      } else {
        setStudents([]);
      }

      setSelectedStudent("");
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load students",
        color: "danger",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  // =========================
  // DOWNLOAD REPORT CARD
  // =========================
  const handleDownload = async () => {
    if (!selectedStudent || !selectedExam) return;

    setDownloading(true);
    try {
      const response = await examService.downloadReportCard({
        studentId: selectedStudent,
        examId: selectedExam,
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: "application/pdf",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        const studentName =
          students.find((s) => s.id === selectedStudent)?.name || "Student";

        const examName =
          exams.find((e) => e.id === selectedExam)?.name || "Exam";

        link.href = url;
        link.download = `ReportCard_${studentName}_${examName}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        addToast({
          title: "Success",
          description: "Report card downloaded successfully",
          color: "success",
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to download report card",
        color: "danger",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <PageHeader
        title="Download Report Card"
        subtitle="Select class, section, exam and student"
      />

      <Card className="shadow-sm bg-content1 border border-default-200">
        <CardBody className="p-6 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* CLASS */}
            <Select
              label="Select Class"
              selectedKeys={
                selectedClass ? new Set([selectedClass]) : new Set()
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setSelectedClass(value ?? "");
              }}
              isLoading={loadingClasses}
              variant="bordered"
              labelPlacement="outside"
            >
              {classes.map((cls) => (
                <SelectItem key={String(cls.id)}>{cls.name}</SelectItem>
              ))}
            </Select>

            {/* SECTION */}
            <Select
              label="Select Section"
              selectedKeys={
                selectedSection ? new Set([selectedSection]) : new Set()
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setSelectedSection(value ?? "");
              }}
              isLoading={loadingSections}
              isDisabled={!selectedClass}
              variant="bordered"
              labelPlacement="outside"
            >
              {sections.map((section) => (
                <SelectItem key={String(section.id)}>{section.name}</SelectItem>
              ))}
            </Select>

            {/* EXAM */}
            <Select
              label="Select Exam"
              selectedKeys={selectedExam ? new Set([selectedExam]) : new Set()}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setSelectedExam(value ?? "");
              }}
              variant="bordered"
              labelPlacement="outside"
            >
              {exams.map((exam) => (
                <SelectItem key={String(exam.id)}>{exam.name}</SelectItem>
              ))}
            </Select>

            {/* STUDENT */}
            <Select
              label="Select Student"
              selectedKeys={
                selectedStudent ? new Set([selectedStudent]) : new Set()
              }
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setSelectedStudent(value ?? "");
              }}
              isLoading={loadingStudents}
              isDisabled={!selectedSection}
              variant="bordered"
              labelPlacement="outside"
            >
              {students.map((student) => (
                <SelectItem
                  key={student.id}
                  textValue={`${student.name} (${student.admissionNumber})`}
                >
                  {student.name} ({student.admissionNumber})
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              color="primary"
              onPress={handleDownload}
              isLoading={downloading}
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
