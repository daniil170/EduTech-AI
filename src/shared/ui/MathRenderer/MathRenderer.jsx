import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

// Helper function to sanitize raw LaTeX strings from JSON/AI response
const cleanText = (str) => {
  if (!str) return "";
  let cleaned = str
    .toString()
    .replace(/\\\\/g, "\\")
    .replace(/\\n/g, "\n");
    
  // Fix missing brackets in \text for Cyrillic/Latin
  cleaned = cleaned.replace(/\\text([А-Яа-яA-Za-z0-9]+)/g, "\\text{$1}");
  
  // Fix missing brackets in \frac
  cleaned = cleaned.replace(/\\frac([A-Za-z0-9])([A-Za-z0-9])/g, "\\frac{$1}{$2}");

  // Escape percentages that are not already escaped
  cleaned = cleaned.replace(/(\d+)%/g, "$1\\%");

  // Support Russian ctg/tg Math symbols in KaTeX
  cleaned = cleaned.replace(/\\mathrmctg\b/g, "\\mathrm{ctg}");
  cleaned = cleaned.replace(/\\mathrmtg\b/g, "\\mathrm{tg}");

  return cleaned;
};

export const MathRenderer = ({ text, inline = false, className = "" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false,
          errorColor: "#f59e0b", // amber-500
          strict: "ignore",
          macros: {
            "\\tg": "\\tan",
            "\\ctg": "\\cot",
            "\\arctg": "\\arctan",
            "\\arcctg": "\\arccot",
            "\\mathrmtg": "\\tan",
            "\\mathrmctg": "\\cot"
          }
        });
      } catch (err) {
        console.error("KaTeX auto-render error:", err);
      }
    }
  }, [text]);

  if (!text) return null;

  const cleaned = cleanText(text);

  if (inline) {
    // Process basic bold syntax even in inline mode
    const boldParts = cleaned.split(/(\*\*[^*]+\*\*)/g);
    const content = boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        return (
          <strong key={bIdx} className="font-bold text-white">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });

    return (
      <span ref={containerRef} className={className}>
        {content}
      </span>
    );
  }

  // Otherwise, split by lines and render layout elements (headings, list items, paragraphs)
  const lines = cleaned.split("\n");
  const parsedLines = lines.map((line, lineIdx) => {
    let currentLine = line.trim();
    if (!currentLine) return <div key={lineIdx} className="h-2" />;

    // Detect header
    let isHeader = false;
    let headerLevel = 3;
    if (currentLine.startsWith("###")) {
      isHeader = true;
      headerLevel = 3;
      currentLine = currentLine.replace(/^###\s*/, "");
    } else if (currentLine.startsWith("##")) {
      isHeader = true;
      headerLevel = 2;
      currentLine = currentLine.replace(/^##\s*/, "");
    }

    // Process bold text
    const boldParts = currentLine.split(/(\*\*[^*]+\*\*)/g);
    const renderedLineContent = boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith("**") && bPart.endsWith("**")) {
        return (
          <strong key={bIdx} className="font-black text-white">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });

    if (isHeader) {
      if (headerLevel === 2) {
        return (
          <h3 key={lineIdx} className="text-base font-bold text-indigo-400 mt-5 mb-3">
            {renderedLineContent}
          </h3>
        );
      }
      return (
        <h4 key={lineIdx} className="text-sm font-black text-indigo-400 uppercase tracking-wider mt-4 mb-2 border-b border-slate-800 pb-1">
          {renderedLineContent}
        </h4>
      );
    }

    // Detect list item
    if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
      const cleanLine = line.trim().replace(/^[*+-]\s*/, "");
      const boldPartsList = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const renderedListContent = boldPartsList.map((bPart, bIdx) => {
        if (bPart.startsWith("**") && bPart.endsWith("**")) {
          return (
            <strong key={bIdx} className="font-black text-white">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
      return (
        <div key={lineIdx} className="flex items-start gap-2 pl-2 my-1">
          <span className="text-indigo-500">•</span>
          <div className="flex-1">{renderedListContent}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="leading-relaxed mb-2">
        {renderedLineContent}
      </p>
    );
  });

  return (
    <div ref={containerRef} className={className}>
      {parsedLines}
    </div>
  );
};
