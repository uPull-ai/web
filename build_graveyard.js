const fs = require('fs');
const d = require('docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak, convertInchesToTwip
} = d;

const NHS_BLUE = '005EB8';
const INK = '1A1A1A';
const GREY = '5A5A5A';
const RED = 'A8322D';
const LIGHT = 'EEF3F8';

const W = 9020; // usable width in DXA

// ---------- helpers ----------
const h1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  keepNext: true,
  spacing: { before: 460, after: 200 },
  border: { top: { style: BorderStyle.SINGLE, size: 10, color: NHS_BLUE, space: 14 } },
  children: [new TextRun({ text: t, bold: true, size: 32, color: NHS_BLUE, font: 'Calibri' })],
});

const h2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  keepNext: true,
  spacing: { before: 280, after: 130 },
  children: [new TextRun({ text: t, bold: true, size: 26, color: INK, font: 'Calibri' })],
});

const h3 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  keepNext: true,
  spacing: { before: 200, after: 90 },
  children: [new TextRun({ text: t, bold: true, size: 22, color: NHS_BLUE, font: 'Calibri' })],
});

const p = (t, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 115 : opts.after },
  alignment: opts.align,
  children: [new TextRun({
    text: t, size: opts.size || 21, color: opts.color || INK,
    bold: opts.bold, italics: opts.italics, font: 'Calibri',
  })],
});

// paragraph built from [text, {bold/italics/color}] pairs
const rich = (parts, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 115 : opts.after },
  children: parts.map(([text, o = {}]) => new TextRun({
    text, size: o.size || 21, color: o.color || INK,
    bold: o.bold, italics: o.italics, font: 'Calibri',
  })),
});

const bullet = (t, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  spacing: { after: 62 },
  children: [new TextRun({ text: t, size: 21, color: INK, font: 'Calibri' })],
});

const usedLists = new Set();
const num = (t, list) => {
  usedLists.add(list);
  return new Paragraph({
    numbering: { reference: list, level: 0 },
    spacing: { after: 62 },
    children: [new TextRun({ text: t, size: 21, color: INK, font: 'Calibri' })],
  });
};

const rule = () => new Paragraph({
  spacing: { before: 120, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D6E2', space: 4 } },
  children: [new TextRun({ text: '', size: 2 })],
});

// Post-copy block: monospace-ish, shaded, so it's obviously copy-paste-able
const copyBlock = (lines, opts = {}) => {
  const rows = [new TableRow({
    cantSplit: false,
    children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: opts.fill || 'F7F9FB' },
      margins: { top: 200, bottom: 200, left: 220, right: 220 },
      borders: {
        left: { style: BorderStyle.SINGLE, size: 18, color: opts.accent || NHS_BLUE },
        top: { style: BorderStyle.SINGLE, size: 2, color: 'DDE5EC' },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: 'DDE5EC' },
        right: { style: BorderStyle.SINGLE, size: 2, color: 'DDE5EC' },
      },
      children: lines.map((l) => {
        if (l === '') return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: '', size: 16 })] });
        const isBold = l.startsWith('**') && l.endsWith('**');
        const text = isBold ? l.slice(2, -2) : l;
        return new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text, size: 20, font: 'Calibri', bold: isBold, color: INK })],
        });
      }),
    })],
  })];
  return new Table({ columnWidths: [W], width: { size: W, type: WidthType.DXA }, rows });
};

const calloutBox = (title, lines, colour = RED) => {
  const kids = [new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: title, bold: true, size: 21, color: colour, font: 'Calibri' })],
  })];
  lines.forEach((l) => kids.push(new Paragraph({
    spacing: { after: 70 },
    children: [new TextRun({ text: l, size: 20, color: INK, font: 'Calibri' })],
  })));
  return new Table({
    columnWidths: [W], width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'FDF4F3' },
        margins: { top: 180, bottom: 180, left: 220, right: 220 },
        borders: {
          left: { style: BorderStyle.SINGLE, size: 18, color: colour },
          top: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCDA' },
          bottom: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCDA' },
          right: { style: BorderStyle.SINGLE, size: 2, color: 'F0DCDA' },
        },
        children: kids,
      })],
    })],
  });
};

const cell = (text, o = {}) => new TableCell({
  width: { size: o.w, type: WidthType.DXA },
  shading: { type: ShadingType.CLEAR, fill: o.fill || 'FFFFFF' },
  margins: { top: 90, bottom: 90, left: 130, right: 130 },
  children: (Array.isArray(text) ? text : [text]).map((t) => new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({
      text: t, size: 19, bold: o.bold, font: 'Calibri',
      color: o.color || (o.head ? 'FFFFFF' : INK),
    })],
  })),
});

const table = (widths, header, rows) => new Table({
  columnWidths: widths,
  width: { size: W, type: WidthType.DXA },
  rows: [
    new TableRow({
      tableHeader: true,
      children: header.map((t, i) => cell(t, { w: widths[i], bold: true, head: true, fill: NHS_BLUE })),
    }),
    ...rows.map((r, ri) => new TableRow({
      children: r.map((t, i) => cell(t, { w: widths[i], fill: ri % 2 ? 'F4F7FA' : 'FFFFFF' })),
    })),
  ],
});

const spacer = (h = 130) => new Paragraph({ spacing: { after: h }, children: [new TextRun({ text: '', size: 2 })] });

// ---------- content ----------
const c = [];

// TITLE
c.push(new Paragraph({
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text: 'uPull.ai  ·  7-DAY CAMPAIGN SPRINT  ·  VERSION 2', bold: true, size: 20, color: NHS_BLUE, font: 'Calibri', characterSpacing: 60 })],
}));
c.push(new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text: 'The NHS AI Graveyard', bold: true, size: 52, color: INK, font: 'Calibri' })],
}));
c.push(new Paragraph({
  spacing: { after: 300 },
  children: [new TextRun({ text: 'Every dead pilot has a cause of death. Nobody writes it down. We will.', size: 28, color: GREY, italics: true, font: 'Calibri' })],
}));
c.push(rule());
c.push(rich([
  ['Prepared for  ', { color: GREY }], ['Alex, Marketing Director, uPull.ai', { bold: true }],
]));
c.push(rich([
  ['Prepared  ', { color: GREY }], ['Thursday 6 August 2026', { bold: true }],
  ['     Sprint window  ', { color: GREY }], ['Mon 10 – Sun 16 August 2026', { bold: true }],
]));
c.push(rich([
  ['Revised  ', { color: GREY }], ['6 August 2026, after the founder meeting (Hassan, Alex, John, Sukhmeet)', { bold: true }],
]));
c.push(rich([
  ['Objective  ', { color: GREY }], ['Inbound enquiries into the proof-of-value cohort within 7 days', { bold: true }],
]));
c.push(rule());
c.push(spacer(120));
c.push(calloutBox('Read this box before anything else', [
  'This campaign publishes other people’s failures. That is exactly why it will work, and exactly how it could go wrong.',
  'Three rules are non-negotiable and appear in full in section 4: no organisation is ever named, no vendor is ever named, no individual is ever named. Every submission is moderated by a human before it appears.',
  'Break any one of those and this stops being a campaign and starts being a legal problem.',
]));


// ---- WHAT CHANGED ----
c.push(h1('Version 2  ·  what the founder meeting changed'));
c.push(p('Six things in the 6 August meeting bear directly on this campaign. Two of them contradict version 1, so read this page before working from anything else.'));
c.push(spacer(60));
c.push(table([2500, 3400, 3120],
  ['From the meeting', 'What it changes here', 'Where'],
  [
    ['The differentiator is not AI. It is enabling NHS organisations to build their own internal capability without supplier dependency. Keywords: exit, adoption, transformation, agnostic, residual value, sustainable savings.',
     'The graveyard now collects dependency as a cause of death, and the campaign turns on "who could run it after we left" rather than only "workflow first".',
     'Sections 2, 3 and day 5'],
    ['Polls and surveys performed poorly in the launch fortnight. Carousels performed best.',
     'Day 3 was a poll. It is now a carousel. This contradicts version 1 — do not run the poll.',
     'Day 3'],
    ['Marketing should target specific audiences — Chairs/NEDs, CFOs, CIOs, clinical leaders, frontline staff — rather than one undifferentiated campaign.',
     'One mechanic, five audience cuts. The graveyard is the shared asset; the framing changes per audience.',
     'Section 3 (new)'],
    ['CFO theme agreed: sustainable savings come only from upskilling your own workforce. HFMA identified as the route to NHS finance leaders.',
     'The headline graveyard number is reframed as a finance number, and day 3 becomes the money post. HFMA added to distribution.',
     'Day 3, section 8'],
    ['Pharmacy is the first target specialty — measurable savings, existing clinical leadership, easy ROI benchmark.',
     'A pharmacy cut runs through the campaign, and day 7 asks openly for a pharmacy demonstrator partner.',
     'Sections 3 and day 7'],
    ['Build evidence before scaling sales activity. Potential customers keep asking where you have done this before.',
     'Day 7 no longer leads with a hard cohort sell. It leads with the evidence you have just created and asks for one demonstrator.',
     'Day 7, section 10'],
  ]));
c.push(spacer(140));
c.push(calloutBox('One dependency that sits outside this campaign', [
  'The meeting recorded that visitors cannot tell what uPull is in the first few seconds of the website. This campaign will send more traffic to upull.ai in one week than it has had in its life.',
  'If the hero messaging is not fixed before Monday, most of that traffic converts into nothing. The website action on Hassan and Alex is a blocker for this sprint, not a parallel workstream.',
], NHS_BLUE));


// ---- 1. STRATEGIC READ ----
c.push(h1('1.  The strategic read'));

c.push(h2('Your problem is not content. It is distribution.'));
c.push(p('The launch produced 720 impressions and 342 members reached across five posts, from 28 followers — 95 engagements, a 13.2% blended engagement rate and 9.7% CTR. Those are strong rates on a very small denominator. The content is working. Almost nobody is seeing it.'));
c.push(p('So the campaign cannot be "post better things." It has to be built so that other people’s audiences carry it. Everything below is engineered around one mechanic: give NHS people something they want to be seen participating in, and their networks become your distribution.'));

c.push(h2('You have a distribution asset you are not using'));
c.push(p('Hassan Chaudhury is Vice Chair of HIMSS UK & Ireland, Global Digital Health Specialist at Healthcare UK, an NHS Innovation Accelerator mentor and a UCL visiting lecturer. His personal network is worth multiples of the company page. Sukhmeet’s is comparable in NHS system circles.'));
c.push(rich([
  ['The company page should be the destination, not the engine. ', { bold: true }],
  ['Every post in this plan is published from a personal profile first and the company page second. At 28 followers the page is a landing pad, not a megaphone.', {}],
]));

c.push(h2('What your own launch data already tells you'));
c.push(bullet('Carousels are your format. They won the launch fortnight and they won again in the five-post set. Three of the seven days below are carousels for that reason.'));
c.push(bullet('Polls underperformed. Version 1 of this plan used a poll on day 3. That has been replaced.'));
c.push(bullet('A 13.2% engagement rate against a ~3% B2B rule of thumb is real, but it is 95 actions. Treat it as evidence the message lands, not as evidence you have reach.'));
c.push(bullet('Nothing in the launch set produced a recorded enquiry. That is the gap this campaign exists to close.'));

c.push(h2('The stat you should not borrow'));
c.push(p('The widely circulated figures — "80% of healthcare AI projects never leave pilot", "95% of AI pilots fail" — come mostly from vendor blogs recycling each other. Your audience contains people who check. Publishing a soft stat as the centrepiece of a campaign about intellectual honesty would undercut the entire brand.'));
c.push(rich([
  ['So the campaign generates its own. ', { bold: true }],
  ['By day 7 you are not quoting anybody’s statistic. You are quoting yours, with the denominator attached, from a primary source you built. That is the difference between a marketing campaign and a piece of evidence — and evidence is the only currency this audience trades in.', {}],
]));

c.push(h2('The positioning has moved — and it makes the graveyard sharper'));
c.push(p('The meeting landed on something more specific than "workflow first, AI second": uPull\u2019s advantage is that it leaves an organisation able to do this itself. Exit rather than dependency. Residual value. Technology agnostic. Sustainable savings from upskilling your own workforce rather than from buying more software.'));
c.push(rich([
  ['That is not a detour from this campaign — it is the finding the graveyard is most likely to produce. ', { bold: true }],
  ['A large share of dead pilots die because the capability sat outside the organisation: the supplier ran it, the pilot team was seconded, the one person who understood it left. Nobody internally could sustain it. If the wall shows that, the case for capability-building writes itself out of other people\u2019s data rather than out of your own claims.', {}],
]));
c.push(p('So two new fields go on the form, and one new cause of death. They are the difference between a campaign that proves your old positioning and one that proves your new one.'));

c.push(h2('Why this converts rather than just circulating'));
c.push(bullet('Every person who buries a pilot is, by definition, someone with budget scar tissue and an unsolved problem.'));
c.push(bullet('The submission form ends with one optional question that turns a confession into a lead: "Want us to tell you why yours actually died?"'));
c.push(bullet('Your existing AI Readiness Assessment — 32 questions, 8 domains, mapped to What Good Looks Like, DTAC and the Government AI Playbook — is already a best-in-class qualification instrument. This campaign’s job is to fill it.'));
c.push(bullet('From there the path is the one you already run: assessment → 30-minute results call → Discovery Sprint → cohort.'));
c.push(bullet('And it addresses the "where have you done this before?" problem directly. You do not yet have a case study. By day 7 you have something no competitor has: original evidence on why NHS AI fails, gathered from the sector itself.'));


// ---- 2. THE CONCEPT ----
c.push(h1('2.  The concept'));

c.push(p('A public, anonymous, moderated graveyard of dead NHS AI pilots. Built in the open over seven days. Each entry is a headstone. Each headstone carries a cause of death.', { size: 24 }));

c.push(h2('Why it sticks'));
c.push(p('Every person in NHS digital has a pilot they believed in that quietly got switched off. Almost none of them are allowed to say so publicly — it reflects on a trust, a supplier relationship, a business case somebody signed. The graveyard gives them a way to say it without cost. That is the unlock: not outrage, permission.'));
c.push(p('And a graveyard is inherently screenshot-able. A bar chart about adoption failure is not. A headstone reading "Cause of death: workflow unchanged" is.'));

c.push(h2('How it works'));
c.push(num('A page at upull.ai/graveyard goes live on day 1 with a submission form and a live counter.', 'list1'));
c.push(num('Anyone can bury a pilot: what it was meant to do, roughly what it cost (banded), how long it ran, what they think killed it, organisation type only.', 'list1'));
c.push(num('A human moderates every entry before publication. Anything identifying is stripped or the entry is rejected.', 'list1'));
c.push(num('Approved entries appear as headstones, updated daily. The counter shows pilots buried, banded spend and the leading cause of death.', 'list1'));
c.push(num('One optional final field captures the lead: name, role, work email, and a tickbox — "Send me a short read on why this probably died."', 'list1'));
c.push(num('On day 7 you publish The Graveyard Report: the pattern, with denominators.', 'list1'));

c.push(h2('The submission form — exact fields'));
c.push(spacer(60));
c.push(table([2400, 3200, 3420],
  ['Field', 'Type', 'Why it earns its place'],
  [
    ['What was it meant to do?', 'Free text, 200 char', 'The headstone inscription. Keep it short or the wall gets ugly.'],
    ['Organisation type', 'Dropdown — acute / community / mental health / primary care / ICB / national body / supplier / other', 'Segments the data. Never the org name.'],
    ['Roughly what did it cost?', 'Bands: <£25k / £25–100k / £100–500k / £500k–1m / £1m+ / don’t know', 'Banded so nobody can reverse-engineer a contract. Powers the headline number.'],
    ['How long did it run?', 'Bands: <3mo / 3–6mo / 6–12mo / 1–2yr / 2yr+', 'The "it limped on" finding is its own story.'],
    ['What killed it?', 'Multi-select + free text', 'This is the campaign. Pre-set options seed the pattern.'],
    ['Did the workflow change before the AI went in?', 'Yes / No / Partly', 'The single question that proves the original thesis. Do not cut it.'],
    ['Who actually ran it day to day?', 'Own staff / supplier / mix / seconded project team', 'NEW. The dependency question. This is what produces the exit-strategy finding.'],
    ['Could your own team have kept it running without the supplier?', 'Yes / No / Not sure', 'NEW. The single most quotable field on the form, and the direct evidence for residual value.'],
    ['Specialty or service', 'Dropdown, incl. pharmacy, ED, discharge, surgery, elective, medicines management', 'NEW. Lets you cut a pharmacy story out of the data for the first demonstrator.'],
    ['Want us to tell you why yours actually died?', 'Optional: name, role, work email, consent tick', 'The sales bridge. Optional, or trust drops and submissions dry up.'],
  ]));

c.push(spacer(140));
c.push(h3('Pre-set "what killed it" options'));
c.push(p('These do double duty — they make submission fast, and they pre-structure the dataset so day 3 and day 7 have a clean story.'));
c.push(bullet('The workflow never actually changed'));
c.push(bullet('No clinical owner — nobody senior owned it day to day'));
c.push(bullet('Data wasn’t ready / couldn’t get access'));
c.push(bullet('Funding ended before value was proven'));
c.push(bullet('Governance or information governance stalled it'));
c.push(bullet('Staff didn’t use it'));
c.push(bullet('It worked — and nobody scaled it'));
c.push(bullet('The person driving it left'));
c.push(bullet('The supplier ran it, and when the contract ended it stopped  [NEW]'));
c.push(bullet('Nobody inside the organisation could keep it running  [NEW]'));

c.push(h2('The pharmacy cut'));
c.push(p('Pharmacy is the agreed first demonstrator: the workforce is already oriented to cost optimisation, savings are measurable, clinical leadership exists and ROI is easy to benchmark. The campaign should be built so a pharmacy story can be lifted out of it.'));
c.push(bullet('The specialty field makes this possible without running a separate campaign.'));
c.push(bullet('Ask pharmacy contacts directly in the pre-launch DMs — target at least 8 pharmacy entries out of the first 60.'));
c.push(bullet('If you get them, day 7 carries a pharmacy-specific line and you have a warm, self-identified list for the demonstrator conversation.'));
c.push(bullet('If you do not get them, say nothing about pharmacy publicly and treat the outreach as list-building. Do not manufacture a specialty finding from four entries.'));


// ---- 3. AUDIENCE CUTS ----
c.push(h1('3.  Five audiences, one mechanic'));
c.push(p('The meeting concluded that marketing should target specific audiences rather than run one undifferentiated campaign. That is right, and it does not require five campaigns. The graveyard is a single asset that reads differently depending on who is looking at it — the same wall, five framings, five calls to action.'));
c.push(spacer(60));
c.push(table([1500, 2500, 2600, 2420],
  ['Audience', 'What the graveyard says to them', 'The line', 'Where it runs'],
  [
    ['CFOs and finance directors',
     'This is money that left the organisation and produced nothing repeatable.',
     'Sustainable savings do not come from buying software. They come from upskilling the people you already employ.',
     'Day 3 (the money post). HFMA route.'],
    ['Chairs and NEDs',
     'A governance and assurance failure, repeated across the sector, that boards were never shown.',
     'Your board saw the business case. It never saw the post-mortem.',
     'Day 6 newsletter, direct outreach.'],
    ['CIOs and digital leads',
     'Peer evidence they can use internally to argue for doing it differently.',
     'The tools mostly worked. That was never the problem.',
     'Days 1, 2 and 4.'],
    ['Clinical and service leaders',
     'Recognition. Someone finally describing what it is like to have technology arrive on your ward.',
     'The workflow never changed, so neither did the outcome.',
     'Days 2 and 5, pharmacy cut.'],
    ['Frontline staff',
     'Permission, and the case that they should be the ones designing it.',
     'The people who could have told you it would fail were never asked.',
     'Days 2 and 4, carousel content.'],
  ]));
c.push(spacer(140));
c.push(calloutBox('Sequencing note', [
  'Do not try to hit all five in week one. The seven-day sprint below is weighted to CIOs, clinical leaders and CFOs, because those are the three that convert into a Discovery Sprint.',
  'Chairs, NEDs and frontline staff are better served by the newsletter and the podcast series in weeks 2 to 4, once the dataset exists and gives you something to interview people about.',
], NHS_BLUE));


// ---- 4. SAFETY RAILS ----
c.push(h1('4.  Safety rails'));
c.push(p('This is the part that determines whether the campaign is bold or reckless. It is written to be circulated to the founders and agreed before a single post goes out.'));

c.push(calloutBox('The three absolutes', [
  '1.  No organisation is ever named. Not the trust, not the ICB, not the region if the region makes it identifiable.',
  '2.  No supplier or product is ever named. This is the one most likely to generate a legal letter, and the one contributors are most likely to breach.',
  '3.  No individual is ever named. Not the exec who killed it, not the CIO who left.',
]));

c.push(spacer(160));
c.push(h2('Moderation protocol'));
c.push(bullet('Nothing auto-publishes. Every entry sits in a queue until a named human approves it. Alex owns the queue; a founder is the backstop at weekends.'));
c.push(bullet('Twice-daily moderation passes during the sprint: 08:00 and 16:00.'));
c.push(bullet('Standard edits: strip org names, strip product names, generalise anything where the combination of detail plus cost band plus timeframe makes the organisation guessable. When in doubt, reject.'));
c.push(bullet('Publish the moderation policy on the page itself. It is a trust signal, and it is your defence if something slips.'));
c.push(bullet('A one-click "this entry identifies us — remove it" link on the page, with a stated 4-hour takedown commitment. Honour it without argument, every time.'));

c.push(h2('Data handling'));
c.push(bullet('The anonymous submission and the optional contact details must be stored so that an anonymous entry cannot be re-linked to a person by anyone browsing the data.'));
c.push(bullet('Say this plainly on the form. It is the difference between a wall with 80 entries and a wall with 8.'));
c.push(bullet('Standard line, reused from your readiness assessment: do not enter patient-identifiable, commercially sensitive or otherwise confidential information.'));
c.push(bullet('uPull.ai is data controller; legitimate interests / consent; deletion on request to info@upull.ai.'));

c.push(h2('Tone discipline'));
c.push(p('The graveyard mourns pilots. It never mocks the people who ran them. Every piece of copy in this plan is written from inside the problem — "we have all watched this happen" — not from above it. The moment it reads as a consultancy sneering at NHS staff, the founders’ networks turn and the campaign is dead.'));

c.push(h2('Kill-switch criteria'));
c.push(p('Pull or pause if any of these occur. Decision sits with Alex plus one founder, within 2 hours.'));
c.push(bullet('An identifying entry reaches publication, however briefly.'));
c.push(bullet('A named trust, ICB or supplier makes contact expressing concern.'));
c.push(bullet('Any post accrues more than 3 reports/hides — you already had 2 on the launch post, so watch this closely.'));
c.push(bullet('A founder’s own network turns critical in the comments — that is the leading indicator, and it shows up before anything else does.'));
c.push(bullet('Pausing means: stop posting, leave the wall up, respond personally, resume within 24 hours.'));


// ---- 4. PRE-LAUNCH ----
c.push(h1('5.  Pre-launch: Thu 6 – Sun 9 August'));

c.push(calloutBox('The single biggest execution risk', [
  'An empty graveyard on day 1 kills the campaign. Nobody wants to be the first to admit failure in public.',
  'Do not launch with zero headstones. Seed it with 12 before the first post goes live.',
], NHS_BLUE));

c.push(spacer(160));
c.push(h2('Seeding — do this first'));
c.push(num('The three founders each submit two real pilots from their own careers. Six. These are the most important entries on the wall because they establish that this is confession, not accusation.', 'list2'));
c.push(num('DM 10–12 warm NHS contacts before Monday, including at least 4 pharmacy leaders. Scripts in section 8. Target six more submissions.', 'list2'));
c.push(num('Launch showing 12 headstones and "12 buried. Add yours." Momentum reads as permission.', 'list2'));

c.push(h2('Build checklist'));
c.push(spacer(60));
c.push(table([1150, 4200, 1900, 1770],
  ['By', 'Task', 'Owner', 'Status'],
  [
    ['Thu 6 Aug', 'Founders sign off the three absolutes and the kill-switch criteria', 'Alex', ''],
    ['Thu 6 Aug', 'Agree who fronts the day 4 video (recommend Hassan)', 'Alex', ''],
    ['Fri 7 Aug', 'Build /graveyard page: form, moderation queue, live counter, takedown link', 'Web', ''],
    ['Fri 7 Aug', 'Death certificate image template — one reusable asset, five variants', 'Design', ''],
    ['Fri 7 Aug', 'Headstone card template for carousels', 'Design', ''],
    ['Fri 7 Aug', 'Confirm readiness assessment emails route to a monitored inbox', 'Alex', ''],
    ['Fri 7 Aug', 'Fix homepage hero so "what is uPull" is answerable in 5 seconds — blocker', 'Hassan & Alex', ''],
    ['Fri 7 Aug', 'Add the three new form fields: who ran it, could you have run it, specialty', 'Web', ''],
    ['Sat 8 Aug', 'Founders submit 6 seed entries', 'All founders', ''],
    ['Sat 8 Aug', 'Send 12 warm DMs', 'Alex + Hassan', ''],
    ['Sun 9 Aug', 'Dry run: submit, moderate, publish, verify counter increments', 'Alex', ''],
    ['Sun 9 Aug', 'Sales tracker sheet live; tiers and SLA agreed with whoever takes calls', 'Alex', ''],
  ]));

c.push(spacer(140));
c.push(h2('Assets needed'));
c.push(bullet('Death certificate template — the day 1 hero image. Formal, official-looking, slightly funereal. Its power is that it looks like a real document.'));
c.push(bullet('Headstone card — square, dark, one inscription plus cause of death. Reused across all carousels.'));
c.push(bullet('Counter graphic — pilots buried, banded spend, leading cause of death. Regenerated daily.'));
c.push(bullet('No stock photos of doctors holding tablets — the campaign is an argument against that aesthetic.'));


// ---- 5. THE CALENDAR ----
c.push(h1('6.  The seven days'));
c.push(p('One anchor post per day from a personal profile, mirrored to the company page 3–4 hours later. Post times target 07:15–07:45 UK, which is when NHS managers are on LinkedIn before the day starts.'));
c.push(spacer(60));
c.push(table([1100, 1500, 2100, 2400, 1920],
  ['Day', 'Date', 'Format', 'Job of the post', 'Posted by'],
  [
    ['1', 'Mon 10 Aug', 'Text + image', 'The provocation. Open the graveyard.', 'Alex'],
    ['2', 'Tue 11 Aug', 'Carousel', 'First headstones. Founders confess.', 'Alex + all founders'],
    ['3', 'Wed 12 Aug', 'Carousel', 'The money. CFO cut.', 'Hassan'],
    ['4', 'Thu 13 Aug', 'Video, 75 sec', 'Credibility. The unpolished truth.', 'Hassan or Sukhmeet'],
    ['5', 'Fri 14 Aug', 'Text', 'The turn: dependency vs capability.', 'Sukhmeet'],
    ['6', 'Sat 15 Aug', 'Newsletter', 'The Graveyard Report, edition 1.', 'Company page'],
    ['7', 'Sun/Mon 16–17', 'Carousel + text', 'The number. One demonstrator ask.', 'Alex'],
  ]));

// DAY 1
c.push(h2('Day 1  ·  Monday 10 August, 07:30  ·  Alex, personal profile'));
c.push(rich([['Format ', { color: GREY }], ['Text post with a single image — the death certificate.  ', {}], ['CTA ', { color: GREY }], ['Bury a pilot.', {}]]));
c.push(h3('The image'));
c.push(copyBlock([
  '**CERTIFICATE OF DEATH**',
  '',
  'Name of deceased:  Ambient documentation pilot, ward level',
  'Date of birth:  March 2024',
  'Date of death:  November 2024',
  'Time in service:  8 months',
  'Cost of care:  £180,000',
  '',
  '**Cause of death:  Workflow unchanged**',
  '',
  'Certified by: nobody. Nobody signs these.',
], { accent: RED, fill: 'FAFAFA' }));
c.push(spacer(140));
c.push(h3('The copy'));
c.push(copyBlock([
  'Nobody signs one of these.',
  '',
  'That’s the problem.',
  '',
  'When an NHS AI pilot dies, it doesn’t get a post-mortem. It gets a renewal conversation that never happens, a slide quietly removed from the board pack, and a team who learned nothing — because nobody was ever allowed to write down what actually killed it.',
  '',
  'So we lose the pilot. And then we lose the lesson. And then, about eighteen months later, somebody in the next trust along buys the same thing and loses it again.',
  '',
  'I’ve watched this happen for [X] years. This week we’re doing something about it.',
  '',
  'We’ve opened the NHS AI Graveyard.',
  '',
  'It’s anonymous. No trust names. No vendor names. No individuals — ever. We moderate every single entry by hand before it goes anywhere near the wall.',
  '',
  'You tell us what it was meant to do, roughly what it cost, and what you think killed it. We publish the headstone.',
  '',
  'And on Sunday, we publish the pattern.',
  '',
  'I have a suspicion about what we’ll find. I think the cause of death is going to be the same one, over and over and over.',
  '',
  'Twelve pilots are already buried. Six of them are ours.',
  '',
  'Bury yours: upull.ai/graveyard',
  '',
  'If you’ve ever watched something you genuinely believed in get quietly switched off — this one’s for you.',
]));
c.push(spacer(120));
c.push(calloutBox('Notes on day 1', [
  '[X] years — replace with your real number before posting. If it is under five, cut the line entirely rather than reaching.',
  '"Six of them are ours" is the most important sentence in the post. It converts the campaign from accusation into confession, and it is the reason people will feel safe contributing. Do not cut it, and make sure it is true.',
  'The £180,000 and the dates on the certificate are illustrative. Either use a real anonymised entry from your seed set, or add a small "illustrative" mark on the image. Do not present an invented figure as a finding.',
], NHS_BLUE));

// DAY 2
c.push(h2('Day 2  ·  Tuesday 11 August, 07:30  ·  Alex + all three founders'));
c.push(rich([['Format ', { color: GREY }], ['Carousel, 8 slides. Your carousel outperformed everything else in the launch fortnight — use the format that works.  ', {}], ['CTA ', { color: GREY }], ['Add yours.', {}]]));
c.push(h3('Carousel structure'));
c.push(copyBlock([
  'Slide 1    "24 hours. 31 pilots buried."',
  'Slide 2    Headstone — inscription + cause of death',
  'Slide 3    Headstone',
  'Slide 4    Headstone',
  'Slide 5    Headstone',
  'Slide 6    Headstone',
  'Slide 7    "Cause of death so far" — tally, with the denominator shown',
  'Slide 8    "Bury yours. Anonymous. Moderated. upull.ai/graveyard"',
]));
c.push(spacer(140));
c.push(h3('The copy above the carousel'));
c.push(copyBlock([
  'Thirty-one in a day.',
  '',
  'I expected maybe ten. What I did not expect was how many people messaged privately first to check it was really anonymous before they submitted.',
  '',
  'That tells you something on its own. There is a lot of experience in the NHS that has never been allowed out of the building.',
  '',
  'Six headstones from the wall are below. Read the causes of death.',
  '',
  'One thing is already showing up more than anything else, and it is not the technology.',
  '',
  'Anonymous. Moderated by hand. No trusts, no vendors, no names: upull.ai/graveyard',
]));
c.push(spacer(140));
c.push(h3('The founder confessions — this is the day’s real work'));
c.push(p('Each founder posts their own dead pilot, from their own profile, in their own words, on the same day. Not a repost of Alex — an original post. This is what makes day 2 travel, because a senior, recognisable figure admitting a specific failure is the thing people screenshot.'));
c.push(h3('Template for founders'));
c.push(copyBlock([
  'I buried one of my own on the NHS AI Graveyard this morning.',
  '',
  '[One paragraph: what it was, what you believed it would do, who it was for. Be specific about the ambition — that is what makes the ending land.]',
  '',
  '[One paragraph: how it actually ended. Not dramatic. The truth is usually mundane — a funding cycle, a departure, a pilot that simply never converted into business as usual.]',
  '',
  'What I got wrong: [one sentence. Own something real. "We put the technology in before we’d changed a single step of the process" is worth more than any case study on our website.]',
  '',
  'The wall is anonymous and moderated — mine isn’t, because I think somebody senior should go first.',
  '',
  'upull.ai/graveyard',
], { accent: '2E7D32' }));
c.push(spacer(120));
c.push(calloutBox('Notes on day 2', [
  'The "31" is a placeholder. Use the real number, whatever it is. If it is 14, say 14 — a real 14 beats an inflated 31, and this audience can smell rounding.',
  'If submissions are genuinely low by Monday evening, do not fake it. Change the day 2 angle to "Twelve of these are ours. Here is why we went first." Honesty is recoverable; a fabricated number is not.',
  'Founders post between 07:00 and 09:00, staggered by 30 minutes, so LinkedIn does not read it as coordinated spam.',
], NHS_BLUE));

// DAY 3
c.push(h2('Day 3  ·  Wednesday 12 August, 07:30  ·  Hassan, personal profile'));
c.push(rich([['Format ', { color: GREY }], ['Carousel, 6 slides. Version 1 used a poll here; your own launch data says polls underperform and carousels win, so this is now a carousel.  ', {}], ['CTA ', { color: GREY }], ['Add yours. Soft link to the assessment.', {}]]));
c.push(rich([['Audience cut ', { color: GREY }], ['CFOs and finance directors. This is the sustainable-savings post.', { bold: true }]]));
c.push(h3('Carousel structure'));
c.push(copyBlock([
  'Slide 1    "£[N] of NHS AI spend is buried on this wall."',
  'Slide 2    "None of it bought a capability that stayed."',
  'Slide 3    Cost bands chart — how much, how many, over what period',
  'Slide 4    "Who actually ran it?" — supplier vs own staff, with counts',
  'Slide 5    "Could your own team have kept it running?" — the No count',
  'Slide 6    "Sustainable savings come from people, not licences. upull.ai/graveyard"',
]));
c.push(spacer(140));
c.push(h3('The copy'));
c.push(copyBlock([
  '[N] headstones in, and the finance story is louder than the technology story.',
  '',
  '£[N] in self-reported, banded spend. Buried. And the striking part is not the total — public sector programmes fail everywhere, that is not news.',
  '',
  'The striking part is what was left behind afterwards. Which is, in most of these cases, nothing.',
  '',
  'We asked two questions on the form. Who actually ran it day to day? And could your own team have kept it running without the supplier?',
  '',
  '[N] of [N] said the supplier or a seconded project team ran it. [N] of [N] said no, their own people could not have kept it going.',
  '',
  'So the money did not buy a capability. It rented one, and then the rental ended.',
  '',
  'That is the bit that should interest anyone holding a budget. You can spend the same money twice — once on a tool that leaves, and once on a workforce that stays — and only one of those is still on your balance sheet in three years.',
  '',
  'Usual caveats, because they matter: self-selecting sample, self-reported figures, banded costs, nothing audited. Signal, not research.',
  '',
  'Anonymous and moderated by hand: upull.ai/graveyard',
]));
c.push(spacer(120));
c.push(calloutBox('Notes on day 3', [
  'This is the post that opens the HFMA and finance-director conversation. Tag it accordingly and share it into finance networks rather than digital ones.',
  'Every number needs its denominator — "[N] of [N]", never a bare percentage. Your founder-review discipline applies to public posts too.',
  'The sample-bias caveat is not throat-clearing, it is the post\u2019s credibility. This audience contains analysts who will otherwise say it for you in the comments, and it is far better coming from Hassan.',
  'Do not run the poll from version 1. Polls underperformed in your launch set and a weak poll on day 3 breaks the week\u2019s momentum.',
], NHS_BLUE));

// DAY 4
c.push(h2('Day 4  ·  Thursday 13 August, 07:30  ·  Hassan or Sukhmeet'));
c.push(rich([['Format ', { color: GREY }], ['Video, 75 seconds, straight to camera, deliberately unpolished. Captions burned in — most of this audience watches on mute.  ', {}], ['CTA ', { color: GREY }], ['Soft. The wall.', {}]]));
c.push(h3('Script'));
c.push(copyBlock([
  '[Straight to camera. No intro card. No music. Start mid-thought.]',
  '',
  'There’s a version of this I’m supposed to give at conferences.',
  '',
  'It has a slide with three logos on it and a number that goes up and to the right.',
  '',
  'This is the other one.',
  '',
  'We’ve spent four days collecting dead NHS AI pilots. Anonymously. [N] of them so far. Somewhere north of [£] million in banded spend.',
  '',
  'And the thing that’s striking me isn’t the money. It’s that almost every single one of these was a good idea. Sensible people. Real problems. Technology that mostly worked.',
  '',
  'They died because we asked the technology to do the difficult part.',
  '',
  'The difficult part isn’t the model. The difficult part is that changing how a ward actually works is slow, political, unglamorous, and nobody gets promoted for it.',
  '',
  'So we skip it. We buy the thing. We run the pilot. And eight months later somebody quietly stops renewing it and we never speak of it again.',
  '',
  'That’s the whole pattern. That’s the wall.',
  '',
  'If you’ve got one — it’s anonymous, we moderate every entry by hand, and no trust or supplier is ever named.',
  '',
  'upull.ai/graveyard',
], { accent: '2E7D32' }));
c.push(spacer(120));
c.push(calloutBox('Notes on day 4', [
  'Film on a phone. Do not book a studio. The credibility of this video is entirely in its lack of production — a polished version says "marketing" and the whole campaign dies on the spot.',
  'One take. If it is slightly awkward, keep it.',
  '[N] and [£] must be the real running totals on the morning of the 13th.',
], NHS_BLUE));

// DAY 5
c.push(h2('Day 5  ·  Friday 14 August, 07:30  ·  Sukhmeet, personal profile'));
c.push(rich([['Format ', { color: GREY }], ['Text.  ', {}], ['CTA ', { color: GREY }], ['The readiness assessment. This is the first real conversion ask of the week.', {}]]));
c.push(h3('The copy'));
c.push(copyBlock([
  'Five days of collecting dead NHS AI pilots, and I want to say the uncomfortable part out loud.',
  '',
  'Almost none of them failed for a technical reason.',
  '',
  'They failed because the foundations underneath them were never checked. Governance with no named owner. Data nobody had profiled. A workforce who found out in week three. A business case that assumed adoption rather than planning for it.',
  '',
  'Which means most of these deaths were predictable. Not in hindsight — in advance. Somebody could have looked at the state of the organisation before the money was committed and said, honestly, this will not survive contact with a ward.',
  '',
  'But there is a second thing underneath that, and the wall has made it obvious in a way I did not expect.',
  '',
  'We asked who actually ran these pilots day to day. Overwhelmingly: the supplier, or a project team that was disbanded the moment the funding cycle closed. Then we asked whether the organisation\u2019s own staff could have kept it running alone. Overwhelmingly: no.',
  '',
  'So these were not really capabilities. They were rentals. And when the rental ended, the organisation was exactly where it started, minus the money.',
  '',
  'That is the thing I would want a chief executive to understand. The question is not "does this AI work". It is "who can still run this in two years when everyone in this room has moved on".',
  '',
  'Which is genuinely all our method is. Workflow first, AI second, and the people who do the work doing the redesign — so that what is left behind when we go is a team that can do it again without us. Find one real bottleneck with the people living in it. Change the process before choosing a tool. Add the technology that supports the new shape of the work. Prove it in six weeks with a number a finance director will accept.',
  '',
  'We are deliberately building ourselves an exit. If we are still needed in three years, we have failed.',
  '',
  'If you want to know whether your own foundations would hold: we built a free readiness assessment. Thirty-two questions, eight domains, mapped to What Good Looks Like, DTAC and the government AI playbook. Ten minutes. Your score is on the screen at the end — there is no call to book before you see it, and no card.',
  '',
  'upull.ai/readiness',
  '',
  'And the wall is still open. Two hundred-odd headstones and counting: upull.ai/graveyard',
]));
c.push(spacer(120));
c.push(calloutBox('Notes on day 5', [
  'This post now carries the repositioning agreed on 6 August: exit rather than dependency, residual value, capability that stays. "We are deliberately building ourselves an exit" is the most differentiating sentence uPull has, and this is where it enters the market.',
  '"Your score is on the screen at the end — no call to book before you see it" is the highest-converting sentence available to you. Ungated results are rare in this market. Lead with it wherever the assessment is mentioned.',
  'This is the pivot post. If it lands as a pitch, the week\u2019s goodwill evaporates. The first two thirds must be substance before the ask appears.',
], NHS_BLUE));

// DAY 6
c.push(h2('Day 6  ·  Saturday 15 August  ·  Newsletter, company page'));
c.push(rich([['Format ', { color: GREY }], ['Newsletter edition — "The Graveyard Report, edition one." Your newsletter engagement was 17.3% on 52 impressions: small audience, engaged audience.', {}]]));
c.push(h3('Structure'));
c.push(num('The headline number, with its denominator. "[N] pilots. [£] banded spend. [N] organisations."', 'list3'));
c.push(num('Cause of death table, ranked, with counts not percentages.', 'list3'));
c.push(num('The workflow question — the finding that proves the thesis, stated carefully.', 'list3'));
c.push(num('Three headstones in full, chosen because they are recognisable to anybody in NHS digital.', 'list3'));
c.push(num('What we would have done differently on each. This is the value give — specific, practical, no pitch.', 'list3'));
c.push(num('The dependency finding — who ran these, and how many organisations could have kept them going alone. This is the section a chair or a CFO will forward.', 'list3'));
c.push(num('Method and limitations, in full. Self-selecting sample, self-reported figures, banded costs, unverified. Say all of it.', 'list3'));
c.push(num('One line: the cohort takes [N] organisations. Link.', 'list3'));

c.push(h2('Day 7  ·  Sunday 16 / Monday 17 August, 07:30  ·  Alex'));
c.push(rich([['Format ', { color: GREY }], ['Carousel + text.  ', {}], ['CTA ', { color: GREY }], ['One demonstrator partner, plus the cohort. Softer than version 1 — see the note below.', {}]]));
c.push(h3('The copy'));
c.push(copyBlock([
  'Seven days ago I posted a death certificate for a pilot that never existed, and asked whether anyone else had one that did.',
  '',
  '[N] people did.',
  '',
  '[N] dead NHS AI pilots. £[N] in self-reported, banded spend. [N] different organisations, none of them named, because that was the deal and we kept it.',
  '',
  'Here is what killed them:',
  '',
  '[N] — the workflow never changed',
  '[N] — no clinical owner',
  '[N] — funding ended before value was proven',
  '[N] — the supplier ran it, and when the contract ended it stopped',
  '[N] — it worked, and nobody scaled it',
  '',
  'That last one should bother us more than it does.',
  '',
  'The honest caveats: this is a self-selecting sample. People with dead pilots submitted, people with live ones mostly did not. The costs are self-reported and banded. Nothing here is audited. Treat it as the most honest thing available rather than as research.',
  '',
  'But [N] entries is [N] more than anybody else has written down, and the pattern did not wobble once after the first thirty.',
  '',
  'The single finding I cannot stop thinking about: on [N] of [N] entries where it was recorded, the workflow had not changed before the technology went in.',
  '',
  'We bought new tools to run old processes and then acted surprised.',
  '',
  'And the second finding, which I think matters more: [N] of [N] said their own team could not have kept it running without the supplier. So the money did not buy a capability. It rented one.',
  '',
  'That is the thing we care about most. Not whether the AI works — whether anything is still standing in your organisation two years after we have gone.',
  '',
  'So — the practical bit, and I am going to be straight about where we are.',
  '',
  'We are a young company. We do not yet have a five-year NHS case study, and I am not going to pretend otherwise while running a campaign about intellectual honesty.',
  '',
  'What we have is a method, three founders who have spent their careers in and around this, and now the largest honest dataset I know of on why this keeps failing.',
  '',
  'What we want is one organisation to prove it with. One workflow, six weeks, a number your finance director will accept, and — the part we actually care about — your own people able to run the next one without us.',
  '',
  'We think pharmacy is the right place to start. Measurable savings, clinical leadership already there, ROI you can benchmark. If you lead pharmacy somewhere and this sounds like a problem you have: message me.',
  '',
  'If you buried something on this wall and you do not want to bury the next one: upull.ai',
  '',
  'And if you would rather just check your own foundations first, the readiness assessment is free and the results are not behind a call: upull.ai/readiness',
  '',
  'Thank you to everyone who was honest in public this week. It is a harder thing to do than it looks.',
]));
c.push(spacer(120));
c.push(calloutBox('Notes on day 7 — changed in version 2', [
  'Version 1 closed with a hard cohort sell. The founder meeting concluded that evidence should be built before sales activity is scaled, and that buyers keep asking "where have you done this before?".',
  'So the close now names that gap rather than talking around it, and asks for one demonstrator instead of a cohort intake. Admitting you do not yet have the case study, in the same post where you publish original evidence nobody else has, is more persuasive than a confident CTA — and it is consistent with everything else the campaign has said all week.',
  'The pharmacy paragraph is the operational ask. If pharmacy entries did not materialise on the wall, keep the paragraph anyway — it is an outreach ask, not a claim about the data.',
], NHS_BLUE));


// ---- 6. AMPLIFICATION ----
c.push(h1('7.  Amplification'));
c.push(p('At 28 followers, organic reach on the company page is negligible. Reach in this campaign is manufactured, deliberately, every single day. Budget 45 minutes per person per day.'));

c.push(h2('Daily founder routine — non-negotiable'));
c.push(spacer(60));
c.push(table([1500, 4100, 3420],
  ['Time', 'Action', 'Why'],
  [
    ['07:30–08:00', 'Post or comment substantively on the day’s anchor post within 30 minutes of it going live', 'Early engagement velocity is the single biggest driver of LinkedIn distribution'],
    ['08:00–08:30', 'Reply to every comment on yesterday’s post — individually, by name, with a question back', 'Every reply resurfaces the post and doubles the comment count'],
    ['12:00–12:20', 'Comment on 5 other people’s NHS AI posts. Not promotion — genuine contribution', 'Borrowing audiences is the whole strategy'],
    ['16:00–16:30', 'DM anyone who engaged and works in an NHS organisation. No pitch. See scripts.', 'At this volume every engager is a person, not a data point'],
  ]));

c.push(spacer(140));
c.push(h2('Beyond LinkedIn'));
c.push(bullet('HSJ and Digital Health News — pitch the day 7 number as an exclusive on day 5, before you publish. A primary-source dataset on NHS AI failure is a genuine story and neither outlet has one.'));
c.push(bullet('Hassan’s HIMSS UK & Ireland position and the NHS Innovation Accelerator network are the two highest-value channels you have. Ask directly for a share on days 2 and 7.'));
c.push(bullet('Relevant NHS digital WhatsApp and Slack communities — seed the link on day 2, once the wall has real content on it. Never on day 1.'));
c.push(bullet('The founders’ personal networks, asked explicitly and by name. "Would you share this one?" outperforms hoping.'));
c.push(bullet('HFMA — the agreed route to NHS finance leaders. Day 3 is the post built for them. Approach on day 4 with the money cut, not with a company introduction.'));
c.push(bullet('Pharmacy networks for the demonstrator: regional chief pharmacists, the Guild of Healthcare Pharmacists, RPS hospital groups. Ask for entries in week one, ask for the pilot conversation in week two.'));

c.push(h2('Week 2 onwards — where this goes next'));
c.push(p('The graveyard is not a one-week campaign, it is an asset that keeps producing. Three extensions, in the order they should happen:'));
c.push(bullet('The podcast series agreed in the meeting has an obvious first season: 10-minute interviews with NHS leaders about a pilot that did not work and what they learned. The wall gives you both the subject matter and the invitation — "you buried one, would you talk about it?" That is a far easier ask than a generic interview request.'));
c.push(bullet('Audience cuts of the same dataset: a chairs and NEDs edition on governance, a CIO edition on procurement, a frontline edition on being consulted too late. One dataset, four more posts, no new research.'));
c.push(bullet('Keep the wall permanently open. A counter that keeps climbing is a standing reason to publish an update every quarter, and it is the closest thing to a proprietary benchmark uPull will own before the first case study lands.'));


// ---- 7. SALES HANDOFF ----
c.push(h1('8.  Marketing to sales'));
c.push(p('This is where most campaigns leak. Seven days of attention is worth nothing if a comment from a transformation director sits unanswered for two days. The rule for this sprint: every named NHS person who engages gets a human response within four working hours.'));

c.push(h2('Lead tiers'));
c.push(spacer(60));
c.push(table([900, 3000, 2600, 2520],
  ['Tier', 'Definition', 'Action', 'SLA'],
  [
    ['A+', 'Any pharmacy lead, chief pharmacist, CFO or deputy CFO who engages at all, however lightly. These are the two audiences tied to a live business objective — the demonstrator and the HFMA route.', 'Founder-led call, offered the same day. Hassan or Sukhmeet, not a marketing reply.', 'Same day'],
    ['A', 'Named NHS / ICB / national body decision-maker (8a+, digital, transformation, ops or clinical lead) who completed the readiness assessment OR ticked the diagnosis option', 'Founder-led 30-minute results call, offered by DM and email', '4 working hours'],
    ['B', 'NHS person who engaged publicly — comment or repost with commentary — but has not converted', 'Personal DM. No pitch. Ask about their story. Invite them to the wall.', '4 working hours'],
    ['C', 'NHS person who reacted only, or a supplier / vendor engaging positively', 'Follow, add to newsletter, comment on their content within the week', '48 hours'],
    ['D', 'Students, engagement pods, out-of-market', 'Nothing. Do not let these inflate the founder numbers.', 'n/a'],
  ]));

c.push(spacer(160));
c.push(h2('The daily standup'));
c.push(p('15 minutes, 16:30, every day of the sprint. Four questions only: How many new Tier A and B? Who has not been contacted within SLA? What are people actually saying in DMs? What changes tomorrow?'));
c.push(p('Shared tracker columns: name, role, organisation, org type, source (post / wall / assessment), tier, first contact, response, next action, owner, outcome.'));

c.push(h2('DM scripts'));

c.push(h3('Tier A — completed the readiness assessment'));
c.push(copyBlock([
  'Hi [name] — thanks for taking the readiness assessment. Your score has already landed in your inbox, so nothing is being held back.',
  '',
  'The bit the report can’t do is interpretation. [Domain] came out lowest, and in my experience that one blocks more downstream work than people expect — it tends to be what is actually behind the "we ran a pilot and it never scaled" pattern.',
  '',
  'Happy to spend 30 minutes going through it properly. No charge, no pitch, and if the answer is that you don’t need us I’ll tell you that on the call.',
  '',
  'Would sometime [day] or [day] work?',
], { accent: '2E7D32' }));

c.push(h3('Tier A — buried a pilot and asked for the diagnosis'));
c.push(copyBlock([
  'Hi [name] — you asked us to tell you why yours actually died. Here is the honest version.',
  '',
  'You said [what they said]. On the wall, that clusters with [N] others, and in almost all of them the same thing sits underneath it: the process was never redesigned before the technology arrived. The tool was asked to absorb a workflow problem, and tools cannot do that.',
  '',
  'Two questions that would tell you whether the next one goes the same way: who owned it day to day once the pilot team left, and what step of the actual work changed on day one?',
  '',
  'If it’s useful, we have a free readiness assessment that scores the foundations — 32 questions, ten minutes, results on screen, no call needed to see them: upull.ai/readiness',
  '',
  'And if you’d rather just talk it through, I’ve got 30 minutes this week.',
], { accent: '2E7D32' }));

c.push(h3('Tier B — engaged publicly, no conversion'));
c.push(copyBlock([
  'Hi [name] — thanks for [specific thing they said]. That line about [detail] is the one I keep hearing this week.',
  '',
  'Genuinely curious: when it happened to you, was there a moment where you could see it coming? Most people say yes, and most people say they couldn’t get anyone to act on it.',
  '',
  'No agenda — the wall is anonymous if you ever want to put it up there.',
], { accent: '2E7D32' }));

c.push(spacer(120));
c.push(calloutBox('DM discipline', [
  'Every DM references something the person specifically said. A templated opener at this volume is worse than sending nothing, because this audience talks to each other.',
  'Never pitch in the first message to Tier B. The ask is a question, not a call.',
  'If someone says no or does not reply, one gentle follow-up after four days. Then stop.',
], NHS_BLUE));


c.push(h2('Objection handling'));
c.push(spacer(60));
c.push(table([3000, 6020],
  ['You will hear', 'Say'],
  [
    ['"You’re profiting from NHS failure."',
      '"Fair challenge. Six of the first twelve entries are our own failures, and they’re not anonymous — we put our names on them. We’re publishing the whole dataset and the method free, whether anyone buys anything or not. If that still reads as extractive to you I’d rather hear it than not."'],
    ['"Isn’t this just negative? The NHS gets enough of that."',
      '"The negativity is what happens now — pilots dying quietly and nobody being allowed to say why, so the next team repeats it. Writing down the cause of death is the constructive act. And every entry comes with what we’d have done differently."'],
    ['"£35,000 for four days is a lot."',
      '"It is. The comparison worth making isn’t against a cheaper consultant, it’s against the median entry on that wall. Discovery is deliberately the smallest commitment we offer, and it exists so you can find out whether the case is real before committing to anything larger."'],
    ['"How is this different from every other consultancy?"',
      '"Order of operations. Most people bring a technology and look for a workflow to put it in. We change the workflow first with the people who do the work, then choose the technology that supports the new shape. And we’re vendor-neutral, so we have no reason to recommend a tool that doesn’t fit."'],
    ['"We already have an AI strategy."',
      '"Most of the organisations on that wall did too. The readiness assessment takes ten minutes and shows the results on screen — if the foundations are solid it will tell you that, and we’ll go away."'],
    ['"Can you prove the 5:1 return?"',
      '"Not yet, and I won’t pretend otherwise — it’s our target, and it’s labelled as a target on our site. What we can show you is the six-week structure and exactly how the number gets measured, so you can judge whether you’d believe it at the end."'],
  ]));


// ---- 8. MEASUREMENT ----
c.push(h1('9.  What success looks like'));
c.push(p('Measured at the 7-day snapshot, following your standard founder-review rules: every rate carries its denominator, and pipeline is reported separately from reach.'));
c.push(spacer(60));
c.push(table([2600, 1700, 1700, 3020],
  ['Measure', 'Baseline', '7-day target', 'Note'],
  [
    ['Headstones submitted', '0', '60+', 'The campaign’s primary output and the asset that outlives the week'],
    ['Diagnosis opt-ins', '0', '25+', 'Tier A/B leads straight from the wall'],
    ['Readiness assessments completed by NHS orgs', 'unknown', '15', 'The real qualification gate'],
    ['Discovery conversations booked', '0', '6', 'The number the founders should care about'],
    ['Cohort applications', '0', '2', 'The only figure that matters commercially'],
    ['Impressions', '720 / launch set', '8,000', 'Only achievable via founder networks — the page will not deliver this'],
    ['Distinct NHS orgs commenting', '~0', '5+', 'Conversation quality beats volume at this stage'],
    ['New followers', '28 total', '150+', 'Secondary, but it is the compounding asset'],
    ['Pharmacy entries on the wall', '0', '8', 'Feeds the first demonstrator — the meeting’s highest priority'],
    ['Finance / CFO-side engagements', '0', '5', 'The HFMA route needs names to open it'],
    ['Reports / hides', '2 on launch post', '0', 'Any report gets reviewed same day'],
  ]));

c.push(spacer(160));
c.push(h2('An honest word on the reach target'));
c.push(p('8,000 impressions from a 28-follower base is an 11x step change, and it is not achievable through content quality. It happens only if the founders post from their own profiles daily and actively ask their networks to share. If that does not happen, expect roughly 1,500 — a good artefact and very little pipeline.'));
c.push(rich([
  ['The decision to put to the founders is therefore not "do you like this idea". It is: ', {}],
  ['will each of you commit 45 minutes a day for seven days, and post one real personal failure under your own name?', { bold: true }],
  [' If the answer is no, run something smaller. This campaign only works if they are in it.', {}],
]));

c.push(h2('The three decisions needed'));
c.push(num('Founder commitment — 45 min/day each, plus one personal confession post under their own name. Owner: Alex. Needed by Friday 7 August.', 'list4'));
c.push(num('Sign-off on the three absolutes and the kill-switch criteria, so nobody is improvising at 9pm on day 3. Owner: all founders. Needed by Thursday 6 August.', 'list4'));
c.push(num('Who takes the discovery calls, and how fast. A Tier A lead going cold for 48 hours is the most expensive thing that can happen this week. Owner: Alex to confirm. Needed by Sunday 9 August.', 'list4'));
c.push(num('Whether the homepage hero fix lands before Monday. This is the one dependency outside marketing’s control, and without it the week’s traffic arrives somewhere that does not explain what uPull is. Owner: Hassan & Alex. Needed by Friday 7 August.', 'list4'));


// ---- 10. POSITIONING STATEMENTS ----
c.push(h1('10.  Positioning statements'));
c.push(p('The meeting put "produce 15–20 strong declarative positioning statements" on Alex’s action list. Fourteen are below, drafted against the agreed keywords — exit, adoption, transformation, agnostic, residual value, sustainable savings. They are written to be usable as post openers, hero lines, slide headers and DM sentences, which is the test of whether a positioning statement is doing any work.'));

c.push(h2('On capability and exit'));
c.push(bullet('We are the only AI partner in the NHS whose success is measured by how quickly you stop needing us.'));
c.push(bullet('Most suppliers sell you a capability. We build you one and leave it behind.'));
c.push(bullet('If we are still essential to you in three years, we have failed at the thing we were hired to do.'));
c.push(bullet('The question is not whether the AI works. It is who can still run it once everyone in the room has moved on.'));

c.push(h2('On sustainable savings — the CFO cut'));
c.push(bullet('Sustainable savings do not come from buying software. They come from upskilling the people you already employ.'));
c.push(bullet('A licence is a cost that recurs. A capable workforce is an asset that compounds.'));
c.push(bullet('You can spend the same money twice — once on a tool that leaves, once on people who stay. Only one is still on your balance sheet in three years.'));
c.push(bullet('We would rather prove £1 of savings your team can repeat than promise £10 they cannot.'));

c.push(h2('On method'));
c.push(bullet('Workflow first. AI second. Everything else is the wrong order.'));
c.push(bullet('We do not parachute in to fix your workflows. Your people already know how — they have never been given the framework or the permission.'));
c.push(bullet('We are technology agnostic, which means we have no reason to recommend a tool that does not fit.'));
c.push(bullet('One workflow. Six weeks. One number your finance director will accept.'));

c.push(h2('On the problem'));
c.push(bullet('NHS AI programmes rarely fail because the technology is weak. They fail because the work never changed shape.'));
c.push(bullet('The people who could have told you it would fail were never asked.'));

c.push(spacer(140));
c.push(calloutBox('How to use these', [
  'Test each one against a single question: could a competitor put their logo on it? If yes, it is a slogan, not a position. Lines about exit, residual value and building capability survive that test. Lines about "transforming healthcare with AI" do not.',
  'The website hero needs one of these, not a paragraph. The meeting feedback was that visitors cannot tell what uPull is in the first few seconds — a declarative sentence fixes that faster than more explanation.',
]));

c.push(spacer(60));
c.push(rule());
c.push(p('One workflow. Six weeks. Start by writing down why the last one died.', { italics: true, color: GREY, size: 22 }));

// ---------- document ----------
const doc = new Document({
  creator: 'uPull.ai',
  title: 'The NHS AI Graveyard — 7-Day Campaign Sprint',
  description: 'Campaign concept, content calendar and sales handoff for uPull.ai',
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 240 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 240 } } } },
        ],
      },
      ...[...usedLists].map((ref) => ({
        reference: ref,
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
        ],
      })),
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1300, right: 1440, bottom: 1300, left: 1440 },
      },
    },
    children: c,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('/sessions/ecstatic-compassionate-fermat/mnt/outputs/uPull-NHS-AI-Graveyard-Campaign.docx', buf);
  console.log('written', buf.length);
});
