import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we can parse the PDF buffer before uploading to Cloudinary
const storage = multer.memoryStorage();

// Create multer upload middleware
const uploadPDFMulter = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            console.error(`File upload rejected: Invalid mimetype ${file.mimetype}`);
            cb(new Error(`Only PDF files are allowed! Received: ${file.mimetype}`), false);
        }
    }
}).single('pdf');

// Enhanced wrapper for multer middleware to provide better error handling
const uploadPDF = (req, res, next) => {
    uploadPDFMulter(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                console.error(`Multer upload error: ${err.code}`, err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        error: 'File is too large. Maximum size allowed is 10MB.'
                    });
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return res.status(400).json({
                        success: false,
                        error: 'Unexpected file field. Please upload a PDF file.'
                    });
                }
            }
            console.error('PDF upload failed:', err);
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
};

// Upload PDF buffer to Cloudinary using upload_stream
const uploadPDFToCloudinary = async (file) => {
    try {
        if (!file || !file.buffer) {
            console.error('Invalid file object provided to uploadPDFToCloudinary');
            throw new Error('Invalid file: file buffer is missing');
        }

        // Verify credentials are set
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary credentials missing or incomplete');
            throw new Error('Cloudinary credentials are not properly configured');
        }

        const publicId = `pdf-${Date.now()}-${file.originalname}`;
        console.log(`Uploading file to Cloudinary: ${publicId}`);

        // Use upload_stream to upload from buffer
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder: 'pdfs',
                    public_id: publicId,
                    access_mode: 'public',
                    type: 'upload'
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            uploadStream.end(file.buffer);
        });

        // Verify upload result
        if (!result || !result.secure_url) {
            console.error('Cloudinary upload failed - no valid result:', result);
            throw new Error('Upload failed - no URL received from Cloudinary');
        }

        console.log(`File successfully uploaded to Cloudinary: ${result.public_id}`);

        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            created_at: result.created_at
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: error.message || 'Upload to Cloudinary failed',
            details: error.stack
        };
    }
};

// Function to delete PDF from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        console.log(`[deleteFromCloudinary] Attempting to delete: ${publicId}`);
        
        // Verify credentials are set
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('Cloudinary credentials missing or incomplete');
            throw new Error('Cloudinary credentials are not properly configured');
        }

        // Delete the resource
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
        });

        console.log(`[deleteFromCloudinary] Delete result:`, result);

        if (result.result === 'ok') {
            return {
                success: true,
                message: 'File deleted successfully from Cloudinary'
            };
        } else if (result.result === 'not found') {
            console.warn(`[deleteFromCloudinary] File not found in Cloudinary: ${publicId}`);
            return {
                success: true,
                message: 'File was already deleted or not found'
            };
        } else {
            return {
                success: false,
                error: `Delete failed with result: ${result.result}`
            };
        }
    } catch (error) {
        console.error('[deleteFromCloudinary] Error deleting from Cloudinary:', error);
        return {
            success: false,
            error: error.message || 'Delete from Cloudinary failed'
        };
    }
};

export {
    uploadPDF,
    uploadPDFToCloudinary,
    deleteFromCloudinary
};