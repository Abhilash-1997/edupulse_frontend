import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { authService } from '@/services';
import { motion } from "framer-motion";
import PasswordStrengthIndicator from '@/components/common/PasswordStrengthIndicator';

const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
    token: z.string().min(1, "OTP code is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: location.state?.email || '',
        }
    });

    const newPassword = watch('newPassword');

    useEffect(() => {
        if (location.state?.email) {
            setValue('email', location.state.email);
        }
    }, [location.state, setValue]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.resetPassword({
                email: data.email,
                token: data.token,
                newPassword: data.newPassword
            });

            if (response.data?.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login', { state: { message: 'Password reset successfully. Please login with your new password.' } });
                }, 2000);
            } else {
                setError(response.data?.message || 'Failed to reset password. Please check your OTP.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during password reset.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-secondary-100/10 backdrop-blur-lg border border-secondary-500/20 rounded-2xl flex items-center justify-center shadow-xl shadow-secondary-500/10">
                        <Icon icon="mdi:lock-reset" className="text-4xl text-secondary-500" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Reset Password
                </h2>
                <p className="mt-2 text-center text-sm text-primary-200/60">
                    Enter the OTP sent to your email and set a new password
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <Card className="shadow-2xl bg-content1/90 dark:bg-content1/50 backdrop-blur-xl border border-white/20 dark:border-white/10">
                    <CardHeader className="flex gap-3 px-8 pt-8 pb-0">
                        <div className="flex flex-col">
                            <p className="text-xl font-bold text-foreground">Set New Password</p>
                            <p className="text-sm text-default-500">Secure your account with a new password</p>
                        </div>
                    </CardHeader>
                    <div className="px-8 py-4">
                        <Divider className="bg-default-200/50" />
                    </div>
                    <CardBody className="px-8 pb-8 pt-0">
                        {success ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-4"
                            >
                                <div className="flex justify-center mb-4">
                                    <div className="w-20 h-20 bg-success-100/20 rounded-full flex items-center justify-center">
                                        <Icon icon="mdi:check-circle" className="text-5xl text-success-500" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-success-600 dark:text-success-400">Success!</h3>
                                <p className="text-sm text-default-500 mt-2">
                                    Your password has been reset successfully. Redirecting to login page...
                                </p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
                                {error && (
                                    <div className="bg-danger-50 text-danger-600 border border-danger-100 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <Icon icon="mdi:alert-circle" className="text-lg" />
                                        {error}
                                    </div>
                                )}

                                <Input
                                    {...register('email')}
                                    type="email"
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    classNames={{
                                        label: "text-default-600 font-medium",
                                        inputWrapper: "bg-default-100/50 dark:bg-default-100/20 border-default-200 dark:border-default-700 hover:border-primary-500 focus-within:!border-primary-500 transition-colors duration-300",
                                        innerWrapper: "bg-transparent",
                                        input: "text-foreground",
                                    }}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email?.message}
                                    startContent={<Icon icon="mdi:email" className="text-default-400 text-xl" />}
                                    isDisabled={!!location.state?.email}
                                />

                                <Input
                                    {...register('token')}
                                    type="text"
                                    label="OTP Code"
                                    placeholder="Enter the OTP from your email"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    classNames={{
                                        label: "text-default-600 font-medium",
                                        inputWrapper: "bg-default-100/50 dark:bg-default-100/20 border-default-200 dark:border-default-700 hover:border-primary-500 focus-within:!border-primary-500 transition-colors duration-300",
                                        innerWrapper: "bg-transparent",
                                        input: "text-foreground",
                                    }}
                                    isInvalid={!!errors.token}
                                    errorMessage={errors.token?.message}
                                    startContent={<Icon icon="mdi:numeric" className="text-default-400 text-xl" />}
                                />

                                <div className="space-y-1">
                                    <Input
                                        {...register('newPassword')}
                                        type={showPassword ? "text" : "password"}
                                        label="New Password"
                                        placeholder="Min 8 characters"
                                        variant="bordered"
                                        labelPlacement="outside"
                                        classNames={{
                                            label: "text-default-600 font-medium",
                                            inputWrapper: "bg-default-100/50 dark:bg-default-100/20 border-default-200 dark:border-default-700 hover:border-primary-500 focus-within:!border-primary-500 transition-colors duration-300",
                                            innerWrapper: "bg-transparent",
                                            input: "text-foreground",
                                        }}
                                        isInvalid={!!errors.newPassword}
                                        errorMessage={errors.newPassword?.message}
                                        startContent={<Icon icon="mdi:lock" className="text-default-400 text-xl" />}
                                        endContent={
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                                <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} className="text-default-400" />
                                            </button>
                                        }
                                    />
                                    <PasswordStrengthIndicator password={newPassword} />
                                </div>

                                <Input
                                    {...register('confirmPassword')}
                                    type={showPassword ? "text" : "password"}
                                    label="Confirm Password"
                                    placeholder="Confirm your new password"
                                    variant="bordered"
                                    labelPlacement="outside"
                                    classNames={{
                                        label: "text-default-600 font-medium",
                                        inputWrapper: "bg-default-100/50 dark:bg-default-100/20 border-default-200 dark:border-default-700 hover:border-primary-500 focus-within:!border-primary-500 transition-colors duration-300",
                                        innerWrapper: "bg-transparent",
                                        input: "text-foreground",
                                    }}
                                    isInvalid={!!errors.confirmPassword}
                                    errorMessage={errors.confirmPassword?.message}
                                    startContent={<Icon icon="mdi:lock-check" className="text-default-400 text-xl" />}
                                />

                                <Button
                                    type="submit"
                                    className="w-full font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/30 transition-all duration-300"
                                    size="lg"
                                    isLoading={isLoading}
                                    startContent={!isLoading && <Icon icon="mdi:update" className="text-xl" />}
                                >
                                    {isLoading ? 'Resetting...' : 'Reset Password'}
                                </Button>

                                <div className="text-center mt-2">
                                    <Link to="/login" className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-secondary-500 transition-colors flex items-center justify-center gap-1">
                                        <Icon icon="mdi:arrow-left" /> Back to Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardBody>
                </Card>
            </motion.div>

            <div className="mt-8 text-center relative z-10">
                <p className="text-xs text-primary-200/40">
                    &copy; {new Date().getFullYear()} School Management System. All rights reserved.
                </p>
            </div>
        </div>
    );
}
