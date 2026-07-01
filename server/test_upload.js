import fs from 'fs';
import dotenv from 'dotenv';
import { uploadPDFToCloudinary } from './src/config/cloudinary.js';
import pdfParse from 'pdf-parse';

dotenv.config();

async function testUpload() {
    console.log("Creating dummy PDF...");
    // A tiny valid PDF file (contains just "Hello World")
    const pdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQsTAz1LBSK0xPzSjLz8xTSFSoVagE2AAqjCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNDMKZW5kb2JqCgo1IDAgb2JqCjw8L0xlbmd0aCA2IDAgUi9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoMSAxMjI4OD4+CnN0cmVhbQp4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AYbSABMKZW5kc3RyZWFtCmVuZG9iagoKNCAwIG9iago8PC9UeXBlL0ZvbnREZXNjcmlwdG9yL0ZvbnROYW1lL0JBQUFBQStMaWJlcmF0aW9uU2VyaWYvRmxhZ3MgNC9Gb250QkJveFstNTQzIC0zMDMgMTI3OCA5ODJdL0l0YWxpY0FuZ2xlIDAvQXNjZW50IDk4Mi9EZXNjZW50IC0zMDMvQ2FwSGVpZ2h0IDk4Mi9TdGVtViA4MC9Gb250RmlsZTIgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvVHlwZS9Gb250L0ZvbnREZXNjcmlwdG9yIDQgMCBSL0Jhc2VGb250L0JBQUFBQStMaWJlcmF0aW9uU2VyaWYvU3VidHlwZS9UcnVlVHlwZS9GaXJzdENoYXIgMzMvTGFzdENoYXIgMzMvV2lkdGhzWzI1MF0+PgplbmRvYmoKCjggMCBvYmoKPDwvVHlwZS9Gb250L0Jhc2VGb250L0hlbHZldGljYS9TdWJ0eXBlL1R5cGUxL0VuY29kaW5nL1dpbkFuc2lFbmNvZGluZz4+CmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDggMCBSL0YyIDcgMCBSPj4+Pi9NZWRpYUJveFswIDAgNTk1IDg0Ml0vQ29udGVudHMgMiAwIFIvUGFyZW50IDkgMCBSPj4KZW5kb2JqCgo5IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzEgMCBSXT4+CmVuZG9iagoKMTAgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDkgMCBSPj4KZW5kb2JqCgoxMSAwIG9iago8PC9Qcm9kdWNlcihnb3NjcmlwdCk+PgplbmRvYmoKCnhyZWYKMCAxMgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDA0ODcgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTMwIDAwMDAwIG4gCjAwMDAwMDAyOTUgMDAwMDAgbiAKMDAwMDAwMDE1MSAwMDAwMCBuIAowMDAwMDAwMjc1IDAwMDAwIG4gCjAwMDAwMDA1MDkgMDAwMDAgbiAKMDAwMDAwMDYzNiAwMDAwMCBuIAowMDAwMDAwNzI0IDAwMDAwIG4gCjAwMDAwMDA3ODMgMDAwMDAgbiAKMDAwMDAwMDgzMyAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgMTIvUm9vdCAxMCAwIFIvSW5mbyAxMSAwIFI+PgpzdGFydHhyZWYKODgwCiUlRU9GCg==";
    const buffer = Buffer.from(pdfBase64, 'base64');

    console.log("Testing pdf-parse...");
    try {
        const data = await pdfParse(buffer);
        console.log("Parsed text:", data.text.trim());
    } catch (e) {
        console.error("pdf-parse failed:", e);
    }

    console.log("Testing Cloudinary upload...");
    const dummyFile = {
        buffer: buffer,
        originalname: 'test_hello.pdf',
        mimetype: 'application/pdf'
    };

    try {
        const result = await uploadPDFToCloudinary(dummyFile);
        console.log("Cloudinary result:", result);
    } catch (e) {
        console.error("Cloudinary upload failed:", e);
    }
}

testUpload().then(() => process.exit(0)).catch(e => console.error(e));
