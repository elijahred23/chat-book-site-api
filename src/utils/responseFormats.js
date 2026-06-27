export const RESPONSE_FORMATS = [
  { value: "none", label: "No formatting (default)", instruction: "" },
  { value: "no_headers_no_lists", label: "No headers, no lists (paragraphs only)", instruction: "No headers. No lists. Use paragraph form only." },
  { value: "short_paragraphs", label: "Short paragraphs only", instruction: "Use short paragraphs (2–3 sentences). No bullet points." },
  { value: "bullets_only", label: "Bulleted list only", instruction: "Respond using bullet points only. No headings, no numbered lists." },
  { value: "numbered_steps", label: "Numbered steps only", instruction: "Respond using a numbered list only. No headings, no bullets." },
  { value: "headers_and_bullets", label: "Headings + bullets", instruction: "Use short headings with bullet points under each. No long paragraphs." },
  { value: "qa_pairs", label: "Q&A pairs", instruction: "Format as Q: ... then A: ... for each point. No headings." },
  { value: "table_like", label: "Table style (pipe rows)", instruction: "Use a markdown table with headers and pipe-delimited rows. No extra text." },
  { value: "bold_terms", label: "Bold terms + brief explanations", instruction: "Start each line with a bolded term followed by a short explanation. No headings." },
  { value: "code_blocks_only", label: "Code blocks only", instruction: "Respond using only code blocks where applicable. No explanations or other text." },
  { value: "code_blocks_only_no_comments", label: "Code blocks only (no comments)", instruction: "Respond using only code blocks where applicable. Do not include explanations, comments within the code, or other text." },
  { value: "code_blocks_only_files_and_console_commands", label: "Code blocks only (files + console commands)", instruction: "Respond using only code blocks. Use comments only to identify file names, such as // Program.cs. Include command-line commands when applicable. Do not include explanations or other text." },
];
