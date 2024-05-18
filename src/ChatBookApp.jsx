import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import ProgressBar from "./ui/ProgressBar";
import { hostname } from "./utils/hostname";
import { appActionTypes, useAppContext } from "./context-api/AppProvider";

const baseURL = hostname;

const getValuesInLocalStorage = () => {
    const localNumSteps = localStorage.getItem('numSteps');
    const localSubject = localStorage.getItem('subject');
    const localInitialInstruction = localStorage.getItem('initialInstruction');
    const localSubsequentInstructions = localStorage.getItem('subsequentInstructions');
    const localMaxWords = localStorage.getItem('maxWords');

    return {
        numSteps: localNumSteps ? JSON.parse(localNumSteps) : 5,
        subject: localSubject ? JSON.parse(localSubject) : "" ,
        initialInstruction: localInitialInstruction ? JSON.parse(localInitialInstruction) : "" ,
        subsequentInstructions: localSubsequentInstructions ? JSON.parse(localSubsequentInstructions) : [] ,
        maxWords: localMaxWords ? JSON.parse(localMaxWords) : 500,
    }
}

export default function ChatBookApp() {
    const {state, dispatch} = useAppContext();

    const localStorageValues = getValuesInLocalStorage();

    const modes = ["chapters", "steps"];

    const [mode, setMode] = useState("steps");

    const [numSteps, setNumSteps] = useState(localStorageValues.numSteps);

    const [subject, setSubject] = useState(localStorageValues.subject);

    const [initialInstruction, setInitialInstruction] = useState(localStorageValues.initialInstruction);

    const [subsequentInstructions, setSubsequentInstructions] = useState(localStorageValues.subsequentInstructions);

    const [loading, setLoading] = useState(false);

    const [executionStarted, setExecutionStarted] = useState(false);

    const [maxWords, setMaxWords] = useState(localStorageValues.maxWords);

    const [printWhenFinished, setPrintWhenFinished] = useState(false);
    const [stepsExecuted, setStepsExecuted] = useState(0);

    const [canExecuteKey, setCanExecuteKey] = useState(false);

    const getInitialInstructionMessage = (steps = null) => {
        if (steps === null) {
            steps = numSteps;
        }
        return `Write a step by step process that has ${steps} steps total about ${subject}`;
    }
    const getExecutionInstructionMessage = (currentStep) => {
        return `write in detail how to execute step ${currentStep} from step by step process with about ${maxWords} words or more with code if necessary or more`;
    }
    const initializeSubsequentInstructions = () => {
        let newExecutionInstructions = []
        for (let currentStep = 1; currentStep <= numSteps; currentStep++) {
            let execInstruction = getExecutionInstructionMessage(currentStep);
            newExecutionInstructions.push(execInstruction);
        }
        setSubsequentInstructions(newExecutionInstructions);
    }
    const incrementStepsExecuted = () => setStepsExecuted(prev=> prev+1);

    const executeInitialInstruction = async () => {
        if(canExecuteKey){
            dispatch({type:appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: ""})
            dispatch({type:appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: []})
            let prompt = (initialInstruction);
            let hash = Math.random().toString(36).substring(2,20+2);
            prompt = `${hash} ignore hash at beginning. Do prompt: ${prompt}`
            const response = await fetch(`${baseURL}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
            const data = await response.json();
            let gptResponse = data.geminiResponse;
            incrementStepsExecuted();
            dispatch({type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: gptResponse});
        }
    }
    const executeInstructions = async () => {
        if(canExecuteKey){
            //execute initial instruction
            setLoading(true);
            setExecutionStarted(true);
            await executeInitialInstruction();
            setLoading(false);
        }
    }
    const print = () => window.print();

    const clear = () => {
        setSubject("");
        dispatch({type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: ""})
        dispatch({type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: []})
    } 

    const executeSubsequentInstructions = async () => {
        if(canExecuteKey){
            setLoading(true);
            let newResponses = [];
            await Promise.all(subsequentInstructions.map(async (currentStep, currentStepIndex) => {
                let prompt = (`using these steps: ${state.initialInstructionResponse} : ${currentStep}`);
                const response = await fetch(`${baseURL}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
                const data = await response.json();
                let gptResponse = data.geminiResponse;
                newResponses[currentStepIndex] = (gptResponse);
                incrementStepsExecuted();
            }));
            setLoading(false);
            dispatch({type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: newResponses});
        }
    }

    useEffect(() => {
        if (state.subsequentInstructionResponses?.length > 0 && printWhenFinished) {
            print();
        }
    }, [state.subsequentInstructionResponses])

    useEffect(() => {
        if (state.initialInstructionResponse !== '') {
            executeSubsequentInstructions();
        }
    }, [state.initialInstructionResponse]);

    useEffect(() => {
        if (mode === "steps") {
            let instructions = getInitialInstructionMessage(numSteps);
            setInitialInstruction(instructions);
            initializeSubsequentInstructions();
        }
    }, [numSteps, maxWords]);

    useEffect(() => {
        document.title = subject;
        let newInitialInstruction = getInitialInstructionMessage();
        setInitialInstruction(newInitialInstruction);
    }, [subject])

    useEffect(()=>{
        setCanExecuteKey(true);
    }, [initialInstruction])

    useEffect(()=>{
        setCanExecuteKey(false);
       setExecutionStarted(false); 

       return () => {
        setExecutionStarted(false); 
        setPrintWhenFinished(false);
        setCanExecuteKey(false);
       }
    }, [])

    useEffect(() => {

        return () => {
            let jsonNumSteps = JSON.stringify(numSteps);
            localStorage.setItem('numSteps', jsonNumSteps);

            let jsonSubject = JSON.stringify(subject);
            localStorage.setItem('subject', jsonSubject);

            let jsonInitialInstruction = JSON.stringify(initialInstruction);
            localStorage.setItem('initialInstruction', jsonInitialInstruction);

            let jsonSubsequentInstruction = JSON.stringify(subsequentInstructions);
            localStorage.setItem('subsequentInstructions', jsonSubsequentInstruction);

            let jsonMaxWords = JSON.stringify(maxWords);
            localStorage.setItem('maxWords', jsonMaxWords);
        }
    }, [numSteps, subject, initialInstruction, subsequentInstructions, maxWords ]);



    return (
        <>
            <div>
                <h2>Chat Book App</h2>
                <p> Initial Instruction
                    &nbsp;<input readOnly value={initialInstruction} disabled />
                </p>
                {executionStarted && <>
                    <ProgressBar progress={(stepsExecuted/(numSteps + 1)) * 100}/>
                    <h3>Instructions:</h3>
                    <p style={{ border: state.initialInstructionResponse !== "" ? "1px dotted blue" : "none", padding: "10px" }}>
                        <ReactMarkdown>
                            {state.initialInstructionResponse}
                        </ReactMarkdown>
                    </p>
                    <h3>Executed Instructions:</h3>
                    {state.subsequentInstructionResponses.map(instructionResponse => {
                        return (
                            <div style={{ border: "1px dotted red", padding: "10px" }}>
                                <ReactMarkdown>{instructionResponse}</ReactMarkdown>
                            </div>
                        )
                    })}
                </>}
                <p> Subject
                    &nbsp;<input disabled={loading} value={subject} onKeyDown={event=>{
                        if(event.key === 'Enter' && !(subject === '' || executionStarted)){
                            executeInstructions();
                        }
                    }} onChange={event => {
                        setSubject(event.target.value);
                    }} />
                </p>
                <ClipLoader color="blue" loading={loading} />
                {executionStarted ? <></> :
                    <p>
                        <button disabled={subject === '' || executionStarted} onClick={executeInstructions}>Execute</button>
                        <button onClick={print}>Print</button>
                        <button onClick={clear}>Clear</button>
                        &nbsp;
                        Print When Finished
                        <input type="checkbox" checked={printWhenFinished} onClick={() => setPrintWhenFinished(!(printWhenFinished))} />
                    </p>
                }
                <p>
                    Number of Steps &nbsp;
                    <input type="number" min="1" max="10" step="1" disabled={loading} onChange={event => {
                        setNumSteps(event.target.value);
                    }}
                        value={numSteps}
                    />
                </p>
                <p>
                    Max Words &nbsp;
                    <input type="number" step="100" min="100" max="2000" disabled={loading} onChange={event => {
                        setMaxWords(event.target.value);
                    }}
                        value={maxWords}
                    />
                </p>
                {subsequentInstructions.map((instruction, index) => {
                    return (
                        <p>
                            <input key={index} disabled={loading} value={instruction} />
                        </p>
                    )
                })}

            </div>
        </>
    )
} 