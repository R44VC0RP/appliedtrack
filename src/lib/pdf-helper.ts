import PDFParser from 'pdf2json';

import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export default class Pdf {
  public static async getPDFText(url: string): Promise<string> {
    try {
      // Download the file
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      
      // Create a temporary file
      const tempPath = join(tmpdir(), `temp-${Date.now()}.pdf`);
      await writeFile(tempPath, Buffer.from(buffer));

      // Parse the PDF
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);

        pdfParser.on("pdfParser_dataError", (errData: any) => {
          reject(errData.parserError);
        });

        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });

        pdfParser.loadPDF(tempPath);
      });
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error}`);
    }
  }
} 