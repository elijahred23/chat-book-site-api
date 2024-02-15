import { useState, useEffect } from "react";


export default function ChatBookApp() {
    const modes = ["chapters", "steps"];

    const [mode, setMode] = useState("steps");

    const [numSteps, setNumSteps] = useState(1);

    const [subject, setSubject] = useState("");

    const [initialInstruction, setInitialInstruction] = useState("");

    const [subsequentInstructions, setSubsequentInstructions] = useState([]);

    const maxWords = 1000;

    const getInitialInstructionMessage = (steps = null) => {
        if(steps === null){
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
        let initialStepNumbers = 5;
        let instructions = getInitialInstructionMessage(initialStepNumbers);
        setNumSteps(initialStepNumbers);
        setInitialInstruction(instructions);
    }, [])



    return (
        <>
            <div>
                <h2>Chat Book App</h2>
                <p> Initial Instruction
                    &nbsp;<input value={initialInstruction} disabled />
                </p>
                <p> Subject 
                    &nbsp;<input value={subject} onChange={event=>{
                        setSubject(event.target.value);
                    }} />
                </p>
                <p>
                    Number of Steps &nbsp;
                    <input type="number" onChange={event => {
                        setNumSteps(event.target.value);
                    }}
                        value={numSteps}
                    />
                </p>
                {subsequentInstructions.map(instruction => {
                    return (
                        <p>
                            <input value={instruction} />
                        </p>
                    )
                })}

            </div>
        </>
    )
} 