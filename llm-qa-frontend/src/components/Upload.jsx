// import { useState } from "react";
// import axios from "axios";

// export default function Upload() {
//   const [file, setFile] = useState(null);

//   const handleUpload = async () => {
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       await axios.post("http://localhost:5000/upload", formData);
//       alert("PDF uploaded successfully!");
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="p-4 bg-gray-800 flex gap-2 items-center">
//       <input
//         type="file"
//         onChange={(e) => setFile(e.target.files[0])}
//         className="text-white"
//       />
//       <button
//         onClick={handleUpload}
//         className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
//       >
//         Upload
//       </button>
//     </div>
//   );
// }




import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData
    });

    alert("Uploaded successfully!");
  };

  return (
    <div style={{ padding: "10px" }}>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}