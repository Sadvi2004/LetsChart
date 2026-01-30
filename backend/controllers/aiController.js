const { askGemini } = require("../service/gemini.service");

exports.chatAI = async (req, res) => {
    try {
        const { messages, action, tone, targetLanguage } = req.body;

        const chatText = messages
            .filter(m => m?.content)
            .map(m => `${m.sender}: ${m.content}`)
            .join("\n");

        if (!chatText.trim()) {
            return res.status(400).json({
                error: "No valid message content"
            });
        }

        const prompts = {
            smartReply: `
Suggest ONE short and natural WhatsApp-style reply to the LAST message only.
Do NOT explain anything.

${chatText}
`,

            summarize: `
Summarize the following chat in 2-3 lines:
${chatText}
`,

            translate: `
Translate the following chat to ${targetLanguage || "English"}:
${chatText}
`,

            improve: `
Rewrite ONLY the LAST message in 3 different improved ways.
Return ONLY a valid JSON array of strings.
Do NOT add explanations.
Do NOT add numbering.
Do NOT add extra text.

Chat:
${chatText}
`,

            tone: `
Rewrite ONLY the LAST message in a ${tone} tone.
Return ONLY the rewritten text.
Do NOT add explanations.
Do NOT add labels.
Do NOT add extra text.

Chat:
${chatText}
`,
        };

        // ACTION VALIDATION
        if (!prompts[action]) {
            return res.status(400).json({ error: "Invalid AI action" });
        }

        let reply = await askGemini(
            prompts[action],
            "You are a helpful WhatsApp-style chat assistant"
        );

        // JSON cleanup only for improve
        if (action === "improve") {
            try {
                const cleaned = reply.replace(/```json|```/g, "").trim();
                reply = JSON.parse(cleaned).filter(r => typeof r === "string");
            } catch {
                reply = [];
            }
        }

        res.json({ reply });

    } catch (err) {
        console.error("AI ERROR:", err);
        res.status(500).json({ error: "AI failed" });
    }
};