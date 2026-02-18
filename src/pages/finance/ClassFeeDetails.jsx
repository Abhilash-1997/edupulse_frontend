import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Chip,
    Input,
    Select,
    SelectItem,
    Spinner,
    addToast
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { financeService } from '@/services';
import { format } from 'date-fns';
import { motion } from "framer-motion";

export default function ClassFeeDetails() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchClassFeeStatus();
    }, [classId]);

    const fetchClassFeeStatus = async () => {
        try {
            setIsLoading(true);
            const response = await financeService.getClassFeeStatus(classId);
            if (response.data?.success) {
                setStudents(response.data.data || []);
            } else {
                addToast({
                    title: 'Error',
                    description: 'Failed to load fee details',
                    color: 'danger',
                });
            }
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to load fee details',
                color: 'danger',
            });
        } finally {
            setIsLoading(false);
        }
    };
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'success';
            case 'PARTIAL': return 'warning';
            case 'PENDING': return 'danger';
            default: return 'default';
        }
    };

    // 🔥 Filtered Students
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesStatus =
                filterStatus === 'ALL' || student.status === filterStatus;

            const matchesSearch =
                !searchQuery ||
                student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [students, filterStatus, searchQuery]);

    // 🔥 Summary Stats
    const stats = useMemo(() => ({
        total: students.length,
        paid: students.filter(s => s.status === 'PAID').length,
        partial: students.filter(s => s.status === 'PARTIAL').length,
        pending: students.filter(s => s.status === 'PENDING').length
    }), [students]);

    const className = students?.[0]?.className || 'Class';
    const feePerStudent = students?.[0]?.totalFeesPerStudent || 0;

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Button
                        variant="light"
                        startContent={<Icon icon="mdi:arrow-left" />}
                        onPress={() => navigate('/finance/statistics')}
                        className="mb-2 text-default-500"
                    >
                        Back to Statistics
                    </Button>

                    <h1 className="text-3xl font-bold text-foreground">
                        {className} - Fee Details
                    </h1>

                    <p className="text-default-500 mt-1">
                        Fee per student: {formatCurrency(feePerStudent)}
                    </p>
                </div>

                <Button
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="mdi:refresh" />}
                    onPress={fetchClassFeeStatus}
                    isLoading={isLoading}
                >
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <motion.div whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-primary bg-content1 shadow-sm">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Total Students</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                </div>
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <Icon icon="mdi:account-group" className="text-2xl text-primary" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-success bg-content1 shadow-sm">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Paid</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
                                </div>
                                <div className="bg-success/10 p-3 rounded-lg">
                                    <Icon icon="mdi:check-circle" className="text-2xl text-success" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-warning bg-content1 shadow-sm">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Partial</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.partial}</p>
                                </div>
                                <div className="bg-warning/10 p-3 rounded-lg">
                                    <Icon icon="mdi:alert-circle" className="text-2xl text-warning" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-danger bg-content1 shadow-sm">
                        <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Pending</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                                </div>
                                <div className="bg-danger/10 p-3 rounded-lg">
                                    <Icon icon="mdi:close-circle" className="text-2xl text-danger" />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Student Table */}
            <Card className="bg-content1 border border-default-200 shadow-sm">
                <CardBody className="p-0">
                    <Table aria-label="Student payment status table" shadow="none">

                        <TableHeader>
                            <TableColumn>ADMISSION NO</TableColumn>
                            <TableColumn>STUDENT NAME</TableColumn>
                            <TableColumn>TOTAL FEES</TableColumn>
                            <TableColumn>AMOUNT PAID</TableColumn>
                            <TableColumn>PENDING</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                        </TableHeader>

                        <TableBody
                            isLoading={isLoading}
                            loadingContent={<Spinner label="Loading students..." />}
                        >
                            {filteredStudents.map((student) => (
                                <TableRow key={student.studentId}>
                                    <TableCell>{student.admissionNumber}</TableCell>
                                    <TableCell>{student.studentName}</TableCell>
                                    <TableCell>{formatCurrency(student.totalFeesPerStudent)}</TableCell>
                                    <TableCell>{formatCurrency(student.totalPaid)}</TableCell>
                                    <TableCell>{formatCurrency(student.balance)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={getStatusColor(student.status)}
                                            variant="flat"
                                        >
                                            {student.status}
                                        </Chip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                    </Table>
                </CardBody>
            </Card>

        </div>
    );
}
