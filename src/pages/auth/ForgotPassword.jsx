import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";
import { authService } from '@/services';
import { motion } from "framer-motion";

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.forgotPassword(data);
            if (response.data?.success) {
                setSuccess(true);
                // Redirect to reset password after 2 seconds, passing email in state
                setTimeout(() => {
                    navigate('/reset-password', { state: { email: data.email } });
                }, 2000);
            } else {
                setError(response.data?.message || 'Failed to process request. Please check your email.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again later.');
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
                        <Icon icon="mdi:lock-question" className="text-4xl text-secondary-500" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Forgot Password?
                </h2>
                <p className="mt-2 text-center text-sm text-primary-200/60">
                    Enter your email to receive a password reset OTP
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
                            <p className="text-xl font-bold text-foreground">Reset Request</p>
                            <p className="text-sm text-default-500">We'll send an OTP to your registered email</p>
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
                                <h3 className="text-lg font-bold text-success-600 dark:text-success-400">Request Sent!</h3>
                                <p className="text-sm text-default-500 mt-2">
                                    If the email exists, a password reset OTP has been sent. Redirecting to reset page...
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
                                />

                                <Button
                                    type="submit"
                                    className="w-full font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/30 transition-all duration-300"
                                    size="lg"
                                    isLoading={isLoading}
                                    startContent={!isLoading && <Icon icon="mdi:send" className="text-xl" />}
                                >
                                    {isLoading ? 'Processing...' : 'Send OTP'}
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
