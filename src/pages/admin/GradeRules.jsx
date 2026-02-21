import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
    addToast,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Spinner,
    Tooltip,
    useDisclosure
} from '@heroui/react';
import { gradeRuleService } from '@/services';
import GradeRuleForm from './GradeRuleForm';
import BulkGradeRuleModal from './BulkGradeRuleModal';
import { useAuth } from '@/context/AuthContext';

const GradeRules = () => {
    const { user } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange, onClose: onFormClose } = useDisclosure();
    const { isOpen: isBulkOpen, onOpen: onBulkOpen, onOpenChange: onBulkOpenChange, onClose: onBulkClose } = useDisclosure();

    const [editingRule, setEditingRule] = useState(null);

    // Check if user has permission to manage grade rules
    const canManageRules = user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await gradeRuleService.getGradeRules();
            if (response.data?.success) {
                setRules(response.data.data || []);
            }
        } catch (error) {
            addToast({
                title: "Error fetching grade rules",
                color: "danger",
            });
            console.error('Error fetching grade rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRule(null);
        onFormOpen();
    };

    const handleEdit = (rule) => {
        setEditingRule(rule);
        onFormOpen();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this grade rule?')) {
            try {
                await gradeRuleService.deleteGradeRule(id);
                addToast({
                    title: "Grade rule deleted successfully",
                    color: "success",
                });
                fetchRules();
            } catch (error) {
                addToast({
                    title: "Failed to delete grade rule",
                    color: "danger",
                });
            }
        }
    };

    const handleFormSuccess = () => {
        onFormClose();
        onBulkClose();
        fetchRules();
    };

    if (!canManageRules) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Icon icon="mdi:shield-alert-outline" className="w-16 h-16 text-danger mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
                <p className="text-default-500">
                    You do not have permission to manage grade rules. Only School Administrators can access this page.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Grade Rules</h1>
                    <p className="text-sm text-default-500 mt-1">
                        Manage grading system and percentage criteria
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        color="secondary"
                        variant="flat"
                        onPress={onBulkOpen}
                        startContent={<Icon icon="mdi:file-upload-outline" className="text-xl" />}
                    >
                        Bulk Add
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleCreate}
                        startContent={<Icon icon="mdi:plus" className="text-xl" />}
                    >
                        Add Grade Rule
                    </Button>
                </div>
            </div>

            <div className="bg-content1 rounded-large shadow-small">
                <Table
                    aria-label="Grade Rules Table"
                    bottomContent={
                        loading ? (
                            <div className="flex justify-center uppercase w-full">
                                <Spinner size="sm" color="primary" />
                            </div>
                        ) : null
                    }
                >
                    <TableHeader>
                        <TableColumn>GRADE</TableColumn>
                        <TableColumn align="center">MIN %</TableColumn>
                        <TableColumn align="center">MAX %</TableColumn>
                        <TableColumn>DESCRIPTION</TableColumn>
                        <TableColumn align="end">ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody
                        emptyContent={loading ? " " : "No grade rules found."}
                        items={rules}
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Chip color="primary" variant="flat" size="sm" className="font-medium">
                                        {item.grade}
                                    </Chip>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {item.minPercentage}%
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {item.maxPercentage}%
                                </TableCell>
                                <TableCell>
                                    <span className="text-default-500 text-sm">{item.description || '-'}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="relative flex items-center justify-end gap-2">
                                        <Tooltip content="Edit rule">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => handleEdit(item)}
                                            >
                                                <Icon icon="mdi:pencil-outline" className="text-lg text-default-400 hover:text-primary" />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip color="danger" content="Delete rule">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => handleDelete(item.id)}
                                            >
                                                <Icon icon="mdi:trash-can-outline" className="text-lg text-danger cursor-pointer active:opacity-50" />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {isFormOpen && (
                <GradeRuleForm
                    isOpen={isFormOpen}
                    onOpenChange={onFormOpenChange}
                    rule={editingRule}
                    onSuccess={handleFormSuccess}
                />
            )}

            {isBulkOpen && (
                <BulkGradeRuleModal
                    isOpen={isBulkOpen}
                    onOpenChange={onBulkOpenChange}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default GradeRules;
