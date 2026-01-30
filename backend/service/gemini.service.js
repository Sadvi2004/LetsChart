const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

exports.askGemini = async (prompt, systemInstruction) => {
    try {
        const modelName = "gemini-2.5-flash";

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });
        return response.text;

    } catch (error) {
        console.error("Gemini Error Details:", error);
        throw new Error(`AI failed: ${error.message}`);
    }
};