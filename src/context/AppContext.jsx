// context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  copyText: '',
  htmlBuilder: { input: '', generatedHTML: '' },
  drawerStack: [],
  isChatOpen: false,
  chatPrompt: '',
  selectedText: '',
  ttsText: '',
  teleprompterText: '',
  transcriptTypes: ['internal', 'external'],
  selectedTranscriptType: 'internal',
  isTeleprompterOpen: false,
  isTTSOpen: false,
  ttsAutoPlay: false,
  isPlantUMLOpen: false,
  plantUMLPrompt: '',
  isPodcastTTSOpen: false,
  podcastTTSPrompt: '',
  isJSGeneratorOpen: false,
  jsGeneratorPrompt: '',
  isChatBookOpen: false,
  chatBookSubject: '',
  isArchitectureOpen: false,
  architecturePrompt: '',
  isYouTubeOpen: false,
  youtubeSearchText: '',
  isHtmlBuilderOpen: false,
  isTypingOpen: false,
  typingSource: '',
  flashcardPrompt: '',
  isIframeOpen: false,
  iframeSearchText: '',
};

const actionTypes = {
  SET_COPY_TEXT: 'SET_COPY_TEXT',
  SET_HTML_INPUT: 'SET_HTML_INPUT',
  SET_GENERATED_HTML: 'SET_GENERATED_HTML',
  SET_IS_CHAT_OPEN: 'SET_IS_CHAT_OPEN',
  SET_CHAT_PROMPT: 'SET_CHAT_PROMPT',
  SET_SELECTED_TEXT: 'SET_SELECTED_TEXT',
  SET_TTS_TEXT: 'SET_TTS_TEXT',
  SET_TELEPROMPTER_TEXT: 'SET_TELEPROMPTER_TEXT',
  SET_SELECTED_TRANSCRIPT_TYPE: 'SET_SELECTED_TRANSCRIPT_TYPE',
  SET_IS_TELEPROMPTER_OPEN: 'SET_IS_TELEPROMPTER_OPEN',
  SET_IS_TTS_OPEN: 'SET_IS_TTS_OPEN',
  SET_TTS_AUTOPLAY: 'SET_TTS_AUTOPLAY',
  SET_IS_PLANTUML_OPEN: 'SET_IS_PLANTUML_OPEN',
  SET_PLANT_UML_PROMPT: 'SET_PLANT_UML_PROMPT',
  SET_IS_PODCAST_TTS_OPEN: 'SET_IS_PODCAST_TTS_OPEN',
  SET_PODCAST_TTS_PROMPT: 'SET_PODCAST_TTS_PROMPT',
  SET_IS_JS_GENERATOR_OPEN: 'SET_IS_JS_GENERATOR_OPEN',
  SET_JS_GENERATOR_PROMPT: 'SET_JS_GENERATOR_PROMPT',
  SET_IS_CHAT_BOOK_OPEN: 'SET_IS_CHAT_BOOK_OPEN',
  SET_CHAT_BOOK_SUBJECT: 'SET_CHAT_BOOK_SUBJECT',
  SET_IS_ARCHITECTURE_OPEN: 'SET_IS_ARCHITECTURE_OPEN',
  SET_ARCHITECTURE_PROMPT: 'SET_ARCHITECTURE_PROMPT',
  SET_IS_YOUTUBE_OPEN: 'SET_IS_YOUTUBE_OPEN',
  SET_YOUTUBE_SEARCH_TEXT: 'SET_YOUTUBE_SEARCH_TEXT',
  SET_IS_HTML_BUILDER_OPEN: 'SET_IS_HTML_BUILDER_OPEN',
  SET_IS_TYPING_OPEN: 'SET_IS_TYPING_OPEN',
  SET_TYPING_SOURCE: 'SET_TYPING_SOURCE',
  SET_FLASHCARD_PROMPT: 'SET_FLASHCARD_PROMPT',
  SET_IS_IFRAME_OPEN: 'SET_IS_IFRAME_OPEN',
  SET_IFRAME_SEARCH_TEXT: 'SET_IFRAME_SEARCH_TEXT',
};

// ✅ closes all open UI panels (stack managed separately)
const closeAllPanels = (state) => ({
  ...state,
  isChatOpen: false,
  isTeleprompterOpen: false,
  isTTSOpen: false,
  isPlantUMLOpen: false,
  isPodcastTTSOpen: false,
  isJSGeneratorOpen: false,
  isChatBookOpen: false,
  isArchitectureOpen: false,
  isYouTubeOpen: false,
  isHtmlBuilderOpen: false,
  isTypingOpen: false,
  isIframeOpen: false,
});

const drawerKeyToState = {
  chat: 'isChatOpen',
  teleprompter: 'isTeleprompterOpen',
  tts: 'isTTSOpen',
  plantuml: 'isPlantUMLOpen',
  podcast: 'isPodcastTTSOpen',
  jsgen: 'isJSGeneratorOpen',
  chatbook: 'isChatBookOpen',
  architecture: 'isArchitectureOpen',
  youtube: 'isYouTubeOpen',
  html: 'isHtmlBuilderOpen',
  typing: 'isTypingOpen',
  iframe: 'isIframeOpen',
};

const activateDrawer = (state, key) => {
  const flag = drawerKeyToState[key];
  if (!flag) return state;
  const newStack = [...state.drawerStack.filter((k) => k !== key), key];
  const cleared = closeAllPanels(state);
  return { ...cleared, [flag]: true, drawerStack: newStack };
};

const deactivateDrawer = (state, key) => {
  const flag = drawerKeyToState[key];
  if (!flag) return state;
  const newStack = state.drawerStack.filter((k) => k !== key);
  const last = newStack[newStack.length - 1];
  let nextState = { ...state, [flag]: false, drawerStack: newStack };
  if (last) {
    const reopenFlag = drawerKeyToState[last];
    if (reopenFlag) {
      const cleared = closeAllPanels(state);
      nextState = { ...cleared, [reopenFlag]: true, drawerStack: newStack };
    }
  }
  return nextState;
};

function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_COPY_TEXT:
      return { ...state, copyText: action.payload };

    case actionTypes.SET_HTML_INPUT:
      return { ...state, htmlBuilder: { ...state.htmlBuilder, input: action.payload } };

    case actionTypes.SET_GENERATED_HTML:
      return { ...state, htmlBuilder: { ...state.htmlBuilder, generatedHTML: action.payload } };

    case actionTypes.SET_IS_CHAT_OPEN:
      return action.payload ? activateDrawer(state, 'chat') : deactivateDrawer(state, 'chat');

    case actionTypes.SET_CHAT_PROMPT:
      return { ...state, chatPrompt: action.payload };

    case actionTypes.SET_SELECTED_TEXT:
      return { ...state, selectedText: action.payload };

    case actionTypes.SET_TTS_TEXT:
      return { ...state, ttsText: action.payload };

    case actionTypes.SET_TELEPROMPTER_TEXT:
      return { ...state, teleprompterText: action.payload };

    case actionTypes.SET_SELECTED_TRANSCRIPT_TYPE:
      return { ...state, selectedTranscriptType: action.payload };

    case actionTypes.SET_IS_TELEPROMPTER_OPEN:
      return action.payload ? activateDrawer(state, 'teleprompter') : deactivateDrawer(state, 'teleprompter');

    case actionTypes.SET_IS_TTS_OPEN:
      return action.payload ? activateDrawer(state, 'tts') : deactivateDrawer(state, 'tts');

    case actionTypes.SET_TTS_AUTOPLAY:
      return { ...state, ttsAutoPlay: action.payload };

    case actionTypes.SET_IS_PLANTUML_OPEN:
      return action.payload ? activateDrawer(state, 'plantuml') : deactivateDrawer(state, 'plantuml');

    case actionTypes.SET_PLANT_UML_PROMPT:
      return { ...state, plantUMLPrompt: action.payload };

    case actionTypes.SET_IS_PODCAST_TTS_OPEN:
      return action.payload ? activateDrawer(state, 'podcast') : deactivateDrawer(state, 'podcast');
      
    case actionTypes.SET_IS_JS_GENERATOR_OPEN:
      return action.payload ? activateDrawer(state, 'jsgen') : deactivateDrawer(state, 'jsgen');

    case actionTypes.SET_JS_GENERATOR_PROMPT:
      return { ...state, jsGeneratorPrompt: action.payload };

    case actionTypes.SET_IS_CHAT_BOOK_OPEN:
      return action.payload ? activateDrawer(state, 'chatbook') : deactivateDrawer(state, 'chatbook');

    case actionTypes.SET_CHAT_BOOK_SUBJECT:
      return { ...state, chatBookSubject: action.payload };

    case actionTypes.SET_IS_ARCHITECTURE_OPEN:
      return action.payload ? activateDrawer(state, 'architecture') : deactivateDrawer(state, 'architecture');

    case actionTypes.SET_ARCHITECTURE_PROMPT:
      return { ...state, architecturePrompt: action.payload };

    case actionTypes.SET_PODCAST_TTS_PROMPT:
      return { ...state, podcastTTSPrompt: action.payload };

    case actionTypes.SET_IS_YOUTUBE_OPEN:
      return action.payload ? activateDrawer(state, 'youtube') : deactivateDrawer(state, 'youtube');

    case actionTypes.SET_YOUTUBE_SEARCH_TEXT:
      return { ...state, youtubeSearchText: action.payload };

    case actionTypes.SET_IS_TYPING_OPEN:
      return action.payload ? activateDrawer(state, 'typing') : deactivateDrawer(state, 'typing');

    case actionTypes.SET_TYPING_SOURCE:
      return { ...state, typingSource: action.payload };

    case actionTypes.SET_IS_HTML_BUILDER_OPEN:
      return action.payload ? activateDrawer(state, 'html') : deactivateDrawer(state, 'html');

    case actionTypes.SET_FLASHCARD_PROMPT:
      return { ...state, flashcardPrompt: action.payload };

    case actionTypes.SET_IS_IFRAME_OPEN:
      return action.payload ? activateDrawer(state, 'iframe') : deactivateDrawer(state, 'iframe');

    case actionTypes.SET_IFRAME_SEARCH_TEXT:
      console.log({action})
      return { ...state, iframeSearchText: action.payload };

    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
}

const AppStateContext = createContext();
const AppDispatchContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);

export const actions = {
  setCopyText: (text) => ({ type: actionTypes.SET_COPY_TEXT, payload: text }),
  setHtmlInput: (input) => ({ type: actionTypes.SET_HTML_INPUT, payload: input }),
  setGeneratedHtml: (html) => ({ type: actionTypes.SET_GENERATED_HTML, payload: html }),
  setIsChatOpen: (open) => ({ type: actionTypes.SET_IS_CHAT_OPEN, payload: open }),
  setChatPrompt: (prompt) => ({ type: actionTypes.SET_CHAT_PROMPT, payload: prompt }),
  setSelectedText: (text) => ({ type: actionTypes.SET_SELECTED_TEXT, payload: text }),
  setTtsText: (text) => ({ type: actionTypes.SET_TTS_TEXT, payload: text }),
  setTtsAutoplay: (val) => ({ type: actionTypes.SET_TTS_AUTOPLAY, payload: val }),
  setTeleprompterText: (text) => ({ type: actionTypes.SET_TELEPROMPTER_TEXT, payload: text }),
  setSelectedTranscriptType: (type) => ({ type: actionTypes.SET_SELECTED_TRANSCRIPT_TYPE, payload: type }),
  setIsTeleprompterOpen: (open) => ({ type: actionTypes.SET_IS_TELEPROMPTER_OPEN, payload: open }),
  setIsTTSOpen: (open) => ({ type: actionTypes.SET_IS_TTS_OPEN, payload: open }),
  setIsPlantUMLOpen: (open) => ({ type: actionTypes.SET_IS_PLANTUML_OPEN, payload: open }),
  setPlantUMLPrompt: (prompt) => ({ type: actionTypes.SET_PLANT_UML_PROMPT, payload: prompt }),
  setIsPodcastTTSOpen: (open) => ({ type: actionTypes.SET_IS_PODCAST_TTS_OPEN, payload: open }),
  setPodcastTTSPrompt: (prompt) => ({ type: actionTypes.SET_PODCAST_TTS_PROMPT, payload: prompt }),
  setIsJSGeneratorOpen: (open) => ({ type: actionTypes.SET_IS_JS_GENERATOR_OPEN, payload: open }),
  setJSGeneratorPrompt: (prompt) => ({ type: actionTypes.SET_JS_GENERATOR_PROMPT, payload: prompt }),
  setIsChatBookOpen: (open) => ({ type: actionTypes.SET_IS_CHAT_BOOK_OPEN, payload: open }),
  setChatBookSubject: (subject) => ({ type: actionTypes.SET_CHAT_BOOK_SUBJECT, payload: subject }),
  setIsArchitectureOpen: (open) => ({ type: actionTypes.SET_IS_ARCHITECTURE_OPEN, payload: open }),
  setArchitecturePrompt: (prompt) => ({ type: actionTypes.SET_ARCHITECTURE_PROMPT, payload: prompt }),
  setIsYouTubeOpen: (open) => ({ type: actionTypes.SET_IS_YOUTUBE_OPEN, payload: open }),
  setYouTubeSearchText: (text) => ({ type: actionTypes.SET_YOUTUBE_SEARCH_TEXT, payload: text }),
  setIsTypingOpen: (open) => ({ type: actionTypes.SET_IS_TYPING_OPEN, payload: open }),
  setTypingSource: (text) => ({ type: actionTypes.SET_TYPING_SOURCE, payload: text }),
  setIsHtmlBuilderOpen: (open) => ({ type: actionTypes.SET_IS_HTML_BUILDER_OPEN, payload: open }),
  setFlashcardPrompt: (text) => ({ type: actionTypes.SET_FLASHCARD_PROMPT, payload: text }),
  setIsIframeOpen: (open) => ({ type: actionTypes.SET_IS_IFRAME_OPEN, payload: open }),
  setIframeSearchText: (text) => { 
    console.log({text})
    return { type: actionTypes.SET_IFRAME_SEARCH_TEXT, payload: text }},
};
