import React, { useRef } from 'react';

const AutoScroller = ({ children }) => {
    const containerRef = useRef(null);

    return (
        <div
            ref={containerRef}
            style={{
                overflowY: 'auto',
                maxHeight: '80vh',
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
            }}
        >
            {React.Children.map(children, (child, i) => (
                <div
                    key={i}
                    style={{
                        marginBottom: '1rem',
                        maxWidth: '100%',
                        overflowX: 'auto',
                    }}
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

export default AutoScroller;
