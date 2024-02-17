import React, { useState, useEffect } from 'react';
import './ProgressBar.css'; // CSS file for styling

const ProgressBar = ({progress}) => {


  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
};

export default ProgressBar;
