const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat,
} = require("docx");

const COLOR_HEAD = "1F2937";
const COLOR_ACCENT = "2563EB";
const COLOR_MUTE = "6B7280";

const numbering = {
  config: [
    {
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
      ],
    },
    {
      reference: "numbered",
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
      ],
    },
  ],
};

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1 });
}
function p(text) {
  return new Paragraph({ children: [new TextRun({ text })], spacing: { after: 160 } });
}
function bulletB(bold, rest) {
  return new Paragraph({
    children: [new TextRun({ text: bold, bold: true }), new TextRun({ text: "  " + rest })],
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 100 },
  });
}
function numB(bold, rest) {
  return new Paragraph({
    children: [new TextRun({ text: bold, bold: true }), new TextRun({ text: "  " + rest })],
    numbering: { reference: "numbered", level: 0 },
    spacing: { after: 100 },
  });
}
function note(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, color: COLOR_MUTE })],
    spacing: { after: 240, before: 40 },
    border: { left: { color: COLOR_ACCENT, space: 8, style: BorderStyle.SINGLE, size: 12 } },
    indent: { left: 120 },
  });
}
function fileCell(text, width, header) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header ? { type: ShadingType.CLEAR, fill: "2563EB" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!header, color: header ? "FFFFFF" : "1F2937" })] })],
  });
}

const doc = new Document({
  numbering,
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: "1F2937" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: COLOR_HEAD }, paragraph: { spacing: { before: 400, after: 160 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: COLOR_ACCENT }, paragraph: { spacing: { before: 280, after: 120 } } },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: "uPull.ai", bold: true, size: 44, color: COLOR_ACCENT })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: "Search & AI Visibility Action Plan", bold: true, size: 34, color: COLOR_HEAD })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: "Prepared 29 July 2026", italics: true, color: COLOR_MUTE })], spacing: { after: 400 } }),

        h1("Where things stand today"),
        p("upull.ai is live and reasonably well-built content-wise — a clear FAQ library, three named case studies, and a defined methodology (“the Pull principle”). But it isn't yet visible in Google search or in AI-generated answers. A site: search on Google returns nothing, and the site currently has no robots.txt or sitemap.xml, meaning search engines and AI crawlers haven't been given a map of the site or explicit permission to crawl it. This is a brand-new-site visibility problem, not a content-quality problem — the fastest wins are technical."),
        p("uPull.ai also sits in a narrow B2B niche (NHS and UK health-and-care leaders), not a high-volume consumer search category. The goal isn't chasing generic “AI healthcare” traffic — it's making sure that when an NHS digital transformation lead, ICB director, or the AI assistant they're using searches for workflow-led AI adoption, proof-of-value pilots, or NHS AI ROI, uPull.ai shows up and is described accurately."),

        h1("1. Technical foundation — do this first (days 1–14)"),
        p("Nothing below matters until search engines and AI crawlers can find and parse the site. These are mostly one-time setup tasks, and four ready-to-use files are attached alongside this document."),
        numB("Verify the domain in Google Search Console and Bing Webmaster Tools,", "then submit the sitemap in both. This is what actually triggers indexing — without it, Google has no signal the site exists yet."),
        numB("Upload robots.txt to the site root (attached).", "It allows standard search crawlers plus AI crawlers — GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot — and points to the sitemap. Blocking AI crawlers by default is the single most common reason a legitimate business is invisible in ChatGPT/Perplexity/Copilot answers."),
        numB("Upload sitemap.xml to the site root (attached).", "Lists the current pages (home, FAQs, case studies, academy, community, uCollabX, news). Verify each URL resolves and add any pages not listed here."),
        numB("Add llms.txt to the site root (attached).", "An emerging convention that gives AI crawlers a concise, plain-language summary of who uPull.ai is, who it's for, and where the key pages live — reduces the chance an AI assistant misdescribes the company."),
        numB("Add the two JSON-LD schema blocks (attached, schema-snippets.html) to the site’s <head>.", "An Organization schema on every page (name, founders, London address, contact) and a FAQPage schema on faqs.html mirroring the Q&A already written there. FAQPage schema is the highest-leverage single change available today — it turns existing content into an extractable, directly citable answer format for both Google's rich results and AI answer engines."),
        numB("Give every page a unique, keyword-specific <title> and meta description.", "E.g. faqs.html could target “NHS AI Adoption FAQs — Pilots, ROI, Governance | uPull.ai” rather than a generic title. Add Open Graph tags so links preview correctly when shared on LinkedIn."),
        numB("Run the homepage through PageSpeed Insights / Core Web Vitals.", "Large unsplash hero images (seen at 1800px) are likely worth compressing or serving responsively — page speed is a ranking factor and affects whether AI crawlers fully render the page."),

        h1("2. Content & keyword strategy (weeks 2–12)"),
        p("The FAQ library is unusually strong raw material — most sites don't start with this much direct-answer content. The opportunity is to expand it into standalone, indexable pages built around the specific phrases NHS buyers (and their AI assistants) actually search for."),
        bulletB("Target phrase clusters:", "“NHS AI adoption pilot,” “NHS AI proof of value,” “workflow redesign healthcare AI,” “AI safety envelope NHS,” “ambient voice AI clinical documentation,” “NHS digital transformation ROI,” “intrapreneur healthcare AI.” These are low-volume but high-intent — exactly the searches an ICB director or their AI copilot would run."),
        bulletB("Turn case studies into full standalone pages.", "MedScribe AI, AuraCare Agent, and PathoAgent each deserve their own URL with the full narrative (problem, baseline, redesign, governance, measured result) rather than a homepage card. Standalone case-study pages are exactly the format AI engines cite when asked “what NHS AI pilots have shown ROI.”"),
        bulletB("Publish a recurring benchmark piece,", "e.g. an annual or quarterly “State of NHS AI Adoption” short report with original figures. Original data/statistics are disproportionately what gets cited by journalists, other sites (backlinks), and AI answer engines."),
        bulletB("Strengthen founder credibility (E-E-A-T) pages.", "Expand Alex Cheung, Hassan Chaudhry, and Suki Panesar's bios with full track record and link out to LinkedIn. Google and AI models both weight demonstrated first-hand expertise heavily for YMYL-adjacent (health) topics."),
        bulletB("Keep content fresh.", "Add visible “last updated” dates to FAQ and case-study pages and revisit quarterly — recency is a ranking signal for both Google and AI answer engines on evolving topics like NHS AI policy."),

        h1("3. Getting cited in AI answers (GEO specifics)"),
        p("Ranking on Google page one and being cited by ChatGPT/Perplexity/Gemini/Copilot are related but not the same thing. AI engines lean heavily on third-party corroboration — what other trusted sources say about uPull.ai — not just the site itself."),
        bulletB("Get listed in sources AI models already trust:", "DigitalHealth.London's Innovation Directory, HTN (Health Tech News), Health Tech Digital, techUK's health & social care member directory. These are exactly the kind of mid-authority, topic-relevant sites that show up in AI training/retrieval for NHS health-tech queries."),
        bulletB("Create a Crunchbase (and, if eligible, Wikipedia) entry.", "AI engines pull company facts from these disproportionately often; keeping the description, founders, and location consistent everywhere helps models converge on accurate information rather than guessing."),
        bulletB("Pitch a launch/cohort story to trade press", "(Digital Health News, HTN, Health Tech Digital) around the proof-of-value cohort — earned coverage is both a backlink and a citation source."),
        bulletB("Encourage founder LinkedIn posts", "on NHS AI adoption topics, linking back to the relevant FAQ or case-study page — LinkedIn content is increasingly indexed and cited directly by AI search tools."),
        bulletB("Run a monthly manual spot-check:", "ask ChatGPT, Perplexity, Gemini, and Copilot questions like “who helps NHS trusts run AI adoption pilots” or “what is a safety envelope in NHS AI deployment” and note whether/how uPull.ai appears. This is currently the only reliable way to measure GEO progress — there is no “AI Search Console” equivalent yet."),

        h1("4. Suggested sequence"),
        new Table({
          columnWidths: [1600, 4200, 4400],
          rows: [
            new TableRow({ children: [fileCell("When", 1600, true), fileCell("Do", 4200, true), fileCell("Why it matters", 4400, true)] }),
            new TableRow({ children: [fileCell("Days 1–2", 1600), fileCell("Upload robots.txt, sitemap.xml, llms.txt; verify Search Console + Bing", 4200), fileCell("Unlocks indexing entirely — currently blocking everything downstream", 4400)] }),
            new TableRow({ children: [fileCell("Days 3–14", 1600), fileCell("Add JSON-LD schema; unique titles/meta descriptions per page; compress hero images", 4200), fileCell("Turns existing content into machine-readable, citable answers", 4400)] }),
            new TableRow({ children: [fileCell("Weeks 2–4", 1600), fileCell("Submit to DigitalHealth.London, HTN, Health Tech Digital, techUK directories; create Crunchbase entry", 4200), fileCell("Third-party corroboration that both Google and AI engines rely on", 4400)] }),
            new TableRow({ children: [fileCell("Weeks 4–12", 1600), fileCell("Standalone case-study pages; expanded founder bios; first benchmark piece; press pitch", 4200), fileCell("Builds the depth and originality that earns backlinks and AI citations", 4400)] }),
            new TableRow({ children: [fileCell("Ongoing", 1600), fileCell("Monthly AI-answer spot checks; quarterly content refresh", 4200), fileCell("The only current way to track GEO progress; keeps freshness signals strong", 4400)] }),
          ],
        }),

        h1("Attached, ready to deploy"),
        bulletB("robots.txt", "— upload to the site root as-is."),
        bulletB("sitemap.xml", "— upload to the site root; verify/extend the URL list."),
        bulletB("llms.txt", "— upload to the site root as-is."),
        bulletB("schema-snippets.html", "— copy the two <script type=\"application/ld+json\"> blocks into the relevant pages' <head>."),
        note("If you'd like these implemented directly rather than copy-pasted, connect the site's codebase/repo folder and I can make the edits and open them for review."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/sessions/pensive-stoic-knuth/mnt/outputs/uPull_SEO_GEO_Action_Plan.docx", buf);
  console.log("done");
});
