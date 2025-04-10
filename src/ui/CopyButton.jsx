import React, { useState } from 'react';

// Utility function to remove basic Markdown syntax
const stripMarkdown = (markdownText) => {
  return markdownText
    .replace(/(\*\*|__)(.*?)\1/g, '$2')           // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')              // italic
    .replace(/`([^`]*)`/g, '$1')                  // inline code
    .replace(/~~(.*?)~~/g, '$1')                  // strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')     // images
    .replace(/^>+\s?/gm, '')                      // blockquotes
    .replace(/^#+\s+(.*)/gm, '$1')                // headers
    .replace(/^-+\s*/gm, '')                      // list items
    .replace(/\n{2,}/g, '\n')                     // excess newlines
    .trim();
};

const CopyButton = ({ text, buttonText = 'Copy', onCopy, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const plainText = stripMarkdown(text);
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      if (onCopy) onCopy(plainText);
      setTimeout(() => setCopied(false), 1500); // reset after 1.5s
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button onClick={handleCopy} className={className}>
      {copied ? '✅ Copied!' : buttonText}
    </button>
  );
};

export default CopyButton;
