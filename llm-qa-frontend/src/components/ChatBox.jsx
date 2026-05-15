// import { useState } from "react";
// import axios from "axios";

// export default function ChatBox() {
//   const [messages, setMessages] = useState([]);
//   const [question, setQuestion] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleAsk = async () => {
//     if (!question.trim()) return;

//     const newMessages = [...messages, { type: "user", text: question }];
//     setMessages(newMessages);
//     setQuestion("");
//     setLoading(true);

//     try {
//       const response = await fetch("http://localhost:5000/ask", {
//         method: "POST",
//         headers: {"Content-Type": "application/json"},
//         body: JSON.stringify({ question })
//       });

//       const reader = response.body.getReader();
//       let botText = "";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = new TextDecoder().decode(value);
//         botText += chunk;

//         setMessages([...newMessages, { type: "bot", text: botText }]);
//       }

//     } catch (err) {
//       console.error(err);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-900 text-white">

//       {/* Header */}
//       <div className="p-4 text-xl font-bold border-b border-gray-700">
//         LLM Q&A System
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         {messages.map((msg, i) => (
//           <div key={i} className={`max-w-xl p-3 rounded-lg ${
//             msg.type === "user"
//               ? "bg-blue-500 ml-auto"
//               : "bg-gray-700"
//           }`}>
//             {msg.text}
//           </div>
//         ))}

//         {loading && <p className="text-gray-400">Typing...</p>}
//       </div>

//       {/* Input */}
//       <div className="p-4 flex gap-2 border-t border-gray-700">
//         <input
//           value={question}
//           onChange={(e) => setQuestion(e.target.value)}
//           className="flex-1 p-2 rounded bg-gray-800 outline-none"
//           placeholder="Ask something..."
//         />
//         <button
//           onClick={handleAsk}
//           className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }











// import { useState } from "react";

// export default function ChatBox() {
//   const [messages, setMessages] = useState([]);
//   const [question, setQuestion] = useState("");

//   const handleAsk = async () => {
//     if (!question.trim()) return;

//     const newMessages = [...messages, { type: "user", text: question }];
//     setMessages(newMessages);
//     setQuestion("");

//     const response = await fetch("http://127.0.0.1:5000/ask", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ question })
//     });

//     const reader = response.body.getReader();
//     let botText = "";

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;

//       const chunk = new TextDecoder().decode(value);
//       botText += chunk;

//       setMessages([...newMessages, { type: "bot", text: botText }]);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>LLM Q&A System</h2>

//       <div style={{
//         border: "1px solid #ccc",
//         height: "300px",
//         overflowY: "scroll",
//         padding: "10px",
//         marginBottom: "10px"
//       }}>
//         {messages.map((msg, i) => (
//           <p key={i} style={{
//             textAlign: msg.type === "user" ? "right" : "left"
//           }}>
//             <b>{msg.type === "user" ? "You" : "Bot"}:</b> {msg.text}
//           </p>
//         ))}
//       </div>

//       <input
//         value={question}
//         onChange={(e) => setQuestion(e.target.value)}
//         placeholder="Ask something..."
//         style={{ width: "70%" }}
//       />

//       <button onClick={handleAsk}>Ask</button>
//     </div>
//   );
// }


import { useState } from "react";

export default function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userMessage = { type: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    try {
      const response = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { type: "bot", text: data.answer }
      ]);

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⚠️ Error getting response" }
      ]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>LLM Q&A System</h2>

      <div style={{
        border: "1px solid #ccc",
        height: "300px",
        overflowY: "auto",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px"
      }}>
        {messages.map((msg, i) => (
          <p key={i} style={{
            textAlign: msg.type === "user" ? "right" : "left"
          }}>
            <b>{msg.type === "user" ? "You" : "Bot"}:</b> {msg.text}
          </p>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            color: "black",
            background: "white"
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAsk();
          }}
        />

        <button
          onClick={handleAsk}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer"
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}