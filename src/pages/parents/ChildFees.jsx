import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Chip,
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    addToast,
    Spinner
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { financeService, parentService } from '@/services';
import { format } from 'date-fns';
import { motion } from "framer-motion";

export default function ChildFees() {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [feeDetails, setFeeDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedFee, setSelectedFee] = useState(null);

    useEffect(() => {
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchFeeDetails(selectedChild);
        }
    }, [selectedChild]);

    const fetchChildren = async () => {
        try {
            setIsLoading(true);
            const response = await parentService.getMyChildren();

            if (response.data?.success) {
                const kids = response.data?.data?.children || [];
                setChildren(kids);

                if (kids.length > 0) {
                    setSelectedChild(kids[0].student.id);
                }
            }
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Failed to load children',
                color: 'danger',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFeeDetails = async (studentId) => {
        try {
            const response = await financeService.getStudentFeeDetails(studentId);
            if (response.data?.success) {
                setFeeDetails(response.data.data);
            }
        } catch (error) {}
    };

    const handlePayment = (fee) => {
        setSelectedFee(fee);
        onOpen();
    };

    const processPayment = async () => {
        if (!selectedFee || !selectedChild) return;

        try {
            setIsPaymentProcessing(true);

            const response = await financeService.processPayment({
                studentId: selectedChild,
                feeStructureId: selectedFee.feeStructureId,
                amountPaid: selectedFee.pendingAmount
            });

            if (response.data?.success) {
                addToast({
                    title: 'Success',
                    description: 'Payment processed successfully!',
                    color: 'success',
                });
                onClose();
                fetchFeeDetails(selectedChild);
            } else {
                addToast({
                    title: 'Error',
                    description: response.data?.message || 'Payment failed',
                    color: 'danger',
                });
            }
        } catch (error) {
            addToast({
                title: 'Error',
                description: 'Payment processing failed',
                color: 'danger',
            });
        } finally {
            setIsPaymentProcessing(false);
        }
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'success';
            case 'PARTIAL': return 'warning';
            case 'PENDING': return 'danger';
            default: return 'default';
        }
    };

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Children's Fees</h1>
                    <p className="text-gray-600 mt-1">
                        View and pay fees for your children
                    </p>
                </div>

                <Button
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="mdi:refresh" />}
                    onPress={() => {
                        fetchChildren();
                        if (selectedChild) fetchFeeDetails(selectedChild);
                    }}
                    isLoading={isLoading}
                >
                    Refresh
                </Button>
            </div>

            {/* Child Selector */}
            {children.length > 1 && (
                <Card>
                    <CardBody>
                        <Select
                            label="Select Child"
                            selectedKeys={selectedChild ? [selectedChild] : []}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            startContent={<Icon icon="mdi:account-child" />}
                        >
                            {children.map((childWrapper) => (
                                <SelectItem
                                    key={childWrapper.student.id}
                                    value={childWrapper.student.id}
                                >
                                    {childWrapper.student.name} - {childWrapper.student.admissionNumber}
                                </SelectItem>
                            ))}
                        </Select>
                    </CardBody>
                </Card>
            )}

            {/* Summary Cards */}
            {feeDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardBody>
                            <p>Total Fees</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(feeDetails.summary.totalFees)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="border-l-4 border-l-success">
                        <CardBody>
                            <p>Paid</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(feeDetails.summary.totalPaid)}
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="border-l-4 border-l-warning">
                        <CardBody>
                            <p>Pending</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(feeDetails.summary.totalPending)}
                            </p>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Fee Table */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold">Fee Structure</h2>
                </CardHeader>
                <CardBody className="p-0">
                    <Table removeWrapper>
                        <TableHeader>
                            <TableColumn>FEE NAME</TableColumn>
                            <TableColumn>AMOUNT</TableColumn>
                            <TableColumn>FREQUENCY</TableColumn>
                            <TableColumn>PAID</TableColumn>
                            <TableColumn>PENDING</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>ACTION</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {(feeDetails?.feeBreakdown || []).map((fee) => (
                                <TableRow key={fee.feeStructureId}>
                                    <TableCell>{fee.feeName}</TableCell>
                                    <TableCell>{formatCurrency(fee.amount)}</TableCell>
                                    <TableCell>
                                        <Chip size="sm" variant="flat" color="primary">
                                            {fee.frequency}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{formatCurrency(fee.totalPaid)}</TableCell>
                                    <TableCell>{formatCurrency(fee.pendingAmount)}</TableCell>
                                    <TableCell>
                                        <Chip size="sm" color={getStatusColor(fee.status)} variant="flat">
                                            {fee.status}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        {fee.pendingAmount > 0 && (
                                            <Button
                                                size="sm"
                                                color="primary"
                                                startContent={<Icon icon="mdi:cash" />}
                                                onPress={() => handlePayment(fee)}
                                            >
                                                Pay Now
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Payment Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>Confirm Payment</ModalHeader>
                    <ModalBody>
                        {selectedFee && (
                            <div>
                                <p>{selectedFee.feeName}</p>
                                <p className="font-bold text-lg">
                                    {formatCurrency(selectedFee.pendingAmount)}
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={processPayment}
                            isLoading={isPaymentProcessing}
                        >
                            Confirm Payment
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </div>
    );
}