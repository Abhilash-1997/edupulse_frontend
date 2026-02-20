import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Avatar,
    Chip,
    Skeleton,
    addToast,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parentService, studentService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";

export default function ParentDashboard() {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState({});
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [idCardData, setIdCardData] = useState(null);
    const { isOpen: isIdOpen, onOpen: onIdOpen, onClose: onIdClose } = useDisclosure();

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const response = await parentService.getMyChildren();
            if (response.data?.success) {
                const students = response.data.data?.children || [];
                setChildren(students);
            }
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to load children',
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadIDCard = async (student) => {
        setDownloading((prev) => ({ ...prev, [student.id]: true }));
        try {
            const result = await studentService.getIDCard(student.id, student.name);
            if (result.success) {
                addToast({ title: "Success", description: "ID Card downloaded", color: "success" });
            } else {
                addToast({ title: "Error", description: "Failed to generate ID Card", color: "danger" });
            }
        } catch (error) {
            addToast({ title: "Error", description: "Error generating ID Card", color: "danger" });
        } finally {
            setDownloading((prev) => ({ ...prev, [student.id]: false }));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Updated according to new response
    const totalPendingFees = children.reduce(
        (sum, child) => sum + (child.feeSummary?.pendingFees || 0),
        0
    );

    const avgAttendance = children.length > 0
        ? (children.reduce((sum, child) => sum + parseFloat(child.attendanceRate || 0), 0) / children.length).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-background">

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Parent Dashboard</h2>
                        <p className="text-default-500">Overview of your children's academic progress</p>
                    </div>
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<Icon icon="mdi:refresh" />}
                        onPress={fetchChildren}
                        isLoading={loading}
                    >
                        Refresh
                    </Button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div whileHover={{ scale: 1.02 }}>
                        <Card>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-default-500">Total Children</p>
                                        <p className="text-3xl font-bold">{children.length}</p>
                                    </div>
                                    <Icon icon="mdi:account-multiple" className="text-2xl" />
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                        <Card>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-default-500">Pending Fees</p>
                                        <p className="text-3xl font-bold">
                                            {formatCurrency(totalPendingFees)}
                                        </p>
                                    </div>
                                    <Icon icon="mdi:currency-usd" className="text-2xl" />
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                        <Card>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-default-500">Avg Attendance</p>
                                        <p className="text-3xl font-bold">{avgAttendance}%</p>
                                    </div>
                                    <Icon icon="mdi:calendar-check" className="text-2xl" />
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>

                {/* Children Cards */}
                <Card>
                    <CardHeader>
                        <h3 className="text-xl font-bold">My Children</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-48 rounded-xl" />
                                ))
                            ) : children.length > 0 ? (
                                children.map((childWrapper) => {
                                    const child = childWrapper.student;
                                    const feeSummary = childWrapper.feeSummary;

                                    return (
                                        <motion.div key={child.id} whileHover={{ scale: 1.03 }}>
                                            <Card className="h-full">
                                                <CardHeader className="justify-between pb-2">
                                                    <div className="flex gap-3">
                                                        <Avatar
                                                            isBordered
                                                            radius="full"
                                                            size="md"
                                                            src={`https://i.pravatar.cc/150?u=${child.id}`}
                                                        />
                                                        <div className="flex flex-col gap-1">
                                                            <h4 className="text-sm font-bold">{child.name}</h4>
                                                            <h5 className="text-xs text-default-500">
                                                                {child.admissionNumber}
                                                            </h5>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <CardBody>
                                                    <div className="space-y-3 mb-4">

                                                        <div className="flex justify-between text-sm">
                                                            <span>Class</span>
                                                            <Chip size="sm" color="primary" variant="flat">
                                                                {child.className || "N/A"}
                                                            </Chip>
                                                        </div>

                                                        <div className="flex justify-between text-sm">
                                                            <span>Attendance</span>
                                                            <Chip
                                                                size="sm"
                                                                color={parseFloat(childWrapper.attendanceRate) >= 75 ? "success" : "warning"}
                                                                variant="flat"
                                                            >
                                                                {childWrapper.attendanceRate}%
                                                            </Chip>
                                                        </div>

                                                        <div className="flex justify-between text-sm">
                                                            <span>Pending Fees</span>
                                                            <span className="font-bold">
                                                                {formatCurrency(feeSummary?.pendingFees || 0)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="w-full"
                                                            startContent={<Icon icon="mdi:eye" />}
                                                            onPress={() => navigate(`/parent/child/${child.id}`)}
                                                        >
                                                            View Details
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            className="w-full"
                                                            startContent={<Icon icon="mdi:download" />}
                                                            onPress={() => handleDownloadIDCard(child)}
                                                            isLoading={downloading[child.id]}
                                                        >
                                                            ID Card
                                                        </Button>
                                                    </div>

                                                    {feeSummary?.pendingFees > 0 && (
                                                        <Button
                                                            size="sm"
                                                            className="w-full mt-2"
                                                            startContent={<Icon icon="mdi:cash" />}
                                                            onPress={() => navigate('/parent/fees')}
                                                        >
                                                            Pay Fees
                                                        </Button>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center p-12 text-default-400">
                                    <Icon icon="mdi:account-school" className="text-6xl mb-4" />
                                    <p className="text-lg font-medium">
                                        No children linked to your account
                                    </p>
                                </div>
                            )}

                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}