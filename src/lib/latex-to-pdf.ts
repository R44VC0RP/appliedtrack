import { UTApi } from "uploadthing/server";
import { Logger } from '@/lib/logger';
import { writeFile, readFile, unlink, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

function sanitizeLatex(latex: string): string {
    // Only escape special characters #, $, %, &, ’
    return latex.replace(/(?<!\\)([#$%&’])/g, '\\$1');
}

export async function latexToPdfUrl(latexBody: string): Promise<{url: string, status: string}> {
    try {
        const uuid_latex = uuidv4();
        const tempDir = join(tmpdir(), 'latex-to-pdf', uuid_latex);

        // Create the temp directory if it doesn't exist
        await mkdir(tempDir, { recursive: true });

        const texFilePath = join(tempDir, `${uuid_latex}.tex`);
        const outputPdfPath = join(tempDir, `${uuid_latex}.pdf`);
        
        // Only use the sanitizeLatex function instead of the previous double processing
        const processedLatex = sanitizeLatex(latexBody);
        
        await writeFile(texFilePath, processedLatex);
        
        // Change to temp directory before running curl
        const currentDir = process.cwd();
        process.chdir(tempDir);

        console.log("DIR:", tempDir);
        console.log("outputPdfPath", outputPdfPath);
        
        // Execute curl command (now relative to temp directory)
        const curlCommand = `curl -L -H 'Accept: application/pdf' --data-binary @${uuid_latex}.tex -OJ 'https://api.appliedtrack.com/job?log-on-error=true?format=pdf'`;

        console.log("curlCommand", curlCommand);
        
        const { stdout, stderr } = await execAsync(curlCommand);
        
        // Change back to original directory
        process.chdir(currentDir);
        
        // List files in the output PDf path directory
        const files = await readdir(tempDir);
        console.log("Files in the output PDF path directory PDF3:", files);

        // Inside of the temp directory if there is a file ending in .log the process failed, if there is a file ending in .pdf the process succeeded
        const findLogFile = files.find(file => file.endsWith('.log'));
        const findPdfFile = files.find(file => file.endsWith('.pdf'));

        if (findLogFile) {
            return {url: "", status: "Error: LaTeX to PDF conversion failed"};
        }

        console.log("findPdfFile", findPdfFile, outputPdfPath);
        if (!findPdfFile) {
            return {url: "", status: "Error: No PDF file found in temp directory"};
        }
        // Read the PDF from temp directory
        const pdfBuffer = await readFile(join(tempDir, findPdfFile));

        if (!pdfBuffer.length) {
            return {url: "", status: "Error: No PDF content received from conversion service"};
        }

        const fileName = `latex-${Date.now()}-${uuidv4()}.pdf`;
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

        const uploadResponse = await utapi.uploadFiles([pdfFile]);

        if (!Array.isArray(uploadResponse) || uploadResponse[0].error) {
            return {url: "", status: 'Upload failed: ' + 
                    (Array.isArray(uploadResponse) ? uploadResponse[0].error?.message : 'Unknown error')};
        }

        const fileUrl = uploadResponse[0].data?.url;
        if (!fileUrl) return {url: "", status: 'No file URL returned from upload'};

        await Logger.info('LaTeX successfully converted and uploaded', {
            fileName,
            fileSize: pdfBuffer.length,
            fileUrl
        });

        return {url: fileUrl, status: "Success"};

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