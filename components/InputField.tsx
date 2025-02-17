import React from "react";
import { Paperclip, Send } from "lucide-react";

type InputFieldProps = {
  message: string;
  setMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
};

const InputField: React.FC<InputFieldProps> = ({ message, setMessage, sendMessage }) => {
  return (
    <div className="flex items-center p-2 bg-white border-t border-gray-300">
      <button className="p-2 text-gray-500 hover:text-gray-700">
        <Paperclip size={20} />
      </button>

      <form onSubmit={sendMessage} className="flex flex-grow items-center mx-2 bg-gray-100 rounded-full px-4 py-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
          onChange={(event) => setMessage(event.target.value)}
        />
      </form>

      <button
        type="submit"
        disabled={message === ""}
        className={`p-2 rounded-full transition ${
          message ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default InputField;