import React, { useState } from 'react';
import { actions, useAppDispatch } from '../context/AppContext';

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
  const dispatch = useAppDispatch();

  const handleCopy = async () => {
    const plainText = stripMarkdown(text);
    dispatch(actions.setCopyText(plainText));
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
    <button
      onClick={handleCopy}
      className={className}
      style={{
        minWidth: '100px', // ensure consistent width
        textAlign: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ display: 'inline-block', width: '100%' }}>
        {copied ? '✅ Copied!' : buttonText}
      </span>
    </button>
  );
};

export default CopyButton;
