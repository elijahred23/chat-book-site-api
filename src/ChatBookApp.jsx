import React, { useState, useEffect, useMemo } from "react";
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
    const localMode = localStorage.getItem('mode');

    return {
        numSteps: localNumSteps ? JSON.parse(localNumSteps) : 5,
        subject: localSubject ? JSON.parse(localSubject) : "",
        initialInstruction: localInitialInstruction ? JSON.parse(localInitialInstruction) : "",
        subsequentInstructions: localSubsequentInstructions ? JSON.parse(localSubsequentInstructions) : [],
        maxWords: localMaxWords ? JSON.parse(localMaxWords) : 500,
        mode: localMaxWords ? JSON.parse(localMode) : "steps",
    }
}

export default function ChatBookApp() {
    const { state, dispatch } = useAppContext();

    const localStorageValues = getValuesInLocalStorage();

    const modes = ["steps", "splits", "mind_map"];

    const [mode, setMode] = useState(localStorageValues.mode);

    const [numSteps, setNumSteps] = useState(localStorageValues.numSteps);

    const [subject, setSubject] = useState(localStorageValues.subject);

    const [initialInstruction, setInitialInstruction] = useState(localStorageValues.initialInstruction);

    const [subsequentInstructions, setSubsequentInstructions] = useState(localStorageValues.subsequentInstructions);

    const [loading, setLoading] = useState(false);

    const [loadingPDF, setLoadingPDF] = useState(false);

    const [executionStarted, setExecutionStarted] = useState(false);

    const [maxWords, setMaxWords] = useState(localStorageValues.maxWords);

    const [printWhenFinished, setPrintWhenFinished] = useState(false);
    const [stepsExecuted, setStepsExecuted] = useState(0);

    const [canExecuteKey, setCanExecuteKey] = useState(false);

    const getInitialInstructionMessage = (steps = null) => {
        if (steps === null) {
            steps = numSteps;
        }
        switch(mode) {
            case 'steps':
                return `Write a step-by-step process with ${steps} steps about ${subject}.`;
            case 'splits':
                return `Split the paragraph into ${steps} sections about ${subject}.`;
            case 'mind_map':
                return `Create a mind map of ${steps} main branches for the topic '${subject}', with sub-branches under each if needed.`;
        }
    }
    
    const getExecutionInstructionMessage = (currentStep) => {
        switch(mode) {
            case 'steps':
                return `Detail step ${currentStep} of the process in about ${maxWords} words.`;
            case 'splits':
                return `Explain section ${currentStep} in detail, focusing on completeness in about ${maxWords} words.`;
            case 'mind_map':
                return `Expand on branch ${currentStep} of the mind map. Add details to sub-branches as needed, aiming for about ${maxWords} words.`;
        }
    };
    
    const initializeSubsequentInstructions = () => {
        let newExecutionInstructions = []
        for (let currentStep = 1; currentStep <= numSteps; currentStep++) {
            let execInstruction = getExecutionInstructionMessage(currentStep);
            newExecutionInstructions.push(execInstruction);
        }
        setSubsequentInstructions(newExecutionInstructions);
    }
    const incrementStepsExecuted = () => setStepsExecuted(prev => prev + 1);

    const executeInitialInstruction = async () => {
        if (canExecuteKey) {
            dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: "" })
            dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: [] })
            let prompt = (initialInstruction);
            let hash = Math.random().toString(36).substring(2, 20 + 2);
            prompt = `${hash} ignore hash at beginning. Do prompt: ${prompt}`
            const response = await fetch(`${baseURL}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
            const data = await response.json();
            let gptResponse = data.geminiResponse;
            incrementStepsExecuted();
            dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: gptResponse });
        }
    }
    const executeInstructions = async () => {
        if (canExecuteKey) {
            //execute initial instruction
            setLoading(true);
            setExecutionStarted(true);
            await executeInitialInstruction();
            setLoading(false);
        }
    }
    const print = () => window.print();
    const generatePDF = async () => {
        if (state.initialInstructionResponse !== "") {
            try {
                setLoadingPDF(true);
                console.log({loadingPDF})
                const response = await fetch(`${baseURL}/generate-pdf`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        markdown: state.initialInstructionResponse,
                        messagesToCombine: state.subsequentInstructionResponses,
                        pdfFileName: document.title
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate PDF');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${subject}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
            finally {
                setLoadingPDF(false);
                console.log({loadingPDF})
            }
        }
    };


    const clear = () => {
        setSubject("");
        dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: "" })
        dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: [] })
    }

    const executeSubsequentInstructions = async () => {
        if (canExecuteKey) {
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
            dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: newResponses });
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
        let instructions = getInitialInstructionMessage(numSteps);
        setInitialInstruction(instructions);
        initializeSubsequentInstructions();
    }, [numSteps, maxWords, mode]);

    useEffect(() => {
        document.title = subject;
        let newInitialInstruction = getInitialInstructionMessage();
        setInitialInstruction(newInitialInstruction);
    }, [subject])

    useEffect(() => {
        setCanExecuteKey(true);
    }, [initialInstruction])

    useEffect(() => {
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

            let jsonMode = JSON.stringify(mode);
            localStorage.setItem('mode', jsonMode);
        }
    }, [numSteps, subject, initialInstruction, subsequentInstructions, maxWords]);

    const progress = useMemo(() => {
        return (parseInt(stepsExecuted) / (parseInt(numSteps) + 1)) * 100;
    }, [stepsExecuted, numSteps])

    return (
        <>
        <div>
            <h2>Chat Book App</h2>
            <select
                value={mode}
                onChange={(event) => setMode(event.target.value)}
            >
                {modes.map((mod, index) => {
                    return (
                        <option
                            key={index}
                            selected={mod === mode}
                            value={mod}
                        >
                            {mod}
                        </option>
                    );
                })}
            </select>

                <p> Initial Instruction
                    &nbsp;<input readOnly value={initialInstruction} disabled />
                </p>
                <ClipLoader color="blue" loading={loadingPDF} />
                {
                    !(loadingPDF) && (state.initialInstructionResponse !== "") && <button onClick={generatePDF}>
                        Generate PDF
                    </button>
                }
                {executionStarted && <>
                    <ProgressBar progress={progress} />
                    <h3>Instructions:</h3>
                    <p style={{ border: state.initialInstructionResponse !== "" ? "1px dotted blue" : "none", padding: "10px" }}>
                        <ReactMarkdown>
                            {state.initialInstructionResponse}
                        </ReactMarkdown>
                    </p>
                    <h3>Executed Instructions:</h3>
                    {state.subsequentInstructionResponses.map(subsequentInstructionResponse => {
                        return (
                            <div style={{ border: "1px dotted red", padding: "10px" }}>
                                <ReactMarkdown>{subsequentInstructionResponse}</ReactMarkdown>
                            </div>
                        )
                    })}
                </>}
                <p> Subject
                    &nbsp;<input disabled={loading} value={subject} onKeyDown={event => {
                        if (event.key === 'Enter' && !(subject === '' || executionStarted)) {
                            executeInstructions();
                        }
                    }} onChange={event => {
                        setSubject(event.target.value);
                    }} />
                </p>
                <ClipLoader color="blue" loading={loading} />
                {executionStarted ? <></> :
                    <p>
                        <button className={subject === '' || executionStarted || !canExecuteKey ? 'disabled' : ''} disabled={subject === '' || executionStarted} onClick={executeInstructions}>Execute</button>
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