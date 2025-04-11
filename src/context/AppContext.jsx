// context/AppContext.js
import React, { createContext, useContext, useReducer } from 'react';

// Initial State
const initialState = {
    copyText: '',
};

// Action Types
const actionTypes = {
    SET_COPY_TEXT: 'SET_COPY_TEXT',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case actionTypes.SET_COPY_TEXT:
            return { ...state, copyText: action.payload };
        // Add more cases here
        default:
            console.warn(`Unhandled action type: ${action.type}`);
            return state;
    }
}

// Contexts
const AppStateContext = createContext();
const AppDispatchContext = createContext();

// Provider
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

// Hooks
export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);

// Actions
export const actions = {
    setCopyText: (text) => ({
        type: actionTypes.SET_COPY_TEXT,
        payload: text,
    })
}