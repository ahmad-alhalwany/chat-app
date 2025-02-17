"use client";
import { useEffect, useRef, useState } from "react";
import InputField from "./InputField";

export default function Chat() {
  const socketRef = useRef<WebSocket | null>(null);
  const [username, setUserName] = useState<string>("");
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [users, setUsers] = useState<string[]>(() => []);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8080/ws");

    socketRef.current.onopen = () => {
      console.log("Connected to WebSocket server");
      const name = window.prompt("Enter your name");
      if (name && socketRef.current) {
        setUserName(name);
        socketRef.current.send(JSON.stringify({ type: "login", userName: name }));
      }
    };

    socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received:", data);
      
          if (data.type === "welcome") {
            setMessages((prev) => [...prev, { user: "System", text: data.data }]);
          } else if (data.type === "message") {
            setMessages((prev) => [...prev, { user: data.userName, text: data.data }]);
          } else if (data.type === "userJoined") {
            console.log("Updated active users:", data.users);
            setUsers([...data.users]);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

    socketRef.current.onerror = (error) => console.error("WebSocket error:", error);
    socketRef.current.onclose = () => console.log("Disconnected from server");

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({ type: "message", userName: username, data: message }));
    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4 bg-green-500 text-white text-lg font-bold shadow-md text-center">
        WhatsApp Chat Clone
      </div>

      <div className="p-2 bg-white shadow-md text-center">
        <strong>Active Users:</strong> {users.length > 0 ? users.join(", ") : "No users online"}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.user === username ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg p-2 max-w-xs text-white ${
                msg.user === username ? "bg-blue-500" : "bg-gray-300 text-black"
              }`}
            >
              {msg.user !== "System" && <strong>{msg.user}: </strong>}
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <InputField message={message} setMessage={setMessage} sendMessage={sendMessage} />
    </div>
  );
}