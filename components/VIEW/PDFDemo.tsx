"use client";
import { useState } from 'react';
import DownloadOrderListView from './DownloadOrderListView';
import PDFPreview from './PDFPreview';

export default function PDFDemo() {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const handlePDFGenerated = (blob: Blob) => {
    setPdfBlob(blob);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4">
        <DownloadOrderListView 
          label="Preview Only" 
          mode="preview"
          onPDFGenerated={handlePDFGenerated}
          className="btn-primary"
        />
        <DownloadOrderListView 
          label="Download Only" 
          mode="download"
          className="btn-secondary"
        />
        <DownloadOrderListView 
          label="Preview & Download" 
          mode="both"
          onPDFGenerated={handlePDFGenerated}
          className="btn-accent"
        />
      </div>
      
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">PDF Preview</h3>
        <PDFPreview 
          pdfBlob={pdfBlob} 
          height="500px"
          className="w-full"
        />
      </div>
    </div>
  );
}


