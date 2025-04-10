import React from 'react';

const PasteButton = ({ setPasteText, children = 'Paste' }) => {
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPasteText(text);
        } catch (err) {
            alert('Clipboard access denied or not supported.');
        }
    };

    return <button onClick={handlePaste}>{children}</button>;
};

export default PasteButton;
