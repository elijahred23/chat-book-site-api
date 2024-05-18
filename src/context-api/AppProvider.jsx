import {useReducer, useContext, createContext} from 'react';


export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext) 
}

const initialAppState = {
    initialInstructionResponse: "",
    subsequentInstructionResponses: []
}
export const appActionTypes = {
    SET_INITIAL_INSTRUCTION_RESPONSE:'SET_INITIAL_INSTRUCTION_RESPONSE',
    SET_SUBSEQUENT_INSTRUCTION_RESPONSES: 'SET_SUBSEQUENT_INSTRUCTION_RESPONSES',
}
const appReducer = (state, action) => {
    switch(action.type){
        case appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE: 
            return {
                ...state,
                initialInstructionResponse: action.payload
            }
        case appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES: 
            return {
                ...state,
                subsequentInstructionResponses: action.payload
            }

    }
}

export const AppProvider = ({children}) => {
    const [state, dispatch] = useReducer(appReducer, initialAppState)

    return (<AppContext.Provider value={{state, dispatch}}>
        {children}
    </AppContext.Provider>)
}