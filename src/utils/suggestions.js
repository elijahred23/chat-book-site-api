export const CODE_SUGGESTIONS = [
  // 🔍 Code Understanding
  { label: "Explain Code", value: "Explain what this code does step by step. Do NOT include any code in your response—only explanation in plain English." },
  { label: "Code Example", value: "Provide an example of this text in practice"},
  { label: "Explain Out Loud", value: "Explain this code in natural spoken language (as if reading it aloud to a human). Avoid jargon where possible, describe what each part is doing and why, and keep it easy to follow. Do not return any programming code, just explanation" },
  { label: "One Example", value: "Provide one example, if multiple subjects try to provide one example for each subject, if not able to then one example for each subject"},

  // 🧠 Debugging and Troubleshooting
  { label: "Fix Bugs", value: "Find and fix potential bugs or logic errors in this code" },
  { label: "Explain Error", value: "Explain what this error message means and how to fix it" },
  { label: "Debug Strategy", value: "Suggest a debugging strategy or tools to identify this issue" },
  { label: "Edge Cases", value: "List possible edge cases this code should handle" },
  { label: "Validate Input", value: "Show how to validate user input and prevent bad data" },

  // ⚙️ Optimization
  { label: "Optimize", value: "Suggest ways to optimize this code for performance or readability" },
  { label: "Reduce Complexity", value: "Simplify this logic to reduce time or space complexity" },
  { label: "Memory Optimization", value: "Suggest optimizations to reduce memory usage" },
  { label: "Performance Test", value: "Show how to benchmark or measure performance for this code" },
];
export const IDEA_SUGGESTIONS = [
  { label: "Brainstorm Ideas", value: "Generate creative ideas or directions" },
  { label: "Improve Idea", value: "Suggest improvements or variations on this idea" },
  { label: "Identify Risks", value: "List possible risks or failure points" },
  { label: "Pros and Cons", value: "List advantages and disadvantages of this idea" },
  { label: "Use Case Examples", value: "Describe real-world situations where this applies" },
  { label: "Future Opportunities", value: "Predict where this trend might be going in the future" },
  { label: "Competitive Comparison", value: "Compare this idea to competitors or alternatives" },
  { label: "Elevator Pitch", value: "Write a short persuasive explanation of this idea" },
  { label: "Target Audience", value: "Identify who would benefit most from this" },
  { label: "Make it Practical", value: "Explain how to turn this idea into real action steps" },
];

export const LEARNING_SUGGESTIONS = [
  { label: "Teach Me Like I'm 5", value: "Explain this concept in very simple terms" },
  { label: "Teach Me Like I'm Expert", value: "Explain this topic using advanced terminology" },
  { label: "Memory Metaphor", value: "Use a metaphor or analogy to help remember this" },
  { label: "Flashcards", value: "Generate flashcards to study this material" },
  { label: "Memorize Sentence", value: "Help me memorize this sentence/phrase with spaced-repetition prompts and quick recall questions" },
  { label: "Memorize Paragraph", value: "Chunk this paragraph into bite-size pieces for memorization and provide recall cues" },
  { label: "Memorize Key Chunks", value: "Identify the most important chunks to memorize to understand the whole idea; include mnemonics and tests" },
  { label: "Step-by-Step Breakdown", value: "Break this idea into gradual steps to understand it" },
  { label: "Common Misunderstandings", value: "Explain common mistakes people make with this concept" },
  { label: "Quiz Me", value: "Ask quiz questions to test my understanding" },
  { label: "Study Plan", value: "Create a study plan to learn this over time" },
  { label: "Mind Map", value: "Describe how to build a mind map from this information" },
  { label: "Confidence Check", value: "Ask questions to determine where I am confused" },
];

export const RESEARCH_SUGGESTIONS = [
  { label: "Explain Sources", value: "Explain what reliable sources support this topic" },
  { label: "Show Contradictions", value: "Identify any contradictions or debate in research" },
  { label: "Evaluate Credibility", value: "Analyze how credible these claims or sources are" },
  { label: "APA Citations", value: "Provide APA formatted citations and references" },
  { label: "Key Researchers", value: "List the most important researchers or papers in this field" },
  { label: "Historical Context", value: "Describe the history and evolution of this concept" },
  { label: "Compare Theories", value: "Compare two major theories that relate to this topic" },
  { label: "Write Abstract", value: "Write a concise academic abstract summarizing the main idea" },
  { label: "Research Questions", value: "Suggest research questions or hypotheses to explore" },
  { label: "Methodology Advice", value: "Recommend a suitable research method or experimental design" },
];
export const WRITING_SUGGESTIONS = [
  { label: "Summarize Text", value: "Summarize the main points clearly and concisely" },
  { label: "Rewrite for Clarity", value: "Rewrite this text to be clearer and easier to understand" },
  { label: "Make More Professional", value: "Rewrite this text in a professional tone suitable for business" },
  { label: "Make More Casual", value: "Rewrite this text in a conversational and informal tone" },
  { label: "Shorten Text", value: "Shorten this text but keep the original meaning" },
  { label: "Expand Text", value: "Expand this explanation with more detail and depth" },
  { label: "Add Examples", value: "Add real-world examples to clarify these ideas" },
  { label: "Improve Grammar", value: "Fix grammar, spelling, and punctuation errors" },
  { label: "Add Bullet Points", value: "Convert this text into bullet point notes" },
  { label: "Rewrite as Script", value: "Turn this into a conversational podcast or dialogue script" },
  { label: "Rewrite as Story", value: "Convert this content into a narrative story format" },
];


export const SUGGESTION_GROUPS = {
  code: CODE_SUGGESTIONS,
  writing: WRITING_SUGGESTIONS,
  research: RESEARCH_SUGGESTIONS,
  learning: LEARNING_SUGGESTIONS,
  ideas: IDEA_SUGGESTIONS,
};
