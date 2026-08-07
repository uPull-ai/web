/* ══════════════════════════════════════════════════════════════════════
   THE GRAVEYARD WALL — moderated headstone data.

   This is the ONLY file a moderator needs to touch. When a submission
   comes in via Web3Forms (emailed to info@upull.ai), a human reads it,
   strips anything identifying, and adds one object to the WALL array
   below in the same shape as the existing entries. Save this file and
   push it to GitHub — graveyard.html loads it on every page view and
   the wall updates itself. Nothing else in the site needs to change.

   Field reference:
     i     inscription — one sentence, what the pilot was meant to do
     o     organisation type (see the <select id="org"> options in the
           form for the exact list of allowed values)
     s     specialty / service (see <select id="spec">)
     c     cost band, one of: "Under £25k", "£25k–£100k", "£100k–£500k",
           "£500k–£1m", "Over £1m", "Don't know"
     d     how long it ran, one of: "Under 3 months", "3–6 months",
           "6–12 months", "1–2 years", "Over 2 years"
     k     cause of death — pick the closest match from the CAUSES list
           inside graveyard.html (the checkboxes on the form), copied
           verbatim so shortCause()/causeMark() can match it
     ran   who ran it day to day (free text, short)
     sust  could the org's own team have sustained it — "Yes" / "No" /
           "Not sure"
     wf    was the workflow redesigned before the AI went in — "Yes" /
           "Partly" / "No" / "Not sure"
     name  a short, anonymised nickname for the pilot (never the real
           product or supplier name) — shown on the stone face
     yr    a birth–death style year range or single year, e.g. "2023",
           "2023–2024", "2022–present"
     shape one of: "arch", "obelisk", "plaque", "broken" (avoid "cross" —
           it was tried and dropped, too little internal area for the
           name/year/icon once the arms are cut away)

   Everything else about how the wall looks — sizing by spend, random
   placement, the icons, the popup — is driven automatically from these
   fields by the code in graveyard.html. You should not need to touch
   that file to publish a new case.
   ══════════════════════════════════════════════════════════════════════ */

var WALL = [
  {i:"Ambient note-taking on ward rounds, so nurses stopped writing up after shift",o:"Acute trust",s:"General medicine",c:"£100k–£500k",d:"6–12 months",k:"The workflow never actually changed",ran:"The supplier",sust:"No",wf:"No",name:"The Ward Scribe",yr:"2023–2024",shape:"arch"},
  {i:"Automated triage of outpatient referrals to cut the waiting list",o:"Integrated care board",s:"Elective care / outpatients",c:"£500k–£1m",d:"1–2 years",k:"The supplier ran it, and when the contract ended it stopped",ran:"The supplier",sust:"No",wf:"Partly",name:"TriageFlow",yr:"2022–2023",shape:"obelisk"},
  {i:"Dashboard flagging high-cost prescribing variation across the trust",o:"Acute trust",s:"Pharmacy / medicines management",c:"£25k–£100k",d:"6–12 months",k:"It worked — and nobody scaled it",ran:"Our own substantive staff",sust:"Yes",wf:"Yes",name:"Variation Watch",yr:"2023–present",shape:"plaque"},
  {i:"Drafting discharge summaries so patients left before the afternoon",o:"Acute trust",s:"Discharge",c:"£100k–£500k",d:"6–12 months",k:"No clinical owner — nobody senior owned it day to day",ran:"A seconded or fixed-term project team",sust:"No",wf:"No",name:"DischargeDraft",yr:"2023",shape:"plaque"},
  {i:"Prioritising chest X-rays so urgent findings surfaced first",o:"Acute trust",s:"Imaging / radiology",c:"Over £1m",d:"1–2 years",k:"Governance or information governance stalled it",ran:"A mix",sust:"No",wf:"No",name:"UrgentEye",yr:"2022–2024",shape:"obelisk"},
  {i:"Chatbot answering routine patient enquiries out of hours",o:"Community trust",s:"Corporate / back office",c:"£25k–£100k",d:"3–6 months",k:"Staff didn't use it",ran:"The supplier",sust:"No",wf:"No",name:"AskDesk",yr:"2024",shape:"broken"},
  {i:"Predicting which patients would miss appointments so we could call them",o:"Acute trust",s:"Elective care / outpatients",c:"£100k–£500k",d:"6–12 months",k:"Data wasn't ready, or we couldn't get access",ran:"A seconded or fixed-term project team",sust:"No",wf:"No",name:"NoShow Radar",yr:"2023",shape:"arch"},
  {i:"Automating medicines reconciliation on admission",o:"Acute trust",s:"Pharmacy / medicines management",c:"£100k–£500k",d:"3–6 months",k:"The workflow never actually changed",ran:"The supplier",sust:"No",wf:"No",name:"MedRecon",yr:"2024",shape:"plaque"},
  {i:"Streaming ED arrivals to the right clinician at the front door",o:"Acute trust",s:"Emergency department",c:"£500k–£1m",d:"6–12 months",k:"The workflow never actually changed",ran:"A mix",sust:"No",wf:"No",name:"Front Door AI",yr:"2023–2024",shape:"arch"},
  {i:"Theatre list optimisation to recover lost operating minutes",o:"Acute trust",s:"Surgery / theatres",c:"£100k–£500k",d:"1–2 years",k:"The person driving it left",ran:"Our own substantive staff",sust:"Not sure",wf:"Partly",name:"ListOptima",yr:"2022–2024",shape:"arch"},
  {i:"Transcribing therapy session notes for community mental health teams",o:"Mental health trust",s:"Mental health",c:"£25k–£100k",d:"3–6 months",k:"Funding ended before value was proven",ran:"The supplier",sust:"No",wf:"No",name:"SessionScribe",yr:"2024",shape:"broken"},
  {i:"Flagging patients for pharmacist review before they were discharged",o:"Acute trust",s:"Pharmacy / medicines management",c:"Under £25k",d:"6–12 months",k:"It worked — and nobody scaled it",ran:"Our own substantive staff",sust:"Yes",wf:"Yes",name:"ReviewFlag",yr:"2022–present",shape:"plaque"},
  {i:"Coding clinical notes automatically to improve tariff capture",o:"Acute trust",s:"Corporate / back office",c:"£500k–£1m",d:"1–2 years",k:"Nobody inside the organisation could keep it running",ran:"The supplier",sust:"No",wf:"No",name:"AutoCoder",yr:"2022–2023",shape:"obelisk"},
  {i:"Summarising GP referral letters for consultant triage",o:"Primary care / PCN",s:"Elective care / outpatients",c:"£25k–£100k",d:"Under 3 months",k:"Data wasn't ready, or we couldn't get access",ran:"A mix",sust:"Not sure",wf:"No",name:"ReferralBrief",yr:"2025",shape:"arch"},
  {i:"Rota and demand forecasting across four community teams",o:"Community trust",s:"Cross-cutting / whole organisation",c:"£100k–£500k",d:"6–12 months",k:"Funding ended before value was proven",ran:"A seconded or fixed-term project team",sust:"No",wf:"Partly",name:"Rota Sense",yr:"2023–2024",shape:"obelisk"},
  {i:"Regional platform to share AI models between trusts",o:"National body",s:"Cross-cutting / whole organisation",c:"Over £1m",d:"Over 2 years",k:"No clinical owner — nobody senior owned it day to day",ran:"A mix",sust:"No",wf:"No",name:"ModelShare",yr:"2021–2024",shape:"obelisk"},
  {i:"Automating pre-op assessment questionnaires",o:"Acute trust",s:"Surgery / theatres",c:"£25k–£100k",d:"3–6 months",k:"Staff didn't use it",ran:"The supplier",sust:"No",wf:"No",name:"PreOp Assist",yr:"2024",shape:"broken"},
  {i:"Ambulance handover delay prediction for the receiving ED",o:"Ambulance trust",s:"Emergency department",c:"£100k–£500k",d:"6–12 months",k:"The supplier ran it, and when the contract ended it stopped",ran:"The supplier",sust:"No",wf:"Partly",name:"HandoverWatch",yr:"2023–2024",shape:"arch"}
];
