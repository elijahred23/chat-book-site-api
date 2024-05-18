import React, { useState, useEffect } from 'react';
import './ProgressBar.css'; // CSS file for styling

const ProgressBar = ({ progress = 0 }) => { // Set default progress to 0

  return (
    <div className="progress-container">
      <div
        className="progress-bar"
        style={{ width: `${Math.min(progress, 100)}%` }} // Clamp progress between 0 and 100
      />
    </div>
  );
};

export default ProgressBar;
