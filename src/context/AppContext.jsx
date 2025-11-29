// context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  copyText: '',
  htmlBuilder: { input: '', generatedHTML: '' },
  isChatOpen: false,
  chatPrompt: '',
  selectedText: '',
  ttsText: '',
  teleprompterText: '',
  transcriptTypes: ['internal', 'external'],
  selectedTranscriptType: 'internal',
  isTeleprompterOpen: false,
  isTTSOpen: false,
  isPlantUMLOpen: false,
  plantUMLPrompt: '',
  isPodcastTTSOpen: false,
  podcastTTSPrompt: '',
  isJSGeneratorOpen: false,
  jsGeneratorPrompt: '',
  isChatBookOpen: false,
  chatBookSubject: '',
  isYouTubeOpen: false,
  youtubeSearchText: '',
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
  SET_IS_PLANTUML_OPEN: 'SET_IS_PLANTUML_OPEN',
  SET_PLANT_UML_PROMPT: 'SET_PLANT_UML_PROMPT',
  SET_IS_PODCAST_TTS_OPEN: 'SET_IS_PODCAST_TTS_OPEN',
  SET_PODCAST_TTS_PROMPT: 'SET_PODCAST_TTS_PROMPT',
  SET_IS_JS_GENERATOR_OPEN: 'SET_IS_JS_GENERATOR_OPEN',
  SET_JS_GENERATOR_PROMPT: 'SET_JS_GENERATOR_PROMPT',
  SET_IS_CHAT_BOOK_OPEN: 'SET_IS_CHAT_BOOK_OPEN',
  SET_CHAT_BOOK_SUBJECT: 'SET_CHAT_BOOK_SUBJECT',
  SET_IS_YOUTUBE_OPEN: 'SET_IS_YOUTUBE_OPEN',
  SET_YOUTUBE_SEARCH_TEXT: 'SET_YOUTUBE_SEARCH_TEXT',
};

// ✅ closes all open UI panels
const closeAllPanels = (state) => ({
  ...state,
  isChatOpen: false,
  isTeleprompterOpen: false,
  isTTSOpen: false,
  isPlantUMLOpen: false,
  isPodcastTTSOpen: false,
  isJSGeneratorOpen: false,
  isChatBookOpen: false,
  isYouTubeOpen: false,
});

function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_COPY_TEXT:
      return { ...state, copyText: action.payload };

    case actionTypes.SET_HTML_INPUT:
      return { ...state, htmlBuilder: { ...state.htmlBuilder, input: action.payload } };

    case actionTypes.SET_GENERATED_HTML:
      return { ...state, htmlBuilder: { ...state.htmlBuilder, generatedHTML: action.payload } };

    case actionTypes.SET_IS_CHAT_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isChatOpen: true }
        : { ...state, isChatOpen: false };

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
      return action.payload
        ? { ...closeAllPanels(state), isTeleprompterOpen: true }
        : { ...state, isTeleprompterOpen: false };

    case actionTypes.SET_IS_TTS_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isTTSOpen: true }
        : { ...state, isTTSOpen: false };

    case actionTypes.SET_IS_PLANTUML_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isPlantUMLOpen: true }
        : { ...state, isPlantUMLOpen: false };

    case actionTypes.SET_PLANT_UML_PROMPT:
      return { ...state, plantUMLPrompt: action.payload };

    case actionTypes.SET_IS_PODCAST_TTS_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isPodcastTTSOpen: true }
        : { ...state, isPodcastTTSOpen: false };
      
    case actionTypes.SET_IS_JS_GENERATOR_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isJSGeneratorOpen: true }
        : { ...state, isJSGeneratorOpen: false };

    case actionTypes.SET_JS_GENERATOR_PROMPT:
      return { ...state, jsGeneratorPrompt: action.payload };

    case actionTypes.SET_IS_CHAT_BOOK_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isChatBookOpen: true }
        : { ...state, isChatBookOpen: false };

    case actionTypes.SET_CHAT_BOOK_SUBJECT:
      return { ...state, chatBookSubject: action.payload };

    case actionTypes.SET_PODCAST_TTS_PROMPT:
      return { ...state, podcastTTSPrompt: action.payload };

    case actionTypes.SET_IS_YOUTUBE_OPEN:
      return action.payload
        ? { ...closeAllPanels(state), isYouTubeOpen: true }
        : { ...state, isYouTubeOpen: false };

    case actionTypes.SET_YOUTUBE_SEARCH_TEXT:
      return { ...state, youtubeSearchText: action.payload };

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
  setIsYouTubeOpen: (open) => ({ type: actionTypes.SET_IS_YOUTUBE_OPEN, payload: open }),
  setYouTubeSearchText: (text) => ({ type: actionTypes.SET_YOUTUBE_SEARCH_TEXT, payload: text }),
};
