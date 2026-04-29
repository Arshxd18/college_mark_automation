import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { coText, piText } = await request.json();

        if (!coText || !piText) {
            return NextResponse.json({ error: "Missing CO or PI text." }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 500 });
        }

        const systemPrompt = `You are an academic accreditation evaluator (NBA/ABET standard).

Evaluate the relationship between:

Course Outcome (CO):
"{coText}"

Programme Indicator (PI):
"{piText}"

Rules:
- 3 = Strong (direct and explicit alignment)
- 2 = Moderate (clear but partial alignment)
- 1 = Weak (indirect or vague alignment)
- 0 = No meaningful alignment

Be strict. Avoid generic keyword matching.
Only assign 3 if the CO clearly satisfies the PI.

Return ONLY JSON:

{
  "level": number,
  "reason": "1 concise sentence",
  "confidence": "low | medium | high"
}`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `CO:\n${coText}\n\nPI:\n${piText}`
                    }
                ],
                temperature: 0.1, // Keep it heavily deterministic and analytical
                max_tokens: 200,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Groq API error:", errBody);
            return NextResponse.json({ error: "Upstream AI provider error" }, { status: response.status });
        }

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("No payload emitted from AI model");
        }

        const parsed = JSON.parse(content);

        if (![0, 1, 2, 3].includes(parsed.level)) {
            throw new Error("Invalid AI mapping level structural constraint violated");
        }

        return NextResponse.json({
            level: parsed.level,
            reason: parsed.reason || "No reasoning structure provided",
            confidence: parsed.confidence || "medium"
        });

    } catch (err: any) {
        console.error("AI Mapping Route Exception:", err);
        return NextResponse.json({ error: err.message || "Internal mapping server crash" }, { status: 500 });
    }
}
