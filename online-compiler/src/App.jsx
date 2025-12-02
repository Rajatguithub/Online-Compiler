import { useState } from "react";
import axios from "axios";

const LANGUAGE_ID_MAP = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  php: 68,
  ruby: 72,
  go: 60,
  rust: 73,
  kotlin: 78,
  swift: 83,
};

const LANGUAGE_LABELS = {
  python: "Python",
  javascript: "JavaScript (Node)",
  java: "Java",
  cpp: "C++ (GCC)",
  c: "C (GCC)",
  csharp: "C#",
  php: "PHP",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
};

const JUDGE0_BASE_URL = import.meta.env.VITE_JUDGE0_BASE_URL;
const JUDGE0_API_KEY = import.meta.env.VITE_JUDGE0_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState('print("Hello from automation!")');
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const runCode = async () => {
    if (!JUDGE0_BASE_URL) {
      setOutput("❌ JUDGE0_BASE_URL is not set in .env.local");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running code...");

    try {
      const languageId = LANGUAGE_ID_MAP[language];

      const headers = {
        "Content-Type": "application/json",
      };

      if (JUDGE0_API_KEY) {
        headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
        // headers["X-RapidAPI-Host"] = "your-judge0-host";
      }

      const res = await axios.post(
        JUDGE0_BASE_URL,
        {
          source_code: code,
          language_id: languageId,
          stdin: stdin || "",
        },
        { headers }
      );

      const data = res.data;
      const stdout = data.stdout || "";
      const stderr = data.stderr || "";
      const compileOutput = data.compile_output || "";
      const status = data.status?.description || "";

      let finalOutput = "";
      if (status) finalOutput += `Status: ${status}\n\n`;
      if (stdout) finalOutput += `Output:\n${stdout}\n`;
      if (stderr) finalOutput += `Errors:\n${stderr}\n`;
      if (compileOutput) finalOutput += `Compiler Output:\n${compileOutput}\n`;

      setOutput(finalOutput || "No output.");
    } catch (err) {
      console.error(err);
      setOutput(
        "❌ Error running code. Check the browser console & your Judge0 config."
      );
    } finally {
      setIsRunning(false);
    }
  };

  const askAi = async () => {
    if (!OPENAI_API_KEY) {
      setAiResponse("❌ VITE_OPENAI_API_KEY is not set in .env.local");
      return;
    }
    if (!aiPrompt.trim()) {
      setAiResponse("Please type a question for the AI assistant.");
      return;
    }

    setIsThinking(true);
    setAiResponse("🤖 Thinking...");

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful coding assistant inside an online compiler. Explain code, suggest fixes, and help with errors.",
            },
            {
              role: "user",
              content: `Language: ${LANGUAGE_LABELS[language]}\n\nCode:\n${code}\n\nQuestion:\n${aiPrompt}`,
            },
          ],
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error(data.error);
        setAiResponse(
          "❌ Error from AI API. Check your API key / usage in the console."
        );
        return;
      }

      const answer = data.choices?.[0]?.message?.content?.trim();
      setAiResponse(answer || "No response from AI.");
    } catch (err) {
      console.error(err);
      setAiResponse("❌ Error calling AI API. Check the console for details.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
        ⚙️ Online Compiler + 🤖 AI Assistant
      </h1>
      <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
        React + Vite frontend using Judge0 for code execution and an AI helper
        for explanations.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.5fr",
          gap: "1rem",
          alignItems: "stretch",
        }}
      >
        {/* Left side: editor & output */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <label style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                Language
              </label>
              <br />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  marginTop: "0.2rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #1f2937",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={runCode}
              disabled={isRunning}
              style={{
                padding: "0.6rem 1.1rem",
                borderRadius: "999px",
                border: "none",
                cursor: isRunning ? "not-allowed" : "pointer",
                background: isRunning ? "#4b5563" : "#22c55e",
                color: "#020617",
                fontWeight: 600,
                boxShadow: "0 10px 25px rgba(34,197,94,0.25)",
                transition: "transform 0.08s",
              }}
            >
              {isRunning ? "Running..." : "Run ▶"}
            </button>
          </div>

          <div
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: "1px solid #1f2937",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                opacity: 0.7,
                marginBottom: "0.5rem",
              }}
            >
              Code
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                width: "100%",
                resize: "none",
                background: "transparent",
                border: "none",
                color: "#e5e7eb",
                fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular",
                fontSize: "0.9rem",
                outline: "none",
              }}
              spellCheck={false}
            />
          </div>

          <div
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: "1px solid #1f2937",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                opacity: 0.7,
                marginBottom: "0.5rem",
              }}
            >
              Standard Input (stdin)
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              style={{
                width: "100%",
                height: "70px",
                resize: "none",
                background: "transparent",
                border: "none",
                color: "#e5e7eb",
                fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular",
                fontSize: "0.85rem",
                outline: "none",
              }}
              spellCheck={false}
              placeholder="Input that your program reads from stdin"
            />
          </div>

          <div
            style={{
              background: "#020617",
              borderRadius: "0.75rem",
              padding: "0.75rem",
              border: "1px solid #1f2937",
              minHeight: "120px",
              whiteSpace: "pre-wrap",
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                opacity: 0.7,
                marginBottom: "0.5rem",
              }}
            >
              Output
            </div>
            {output || "Run your code to see output here."}
          </div>
        </div>

        {/* Right side: AI panel */}
        <div
          style={{
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "0.75rem",
            border: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "1rem" }}>🤖 AI Assistant</h2>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Ask things like “Explain this code”, “Why am I getting this error?”
            or “Convert this to Java”.
          </p>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Type your question about the code..."
            style={{
              width: "100%",
              height: "90px",
              resize: "none",
              background: "#020617",
              borderRadius: "0.5rem",
              border: "1px solid #1f2937",
              padding: "0.5rem",
              color: "#e5e7eb",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />

          <button
            onClick={askAi}
            disabled={isThinking}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              cursor: isThinking ? "not-allowed" : "pointer",
              background: isThinking ? "#4b5563" : "#38bdf8",
              color: "#020617",
              fontWeight: 600,
              alignSelf: "flex-start",
              boxShadow: "0 10px 25px rgba(56,189,248,0.3)",
            }}
          >
            {isThinking ? "Asking..." : "Ask AI 💬"}
          </button>

          <div
            style={{
              flex: 1,
              background: "#020617",
              borderRadius: "0.5rem",
              border: "1px solid #1f2937",
              padding: "0.5rem",
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
              overflowY: "auto",
            }}
          >
            {aiResponse || "AI answers will show up here."}
          </div>
        </div>
      </div>
    </div>
  );
}
