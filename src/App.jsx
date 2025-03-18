import { useState } from 'react'
import './App.css'
import {BrowserRouter, Routes, Route, NavLink} from 'react-router-dom';
import ChatBookApp from './ChatBookApp.jsx';
import ApiCheck from './ApiCheck';
import ChatGPT from './ChatGPT';
import ProgressBar from './ui/ProgressBar';
import ChatTemplate from './ChatTemplate';
import YouTubeTranscript from './YouTubeTranscript';

function App(){
  return (
    <>
    <div>
    <BrowserRouter>
      <h1>Eli GPT</h1>
      <div className='nav-links'>
        <NavLink to='/chatBook'>Chat Book</NavLink>
        <NavLink to='/chatGPT'>Chat GPT</NavLink>
        <NavLink to='/youTubeTranscript'>YouTube Transcript</NavLink>
        {/* <NavLink to='/chatTemplate'>Chat Template</NavLink> */}
        <NavLink to='/apiCheck'>API Check</NavLink>
      </div>
      <div className="content">
        <Routes>
          <Route path="/chatBook" element={<ChatBookApp />} />
          <Route path="/apiCheck" element={<ApiCheck />} />
          <Route path="/chatGPT" element={<ChatGPT />} />
          <Route path="/progressBar" element={<ProgressBar progress={100} />} />
          <Route path="/chatTemplate" element={<ChatTemplate />} />
          <Route path="/youTubeTranscript" element={<YouTubeTranscript />} />
        </Routes>
      </div>
    </BrowserRouter>   
    </div> 
    </>
  )
}



export default App;