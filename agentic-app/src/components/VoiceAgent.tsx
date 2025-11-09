"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognition = any;
type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [innerIndex: number]: {
        transcript: string;
      };
    };
  };
};

type LogEntry = {
  id: string;
  role: "assistant" | "user";
  message: string;
  timestamp: number;
};

type Task = {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "done";
  notes?: string;
};

export type VoiceAgentHandle = {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
};

type VoiceAgentProps = {
  onTaskUpdate: (tasks: Task[]) => void;
};

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const VoiceAgent: React.FC<VoiceAgentProps> = ({ onTaskUpdate }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    onTaskUpdate(tasks);
  }, [tasks, onTaskUpdate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      handleUserMessage(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      speak("I lost the audio signal. Please try again.");
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const speak = (text: string) => {
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1.02;
    synth.speak(utter);
  };

  const addLog = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => [
      ...prev,
      {
        ...entry,
        id: `${entry.role}-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      },
    ]);
  };

  const processCommand = (message: string) => {
    const lower = message.toLowerCase();
    if (lower.startsWith("create task") || lower.startsWith("add task")) {
      const title = message.replace(/^(create|add) task/i, "").trim() || "Untitled task";
      const task: Task = {
        id: typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`,
        title,
        status: "pending",
      };
      setTasks((prev) => [...prev, task]);
      speak(`Task "${title}" created.`);
      addLog({ role: "assistant", message: `Added task: ${title}` });
      return;
    }

    if (lower.startsWith("mark task") && (lower.includes("done") || lower.includes("complete"))) {
      const identifier = message.replace(/mark task/i, "").replace(/(as)?\s?(done|complete)/i, "").trim();
      setTasks((prev) => {
        const updated = prev.map((task) => {
          if (task.title.toLowerCase().includes(identifier.toLowerCase())) {
            return { ...task, status: "done" as const };
          }
          return task;
        });
        return updated;
      });
      speak(`Marked matching tasks as done.`);
      addLog({ role: "assistant", message: `Marked tasks matching "${identifier}" as done.` });
      return;
    }

    if (lower.startsWith("update task")) {
      const [, ...rest] = message.split(" ");
      const body = rest.join(" ");
      const [identifier, ...noteParts] = body.split(" with ");
      const notes = noteParts.join(" with ");
      setTasks((prev) =>
        prev.map((task) =>
          task.title.toLowerCase().includes(identifier.trim().toLowerCase())
            ? { ...task, status: "in-progress", notes: notes || task.notes }
            : task,
        ),
      );
      speak(`Updated task notes for items matching ${identifier}.`);
      addLog({ role: "assistant", message: `Updated task "${identifier.trim()}" with new notes.` });
      return;
    }

    if (lower.includes("list tasks")) {
      const summary =
        tasks.length === 0
          ? "You have no tasks at the moment."
          : tasks
              .map((task) => `${task.title}: ${task.status}${task.notes ? ` (${task.notes})` : ""}`)
              .join(". ");
      speak(summary);
      addLog({ role: "assistant", message: summary });
      return;
    }

    const defaultResponse =
      "I'm ready to manage catalog updates. Try commands like 'Create task update Amazon listings' or ask me to summarise pending work.";
    speak(defaultResponse);
    addLog({ role: "assistant", message: defaultResponse });
  };

  const handleUserMessage = (message: string) => {
    if (!message.trim()) return;
    addLog({ role: "user", message });
    processCommand(message);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleUserMessage(inputValue);
    setInputValue("");
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      speak("Listening for your command.");
    }
  };

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks],
  );

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Jarvis Command Center</h2>
          <p className="text-sm text-slate-300">
            Speak naturally to create tasks, request updates, or control catalog actions.
          </p>
        </div>
        <button
          onClick={toggleListening}
          className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
            isListening
              ? "border-green-300/60 bg-green-400/20 text-green-100 shadow-lg shadow-green-500/30"
              : "border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-500"
          }`}
        >
          {isListening ? "Listening…" : "Start Listening"}
        </button>
      </div>

      <div className="grid gap-3">
        <div className="flex items-end gap-3">
          <form onSubmit={handleSubmit} className="flex flex-1 gap-3">
            <input
              type="text"
              placeholder="Type a command if you prefer text input…"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Send
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Activity Log
          </h3>
          <div className="mt-3 flex max-h-56 flex-col gap-3 overflow-y-auto pr-1 text-sm">
            {logs.length === 0 ? (
              <p className="text-slate-400">Ask me to create a task or help with catalog listings.</p>
            ) : (
              logs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-xl border px-3 py-2 ${
                      log.role === "assistant"
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide">{log.role}</p>
                    <p>{log.message}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Active Ops Board
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {activeTasks.length === 0 ? (
            <li className="text-slate-400">All missions accomplished. Awaiting your next directive.</li>
          ) : (
            activeTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-100">{task.title}</p>
                  {task.notes ? <p className="text-xs text-slate-400">Notes: {task.notes}</p> : null}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    task.status === "pending"
                      ? "bg-yellow-400/20 text-yellow-200"
                      : "bg-indigo-400/20 text-indigo-100"
                  }`}
                >
                  {task.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
};

export default VoiceAgent;
