/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { ClipLoader } from "react-spinners";
import { FaBookOpen, FaMagic, FaPrint, FaRegLightbulb, FaTrashAlt } from "react-icons/fa";
import { getGeminiResponse } from "./utils/callGemini";
import { RESPONSE_FORMATS } from "./utils/responseFormats";
import { useFlyout } from "./context/FlyoutContext";
import { useAppState } from "./context/AppContext";
import ActionButtons from "./ui/ActionButtons";
import AutoScroller from "./ui/AutoScroller";
import PasteButton from "./ui/PasteButton";
import ProgressBar from "./ui/ProgressBar";
import "./ChatBookApp.css";

const MAX_SECTIONS = 12;
const SECTION_REQUEST_CONCURRENCY = 3;

const promptSuggestions = [
    "Learn how modern databases work",
    "Understand system design from first principles",
    "Learn React by building practical projects",
    "Understand personal finance and investing",
    "Learn the fundamentals of machine learning",
];

function readStoredValue(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
}

function parseBookOutline(response) {
    const text = String(response || "").trim();
    const withoutFence = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("The learning plan did not contain a JSON object.");
    }

    const parsed = JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("The learning plan must be a JSON object.");
    }
    if (typeof parsed.title !== "string" || !parsed.title.trim()) {
        throw new Error("The learning plan is missing a title.");
    }
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error("The learning plan must contain at least one section.");
    }

    const sections = parsed.sections.slice(0, MAX_SECTIONS).map((section, index) => {
        if (!section || typeof section !== "object" || typeof section.title !== "string" || !section.title.trim()) {
            throw new Error(`Section ${index + 1} is missing a title.`);
        }

        return {
            id: `section-${index + 1}`,
            title: section.title.trim(),
            objective: typeof section.objective === "string" ? section.objective.trim() : "",
            topics: Array.isArray(section.topics)
                ? section.topics.filter((topic) => typeof topic === "string" && topic.trim()).map((topic) => topic.trim())
                : [],
        };
    });

    return {
        title: parsed.title.trim(),
        summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
        sections,
    };
}

function getOutlinePrompt(subject) {
    return `You are a curriculum architect. Create the best learning path for the topic below.

Topic: ${subject}

Decide how many sections are appropriate for the topic's complexity. Use between 3 and ${MAX_SECTIONS} sections. Order them so each section builds on prior knowledge.

Return ONLY valid JSON. Do not use markdown fences, commentary, or trailing commas. Use exactly this schema:
{
  "title": "string",
  "summary": "string",
  "sections": [
    {
      "id": "section-1",
      "title": "string",
      "objective": "string",
      "topics": ["string"]
    }
  ]
}`;
}

function getRepairPrompt(response) {
    return `Convert the content below into valid JSON only. Do not add markdown fences or commentary.

Required schema:
{"title":"string","summary":"string","sections":[{"id":"section-1","title":"string","objective":"string","topics":["string"]}]}

Every section must have a title. Preserve the intended learning plan and return between 3 and ${MAX_SECTIONS} sections.

Content to repair:
${response}`;
}

function getSectionPrompt({ outline, section, index, responseFormat }) {
    const formatInstruction = RESPONSE_FORMATS.find(({ value }) => value === responseFormat)?.instruction || "";
    const formatBlock = formatInstruction ? `\n\nFormatting requirements:\n${formatInstruction}` : "";

    return `Write section ${index + 1} of a learning book titled "${outline.title}".

Book summary: ${outline.summary}
Section title: ${section.title}
Learning objective: ${section.objective}
Topics to cover: ${section.topics.join(", ") || "Choose the most useful subtopics for this objective."}

Make the section self-contained, accurate, practical, and easy to learn from. Explain unfamiliar ideas before using them, include examples where useful, and avoid repeating content that belongs in other sections.${formatBlock}`;
}

function formatSectionMarkdown(section, index, content) {
    const sectionParts = [
        `## ${index + 1}. ${section.title}`,
        section.objective ? `> **Learning objective:** ${section.objective}` : "",
        section.topics.length ? `**Topics:** ${section.topics.join(", ")}` : "",
        content || "",
    ];

    return sectionParts.filter(Boolean).join("\n\n");
}

async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runWorker() {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await worker(items[index], index);
        }
    }

    const workerCount = Math.min(limit, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
    return results;
}

export default function ChatBookApp() {
    const { showMessage } = useFlyout();
    const { chatBookSubject } = useAppState();
    const savedData = useMemo(() => {
        const initialResponse = readStoredValue("initialInstructionResponse", "");
        let outline = null;
        try {
            if (initialResponse) outline = parseBookOutline(initialResponse);
        } catch {
            outline = null;
        }

        const storedSectionResponses = readStoredValue("subsequentInstructionResponses", []);

        return {
            subject: readStoredValue("subject", ""),
            responseFormat: readStoredValue("responseFormat", "none"),
            initialResponse: outline ? JSON.stringify(outline, null, 2) : "",
            sectionResponses: outline && Array.isArray(storedSectionResponses)
                ? outline.sections.map((_, index) => storedSectionResponses[index] || "")
                : [],
            outline,
        };
    }, []);

    const [subject, setSubject] = useState(savedData.subject);
    const [responseFormat, setResponseFormat] = useState(savedData.responseFormat);
    const [bookOutline, setBookOutline] = useState(savedData.outline);
    const [initialInstructionResponse, setInitialInstructionResponse] = useState(savedData.initialResponse);
    const [subsequentInstructionResponses, setSubsequentInstructionResponses] = useState(savedData.sectionResponses);
    const [loading, setLoading] = useState(false);
    const [executionStarted, setExecutionStarted] = useState(false);
    const [completedRequests, setCompletedRequests] = useState(0);
    const [followUpView, setFollowUpView] = useState("scroll");
    const [slideIndex, setSlideIndex] = useState(0);

    const sectionCount = bookOutline?.sections.length || 0;
    const totalRequests = sectionCount + (bookOutline ? 1 : 0);
    const progress = totalRequests ? (completedRequests / totalRequests) * 100 : 0;
    const bookMarkdown = useMemo(() => {
        if (!bookOutline) return "";

        const learningPath = bookOutline.sections
            .map((section, index) => `${index + 1}. **${section.title}**${section.objective ? ` — ${section.objective}` : ""}`)
            .join("\n");
        const sections = bookOutline.sections
            .map((section, index) => formatSectionMarkdown(section, index, subsequentInstructionResponses[index]))
            .join("\n\n---\n\n");

        return [
            `# ${bookOutline.title}`,
            bookOutline.summary,
            `## Learning path\n\n${learningPath}`,
            sections,
        ].filter(Boolean).join("\n\n");
    }, [bookOutline, subsequentInstructionResponses]);

    const executeInstructions = async () => {
        const requestedSubject = subject.trim();
        if (!requestedSubject || loading) return;

        setLoading(true);
        setExecutionStarted(true);
        setCompletedRequests(0);
        setBookOutline(null);
        setInitialInstructionResponse("");
        setSubsequentInstructionResponses([]);
        setSlideIndex(0);

        try {
            const rawOutline = await getGeminiResponse(getOutlinePrompt(requestedSubject));
            let outline;

            try {
                outline = parseBookOutline(rawOutline);
            } catch {
                const repairedOutline = await getGeminiResponse(getRepairPrompt(rawOutline));
                outline = parseBookOutline(repairedOutline);
            }

            const canonicalOutline = JSON.stringify(outline, null, 2);
            setBookOutline(outline);
            setInitialInstructionResponse(canonicalOutline);
            setCompletedRequests(1);
            setSubsequentInstructionResponses(new Array(outline.sections.length).fill(""));

            let failedSections = 0;
            const responses = await mapWithConcurrency(
                outline.sections,
                SECTION_REQUEST_CONCURRENCY,
                async (section, index) => {
                    try {
                        const response = await getGeminiResponse(getSectionPrompt({
                            outline,
                            section,
                            index,
                            responseFormat,
                        }));
                        setSubsequentInstructionResponses((current) => {
                            const next = [...current];
                            next[index] = response;
                            return next;
                        });
                        return response;
                    } catch (error) {
                        failedSections += 1;
                        const failureMessage = `Unable to generate this section: ${error.message || "Unknown error"}`;
                        setSubsequentInstructionResponses((current) => {
                            const next = [...current];
                            next[index] = failureMessage;
                            return next;
                        });
                        return failureMessage;
                    } finally {
                        setCompletedRequests((current) => current + 1);
                    }
                },
            );

            setSubsequentInstructionResponses(responses);
            showMessage({
                type: failedSections ? "error" : "success",
                message: failedSections
                    ? `Book created with ${failedSections} section${failedSections === 1 ? "" : "s"} unable to generate.`
                    : `Book created with ${outline.sections.length} sections.`,
            });
        } catch (error) {
            console.error("Error generating chat book:", error);
            showMessage({ type: "error", message: error.message || "Unable to create the book." });
        } finally {
            setLoading(false);
            setExecutionStarted(false);
        }
    };

    const clear = () => {
        setSubject("");
        setBookOutline(null);
        setInitialInstructionResponse("");
        setSubsequentInstructionResponses([]);
        setCompletedRequests(0);
        setSlideIndex(0);
    };

    const printBook = () => {
        window.print();
    };

    useEffect(() => {
        if (chatBookSubject) setSubject(chatBookSubject);
    }, [chatBookSubject]);

    useEffect(() => {
        document.title = subject || "Chat Book";
    }, [subject]);

    useEffect(() => {
        setSlideIndex(0);
    }, [followUpView, sectionCount]);

    useEffect(() => {
        localStorage.setItem("subject", JSON.stringify(subject));
        localStorage.setItem("responseFormat", JSON.stringify(responseFormat));
        localStorage.removeItem("chatBookSyntaxHighlighting");
        localStorage.setItem("initialInstructionResponse", JSON.stringify(initialInstructionResponse));
        localStorage.setItem("subsequentInstructionResponses", JSON.stringify(subsequentInstructionResponses));
        localStorage.removeItem("numSteps");
        localStorage.removeItem("maxWords");
        localStorage.removeItem("mode");
        localStorage.removeItem("initialInstruction");
        localStorage.removeItem("subsequentInstructions");
        localStorage.removeItem("executionStarted");
    }, [subject, responseFormat, initialInstructionResponse, subsequentInstructionResponses]);

    return (
        <div className="cb-shell">
            <div className="cb-card cb-card--hero">
                <header className="cb-hero-heading">
                    <div className="cb-hero-icon"><FaBookOpen aria-hidden="true" /></div>
                    <div>
                        <span className="cb-eyebrow">Adaptive learning workspace</span>
                        <h1>What do you want to learn?</h1>
                        <p>Give Chat Book a topic. It will design the learning path and write every section automatically.</p>
                    </div>
                    <span className="cb-ready"><i /> Ready to learn</span>
                </header>

                <div className="cb-grid cb-grid--topic">
                    <div>
                        <label className="cb-label">Learning topic</label>
                        <input
                            className="cb-input"
                            disabled={loading}
                            value={subject}
                            placeholder="Try “Teach me how distributed systems work”"
                            onKeyDown={(event) => event.key === "Enter" && executeInstructions()}
                            onChange={(event) => setSubject(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="cb-label">Response style</label>
                        <select
                            className="cb-input"
                            value={responseFormat}
                            onChange={(event) => setResponseFormat(event.target.value)}
                            disabled={loading}
                        >
                            {RESPONSE_FORMATS.map((format) => (
                                <option key={format.value} value={format.value}>{format.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="cb-suggestions">
                    <span><FaRegLightbulb aria-hidden="true" /> Try an idea</span>
                    {promptSuggestions.map((suggestion) => (
                        <button key={suggestion} className="cb-suggestion" onClick={() => setSubject(suggestion)}>
                            {suggestion}
                        </button>
                    ))}
                </div>

                <div className="cb-primary-actions">
                    <button className="cb-btn cb-btn--primary" disabled={!subject.trim() || loading} onClick={executeInstructions}>
                        {loading ? <ClipLoader size={14} color="#fff" /> : <FaMagic aria-hidden="true" />}
                        {loading ? "Building your learning path…" : "Create learning book"}
                    </button>
                    <PasteButton setPasteText={setSubject} className="cb-btn cb-btn--ghost" />
                    <button className="cb-btn cb-btn--ghost" onClick={clear}><FaTrashAlt aria-hidden="true" /> Clear</button>
                </div>
            </div>

            <div className="cb-card">
                <div className="cb-book-status">
                    <span className="cb-pill">
                        {bookOutline ? `${sectionCount} sections selected by AI` : "Section count chosen automatically"}
                    </span>
                    <ProgressBar progress={progress} />
                    <ClipLoader color="#7557d5" loading={loading} size={16} />
                </div>

                {bookOutline && !loading && (
                    <div className="cb-book-actions">
                        <button className="cb-btn cb-btn--primary" onClick={printBook} disabled={loading}>
                            <FaPrint aria-hidden="true" /> Print book
                        </button>
                        <ActionButtons promptText={bookMarkdown} />
                    </div>
                )}

                {(executionStarted || bookOutline) && (
                    <div className="cb-output">
                      <AutoScroller activeIndex={subsequentInstructionResponses.filter(Boolean).length}>
                        {bookOutline && (
                            <>
                                <h2 className="cb-section-title">{bookOutline.title}</h2>
                                {bookOutline.summary && <p className="cb-book-summary">{bookOutline.summary}</p>}
                                <details className="cb-json-plan">
                                    <summary>View parsed JSON learning plan</summary>
                                    <pre>{initialInstructionResponse}</pre>
                                </details>
                            </>
                        )}

                        <div className="cb-section-toolbar">
                            <h3 className="cb-section-title">Learning sections</h3>
                            <div>
                                <button className={`cb-btn ${followUpView === "scroll" ? "cb-btn--primary" : "cb-btn--ghost"}`} onClick={() => setFollowUpView("scroll")}>Scroll</button>
                                <button className={`cb-btn ${followUpView === "slide" ? "cb-btn--primary" : "cb-btn--ghost"}`} onClick={() => setFollowUpView("slide")}>Focus</button>
                            </div>
                        </div>

                        {followUpView === "scroll" ? (
                            <div className="cb-section-list">
                                {bookOutline?.sections.map((section, index) => (
                                    <article key={section.id} className="cb-card cb-card--nested">
                                        <div className="cb-section-heading">
                                            <span>{String(index + 1).padStart(2, "0")}</span>
                                            <div><h3>{section.title}</h3><p>{section.objective}</p></div>
                                        </div>
                                        {subsequentInstructionResponses[index] ? (
                                            <>
                                                <ReactMarkdown className="cb-markdown">
                                                    {subsequentInstructionResponses[index]}
                                                </ReactMarkdown>
                                                <div className="cb-section-actions">
                                                    <ActionButtons promptText={formatSectionMarkdown(section, index, subsequentInstructionResponses[index])} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="cb-section-loading"><ClipLoader size={14} color="#7557d5" /> Writing section…</div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            bookOutline && sectionCount > 0 && (
                                <article className="cb-card cb-card--nested">
                                    <div className="cb-slide-nav">
                                        <button className="cb-btn cb-btn--ghost" onClick={() => setSlideIndex((index) => Math.max(0, index - 1))} disabled={slideIndex === 0}>← Prev</button>
                                        <span className="cb-pill">Section {slideIndex + 1} / {sectionCount}</span>
                                        <button className="cb-btn cb-btn--ghost" onClick={() => setSlideIndex((index) => Math.min(sectionCount - 1, index + 1))} disabled={slideIndex >= sectionCount - 1}>Next →</button>
                                    </div>
                                    <div className="cb-section-heading">
                                        <span>{String(slideIndex + 1).padStart(2, "0")}</span>
                                        <div>
                                            <h3>{bookOutline.sections[slideIndex].title}</h3>
                                            <p>{bookOutline.sections[slideIndex].objective}</p>
                                        </div>
                                    </div>
                                    {subsequentInstructionResponses[slideIndex] ? (
                                        <>
                                            <ReactMarkdown className="cb-markdown">
                                                {subsequentInstructionResponses[slideIndex]}
                                            </ReactMarkdown>
                                            <div className="cb-section-actions">
                                                <ActionButtons
                                                    promptText={formatSectionMarkdown(
                                                        bookOutline.sections[slideIndex],
                                                        slideIndex,
                                                        subsequentInstructionResponses[slideIndex],
                                                    )}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="cb-section-loading"><ClipLoader size={14} color="#7557d5" /> Writing section…</div>
                                    )}
                                </article>
                            )
                        )}
                      </AutoScroller>
                    </div>
                )}

                {!executionStarted && !bookOutline && (
                    <div className="cb-empty-state">
                        <FaBookOpen aria-hidden="true" />
                        <h3>Your learning path will appear here</h3>
                        <p>Chat Book chooses the right number of sections based on the topic and expands each one automatically.</p>
                    </div>
                )}
            </div>

            {bookOutline && createPortal(
                <div className="cb-print-book" aria-hidden="true">
                    <header className="cb-print-title">
                        <span>Learning Book</span>
                        <h1>{bookOutline.title}</h1>
                        {bookOutline.summary && <p>{bookOutline.summary}</p>}
                    </header>
                    {bookOutline.sections.map((section, index) => (
                        <article key={section.id} className="cb-print-section">
                            <div className="cb-print-section__heading">
                                <span>Section {index + 1}</span>
                                <h2>{section.title}</h2>
                                {section.objective && <p>{section.objective}</p>}
                            </div>
                            {subsequentInstructionResponses[index] && (
                                <ReactMarkdown className="cb-markdown">
                                    {subsequentInstructionResponses[index]}
                                </ReactMarkdown>
                            )}
                        </article>
                    ))}
                </div>,
                document.body,
            )}
        </div>
    );
}
