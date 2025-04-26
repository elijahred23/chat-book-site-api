import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ChatBookApp from './ChatBookApp.jsx';
import ApiCheck from './ApiCheck';
import ProgressBar from './ui/ProgressBar';
import ChatTemplate from './ChatTemplate';
import YouTubeTranscript from './YouTubeTranscript';
import Wiki from './Wiki';
import GptPromptComponent from './ChatGPT';
import TextSelectionTooltip from './TextSelectionTooltip';
import DownloadCopyTextFile from './DownloadCopyTextFile.jsx';
import HtmlBuilder from './HtmlBuilder';
import WebBrowser from './WebBrowser.jsx';
import { useAppDispatch, useAppState, actions} from './context/AppContext.jsx';

function App() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const dispatch = useAppDispatch();
  const {isChatOpen} = useAppState();

  const toggleChat = () => dispatch(actions.setIsChatOpen(!isChatOpen));
  const toggleWidth = () => setIsFullWidth(prev => !prev);

  useEffect(() => {
    const savedText = localStorage.getItem('selectedText');
    if (savedText) {
      dispatch(actions.setSelectedText(savedText));
    }
  }, []);

  return (
    <>
      <div>
        <BrowserRouter>
          <h1>Eli GPT</h1>

          <div className='nav-links'>
            <NavLink to='/chatBook'>Chat Book</NavLink>
            <NavLink to='/youTubeTranscript'>YouTube Transcript</NavLink>
            <NavLink to='/webBrowser'>Web Browser</NavLink>
            <NavLink to='/htmlBuilder'>HTML Builder</NavLink>
            {/* <NavLink to='/apiCheck'>API Check</NavLink> */}

            <button onClick={toggleChat} className='chat-toggle-btn floating-chat-btn'>
              {isChatOpen ? '❌' : '💬 Ask AI'}
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
              <Route path="/htmlBuilder" element={<HtmlBuilder />} />
              <Route path="/webBrowser" element={<WebBrowser />} />
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
        <DownloadCopyTextFile />
        <TextSelectionTooltip 
        onAskAI={(text) => {
          localStorage.setItem('selectedText', text);
          dispatch(actions.setIsChatOpen(true));
          dispatch(actions.setSelectedText(text)) 
        }} />
      </div>
    </>
  );
}

export default App;
