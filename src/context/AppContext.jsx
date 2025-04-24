// context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
    copyText: '',
    htmlBuilder: {
        input: '',
        generatedHTML: ''
    },
    isChatOpen: false,
};

const actionTypes = {
    SET_COPY_TEXT: 'SET_COPY_TEXT',
    SET_HTML_INPUT: 'SET_HTML_INPUT',
    SET_GENERATED_HTML: 'SET_GENERATED_HTML',
    SET_IS_CHAT_OPEN: 'SET_IS_CHAT_OPEN'
};

function appReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_COPY_TEXT:
            return { ...state, copyText: action.payload };
        case actionTypes.SET_HTML_INPUT:
            return {
                ...state,
                htmlBuilder: {
                    ...state.htmlBuilder,
                    input: action.payload
                }
            };
        case actionTypes.SET_GENERATED_HTML:
            return {
                ...state,
                htmlBuilder: {
                    ...state.htmlBuilder,
                    generatedHTML: action.payload
                }
            };
        case actionTypes.SET_IS_CHAT_OPEN:
            return { ...state, isChatOpen: action.payload };
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
    setCopyText: (text) => ({
        type: actionTypes.SET_COPY_TEXT,
        payload: text
    }),
    setHtmlInput: (input) => ({
        type: actionTypes.SET_HTML_INPUT,
        payload: input
    }),
    setGeneratedHtml: (html) => ({
        type: actionTypes.SET_GENERATED_HTML,
        payload: html
    }),
    setIsChatOpen: (html) => ({
        type: actionTypes.SET_IS_CHAT_OPEN,
        payload: html
    })
};
