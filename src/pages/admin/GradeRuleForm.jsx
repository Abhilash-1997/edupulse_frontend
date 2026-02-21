import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    addToast,
} from '@heroui/react';
import { gradeRuleService } from '@/services';

const schema = z.object({
    grade: z.string().min(1, 'Grade name is required'),
    minPercentage: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, 'Minimum 0%').max(100, 'Maximum 100%'),
    maxPercentage: z.coerce.number({ invalid_type_error: "Must be a number" }).min(0, 'Minimum 0%').max(100, 'Maximum 100%'),
    description: z.string().optional(),
}).refine((data) => data.minPercentage <= data.maxPercentage, {
    message: "Min percentage cannot be greater than max percentage",
    path: ["minPercentage"], // will show error on minPercentage field
});

const GradeRuleForm = ({ isOpen, onOpenChange, rule, onSuccess }) => {
    const isEditing = !!rule;
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            grade: rule?.grade || '',
            minPercentage: rule?.minPercentage || 0,
            maxPercentage: rule?.maxPercentage || 100,
            description: rule?.description || '',
        },
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const payload = {
                grade: data.grade.trim(),
                minPercentage: data.minPercentage,
                maxPercentage: data.maxPercentage,
                description: data.description?.trim() || undefined,
            };

            if (isEditing) {
                await gradeRuleService.updateGradeRule(rule.id, payload);
                addToast({ title: 'Grade rule updated successfully', color: 'success' });
            } else {
                await gradeRuleService.createGradeRule(payload);
                addToast({ title: 'Grade rule created successfully', color: 'success' });
            }

            onSuccess();
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                `Failed to ${isEditing ? 'update' : 'create'} grade rule`;
            addToast({ title: errorMessage, color: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
            <ModalContent>
                {(onClose) => (
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <ModalHeader className="flex flex-col gap-1">
                            {isEditing ? 'Edit Grade Rule' : 'Create Grade Rule'}
                        </ModalHeader>
                        <ModalBody>
                            <Controller
                                name="grade"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        autoFocus
                                        label="Grade Name"
                                        placeholder="e.g., A+, B, Distinction"
                                        variant="bordered"
                                        isInvalid={!!errors.grade}
                                        errorMessage={errors.grade?.message}
                                        isRequired
                                    />
                                )}
                            />

                            <div className="flex gap-4">
                                <Controller
                                    name="minPercentage"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            label="Min Percentage"
                                            placeholder="0.00"
                                            endContent={<span className="text-default-400 text-small">%</span>}
                                            variant="bordered"
                                            className="flex-1"
                                            isInvalid={!!errors.minPercentage}
                                            errorMessage={errors.minPercentage?.message}
                                            isRequired
                                        />
                                    )}
                                />

                                <Controller
                                    name="maxPercentage"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            step="0.01"
                                            label="Max Percentage"
                                            placeholder="100.00"
                                            endContent={<span className="text-default-400 text-small">%</span>}
                                            variant="bordered"
                                            className="flex-1"
                                            isInvalid={!!errors.maxPercentage}
                                            errorMessage={errors.maxPercentage?.message}
                                            isRequired
                                        />
                                    )}
                                />
                            </div>

                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        label="Description"
                                        placeholder="Add details about this grade rule (Optional)"
                                        variant="bordered"
                                        isInvalid={!!errors.description}
                                        errorMessage={errors.description?.message}
                                    />
                                )}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" onPress={onClose} isDisabled={loading}>
                                Cancel
                            </Button>
                            <Button color="primary" type="submit" isLoading={loading}>
                                {isEditing ? 'Save Changes' : 'Create Rule'}
                            </Button>
                        </ModalFooter>
                    </form>
                )}
            </ModalContent>
        </Modal>
    );
};

export default GradeRuleForm;
