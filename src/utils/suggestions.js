export const CODE_SUGGESTIONS = [
  // 🔍 Code Understanding
  { label: "Explain Code", value: "Explain what this code does step by step" },
  { label: "Summarize Code", value: "Summarize what this script or module is responsible for" },
  { label: "Explain Algorithm", value: "Explain the algorithm or logic in simple terms" },
  { label: "Explain Output", value: "Explain what the output of this code will be and why" },
  { label: "Visualize Flow", value: "Describe how to visualize this logic in a flowchart or UML diagram" },
  {label: "Memory Acronym", value: "Provide a acronym to help remember this concept" },
  { label: "Trace Execution", value: "Simulate how this code executes line by line" },

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

  // 🧩 Refactoring and Architecture
  { label: "Refactor", value: "Refactor this code to follow clean code principles or design patterns" },
  { label: "Apply Design Pattern", value: "Identify and apply a suitable design pattern to this code" },
  { label: "Clean Code", value: "Rewrite this to follow clean code and SOLID principles" },
  { label: "Modularize", value: "Break this code into smaller, reusable modules" },
  { label: "Improve Naming", value: "Suggest better variable and function names" },
  { label: "Add Logging", value: "Show how to add useful logging for debugging" },
  { label: "Add Error Handling", value: "Add try/catch or error handling where appropriate" },
  { label: "Decouple Logic", value: "Separate business logic from UI or I/O code" },

  // 🧪 Testing
  { label: "Generate Tests", value: "Write unit tests or integration tests for this code" },
  { label: "Test Scenarios", value: "List test cases to verify this function" },
  { label: "Mock Data", value: "Show how to mock dependencies for this test" },
  { label: "Boundary Tests", value: "Suggest tests for boundary and edge conditions" },
  { label: "Coverage Improvement", value: "Suggest areas where test coverage could be improved" },

  // 🧱 Documentation and Review
  { label: "Add Comments", value: "Add meaningful comments and documentation to this code" },
  { label: "Document Function", value: "Write docstrings or JSDoc for each function" },
  { label: "Code Review", value: "Perform a code review and suggest improvements" },
  { label: "Best Practices", value: "Suggest coding best practices for this language or framework" },
  { label: "Readability", value: "Improve readability and formatting of this code" },
  { label: "Version Control", value: "Explain how to commit this change with a proper Git message" },

  // 🧮 Algorithms and Data Structures
  { label: "Algorithm Analysis", value: "Analyze time and space complexity" },
  { label: "Data Structure Choice", value: "Recommend a better data structure for this problem" },
  { label: "Alternative Algorithm", value: "Suggest a more efficient algorithm for this task" },
  { label: "Explain Big O", value: "Explain this algorithm’s Big O complexity" },
  { label: "Recursive to Iterative", value: "Convert this recursive function to an iterative one" },
  { label: "Dynamic Programming", value: "Show how to use dynamic programming to solve this problem" },

  // 🧰 DevOps and Environment
  { label: "Dockerize", value: "Show how to containerize this application using Docker" },
  { label: "Kubernetes Setup", value: "Suggest a basic Kubernetes deployment for this app" },
  { label: "CI/CD", value: "Explain how to add CI/CD automation for this project" },
  { label: "Environment Variables", value: "Show how to properly handle sensitive environment variables" },

  // 💾 Database and API
  { label: "Optimize Query", value: "Optimize this SQL or ORM query for better performance" },
  { label: "Secure API", value: "Review this API for potential security issues" },
  { label: "Add Pagination", value: "Add pagination or filtering logic to this API" },
  { label: "Error Responses", value: "Define consistent error responses for this API" },
  { label: "Validate Schema", value: "Validate request/response schema using JSON Schema or similar" },

  // 🧠 Conceptual and Educational
  { label: "Compare Methods", value: "Compare this approach with another programming method" },
  { label: "Explain Concept", value: "Explain the key programming concept used here" },
  { label: "Simplify Code", value: "Simplify the logic while keeping functionality intact" },
  { label: "Real-World Example", value: "Provide a real-world analogy for this code" },
  { label: "Next Steps", value: "Suggest logical improvements or next development steps" },
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
