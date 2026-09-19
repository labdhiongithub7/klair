import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps the backend's error `code` onto the field its message belongs next to, so
// the user reads the problem where they can fix it rather than in a generic banner.
const ERROR_FIELD_BY_CODE = {
    MISSING_FIELDS: null,
    INVALID_EMAIL: 'email',
    EMAIL_NOT_FOUND: 'email',
    USER_EXISTS: 'email',
    USERNAME_TAKEN: 'username',
    INVALID_PASSWORD: 'password',
    WEAK_PASSWORD: 'password'
};

const inputClass = (hasError) =>
    `w-full bg-gray-50 rounded-lg pl-12 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 border transition-colors ${
        hasError
            ? 'border-rose-300 focus:ring-rose-300'
            : 'border-gray-200 focus:ring-blue-300'
    }`;

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Field-level messages, plus `form` for errors that aren't tied to one input.
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });

    // Client-side checks so obvious mistakes never cost a round trip.
    const validate = () => {
        const nextErrors = {};

        if (!isLogin && !formData.username.trim()) {
            nextErrors.username = 'Please enter your name.';
        }

        if (!formData.email.trim()) {
            nextErrors.email = 'Please enter your email address.';
        } else if (!EMAIL_REGEX.test(formData.email.trim())) {
            nextErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.password) {
            nextErrors.password = 'Please enter your password.';
        } else if (!isLogin && formData.password.length < 6) {
            nextErrors.password = 'Password must be at least 6 characters long.';
        }

        return nextErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent duplicate submissions while a request is in flight.
        if (isSubmitting) return;

        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin
                ? { email: formData.email.trim(), password: formData.password }
                : {
                      email: formData.email.trim(),
                      password: formData.password,
                      username: formData.username.trim()
                  };

            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const field = ERROR_FIELD_BY_CODE[data.code] ?? null;
                const message =
                    data.message || 'We could not complete that request. Please try again.';
                setErrors({ [field || 'form']: message, code: data.code });
                return;
            }

            if (!data.token || !data.user) {
                setErrors({ form: 'Something went wrong signing you in. Please try again.' });
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/chat');
        } catch (error) {
            // Network/transport failure: log for developers, show a plain message.
            console.error('Auth request failed:', error?.message || error);
            setErrors({
                form: 'Unable to reach the server. Please check your connection and try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear this field's error (and any form-level one) as the user corrects it.
        setErrors((prev) => {
            if (!prev[name] && !prev.form && !prev.code) return prev;
            const next = { ...prev };
            delete next[name];
            delete next.form;
            delete next.code;
            return next;
        });
    };

    const switchMode = () => {
        setIsLogin((prev) => !prev);
        setErrors({});
        setShowPassword(false);
    };

    const submitLabel = isLogin ? 'Sign In' : 'Create Account';
    const submittingLabel = isLogin ? 'Signing in...' : 'Creating account...';

    // Shown under the email field when the account already exists, so the user has
    // a direct way to act on the message instead of just reading it.
    const showLoginInsteadHint = !isLogin && errors.code === 'USER_EXISTS';
    const showSignUpHint = isLogin && errors.code === 'EMAIL_NOT_FOUND';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Klair</h1>
                    <p className="text-gray-500">
                        {isLogin ? 'Welcome back! Please login to continue.' : 'Create an account to get started.'}
                    </p>
                </div>

                {/* Auth Form */}
                <motion.div
                    initial={false}
                    animate={{ height: 'auto' }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-gray-200/60"
                >
                    {errors.form && (
                        <div
                            role="alert"
                            className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm"
                        >
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{errors.form}</span>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Full Name"
                                            autoComplete="name"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            aria-invalid={!!errors.username}
                                            aria-describedby={errors.username ? 'username-error' : undefined}
                                            className={inputClass(!!errors.username)}
                                        />
                                    </div>
                                    {errors.username && (
                                        <p id="username-error" className="mt-1.5 text-sm text-rose-600">
                                            {errors.username}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    aria-invalid={!!errors.email}
                                    aria-describedby={errors.email ? 'email-error' : undefined}
                                    className={inputClass(!!errors.email)}
                                />
                            </div>
                            {errors.email && (
                                <p id="email-error" className="mt-1.5 text-sm text-rose-600">
                                    {errors.email}
                                    {showLoginInsteadHint && (
                                        <>
                                            {' '}
                                            <button
                                                type="button"
                                                onClick={switchMode}
                                                className="underline font-medium hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                                            >
                                                Log in instead
                                            </button>
                                        </>
                                    )}
                                    {showSignUpHint && (
                                        <>
                                            {' '}
                                            <button
                                                type="button"
                                                onClick={switchMode}
                                                className="underline font-medium hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 rounded"
                                            >
                                                Sign up
                                            </button>
                                        </>
                                    )}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password"
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                    className={`${inputClass(!!errors.password)} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 rounded p-0.5"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p id="password-error" className="mt-1.5 text-sm text-rose-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg py-3 flex items-center justify-center gap-2 transition-colors group shadow-md shadow-blue-200/50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    <span>{submittingLabel}</span>
                                </>
                            ) : (
                                <>
                                    <span>{submitLabel}</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={switchMode}
                            disabled={isSubmitting}
                            className="text-blue-500 hover:text-blue-600 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 rounded"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AuthPage;
