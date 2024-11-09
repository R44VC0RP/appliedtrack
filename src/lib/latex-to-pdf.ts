import { UTApi } from "uploadthing/server";
import { Logger } from '@/lib/logger';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

interface FileEsque {
    name: string;
    [Symbol.toStringTag]: string;
    stream: () => ReadableStream;
    text: () => Promise<string>;
    arrayBuffer: () => Promise<ArrayBuffer>;
    slice: () => Blob;
    size: number;
    type: string;
}

const utapi = new UTApi();


export async function latexToPdfUrl(latexBody: string): Promise<string> {
    try {
        // Call the FastAPI endpoint
        const response = await fetch('https://api.appliedtrack.com/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latex_content: latexBody,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`LaTeX conversion failed: ${errorData.detail || 'Unknown error'}`);
        }

        const data = await response.json();
        
        if (!data.pdf_content) {
            throw new Error('No PDF content received from conversion service');
        }

        // data.pdf_content is already base64 encoded from the server
        const pdfBuffer = Buffer.from(data.pdf_content, 'base64');

        // Create a temporary file name with timestamp and random string for uniqueness
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `latex-${timestamp}-${randomString}.pdf`;

        // Create a Blob-like object that matches FileEsque interface
        const pdfFile: FileEsque = {
            name: fileName,
            [Symbol.toStringTag]: 'Blob',
            stream: () => new ReadableStream({
                start(controller) {
                    controller.enqueue(pdfBuffer);
                    controller.close();
                }
            }),
            text: () => Promise.resolve(''),
            arrayBuffer: async () => pdfBuffer,
            slice: () => new Blob([pdfBuffer], { type: 'application/pdf' }),
            size: pdfBuffer.length,
            type: 'application/pdf'
        };

        // Upload PDF to UploadThing
        const uploadResponse = await utapi.uploadFiles([pdfFile]);

        if (!Array.isArray(uploadResponse) || uploadResponse[0].error) {
            throw new Error('Upload failed: ' + 
                (Array.isArray(uploadResponse) ? uploadResponse[0].error?.message : 'Unknown error'));
        }

        const fileKey = uploadResponse[0].data?.key;
        if (!fileKey) throw new Error('No file key returned from upload');

        await Logger.info('LaTeX successfully converted and uploaded', {
            fileKey,
            fileName: uploadResponse[0].data?.name,
            fileSize: pdfBuffer.length
        });

        return fileKey;

    } catch (error) {
        await Logger.error('Failed to convert LaTeX to PDF', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            service: 'FastAPI LaTeX Service',
            latexLength: latexBody.length
        });

        throw error instanceof Error ? error : new Error('Failed to convert LaTeX to PDF');
    }
}