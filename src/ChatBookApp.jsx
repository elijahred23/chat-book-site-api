import { useState, useEffect, useRef, useMemo } from "react";
import { useAppContext } from "./context-api/AppProvider";
import { getGeminiResponse } from "./utils/callGemini";
import { hostname } from "./utils/hostname";
import { ClipLoader } from "react-spinners";
import ProgressBar from "./ui/ProgressBar";
import { appActionTypes } from "./context-api/AppProvider";
import ReactMarkdown from 'react-markdown';


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
        mode: localMode ? JSON.parse(localMode) : "steps",
    }
}

const promptSuggestions = [
    "Summarize the main ideas",
    "List the pros and cons",
    "Explain like I'm 5",
    "Generate FAQs",
    "Create a glossary of terms",
    "Turn into a poem",
    "Translate to plain English",
    "Build a quiz based on the content",
    "Write a tweet-sized summary",
    "Compare this to another topic",
    "Suggest use cases",
    "Provide examples",
    "Break down by timeline",
    "Suggest visuals for this content",
    "Highlight controversial points"
];

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
    const chatLogRef = useRef(null);

    const scrollToBottom = () => {
        chatLogRef.current?.scrollTo({ top: chatLogRef.current.scrollHeight, behavior: 'smooth' });
    };

    const getInitialInstructionMessage = (steps = null) => {
        if (steps === null) steps = numSteps;
        switch (mode) {
            case 'steps':
                return `Write a step-by-step process with ${steps} steps about ${subject}.`;
            case 'splits':
                return `Split the paragraph into ${steps} sections about ${subject}.`;
            case 'mind_map':
                return `Create a mind map of ${steps} main branches for the topic '${subject}', with sub-branches under each if needed.`;
            default:
                return "";
        }
    };

    const getExecutionInstructionMessage = (currentStep) => {
        switch (mode) {
            case 'steps':
                return `Detail step ${currentStep} of the process in about ${maxWords} words.`;
            case 'splits':
                return `Explain section ${currentStep} in detail, focusing on completeness in about ${maxWords} words.`;
            case 'mind_map':
                return `Expand on branch ${currentStep} of the mind map. Add details to sub-branches as needed, aiming for about ${maxWords} words.`;
            default:
                return "";
        }
    };

    const initializeSubsequentInstructions = () => {
        const newInstructions = Array.from({ length: numSteps }, (_, i) => getExecutionInstructionMessage(i + 1));
        setSubsequentInstructions(newInstructions);
    };

    const incrementStepsExecuted = () => setStepsExecuted(prev => prev + 1);

    const executeInitialInstruction = async () => {
        if (!canExecuteKey) return;
        dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: "" });
        dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: [] });

        const prompt = `### Instruction Start ###\n${initialInstruction}\n### End ###`;
        const geminiResponse = await getGeminiResponse(prompt);

        incrementStepsExecuted();
        dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: geminiResponse });
    };

    const executeInstructions = async () => {
        if (canExecuteKey) {
            setLoading(true);
            setExecutionStarted(true);
            await executeInitialInstruction();
            setLoading(false);
        }
    };

    const print = () => window.print();

    const generatePDF = async () => {
        if (!state.initialInstructionResponse) return;
        try {
            setLoadingPDF(true);
            const response = await fetch(`${baseURL}/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    markdown: state.initialInstructionResponse,
                    messagesToCombine: state.subsequentInstructionResponses,
                    pdfFileName: document.title
                })
            });
            if (!response.ok) throw new Error('Failed to generate PDF');

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
        } finally {
            setLoadingPDF(false);
        }
    };

    const clear = () => {
        setSubject("");
        dispatch({ type: appActionTypes.SET_INITIAL_INSTRUCTION_RESPONSE, payload: "" });
        dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: [] });
    };

    const executeSubsequentInstructions = async () => {
        if (!canExecuteKey) return;
        setLoading(true);

        try {
            const promises = subsequentInstructions.map((instruction, index) => {
                const prompt = `Refer to previous instruction:\n${state.initialInstructionResponse}\nNow respond to:\n${instruction}`;
                return getGeminiResponse(prompt).then(response => {
                    incrementStepsExecuted(); // still track progress
                    return response;
                });
            });

            const newResponses = await Promise.all(promises);
            dispatch({ type: appActionTypes.SET_SUBSEQUENT_INSTRUCTION_RESPONSES, payload: newResponses });

        } catch (error) {
            console.error("Error executing subsequent instructions:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (state.subsequentInstructionResponses?.length > 0 && printWhenFinished) print();
    }, [state.subsequentInstructionResponses]);

    useEffect(() => {
        if (state.initialInstructionResponse !== '') executeSubsequentInstructions();
    }, [state.initialInstructionResponse]);

    useEffect(() => {
        setInitialInstruction(getInitialInstructionMessage(numSteps));
        initializeSubsequentInstructions();
    }, [numSteps, maxWords, mode]);

    useEffect(() => {
        document.title = subject;
        setInitialInstruction(getInitialInstructionMessage());
    }, [subject]);

    useEffect(() => setCanExecuteKey(true), [initialInstruction]);

    useEffect(() => {
        setCanExecuteKey(false);
        setExecutionStarted(false);
        return () => {
            setExecutionStarted(false);
            setPrintWhenFinished(false);
            setCanExecuteKey(false);
        };
    }, []);

    useEffect(() => {
        return () => {
            localStorage.setItem('numSteps', JSON.stringify(numSteps));
            localStorage.setItem('subject', JSON.stringify(subject));
            localStorage.setItem('initialInstruction', JSON.stringify(initialInstruction));
            localStorage.setItem('subsequentInstructions', JSON.stringify(subsequentInstructions));
            localStorage.setItem('maxWords', JSON.stringify(maxWords));
            localStorage.setItem('mode', JSON.stringify(mode));
        };
    }, [numSteps, subject, initialInstruction, subsequentInstructions, maxWords]);

    const progress = useMemo(() => {
        return (parseInt(stepsExecuted) / (parseInt(numSteps) + 1)) * 100;
    }, [stepsExecuted, numSteps]);

    useEffect(() => {
        scrollToBottom();
    }, [state.initialInstructionResponse, state.subsequentInstructionResponses]);

    return (
        <div>
            <h2>Chat Book App</h2>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {modes.map((mod, index) => (
                    <option key={index} value={mod}>{mod}</option>
                ))}
            </select>

            <p>Initial Instruction &nbsp;
                <input readOnly value={initialInstruction} disabled />
            </p>

            <div className="mb-2 flex flex-wrap gap-2">
                {promptSuggestions.map((s, i) => (
                    <button
                        key={i}
                        className="bg-gray-200 px-2 py-1 rounded"
                        onClick={() => setSubject(s)}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <ClipLoader color="blue" loading={loadingPDF} />
            {!loadingPDF && state.initialInstructionResponse !== "" && (
                <button onClick={generatePDF}>Generate PDF</button>
            )}

            {executionStarted && (
                <div ref={chatLogRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <ProgressBar progress={progress} />
                    <h3>Instructions:</h3>
                    <div style={{ border: state.initialInstructionResponse ? "1px dotted blue" : "none", padding: "10px" }}>
                        <ReactMarkdown>{state.initialInstructionResponse}</ReactMarkdown>
                    </div>
                    <h3>Executed Instructions:</h3>
                    {state.subsequentInstructionResponses.map((res, idx) => (
                        <div key={idx} style={{ border: "1px dotted red", padding: "10px" }}>
                            <ReactMarkdown>{res}</ReactMarkdown>
                        </div>
                    ))}
                </div>
            )}

            <p>Subject &nbsp;
                <input
                    disabled={loading}
                    value={subject}
                    onKeyDown={e => e.key === 'Enter' && subject && !executionStarted && executeInstructions()}
                    onChange={e => setSubject(e.target.value)}
                />
            </p>

            <ClipLoader color="blue" loading={loading} />

            {!executionStarted && (
                <p>
                    <button
                        className={subject === '' || !canExecuteKey ? 'disabled' : ''}
                        disabled={subject === '' || !canExecuteKey}
                        onClick={executeInstructions}
                    >
                        Execute
                    </button>
                    <button onClick={print}>Print</button>
                    <button onClick={clear}>Clear</button>
                    &nbsp; Print When Finished
                    <input
                        type="checkbox"
                        checked={printWhenFinished}
                        onChange={() => setPrintWhenFinished(!printWhenFinished)}
                    />
                </p>
            )}

            <p>Number of Steps &nbsp;
                <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    disabled={loading}
                    onChange={e => setNumSteps(Number(e.target.value))}
                    value={numSteps}
                />
            </p>

            <p>Max Words &nbsp;
                <input
                    type="number"
                    step="100"
                    min="100"
                    max="2000"
                    disabled={loading}
                    onChange={e => setMaxWords(Number(e.target.value))}
                    value={maxWords}
                />
            </p>

            {subsequentInstructions.map((instruction, index) => (
                <p key={index}>
                    <input disabled={loading} value={instruction} readOnly />
                </p>
            ))}
        </div>
    );
}
