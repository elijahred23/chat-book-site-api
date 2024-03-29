import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import ProgressBar from "./ui/ProgressBar";

const baseURL = 'http://localhost:3005';
export default function ChatBookApp() {
    const modes = ["chapters", "steps"];

    const [mode, setMode] = useState("steps");

    const [numSteps, setNumSteps] = useState(1);

    const [subject, setSubject] = useState("");

    const [initialInstruction, setInitialInstruction] = useState("");

    const [subsequentInstructions, setSubsequentInstructions] = useState([]);

    const [loading, setLoading] = useState(false);

    const [initialInstructionResponse, setInitialInstructionResponse] = useState("");
    const [subsequentInstructionResponses, setSubsequentInstructionResponses] = useState([]);

    const [executionStarted, setExecutionStarted] = useState(false);

    const [maxWords, setMaxWords] = useState(500);
    const [printWhenFinished, setPrintWhenFinished] = useState(true);
    const [stepsExecuted, setStepsExecuted] = useState(0);

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
        let prompt = (initialInstruction);
        let hash = Math.random().toString(36).substring(2,20+2);
        prompt = `${hash} ignore hash at beginning. Do prompt: ${prompt}`
        const response = await fetch(`${baseURL}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
        const data = await response.json();
        let gptResponse = data.geminiResponse;
        incrementStepsExecuted();
        setInitialInstructionResponse(gptResponse);
    }
    const executeInstructions = async () => {
        //execute initial instruction
        setLoading(true);
        setExecutionStarted(true);
        await executeInitialInstruction();
        setLoading(false);
    }
    const print = () => window.print();

    const executeSubsequentInstructions = async () => {
        setLoading(true);
        let newResponses = [];
        await Promise.all(subsequentInstructions.map(async (currentStep, currentStepIndex) => {
            let prompt = (`using these steps: ${initialInstructionResponse} : ${currentStep}`);
            const response = await fetch(`${baseURL}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
            const data = await response.json();
            let gptResponse = data.geminiResponse;
            newResponses[currentStepIndex] = (gptResponse);
            incrementStepsExecuted();
        }));
        setLoading(false);
        setSubsequentInstructionResponses(newResponses);
    }

    useEffect(() => {
        if (subsequentInstructionResponses?.length > 0 && printWhenFinished) {
            print();
        }
    }, [subsequentInstructionResponses])


    useEffect(() => {
        if (initialInstructionResponse !== '') {
            executeSubsequentInstructions();
        }
    }, [initialInstructionResponse]);

    useEffect(() => {
        if (mode === "steps") {
            let instructions = getInitialInstructionMessage(numSteps);
            setInitialInstruction(instructions);
            initializeSubsequentInstructions();
        }
    }, [numSteps, maxWords]);

    useEffect(() => {
        let newInitialInstruction = getInitialInstructionMessage();
        setInitialInstruction(newInitialInstruction);
    }, [subject])

    useEffect(()=>{
        document.title = initialInstruction;
    }, [initialInstruction]);
    useEffect(() => {
        let initialStepNumbers = 5;
        let instructions = getInitialInstructionMessage(initialStepNumbers);
        setNumSteps(initialStepNumbers);
        setInitialInstruction(instructions);
    }, []);



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
                    <p style={{ border: initialInstructionResponse !== "" ? "1px dotted blue" : "none", padding: "10px" }}>
                        <ReactMarkdown>
                            {initialInstructionResponse}
                        </ReactMarkdown>
                    </p>
                    <h3>Executed Instructions:</h3>
                    {subsequentInstructionResponses.map(instructionResponse => {
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