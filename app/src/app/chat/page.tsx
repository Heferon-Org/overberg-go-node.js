"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "driver";
  text: string;
  time: string;
}

const initialMessages: Message[] = [
  { id: "1", sender: "driver", text: "Hi! I'm on my way to pick up your order from Harbour Café.", time: "09:44" },
  { id: "2", sender: "user", text: "Great, thanks Sipho!", time: "09:44" },
  { id: "3", sender: "driver", text: "Just picked it up. ETA about 12 minutes.", time: "09:52" },
  { id: "4", sender: "user", text: "Perfect. I'm at the front door.", time: "09:53" },
  { id: "5", sender: "driver", text: "Coming down Marine Road now. Almost there! 🚗", time: "09:58" },
];

const quickReplies = [
  "I'm outside",
  "Please call me",
  "Take your time",
  "Leave at the door",
  "Can't find the address?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Simulate driver reply
    setTimeout(() => {
      const replies = [
        "Got it! 👍",
        "No problem, will do!",
        "Thanks for letting me know.",
        "Almost there!",
        "Sure thing! 🙂",
      ];
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-reply`,
          sender: "driver",
          text: replies[Math.floor(Math.random() * replies.length)],
          time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="flex items-center gap-3 px-[18px] pt-3 pb-3 border-b border-bd bg-white">
        <Link
          href="/orders/tracking"
          className="w-10 h-10 rounded-[14px] bg-dark3 border border-bd flex items-center justify-center text-lg shrink-0"
        >
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-lg">
          👤
        </div>
        <div className="flex-1">
          <div className="font-heading font-bold text-sm">Sipho Ndlovu</div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[11px] text-t2">Online · Your driver</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
            📞
          </button>
        </div>
      </div>

      {/* Order context */}
      <div className="px-[18px] py-2.5 bg-dark2 border-b border-bd flex items-center gap-2">
        <span className="text-sm">🛵</span>
        <span className="text-[11px] text-t2 font-heading font-semibold">
          Order #OBG-2847 · Harbour Café → Marine 127
        </span>
        <Link href="/orders/tracking" className="ml-auto text-primary text-[11px] font-heading font-bold">
          Track →
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-[18px] py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.sender === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-dark2 border border-bd text-t1 rounded-bl-md"
              }`}
            >
              <div className="text-sm">{msg.text}</div>
              <div
                className={`text-[9px] mt-1 ${
                  msg.sender === "user" ? "text-white/60" : "text-t3"
                }`}
              >
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex gap-2 overflow-x-auto px-[18px] py-2 no-scrollbar border-t border-bd">
        {quickReplies.map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            className="shrink-0 bg-dark3 border border-bd rounded-full px-3 py-1.5 text-[11px] font-heading font-semibold text-t2 active:bg-primary/10 active:border-primary/30 transition-colors"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-[18px] py-3 pb-8 bg-white border-t border-bd">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            className="flex-1 bg-dark3 border border-bd rounded-full px-4 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-white active:bg-primary-dark active:scale-95 transition-all shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
