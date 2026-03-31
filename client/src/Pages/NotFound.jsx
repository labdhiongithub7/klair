import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(91,138,245,0.08),transparent)]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center relative z-10"
            >
                <h1 className="text-8xl font-bold text-blue-400 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-md">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl 
                             flex items-center gap-2 mx-auto transition-colors shadow-md shadow-blue-200/50"
                >
                    <ArrowLeft size={20} />
                    Back to Home
                </motion.button>
            </motion.div>
        </div>
    );
}

export default NotFound;