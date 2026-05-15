// =========================================
// App.jsx
// =========================================

import React, {
  useState,
  useEffect,
  useRef
} from "react";

import axios from "axios";

import ReactMarkdown from "react-markdown";

import {
  FiSend,
  FiUpload,
  FiMic,
  FiFileText,
  FiDownload,
  FiMoon,
  FiSun
} from "react-icons/fi";

import "./App.css";

function App() {

  const [file, setFile] = useState(null);

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([]);

  const [history, setHistory] = useState([]);

  const [selectedChat, setSelectedChat] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] =
    useState(true);

  const chatEndRef = useRef(null);

  const backendURL =
    "http://127.0.0.1:5000";

  // =========================================
  // THEME
  // =========================================

  useEffect(() => {

    const savedTheme =
      localStorage.getItem("theme");

    if(savedTheme === "light"){

      setDarkMode(false);
    }

  }, []);

  useEffect(() => {

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );

  }, [darkMode]);

  // =========================================
  // LOAD HISTORY
  // =========================================

  useEffect(() => {

    loadHistory();

  }, []);

  const loadHistory = async () => {

    try{

      const res = await axios.get(
        `${backendURL}/history`
      );

      setHistory(res.data);

    }catch(err){

      console.log(err);
    }
  };

  // =========================================
  // AUTO SCROLL
  // =========================================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior:"smooth"
    });

  }, [messages]);

  // =========================================
  // UPLOAD PDF
  // =========================================

  const uploadPDF = async () => {

    if(!file){

      alert("Choose a PDF");

      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try{

      setLoading(true);

      const res = await axios.post(
        `${backendURL}/upload`,
        formData
      );

      alert(res.data.message);

    }catch(err){

      console.log(err);

    }finally{

      setLoading(false);
    }
  };

  // =========================================
  // ASK QUESTION
  // =========================================

  const askQuestion = async () => {

    if(!question.trim()) return;

    try{

      setLoading(true);

      const res = await axios.post(
        `${backendURL}/ask`,
        {
          question
        }
      );

      setMessages(prev => [
        ...prev,
        res.data
      ]);

      setHistory(prev => [
        ...prev,
        res.data
      ]);

      setQuestion("");

    }catch(err){

      console.log(err);

    }finally{

      setLoading(false);
    }
  };

  // =========================================
  // SUMMARY
  // =========================================

  const summarizePDF = async () => {

    try{

      setLoading(true);

      const res = await axios.get(
        `${backendURL}/summarize`
      );

      const summaryData = {
        question:"PDF Summary",
        answer:res.data.summary,
        pages:[]
      };

      setMessages(prev => [
        ...prev,
        summaryData
      ]);

      setHistory(prev => [
        ...prev,
        summaryData
      ]);

    }catch(err){

      console.log(err);

    }finally{

      setLoading(false);
    }
  };

  // =========================================
  // EXPORT CHAT
  // =========================================

  const exportChat = () => {

    window.open(
      `${backendURL}/export-chat`
    );
  };

  // =========================================
  // VOICE INPUT
  // =========================================

  const startVoice = () => {

    const recognition =
      new window.webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.onresult = (event) => {

      setQuestion(
        event.results[0][0].transcript
      );
    };

    recognition.start();
  };

  return(

    <div className={
      darkMode
      ? "app dark"
      : "app light"
    }>

      {/* SIDEBAR */}

      <div className="sidebar">

        {/* LOGO */}

        <div className="logo">

          <h1>
            🤖 RAG Assistant
          </h1>

          <p>
            Chat with your PDF
          </p>

        </div>

        {/* DOCUMENT */}

        <div>

          <p className="section-title">
            DOCUMENT
          </p>

          <input
            type="file"
            accept=".pdf"
            onChange={(e)=>
              setFile(e.target.files[0])
            }
          />

          <button
            className="sidebar-btn"
            onClick={uploadPDF}
          >

            <FiUpload />

            Upload PDF

          </button>

        </div>

        {/* TOOLS */}

        <div>

          <p className="section-title">
            TOOLS
          </p>

          <button
            className="secondary-btn"
            onClick={summarizePDF}
          >

            <FiFileText />

            Summarize PDF

          </button>

          <button
            className="secondary-btn"
            onClick={exportChat}
          >

            <FiDownload />

            Export Chat

          </button>

        </div>

        {/* HISTORY */}

        <div className="history-section">

          <p className="section-title">
            HISTORY
          </p>

          <div className="history-list">

            {
              history
              .slice()
              .reverse()
              .map((item,index)=>(

                <div
                  key={index}
                  className="history-item"
                  onClick={() =>
                    setSelectedChat(item)
                  }
                >

                  {
                    item.question.length > 28
                    ? item.question.slice(0,28)
                      + "..."
                    : item.question
                  }

                </div>
              ))
            }

          </div>

        </div>

      </div>

      {/* MAIN */}

      <div className="main">

        {/* TOPBAR */}

        <div className="topbar">

          <div>

            <h2>
              Document Q&A
            </h2>

            <p>
              Ask questions directly
              from your uploaded PDF
            </p>

          </div>

          <button
            className="theme-btn"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >

            {
              darkMode
              ? <FiSun />
              : <FiMoon />
            }

          </button>

        </div>

        {/* CHAT AREA */}

        <div className="chat-area">

          {
            messages.length === 0 &&
            !selectedChat && (

              <div className="empty-state">

                <h2>
                  Upload a PDF and
                  start asking questions
                </h2>

                <p>
                  Your AI assistant
                  answers directly
                  from the document
                </p>

              </div>
            )
          }

          {/* SELECTED HISTORY */}

          {
            selectedChat && (

              <div className="message-wrapper">

                <div className="question">

                  {selectedChat.question}

                </div>

                <div className="answer">

                  <ReactMarkdown>
                    {selectedChat.answer}
                  </ReactMarkdown>

                  {
                    selectedChat.pages
                    .length > 0 && (

                      <div className="pages">

                        📄 Source Pages:
                        {" "}
                        {
                          selectedChat.pages.join(", ")
                        }

                      </div>
                    )
                  }

                </div>

              </div>
            )
          }

          {/* CURRENT SESSION */}

          {
            messages.map((msg,index)=>(

              <div
                className="message-wrapper"
                key={index}
              >

                <div className="question">

                  {msg.question}

                </div>

                <div className="answer">

                  <ReactMarkdown>
                    {msg.answer}
                  </ReactMarkdown>

                  {
                    msg.pages.length > 0 && (

                      <div className="pages">

                        📄 Source Pages:
                        {" "}
                        {msg.pages.join(", ")}

                      </div>
                    )
                  }

                </div>

              </div>
            ))
          }

          {
            loading && (

              <div className="typing">

                <span></span>
                <span></span>
                <span></span>

              </div>
            )
          }

          <div ref={chatEndRef}></div>

        </div>

        {/* INPUT */}

        <div className="input-bar">

          <input
            type="text"
            placeholder="Ask a question about the document..."
            value={question}
            onChange={(e)=>
              setQuestion(e.target.value)
            }
            onKeyDown={(e)=>{

              if(e.key === "Enter"){

                askQuestion();
              }
            }}
          />

          {/* MIC */}

          <button
            onClick={startVoice}
          >

            <FiMic />

          </button>

          {/* SEND */}

          <button
            onClick={askQuestion}
          >

            <FiSend />

          </button>

        </div>

      </div>

    </div>
  );
}

export default App;