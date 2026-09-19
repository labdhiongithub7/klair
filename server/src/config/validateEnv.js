import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'MONGODB_URL',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GROQ_API_KEY'
];

// Values that are clearly still template placeholders, not real credentials.
const isPlaceholder = (value) => /^PASTE|^your_|^<|CHANGE_ME|xxxx/i.test(value);

export const validateEnvironment = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    const placeholders = requiredEnvVars.filter(
        envVar => process.env[envVar] && isPlaceholder(process.env[envVar])
    );

    if (missing.length > 0 || placeholders.length > 0) {
        if (missing.length > 0) {
            console.error('❌ Missing required environment variables:');
            missing.forEach(envVar => console.error(`   - ${envVar}`));
        }
        if (placeholders.length > 0) {
            console.error('❌ These environment variables still contain placeholder values:');
            placeholders.forEach(envVar => console.error(`   - ${envVar}`));
        }
        console.error('\nPlease set real values for these (in your .env file or your host\'s environment settings).');
        process.exit(1);
    }

    console.log('✅ All required environment variables are set');
};
