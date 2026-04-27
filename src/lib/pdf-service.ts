import { PDFParse } from 'pdf-parse';

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
