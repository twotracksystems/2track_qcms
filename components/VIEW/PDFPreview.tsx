"use client";
import { useState, useEffect } from 'react';

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  width?: string;
  height?: string;
  className?: string;
}

export default function PDFPreview({ 
  pdfBlob, 
  width = "100%", 
  height = "600px",
  className = ""
}: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      // Cleanup function to revoke the URL when component unmounts or blob changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl('');
    }
  }, [pdfBlob]);

  return (
    <div className={`pdf-preview ${className}`}>
      {pdfUrl ? (
        <iframe 
          src={pdfUrl} 
          width={width} 
          height={height}
          style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          title="PDF Preview"
        />
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500 text-lg mb-2">No PDF Generated</div>
          <div className="text-gray-400 text-sm">Click the Download button to generate a PDF</div>
        </div>
      )}
    </div>
  );
}


