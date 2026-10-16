export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, history = [] } = await req.json();
const question = message;

    if (!question || typeof question !== "string") {
      return Response.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const apiKey = Netlify.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return Response.json(
        { error: "The AI tutor has not been configured yet." },
        { status: 503 }
      );
    }

    const contents = [
      ...history.slice(-10),
      { role: "user", parts: [{ text: question }] }
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are the friendly AI mentor of Masrur AI Academy. Help students in classes 9-12 with NCERT, ASSEB Division II, and NEET preparation. Explain clearly in simple language. For MCQs, provide options, the correct answer, and an explanation. Never claim you have verified the latest syllabus unless it has been provided."
            }]
          },
          contents,
          generationConfig: { temperature: 0.5 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return Response.json(
        { error: "The AI service could not answer. Please try again." },
        { status: 502 }
      );
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    return Response.json({ answer: answer || "Please try asking differently." });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
};
