import React, { useState, useEffect } from "react";
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';

const baseURL = 'http://localhost:3000';
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

    const maxWords = 1000;

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

    const executeInstructions = async () => {
        //execute initial instruction
        setLoading(true);
        setExecutionStarted(true);
        await fetch(`${baseURL}/`).then(res => res.json()).then(res => {
            let message = res?.message ?? 'MESSAGE NOT SENT AS RESPONSE';
            setInitialInstructionResponse(message);
        });
        setLoading(false);
    }

    const executeSubsequentInstructions = async () => {
        let newResponses = [];
        await Promise.all(subsequentInstructions.map(async (currentStep, currentStepIndex) => {
            let prompt = `using these steps: ${initialInstruction} : ${currentStep}`;
            const res = await fetch(`${baseURL}/`);
            const data = await res.json();
            newResponses[currentStepIndex] = (data?.message);
        }));
        setSubsequentInstructionResponses(newResponses);
    }


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
    }, [numSteps]);

    useEffect(() => {
        let newInitialInstruction = getInitialInstructionMessage();
        setInitialInstruction(newInitialInstruction);
    }, [subject])

    useEffect(() => {
        let initialStepNumbers = 2;
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
                    <h3>Instructions:</h3>
                    <p style={{ border: "1px dotted blue", padding: "10px" }}>
                        <ReactMarkdown>
                            {initialInstructionResponse}
                        </ReactMarkdown>
                    </p>
                    <h3>Executed Instructions:</h3>
                    {subsequentInstructionResponses.map(instructionResponse => {
                        return (
                            <div style={{border: "1px dotted red", padding: "10px"}}>
                                <ReactMarkdown>{instructionResponse}</ReactMarkdown>
                            </div>
                        )
                    })}
                </>}
                <p> Subject
                    &nbsp;<input disabled={loading} value={subject} onChange={event => {
                        setSubject(event.target.value);
                    }} />
                </p>
                <ClipLoader color="blue" loading={loading} />
                {executionStarted ? <></>:
                    <p>
                        <button disabled={subject === '' || executionStarted} onClick={executeInstructions}>Execute</button>
                    </p>
                }
                <p>
                    Number of Steps &nbsp;
                    <input type="number" disabled={loading} onChange={event => {
                        setNumSteps(event.target.value);
                    }}
                        value={numSteps}
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