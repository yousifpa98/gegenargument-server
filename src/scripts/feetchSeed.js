// fetchSeed.js
import fetch from "node-fetch";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

// ⛓️ Cookie-Support aktivieren
const cookieJar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, cookieJar);

const API_BASE = "http://localhost:3001";

// 👤 Deine Login-Daten
const LOGIN_CREDENTIALS = {
  email: "yousifpa@proton.me",
  password: "",
};

// 💬 Argumente zum Einreichen & Veröffentlichen
const testArguments = [
  {
    thesis: "Alle wollen nur noch studieren, keiner will mehr Handwerker sein.",
    antithesis:
      "In Wahrheit fehlen Ausbildungsplätze und gute Bezahlung. Viele Jugendliche interessieren sich für Handwerksberufe, aber die Rahmenbedingungen schrecken ab.",
    tags: ["Bildung", "Soziales"],
    sources: [
      {
        url: "https://www.handwerksblatt.de/themen/ausbildung/warum-das-handwerk-nachwuchs-braucht",
        title: "Warum das Handwerk Nachwuchs braucht",
        publisher: "Handwerksblatt",
        publishedAt: "2023-08-01",
      },
    ],
  },
  {
    thesis: "Wenn man einmal Hartz IV bekommt, will man nie wieder arbeiten.",
    antithesis:
      "Studien zeigen, dass der Großteil der Empfänger innerhalb eines Jahres wieder Arbeit findet oder sucht – oft trotz struktureller Hindernisse.",
    tags: ["Umwelt", "Wirtschaft"],
    sources: [
      {
        url: "https://www.iwkoeln.de/presse/interviews/beitrag/arbeitslosigkeit-ist-kein-dauerzustand.html",
        title: "Arbeitslosigkeit ist kein Dauerzustand",
        publisher: "Institut der deutschen Wirtschaft",
        publishedAt: "2023-07-15",
      },
    ],
  },
  {
    thesis: "Deutschland gibt zu viel Geld für Entwicklungshilfe aus.",
    antithesis:
      "Nur etwa 0,7 % des Bruttonationaleinkommens fließen in Entwicklungshilfe – das entspricht internationalen Vereinbarungen und ist ein Beitrag zu globaler Stabilität.",
    tags: ["Migration", "Recht"],
    sources: [
      {
        url: "https://www.bmz.de/de/themen/entwicklungspolitik-zahlen-und-fakten",
        title: "Zahlen und Fakten zur Entwicklungspolitik",
        publisher: "BMZ",
        publishedAt: "2023-06-10",
      },
    ],
  },
  {
    thesis: "Die Energiewende ist schuld an den hohen Strompreisen.",
    antithesis:
      "Tatsächlich sind internationale Gaspreise, Netzgebühren und alte Subventionen entscheidender. Erneuerbare Energien senken langfristig sogar die Kosten.",
    tags: ["Freiheit", "Sicherheit"],
    sources: [
      {
        url: "https://www.tagesschau.de/wirtschaft/energie/strompreise-faktencheck-energiewende-100.html",
        title: "Faktencheck: Sind die Erneuerbaren schuld am Strompreis?",
        publisher: "Tagesschau",
        publishedAt: "2023-11-05",
      },
    ],
  },
  {
    thesis: "KI wird bald alle Jobs vernichten.",
    antithesis:
      "KI verändert Berufe, schafft aber auch neue Tätigkeiten und erfordert Umschulungen. Historisch gesehen hat technische Innovation Arbeitsmärkte immer nur transformiert.",
    tags: ["Digitalisierung", "Arbeitsmarkt"],
    sources: [
      {
        url: "https://www.ifo.de/publikationen/2023/aufsatz-zeitschrift/kuenstliche-intelligenz-und-zukunft-der-arbeit",
        title: "KI und die Zukunft der Arbeit",
        publisher: "ifo Institut",
        publishedAt: "2023-09-20",
      },
    ],
  },
];

async function loginAndSeed() {
  console.log("🔐 Logging in as admin...");

  const loginRes = await fetchWithCookies(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "https://gegenargument.netlify.app" },
    body: JSON.stringify(LOGIN_CREDENTIALS),
  });

  if (!loginRes.ok) {
    console.error(`❌ Login failed: ${loginRes.status}`);
    process.exit(1);
  }

  console.log("✅ Login erfolgreich, Cookie gespeichert.");

  for (const arg of testArguments) {
    try {
      // ➕ Einreichen
      const submitRes = await fetchWithCookies(`${API_BASE}/api/arguments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });

      if (!submitRes.ok) {
        const text = await submitRes.text();
        console.error(`❌ Fehler beim Einreichen: ${submitRes.status}`, text);
        continue;
      }

      const { id } = await submitRes.json();
      console.log(`📌 Eingereicht: ${arg.thesis} (ID: ${id})`);

      // ✅ Veröffentlichen
      const publishRes = await fetchWithCookies(
        `${API_BASE}/api/arguments/${id}/publish`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!publishRes.ok) {
        const text = await publishRes.text();
        console.error(
          `⚠️ Veröffentlichen fehlgeschlagen: ${publishRes.status}`,
          text,
        );
      } else {
        const { slug } = await publishRes.json();
        console.log(`✅ Veröffentlicht: /a/${slug}`);
      }
    } catch (err) {
      console.error(`💥 Fehler bei "${arg.thesis}":`, err.message);
    }
  }

  console.log("🎉 Seed abgeschlossen.");
  process.exit(0);
}

loginAndSeed();
