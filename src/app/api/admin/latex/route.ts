import { latexToPdfUrl } from '@/lib/latex-to-pdf';
import { Logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const latex = body.latex;

    if (!latex || typeof latex !== 'string') {
      return Response.json({ error: 'Invalid LaTeX input' }, { status: 400 });
    }

    const pdfUrl = await latexToPdfUrl(latex);

    return Response.json({ url: pdfUrl });
  } catch (error) {
    await Logger.error('LaTeX generation API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return Response.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 