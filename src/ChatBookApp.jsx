import { useState, useEffect, useRef, useMemo } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import { hostname } from "./utils/hostname";
import { ClipLoader } from "react-spinners";
import ProgressBar from "./ui/ProgressBar";
import ReactMarkdown from 'react-markdown';
import PasteButton from "./ui/PasteButton";
import CopyButton from "./ui/CopyButton";
import { useFlyout } from "./context/FlyoutContext"; // adjust path as needed
import AutoScroller from "./ui/AutoScroller";



const baseURL = hostname;

const getValuesInLocalStorage = () => {
    const localNumSteps = localStorage.getItem('numSteps');
    const localSubject = localStorage.getItem('subject');
    const localInitialInstruction = localStorage.getItem('initialInstruction');
    const localInitialInstructionResponse = localStorage.getItem('initialInstructionResponse');
    const localSubsequentInstructions = localStorage.getItem('subsequentInstructions');
    const localSubsequentInstructionResponses = localStorage.getItem('subsequentInstructionResponses');
    const localMaxWords = localStorage.getItem('maxWords');
    const localMode = localStorage.getItem('mode');
    const localExecutionStarted = localStorage.getItem('executionStarted');

    return {
        numSteps: localNumSteps ? JSON.parse(localNumSteps) : 5,
        subject: localSubject ? JSON.parse(localSubject) : "",
        initialInstruction: localInitialInstruction ? JSON.parse(localInitialInstruction) : "",
        subsequentInstructions: localSubsequentInstructions ? JSON.parse(localSubsequentInstructions) : [],
        maxWords: localMaxWords ? JSON.parse(localMaxWords) : 500,
        mode: localMode ? JSON.parse(localMode) : "steps",
        initialInstructionResponse: localInitialInstructionResponse ? JSON.parse(localInitialInstructionResponse) : "",
        subsequentInstructionResponses: localSubsequentInstructionResponses ? JSON.parse(localSubsequentInstructionResponses) : [],
        executionStarted: localExecutionStarted ? JSON.parse(localExecutionStarted) : false,
    }
}

const promptSuggestions = [
];

export default function ChatBookApp() {
    const { showMessage } = useFlyout();
    const localStorageValues = getValuesInLocalStorage();

    const modes = ["steps", "splits", "mind_map"];

    const [mode, setMode] = useState(localStorageValues.mode);
    const [numSteps, setNumSteps] = useState(localStorageValues.numSteps);
    const [subject, setSubject] = useState(localStorageValues.subject);
    const [initialInstruction, setInitialInstruction] = useState(localStorageValues.initialInstruction);
    const [subsequentInstructions, setSubsequentInstructions] = useState(localStorageValues.subsequentInstructions);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [executionStarted, setExecutionStarted] = useState(localStorageValues.executionStarted);
    const [maxWords, setMaxWords] = useState(localStorageValues.maxWords);
    const [printWhenFinished, setPrintWhenFinished] = useState(false);
    const [stepsExecuted, setStepsExecuted] = useState(0);
    const [canExecuteKey, setCanExecuteKey] = useState(false);
    const chatLogRef = useRef(null);
    const [initialInstructionResponse, setInitialInstructionResponse] = useState(localStorageValues.initialInstructionResponse);
    const [subsequentInstructionResponses, setSubsequentInstructionResponses] = useState(localStorageValues.subsequentInstructionResponses);

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

        const prompt = `### Instruction Start ###\n${initialInstruction}\n### End ###`;
        const geminiResponse = await getGeminiResponse(prompt);

        incrementStepsExecuted();
        setInitialInstructionResponse(geminiResponse);
        showMessage({ type: "success", message: "Initial instruction completed!" });
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
        if (!initialInstructionResponse) return;
        try {
            setLoadingPDF(true);
            const response = await fetch(`${baseURL}/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    markdown: initialInstructionResponse,
                    messagesToCombine: subsequentInstructionResponses,
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
        setInitialInstructionResponse("");
        setSubsequentInstructionResponses([])
    };

    const executeSubsequentInstructions = async () => {
        if (!canExecuteKey) return;
        setLoading(true);

        try {
            const promises = subsequentInstructions.map((instruction, index) => {
                const prompt = `Refer to previous instruction:\n${initialInstructionResponse}\nNow respond to:\n${instruction}`;
                return getGeminiResponse(prompt).then(response => {
                    incrementStepsExecuted(); // still track progress
                    return response;
                });
            });

            const newResponses = await Promise.all(promises);
            setSubsequentInstructionResponses(newResponses);
            showMessage({ type: "success", message: "Subsequent Instructions completed!" });

        } catch (error) {
            console.error("Error executing subsequent instructions:", error);
            showMessage({ type: "error", message: error.message || "Error during execution" });
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (subsequentInstructionResponses?.length > 0 && printWhenFinished) print();
    }, [subsequentInstructionResponses]);

    useEffect(() => {
        if (initialInstructionResponse !== '') executeSubsequentInstructions();
    }, [initialInstructionResponse]);

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


    let allInstructionResponsesText = useMemo(() => {
        let responses = [initialInstructionResponse, ...subsequentInstructionResponses];

        let responseText = responses.join(' ');
        return responseText;
    }, [initialInstructionResponse, subsequentInstructionResponses])

    useEffect(() => {
        return () => {
            localStorage.setItem('numSteps', JSON.stringify(numSteps));
            localStorage.setItem('subject', JSON.stringify(subject));
            localStorage.setItem('initialInstruction', JSON.stringify(initialInstruction));
            localStorage.setItem('subsequentInstructions', JSON.stringify(subsequentInstructions));
            localStorage.setItem('maxWords', JSON.stringify(maxWords));
            localStorage.setItem('mode', JSON.stringify(mode));
            localStorage.setItem('subsequentInstructionResponses', JSON.stringify(subsequentInstructionResponses));
            localStorage.setItem('initialInstructionResponse', JSON.stringify(initialInstructionResponse));
            localStorage.setItem('executionStarted', JSON.stringify(executionStarted));
        };
    }, [numSteps, subject, initialInstruction, subsequentInstructions, maxWords, subsequentInstructionResponses, initialInstructionResponse, executionStarted]);

    const progress = useMemo(() => {
        return (parseInt(stepsExecuted) / (parseInt(numSteps) + 1)) * 100;
    }, [stepsExecuted, numSteps]);

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
            {!loadingPDF && initialInstructionResponse !== "" && (
                <>
                    <button onClick={generatePDF}>Generate PDF</button>
                    <CopyButton buttonText="Copy all responses" text={allInstructionResponsesText} />
                </>
            )}

            {(executionStarted || initialInstructionResponse != "") && (
                <>
                    <AutoScroller activeIndex={subsequentInstructionResponses.length}>
                        <ProgressBar progress={progress} />

                        <h3>Instructions:</h3>
                        <div style={{ border: initialInstructionResponse ? "1px dotted blue" : "none", padding: "10px" }}>
                            <ReactMarkdown className="markdown-body">{initialInstructionResponse}</ReactMarkdown>
                            <CopyButton text={initialInstructionResponse} />
                        </div>

                        <h3>Executed Instructions:</h3>
                        {subsequentInstructionResponses.map((res, idx) => (
                            <div key={idx} style={{ border: "1px dotted red", padding: "10px" }}>
                                <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                                <CopyButton text={res} />
                            </div>
                        ))}
                    </AutoScroller>

                </>
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
                    <PasteButton setPasteText={setSubject} />
                    <button onClick={clear}>Clear</button>
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
