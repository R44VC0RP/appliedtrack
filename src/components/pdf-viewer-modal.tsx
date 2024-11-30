import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js`;

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function PDFViewerModal({ isOpen, onClose, fileUrl, fileName }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setErrorMessage("");
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF Load Error:', error);
    setIsLoading(false);
    setErrorMessage(error.message);
  }

  const nextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const previousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  // Reset states when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    setPageNumber(1);
    setIsLoading(true);
    setErrorMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw]">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <p>Failed to load PDF</p>
                {errorMessage && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    Error: {errorMessage}
                  </p>
                )}
                <p className="text-sm mt-2 text-muted-foreground">
                  URL: {fileUrl}
                </p>
              </div>
            }
          >
            {numPages > 0 && (
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={false}
                className="max-h-[70vh] overflow-auto"
                scale={1.2}
              />
            )}
          </Document>
          {numPages > 0 && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={previousPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                onClick={nextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function PDFViewerInline({ fileUrl, fileName }: { fileUrl: string, fileName: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setErrorMessage("");
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF Load Error:', error);
    setIsLoading(false);
    setErrorMessage(error.message);
  }

  const nextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const previousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center p-8 text-destructive">
            <p>Failed to load PDF</p>
            {errorMessage && (
              <p className="text-sm mt-2 text-muted-foreground">
                Error: {errorMessage}
              </p>
            )}
          </div>
        }
      >
        {numPages > 0 && (
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false}
            className="max-h-[400px] overflow-auto"
            scale={1.2}
          />
        )}
      </Document>
      {numPages > 0 && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}