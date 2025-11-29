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
import { actions, useAppDispatch } from "./context/AppContext";
import ActionButtons from "./ui/ActionButtons";


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
    "Build a study guide for algorithms",
    "Outline a workshop on AI safety",
    "Draft a product brief for a mobile app",
    "Summarize a research paper",
    "Create a lesson plan for React basics",
];

export default function ChatBookApp() {
    const { showMessage } = useFlyout();
    const localStorageValues = getValuesInLocalStorage();


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
    const dispatch = useAppDispatch();

    const MODE_CONFIGS = useMemo(() => ({
        steps: {
            key: 'steps',
            label: 'Guided Steps',
            getInitialInstruction: (steps, subject) => `Draft ${steps} clear, numbered steps to accomplish: ${subject}.`,
            getExecutionInstruction: (currentStep, maxWords) => `Write step ${currentStep} with concise detail in ~${maxWords} words.`,
        },
        outline: {
            key: 'outline',
            label: 'Crisp Outline',
            getInitialInstruction: (sections, subject) => `Create an outline with ${sections} sections for: ${subject}.`,
            getExecutionInstruction: (currentSection, maxWords) => `Expand section ${currentSection} with bullet points and a short paragraph (~${maxWords} words).`,
        },
        mind_map: {
            key: 'mind_map',
            label: 'Mind Map',
            getInitialInstruction: (branches, subject) => `Create a mind map with ${branches} main branches for '${subject}'. Include sub-branches as needed.`,
            getExecutionInstruction: (currentBranch, maxWords) => `Expand branch ${currentBranch} with sub-branches and notes (~${maxWords} words).`,
        },
        mind_map_key_points: {
            key: 'mind_map_key_points',
            label: 'Mind Map + Examples',
            getInitialInstruction: (branches, subject) =>
                `Build a mind map on "${subject}" with ${branches} main branches. Add sub-branches, key points, and short examples or snippets where useful.`,
            getExecutionInstruction: (currentBranch, maxWords) =>
                `Elaborate on branch "${currentBranch}" with explained sub-points, analogies, and examples. Target ~${maxWords} words, exceed if clarity improves.`,
        },
        faq_generator: {
            key: 'faq_generator',
            label: 'FAQ + Answers',
            getInitialInstruction: (numFAQs, subject) => `List ${numFAQs} frequently asked questions about '${subject}' (questions only).`,
            getExecutionInstruction: (questionNumber, maxWords, subject) => `Answer FAQ #${questionNumber} about '${subject}' in ~${maxWords} words with a helpful tone.`,
        },
        code_generator: {
            key: 'code_generator',
            label: 'Component Blueprint',
            getInitialInstruction: (numberOfComponents, subject) => `List ${numberOfComponents} components or modules needed to build '${subject}'.`,
            getExecutionInstruction: (componentNumber, maxWords, subject) => `Write code or pseudocode for component #${componentNumber} of '${subject}' (~${maxWords} words).`,
        },
        study_guide: {
            key: 'study_guide',
            label: 'Study Guide',
            getInitialInstruction: (sections, subject) => `Create a ${sections}-section study guide for '${subject}' with objectives and key facts.`,
            getExecutionInstruction: (sectionNumber, maxWords, subject) => `Write section ${sectionNumber} of the study guide for '${subject}', include tips and examples (~${maxWords} words).`,
        },
        checklist: {
            key: 'checklist',
            label: 'Checklist',
            getInitialInstruction: (items, subject) => `Create a checklist with ${items} items to accomplish '${subject}'.`,
            getExecutionInstruction: (itemNumber, maxWords, subject) => `Expand checklist item ${itemNumber} for '${subject}' with a brief how-to (~${maxWords} words).`,
        },
    }), []); 

    const modesForSelect = useMemo(() => Object.values(MODE_CONFIGS).map(config => ({
        value: config.key,
        label: config.label,
    })), [MODE_CONFIGS]);

    const getInitialInstructionMessage = (steps = null) => {
        if (steps === null) steps = numSteps;
        const currentModeConfig = MODE_CONFIGS[mode];
        if (currentModeConfig && currentModeConfig.getInitialInstruction) {
            return currentModeConfig.getInitialInstruction(steps, subject);
        }
        console.warn(`[ChatBookApp] Unknown mode or missing getInitialInstruction for mode: ${mode}`);
        return "";
    };

    const getExecutionInstructionMessage = (currentStep, numPointsForModeDetail) => {
        const currentModeConfig = MODE_CONFIGS[mode];
        if (currentModeConfig && currentModeConfig.getExecutionInstruction) {
            return currentModeConfig.getExecutionInstruction(currentStep, maxWords, subject, numPointsForModeDetail);
        }
        console.warn(`[ChatBookApp] Unknown mode or missing getExecutionInstruction for mode: ${mode}`);
        return "";
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
            setExecutionStarted(false);
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

    const AskAIButton = ({text}) => {
        return (
            <>
            <ActionButtons promptText={text} />
            </>
        )
    }

    const styles = `
      .cb-shell {
        max-width: 980px;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      .card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 10px 28px rgba(15,23,42,0.08);
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 0.75rem;
      }
      .label {
        display: block;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 0.35rem;
      }
      .input,
      .select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.95rem;
        background: #fff;
      }
      .input:focus,
      .select:focus,
      textarea:focus {
        outline: 2px solid #bfdbfe;
        border-color: #2563eb;
      }
      .btn {
        padding: 0.65rem 0.95rem;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        background: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        color: #0f172a;
      }
      .btn-primary {
        background: linear-gradient(135deg, #2563eb, #60a5fa);
        color: #fff;
        border: none;
        box-shadow: 0 10px 25px rgba(37,99,235,0.2);
      }
      .btn-ghost {
        background: #f8fafc;
      }
      .pill {
        display: inline-flex;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: #e2e8f0;
        color: #0f172a;
        font-size: 0.85rem;
        margin-right: 0.35rem;
        margin-bottom: 0.35rem;
      }
      .section-title {
        margin: 0 0 0.5rem 0;
        font-size: 1.05rem;
        color: #0f172a;
      }
      @media (max-width: 520px) {
        .cb-shell {
          padding: 0.75rem;
        }
      }
    `;

    return (
        <div className="cb-shell">
            <style>{styles}</style>
            <div className="card" style={{ background: "radial-gradient(circle at 10% 20%, #ecfeff 0, #ffffff 25%)", borderColor: "#bfdbfe" }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Chat Book</h2>
                <p style={{ marginTop: "0.35rem", color: "#475569" }}>
                    Generate structured content with guided modes. Great for study guides, outlines, FAQs, and code blueprints.
                </p>
                <div className="grid-2">
                    <div>
                        <label className="label">Mode</label>
                        <select className="select" value={mode} onChange={(e) => setMode(e.target.value)}>
                            {modesForSelect.map((modConfig) => (
                                <option key={modConfig.value} value={modConfig.value}>{modConfig.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Topic</label>
                        <input
                            className="input"
                            disabled={loading}
                            value={subject}
                            placeholder="e.g. Intro to GraphQL"
                            onKeyDown={e => e.key === 'Enter' && subject && !executionStarted && executeInstructions()}
                            onChange={e => setSubject(e.target.value)}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
                    {promptSuggestions.map((s, i) => (
                        <button
                            key={i}
                            className="btn btn-ghost"
                            onClick={() => setSubject(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                    <div>
                        <label className="label">Steps / Sections</label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            max="12"
                            step="1"
                            disabled={loading}
                            onChange={e => setNumSteps(Number(e.target.value))}
                            value={numSteps}
                        />
                    </div>
                    <div>
                        <label className="label">Target Words per Step</label>
                        <input
                            className="input"
                            type="number"
                            step="100"
                            min="100"
                            max="2000"
                            disabled={loading}
                            onChange={e => setMaxWords(Number(e.target.value))}
                            value={maxWords}
                        />
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    <button
                        className="btn btn-primary"
                        disabled={subject === '' || !canExecuteKey || loading}
                        onClick={executeInstructions}
                    >
                        {loading ? <ClipLoader size={14} color="#fff" /> : "Generate"}
                    </button>
                    <PasteButton setPasteText={setSubject} className="btn btn-ghost" />
                    <button className="btn btn-ghost" onClick={clear}>Clear</button>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                    <label className="label">Initial Instruction</label>
                    <textarea className="input" style={{ minHeight: "80px" }} readOnly value={initialInstruction} />
                </div>
            </div>

            <div className="card">
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="pill">Steps: {numSteps}</span>
                    <span className="pill">Words/step: {maxWords}</span>
                    <span className="pill">Mode: {modesForSelect.find(m => m.value === mode)?.label}</span>
                    <ProgressBar progress={progress} />
                    <ClipLoader color="#2563eb" loading={loading} size={16} />
                </div>

                {!loadingPDF && initialInstructionResponse !== "" && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        <button className="btn btn-primary" onClick={generatePDF}>Export PDF</button>
                        <CopyButton buttonText="Copy all" text={allInstructionResponsesText} className="btn btn-ghost" />
                        <ActionButtons promptText={allInstructionResponsesText} />
                    </div>
                )}

                {(executionStarted || initialInstructionResponse !== "") && (
                    <AutoScroller activeIndex={subsequentInstructionResponses.length}>
                        <h3 className="section-title">Initial Output</h3>
                        <div className="card" style={{ borderColor: "#bfdbfe", background: "#f8fafc" }}>
                            <ReactMarkdown className="markdown-body">{initialInstructionResponse}</ReactMarkdown>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                <ActionButtons promptText={initialInstructionResponse} />
                                <CopyButton text={initialInstructionResponse} />
                            </div>
                        </div>

                        <h3 className="section-title" style={{ marginTop: "1rem" }}>Follow-up Steps</h3>
                        <div className="grid-2">
                            {subsequentInstructionResponses.map((res, idx) => (
                                <div key={idx} className="card" style={{ background: "#fff" }}>
                                    <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Step {idx + 1}</div>
                                    <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                        <ActionButtons promptText={res} />
                                        <CopyButton text={res} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AutoScroller>
                )}
            </div>

            {subsequentInstructions.length > 0 && (
                <div className="card">
                    <h3 className="section-title">Planned Steps</h3>
                    <div className="grid-2">
                        {subsequentInstructions.map((instruction, index) => (
                            <textarea key={index} className="input" readOnly value={instruction} style={{ minHeight: "90px" }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
