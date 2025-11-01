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
import Quran from './Quran.jsx';
import TypingTest from './TypingText.jsx';
import LoopingTTS from './LoopingTTS.jsx';
import Teleprompter from './Teleprompter.jsx';
import FlashCardApp from './FlashCardApp.jsx';
import PlantUMLViewer from './PlantUML.jsx';

function App() {
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [isTTSOpen, setIsTTSOpen] = useState(false);
  const [showFloatingBtns, setShowFloatingBtns] = useState(true); // NEW state
  const dispatch = useAppDispatch();
  const { isChatOpen, isTeleprompterOpen } = useAppState();

  const toggleChat = () => dispatch(actions.setIsChatOpen(!isChatOpen));
  const toggleTTS = () => setIsTTSOpen(prev => !prev);
  const toggleWidth = () => setIsFullWidth(prev => !prev);
  const setIsTeleprompterOpen = (newValue) => {
    dispatch(actions.setIsTeleprompterOpen(newValue));
  }

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
          <h1>Eli Himi GPT</h1>

          <div className="dropdown-nav">
            <button className="dropdown-toggle">Menu ▾</button>
            <div className="dropdown-menu">
              <NavLink to="/chatBook" activeClassName="active">Chat Book</NavLink>
              <NavLink to="/youTubeTranscript" activeClassName="active">YouTube Transcript</NavLink>
              <NavLink to="/typingTest" activeClassName="active">Typing Test</NavLink>
              <NavLink to="/flashCards" activeClassName="active">Flash Cards</NavLink>
              <NavLink to="/htmlBuilder" activeClassName="active">HTML Builder</NavLink>
              <NavLink to="/Quran" activeClassName="active">Quran</NavLink>
              <NavLink to="/plantUML" activeClassName="active">PlantUML</NavLink>
              <NavLink to="/apiCheck" activeClassName="active">Settings</NavLink>
            </div>
          </div>

          {/* Floating Buttons */}
          <div className="floating-chat-container">
            {/* Small toggle button */}
            <button
              onClick={() => setShowFloatingBtns(prev => !prev)}
              className="floating-toggle-btn"
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#444",
                color: "#fff",
                fontSize: "18px",
                zIndex: 1000
              }}
            >
              {showFloatingBtns ? "–" : "+"}
            </button>

            {/* Other floating buttons, only visible if toggled on */}
            {showFloatingBtns && (
              <>
                <button onClick={toggleChat} className="chat-toggle-btn floating-chat-btn">
                  {isChatOpen ? '❌' : '💬 Ask AI'}
                </button>
                <button onClick={toggleTTS} className="chat-toggle-btn floating-chat-btn">
                  {isTTSOpen ? '❌' : '🔊 TTS'}
                </button>
                <button onClick={()=>setIsTeleprompterOpen(true)} className="chat-toggle-btn floating-chat-btn">
                  {isTeleprompterOpen ? '❌' : '📜 Teleprompter'}
                </button>
              </>
            )}
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
              <Route path="/Quran" element={<Quran />} />
              <Route path="/typingTest" element={<TypingTest />} />
              <Route path="/flashCards" element={<FlashCardApp/>} />
              <Route path="/plantUML" element={<PlantUMLViewer />} />
            </Routes>
          </div>

          {/* Slide-out components */}
          <div className={`chat-drawer ${isChatOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
            <div className="chat-drawer-header">
              <button className="width-toggle-btn" onClick={toggleWidth}>
                {isFullWidth ? '↔ Half Width' : '↔ Full Width'}
              </button>
              <button className="close-chat-btn" onClick={toggleChat}>✖</button>
            </div>
            <GptPromptComponent />
          </div>

          <div className={`chat-drawer ${isTTSOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
            <div className="chat-drawer-header">
              <button className="width-toggle-btn" onClick={toggleWidth}>
                {isFullWidth ? '↔ Half Width' : '↔ Full Width'}
              </button>
              <button className="close-chat-btn" onClick={toggleTTS}>✖</button>
            </div>
            <LoopingTTS />
          </div>

          <div className={`chat-drawer ${isTeleprompterOpen ? 'open' : ''} ${isFullWidth ? 'full' : 'half'}`}>
            <div className="chat-drawer-header">
              <button className="width-toggle-btn" onClick={()=>setIsTeleprompterOpen(false)}>
                ✖ Close Teleprompter
              </button>
            </div>
            <Teleprompter />
          </div>
        </BrowserRouter>

        <DownloadCopyTextFile />
      <TextSelectionTooltip
        onAskAI={(text) => {
          dispatch(actions.setIsChatOpen(true));
          dispatch(actions.setSelectedText(text));
        }}
        onSendToTTS={(text) => {
          dispatch(actions.setTtsText(text));
          setIsTTSOpen(true);
        }}
        onSendToTeleprompter={(text) => {
          dispatch(actions.setTeleprompterText(text));
          setIsTeleprompterOpen(true);
        }}
      />

      </div>
    </>
  );
}

export default App;
