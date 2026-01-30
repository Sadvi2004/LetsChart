// const askOllama = async (prompt) => {
//     const response = await fetch("http://127.0.0.1:11434/api/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//             model: "llama3",
//             prompt,
//             stream: false,
//         }),
//     });

//     if (!response.ok) {
//         const text = await response.text();
//         throw new Error("Ollama error: " + text);
//     }

//     const data = await response.json();

//     if (!data.response) {
//         throw new Error("No response from Ollama");
//     }

//     return data.response.trim();
// };

// module.exports = { askOllama };