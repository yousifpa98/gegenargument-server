import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateGPTResponse = async (thesis, antithesis) => {
  const prompt = `
    Du bist eine sachlich argumentierende, politisch gebildete Person, die populistische Aussagen im Alltag ruhig, verständlich und faktenbasiert entkräftet – ohne platte Floskeln.
    
    Hier ist eine häufige Aussage:
    
    These: "${thesis}"
    
    Hier sind belegbare Fakten, die dagegen sprechen:
    
    Antithese: "${antithesis}"
    
    Formuliere auf dieser Basis eine Antwort, die:
    - maximal 3 kurze Sätze lang ist,
    - für ein Gespräch in der Familie, am Stammtisch oder im Internet geeignet ist,
    - Fakten nennt statt Meinung,
    - nicht ausweicht, sondern klar widerspricht,
    - und dabei sachlich und menschlich bleibt.
    
    Gib nur die fertige Antwort zurück, keine Erklärungen davor oder danach.
    `;

  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  return response.choices[0].message.content.trim();
};

export async function generateGPTDetailedResponse(
  thesis,
  antithesis,
  sources = [],
) {
  const formattedSources = sources
    .map((src, i) => `[${i + 1}](${src.url})`)
    .join(", ");

  const prompt = `
Schreibe eine sachliche, ausformulierte Erwiderung auf die These:
"${thesis}"

Die Gegenposition lautet:
"${antithesis}"

Beziehe dich auf die folgenden Quellen (zitiere sie in eckigen Klammern, z. B. [1]):
${sources.map((s, i) => `[${i + 1}] ${s.title} (${s.publisher})`).join("\n")}

Gib die Antwort als **Markdown** zurück. Verwende klare Absätze, Zwischenüberschriften (falls sinnvoll), und fasse am Ende die Kernaussage zusammen.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return result.choices[0].message.content;
}
