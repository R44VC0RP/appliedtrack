import { UTApi } from "uploadthing/server";
import { Logger } from '@/lib/logger';
import { writeFile, readFile, unlink } from 'fs/promises';
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

const latexToPdfEndpoint = 'https://api.appliedtrack.com/job';

export async function latexToPdfUrl(latexBody: string): Promise<string> {
    try {
        const tempDir = tmpdir();
        const uuid_latex = uuidv4();
        const texFilePath = join(tempDir, `${uuid_latex}.tex`);
        const outputPdfPath = join(tempDir, `${uuid_latex}.pdf`);
        
        await writeFile(texFilePath, latexBody);
        
        // Change to temp directory before running curl
        const currentDir = process.cwd();
        process.chdir(tempDir);

        console.log("DIR:", tempDir);
        console.log("outputPdfPath", outputPdfPath);
        
        // Execute curl command (now relative to temp directory)
        const curlCommand = `curl -L -H 'Accept: application/pdf' --data-binary @${uuid_latex}.tex -o ${uuid_latex}.pdf 'https://api.appliedtrack.com/job?log-on-error=true?format=pdf'`;
        
        const { stdout, stderr } = await execAsync(curlCommand);
        
        // Change back to original directory
        process.chdir(currentDir);
        
        // if (stderr) {
        //     throw new Error(`Curl command failed: ${stderr}`);
        // }

        // Read the PDF from temp directory
        const pdfBuffer = await readFile(outputPdfPath);

        if (!pdfBuffer.length) {
            return "Error: No PDF content received from conversion service";
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
            return 'Upload failed: ' + 
                    (Array.isArray(uploadResponse) ? uploadResponse[0].error?.message : 'Unknown error');
        }

        const fileUrl = uploadResponse[0].data?.url;
        if (!fileUrl) return 'No file URL returned from upload';

        await Logger.info('LaTeX successfully converted and uploaded', {
            fileName,
            fileSize: pdfBuffer.length,
            fileUrl
        });

        return fileUrl;

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