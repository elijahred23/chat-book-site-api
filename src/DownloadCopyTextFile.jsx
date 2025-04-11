import React, { useEffect, useState } from 'react';
import { useAppState } from './context/AppContext';

const DownloadCopyTextFile = () => {
  const [showModal, setShowModal] = useState(false);
  const [filename, setFilename] = useState('');
  const { copyText } = useAppState();
  const [visible, setVisible] = useState(copyText?.length > 0);

  const handleDownload = () => {
    if (!filename.trim()) return;

    const blob = new Blob([copyText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    setShowModal(false);
    setFilename('');
  };

  useEffect(() => {
    setVisible(copyText?.length > 0);
  }, [copyText]);

  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#007bff',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          zIndex: 9999,
          maxWidth: '200px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
        }}
        onClick={() => setShowModal(true)}
        onMouseDown={() => setShowModal(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="white"
        >
          <path d="M12 16c-.3 0-.5-.1-.7-.3l-4-4a1 1 0 111.4-1.4l2.3 2.3V4a1 1 0 112 0v8.6l2.3-2.3a1 1 0 111.4 1.4l-4 4c-.2.2-.5.3-.7.3zM5 18a1 1 0 000 2h14a1 1 0 000-2H5z" />
        </svg>
        Download Copy Text
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Enter File Name</h3>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="example_filename"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                fontSize: '14px',
              }}
            />

            <label style={{ fontWeight: 'bold', margin: '10px 0 5px' }}>Preview:</label>
            <div
              style={{
                backgroundColor: '#f4f4f4',
                padding: '10px',
                borderRadius: '4px',
                overflowY: 'auto',
                maxHeight: '300px',
                whiteSpace: 'pre-wrap',
                fontSize: '13px',
                fontFamily: 'monospace',
                border: '1px solid #ccc',
              }}
            >
              <pre style={{ margin: 0 }}>{copyText}</pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleDownload} disabled={!filename.trim()}>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadCopyTextFile;
