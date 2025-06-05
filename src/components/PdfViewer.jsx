import React, { useState } from 'react';
import { FiDownload, FiExternalLink, FiX } from 'react-icons/fi';

const PdfViewer = ({ url, onClose }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback
      window.open(url, '_blank');
    }
  };

  const openInNewTab = () => {
    window.open(url, '_blank');
  };

  const getViewerContent = () => {
    if (!url) return <p>No document URL provided.</p>;

    const fileExtension = url.split('.').pop().toLowerCase();
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      url
    )}`;

    switch (fileExtension) {
      case 'pdf':
        return (
          <iframe
            src={url}
            title='PDF Viewer'
            className='w-full h-full border-0 rounded-md'
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
        );
      case 'doc':
      case 'docx':
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
        return (
          <iframe
            src={officeViewerUrl}
            title='Office Viewer'
            className='w-full h-full border-0 rounded-md'
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
        );
      default:
        return (
          <div className='flex flex-col items-center justify-center h-full'>
            <p className='mb-4'>Preview not available for this file type</p>
            <button
              onClick={handleDownload}
              className='flex items-center gap-2 text-blue-600 hover:underline'
            >
              <FiDownload /> Download File
            </button>
          </div>
        );
    }
  };

  return (
    <div className='p-2 h-full rounded-md flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-xl font-semibold'>Document Viewer</h3>
        <div className='flex items-center gap-3'>
          {url && (
            <button onClick={openInNewTab}>
              <FiExternalLink
                size={18}
                className='text-gray-600 hover:text-gray-800'
              />
            </button>
          )}
          {url && (
            <button onClick={handleDownload} title='Download'>
              <FiDownload
                size={18}
                className='text-gray-600 hover:text-gray-800'
              />
            </button>
          )}
          <button onClick={onClose} title='Close'>
            <FiX size={20} className='text-gray-600 hover:text-gray-800' />
          </button>
        </div>
      </div>

      <div className='flex-1 relative'>
        {isLoading && !hasError && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <p className='text-gray-600'>Loading document...</p>
          </div>
        )}

        {hasError ? (
          <div className='h-full flex flex-col items-center justify-center'>
            <p className='text-red-600 mb-4'>Failed to load document</p>
            <button
              onClick={handleDownload}
              className='flex items-center gap-2 text-blue-600 hover:underline'
            >
              <FiDownload /> Download Instead
            </button>
          </div>
        ) : (
          getViewerContent()
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
