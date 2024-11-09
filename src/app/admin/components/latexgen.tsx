'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { FaSpinner } from 'react-icons/fa';


export default function LatexGenerator() {
  const [latex, setLatex] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      if (!latex.trim()) {
        setError('Please enter LaTeX content');
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latex.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      setPdfUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    //   await Logger.error('Frontend LaTeX generation error', {
    //     error: err instanceof Error ? err.message : 'Unknown error',
    //     stack: err instanceof Error ? err.stack : undefined
    //   });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 w-full">
      <Card className="w-1/2 p-4">
        <div className="flex flex-col h-full gap-4">
          <h2 className="text-lg font-semibold">LaTeX Input</h2>
          <Textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Enter your LaTeX code here..."
            className="flex-1 min-h-[500px] font-mono"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !latex.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate PDF'
            )}
          </Button>
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </div>
      </Card>

      <Card className="w-1/2 p-4">
        <div className="flex flex-col h-full gap-4">
          <h2 className="text-lg font-semibold">PDF Preview</h2>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[500px] border rounded-md"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-[500px] border rounded-md bg-muted">
              <p className="text-muted-foreground">
                PDF preview will appear here
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
