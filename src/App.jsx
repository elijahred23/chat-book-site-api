import { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ChatBookApp from './ChatBookApp.jsx';
import ApiCheck from './ApiCheck';
import ProgressBar from './ui/ProgressBar';
import ChatTemplate from './ChatTemplate';
import YouTubeTranscript from './YouTubeTranscript';
import Wiki from './Wiki';
import GptPromptComponent from './ChatGPT';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  const toggleChat = () => setIsChatOpen(prev => !prev);
  const toggleWidth = () => setIsFullWidth(prev => !prev);

  return (
    <>
      <div>
        <BrowserRouter>
          <h1>Eli GPT</h1>

          <div className='nav-links'>
            <NavLink to='/chatBook'>Chat Book</NavLink>
            <NavLink to='/youTubeTranscript'>YouTube Transcript</NavLink>
            <NavLink to='/wiki'>Wiki</NavLink>
            <NavLink to='/apiCheck'>API Check</NavLink>
            <button onClick={toggleChat} className='chat-toggle-btn'>
              {isChatOpen ? 'Close Assistant ❌' : 'Ask AI 💬'}
            </button>
          </div>

          <div className="content">
            <Routes>
              <Route path="/chatBook" element={<ChatBookApp />} />
              <Route path="/apiCheck" element={<ApiCheck />} />
              <Route path="/progressBar" element={<ProgressBar progress={100} />} />
              <Route path="/chatTemplate" element={<ChatTemplate />} />
              <Route path="/youTubeTranscript" element={<YouTubeTranscript />} />
              <Route path="/wiki" element={<Wiki />} />
            </Routes>
          </div>


          {/* Slide-out ChatGPT assistant */}
          <div className={`chat-drawer ${isChatOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
            <div className="chat-drawer-header">
              <div>
                <button className="width-toggle-btn" onClick={toggleWidth}>
                  {isFullWidth ? '↔ Half Width' : '↔ Full Width'}
                </button>
              </div>
              <div>
                <button className="close-chat-btn" onClick={toggleChat}>
                  ✖
                </button>
              </div>
            </div>
            <GptPromptComponent />
          </div>

        </BrowserRouter>
      </div>
    </>
  );
}

export default App;
