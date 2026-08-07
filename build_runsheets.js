const fs = require('fs');
const d = require('docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat
} = d;

const NHS='005EB8', INK='1A1A1A', GREY='5A5A5A', RED='A8322D', GREEN='2E7D32';
const W=9020;

const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,keepNext:true,spacing:{before:460,after:200},
  border:{top:{style:BorderStyle.SINGLE,size:10,color:NHS,space:14}},
  children:[new TextRun({text:t,bold:true,size:32,color:NHS,font:'Calibri'})]});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,keepNext:true,spacing:{before:280,after:130},
  children:[new TextRun({text:t,bold:true,size:26,color:INK,font:'Calibri'})]});
const h3=t=>new Paragraph({heading:HeadingLevel.HEADING_3,keepNext:true,spacing:{before:200,after:90},
  children:[new TextRun({text:t,bold:true,size:22,color:NHS,font:'Calibri'})]});
const p=(t,o={})=>new Paragraph({spacing:{after:o.after===undefined?115:o.after},
  children:[new TextRun({text:t,size:o.size||21,color:o.color||INK,bold:o.bold,italics:o.italics,font:'Calibri'})]});
const rich=(parts,o={})=>new Paragraph({spacing:{after:o.after===undefined?115:o.after},
  children:parts.map(([text,q={}])=>new TextRun({text,size:q.size||21,color:q.color||INK,bold:q.bold,italics:q.italics,font:'Calibri'}))});
const bullet=t=>new Paragraph({numbering:{reference:'b',level:0},spacing:{after:62},
  children:[new TextRun({text:t,size:21,color:INK,font:'Calibri'})]});
const spacer=(h=130)=>new Paragraph({spacing:{after:h},children:[new TextRun({text:'',size:2})]});
const rule=()=>new Paragraph({spacing:{before:120,after:200},
  border:{bottom:{style:BorderStyle.SINGLE,size:6,color:'C9D6E2',space:4}},children:[new TextRun({text:'',size:2})]});

const copyBlock=(lines,o={})=>new Table({columnWidths:[W],width:{size:W,type:WidthType.DXA},
  rows:[new TableRow({children:[new TableCell({
    width:{size:W,type:WidthType.DXA},
    shading:{type:ShadingType.CLEAR,fill:o.fill||'F7F9FB'},
    margins:{top:200,bottom:200,left:220,right:220},
    borders:{left:{style:BorderStyle.SINGLE,size:18,color:o.accent||NHS},
      top:{style:BorderStyle.SINGLE,size:2,color:'DDE5EC'},
      bottom:{style:BorderStyle.SINGLE,size:2,color:'DDE5EC'},
      right:{style:BorderStyle.SINGLE,size:2,color:'DDE5EC'}},
    children:lines.map(l=>{
      if(l==='') return new Paragraph({spacing:{after:100},children:[new TextRun({text:'',size:16})]});
      const b=l.startsWith('**')&&l.endsWith('**');
      return new Paragraph({spacing:{after:60},
        children:[new TextRun({text:b?l.slice(2,-2):l,size:20,font:'Calibri',bold:b,color:INK})]});
    })})]})]});

const callout=(title,lines,colour=RED)=>{
  const kids=[new Paragraph({spacing:{after:100},children:[new TextRun({text:title,bold:true,size:21,color:colour,font:'Calibri'})]})];
  lines.forEach(l=>kids.push(new Paragraph({spacing:{after:70},children:[new TextRun({text:l,size:20,color:INK,font:'Calibri'})]})));
  return new Table({columnWidths:[W],width:{size:W,type:WidthType.DXA},
    rows:[new TableRow({children:[new TableCell({
      width:{size:W,type:WidthType.DXA},
      shading:{type:ShadingType.CLEAR,fill:colour===RED?'FDF4F3':'F2F7FC'},
      margins:{top:180,bottom:180,left:220,right:220},
      borders:{left:{style:BorderStyle.SINGLE,size:18,color:colour},
        top:{style:BorderStyle.SINGLE,size:2,color:'E4E9EE'},
        bottom:{style:BorderStyle.SINGLE,size:2,color:'E4E9EE'},
        right:{style:BorderStyle.SINGLE,size:2,color:'E4E9EE'}},
      children:kids})]})]});
};

const cell=(t,o={})=>new TableCell({width:{size:o.w,type:WidthType.DXA},
  shading:{type:ShadingType.CLEAR,fill:o.fill||'FFFFFF'},margins:{top:90,bottom:90,left:130,right:130},
  children:(Array.isArray(t)?t:[t]).map(x=>new Paragraph({spacing:{after:40},
    children:[new TextRun({text:x,size:19,bold:o.bold,font:'Calibri',color:o.color||(o.head?'FFFFFF':INK)})]}))});
const table=(widths,header,rows)=>new Table({columnWidths:widths,width:{size:W,type:WidthType.DXA},
  rows:[new TableRow({tableHeader:true,children:header.map((t,i)=>cell(t,{w:widths[i],bold:true,head:true,fill:NHS}))}),
    ...rows.map((r,ri)=>new TableRow({children:r.map((t,i)=>cell(t,{w:widths[i],fill:ri%2?'F4F7FA':'FFFFFF'}))}))]});

const c=[];

/* ───────────── TITLE ───────────── */
c.push(new Paragraph({spacing:{before:200,after:100},
  children:[new TextRun({text:'uPull.ai  ·  THE NHS AI GRAVEYARD',bold:true,size:20,color:NHS,font:'Calibri',characterSpacing:60})]}));
c.push(new Paragraph({spacing:{after:120},
  children:[new TextRun({text:'Run sheets',bold:true,size:52,color:INK,font:'Calibri'})]}));
c.push(new Paragraph({spacing:{after:300},
  children:[new TextRun({text:'What each person does, when they do it, and exactly what to say.',size:28,color:GREY,italics:true,font:'Calibri'})]}));
c.push(rule());
c.push(rich([['Prepared for  ',{color:GREY}],['Alex, Hassan and Sukhmeet',{bold:true}]]));
c.push(rich([['Prepared  ',{color:GREY}],['6 August 2026',{bold:true}],
  ['     Companion to  ',{color:GREY}],['The NHS AI Graveyard — 7-Day Campaign Sprint, v2',{bold:true}]]));
c.push(rule());
c.push(spacer(120));
c.push(callout('How to use this',[
  'Find your name. Read only your section, plus the two shared sections at the end. Nobody needs to read all of it.',
  'Everything in a shaded box is copy you can use as it stands. Anything in [square brackets] is a number or a detail only you can fill in.',
  'Days are named by weekday rather than by date, because the launch Monday is still to be confirmed. Prep runs Thursday to Sunday, the sprint runs Monday to the following Sunday.',
],NHS));

/* ───────────── SHARED GROUND RULES ───────────── */
c.push(h1('Ground rules — everybody, before anything else'));
c.push(p('Four pages of tactics are worthless if one of these slips. Read them once, properly.'));

c.push(h2('The three absolutes'));
c.push(callout('Never, under any circumstances',[
  '1.  No organisation is ever named — not the trust, not the ICB, not the region if it makes them identifiable.',
  '2.  No supplier or product is ever named. This is the one most likely to bring a legal letter.',
  '3.  No individual is ever named — not the executive who cancelled it, not the person who left.',
]));
c.push(spacer(140));
c.push(p('This applies to your own posts and your own comments, not just to submissions. If someone names a trust or a vendor in a comment on your post, reply publicly, warmly, and ask them to take the name out — then hide the comment if they do not. Do not let it sit there.'));

c.push(h2('Tone — the line you cannot cross'));
c.push(p('We are mourning pilots, not mocking the people who ran them. Every sentence should read as though it comes from inside the problem: we have all watched this happen. The moment any of us sounds like a consultancy sneering at NHS staff, the networks turn and the week is over.'));
c.push(p('A simple test before you post anything: would this sentence be fine if the person whose pilot it was read it? If not, rewrite it.'));

c.push(h2('If something goes wrong'));
c.push(p('Stop and tell Alex. Do not improvise a response in public, and do not delete anything before it has been screenshotted for the record. The pause protocol is in the campaign document; the shared scripts at the end of this pack cover the situations most likely to occur.'));

/* ───────────── DAILY RHYTHM ───────────── */
c.push(h1('Who is on point, each day'));
c.push(p('One person owns the anchor post. The other two amplify within thirty minutes. That thirty minutes matters more than anything else you do that day — early engagement is the single biggest driver of how far a LinkedIn post travels.'));
c.push(spacer(60));
c.push(table([1200,2500,2200,3120],
  ['Day','Anchor post','Owner','The other two'],
  [
    ['Thu–Sun','Prep. No posting.','Alex leads','Two seed entries each, in by Saturday'],
    ['Monday','The death certificate','Alex','Comment by 08:00. Share to your network.'],
    ['Tuesday','First headstones (carousel)','Alex','Both post your own confession, staggered 30 min'],
    ['Wednesday','The money — CFO cut','Hassan','Comment by 08:00. Hassan works HFMA and pharmacy.'],
    ['Thursday','The video','Sukhmeet','Comment by 08:00. Alex briefs HSJ.'],
    ['Friday','The turn — capability vs dependency','Sukhmeet','Comment by 08:00. First real conversion ask.'],
    ['Saturday','The Graveyard Report','Company page','Alex compiles. Founders share Sunday morning.'],
    ['Sunday/Mon','The number. One demonstrator ask.','Alex','All three share. Pharmacy outreach follows up.'],
  ]));
c.push(spacer(140));
c.push(callout('Sukhmeet has Thursday and Friday back to back',[
  'That is the heaviest load in the week. If it looks tight by Wednesday, Hassan takes the Thursday video and Sukhmeet keeps Friday — the video is the more transferable of the two, because Friday carries the positioning argument.',
  'Decide this on Wednesday evening at the standup, not on Thursday morning.',
],NHS));

/* ═════════════════════ ALEX ═════════════════════ */
c.push(h1('ALEX  ·  Marketing Director'));
c.push(rich([['Your one job this week: ',{bold:true}],
  ['keep the queue clean and the wall growing. Everything downstream — the posts, the numbers, the leads — stops if moderation slips. Guard that above all else.',{}]]));

c.push(h2('Before launch'));
c.push(spacer(60));
c.push(table([1300,5300,2420],
  ['When','What','Done'],
  [
    ['Thursday','Take down or honestly relabel the waitlist table listing named NHS organisations as "Pending". This is the highest-risk item on the site.',''],
    ['Thursday','Reconcile the homepage "three named deployments … verifiable case study" claim with what can actually be evidenced. With Hassan.',''],
    ['Thursday','Get Hassan\'s and Sukhmeet\'s availability for the full seven days, in writing, including leave.',''],
    ['Thursday','Confirm the launch Monday.',''],
    ['Friday','Homepage hero: choose one declarative line so a visitor knows what uPull is in five seconds.',''],
    ['Friday','Publish the graveyard page. Hosting, form endpoint, moderation view, takedown link.',''],
    ['Friday','Assets: death certificate template, headstone card, counter graphic.',''],
    ['Saturday','Submit your own two seed entries. Chase the other four from Hassan and Sukhmeet.',''],
    ['Saturday','Send 12–15 warm DMs, at least four to pharmacy leads.',''],
    ['Sunday','Dry run — submit, moderate, publish, check the counter moves.',''],
    ['Sunday','Lead tracker live. Name your weekend moderation backup and tell them.',''],
  ]));
c.push(spacer(140));
c.push(callout('With only three of you, the weekend cover matters more',[
  'You are the sole moderator, and the wall runs through Saturday and Sunday. If nobody is named as backup, the three absolutes depend on one person being available every day for nine days in August.',
  'Hassan or Sukhmeet takes Saturday. Agree it Thursday, in writing, with a login that works.',
]));

c.push(h2('Your day, every day'));
c.push(spacer(60));
c.push(table([1300,4100,3620],
  ['Time','What','Why it matters'],
  [
    ['07:30','Publish the anchor post if it is your day. If not, comment on it within 30 minutes.','Early engagement decides reach'],
    ['08:00','Moderation pass one. Clear the whole queue.','Nothing publishes without you'],
    ['08:30','Reply to every comment on yesterday\'s post, by name, with a question back.','Each reply resurfaces the post'],
    ['12:00','Comment on five other people\'s NHS AI posts. Contribution, not promotion.','Borrowing audiences is the strategy'],
    ['16:00','Moderation pass two. Update the counter graphic for tomorrow.','Tomorrow\'s post needs today\'s number'],
    ['16:30','Standup, 15 minutes, all three of you.','Catches leaks same day'],
    ['17:00','DM everyone from an NHS organisation who engaged today.','At this volume each one is a person'],
  ]));

c.push(h2('Moderation — how to decide, fast'));
c.push(p('You will be doing this twice a day under time pressure. Use these rules rather than judgement each time.'));
c.push(bullet('Names of trusts, ICBs, suppliers, products or people — strip them and publish the rest.'));
c.push(bullet('A region plus a specialty plus a cost band that together make the organisation obvious — generalise the specialty or reject.'));
c.push(bullet('Anything that reads as a grievance against a named individual, even unnamed — reject. This is not that kind of wall.'));
c.push(bullet('Anything that looks like it might be commercially confidential — reject, and reply to the submitter if they left contact details.'));
c.push(bullet('Genuinely unsure? Reject. A wall of 40 clean entries beats 60 with one lawsuit in it.'));

c.push(h2('Your scripts'));

c.push(h3('1 · Pre-launch DM, warm contact (send Saturday)'));
c.push(copyBlock([
  'Hi [name] — a slightly odd ask, and no obligation at all.',
  '',
  'We are opening something called the NHS AI Graveyard on Monday. It is an anonymous, moderated wall of AI pilots that died, and what killed them. No trusts named, no vendors named, no people named — I read every entry by hand before it goes up.',
  '',
  'I am trying not to launch it empty, because nobody wants to be the first to admit a failure in public. The three of us have put our own in already.',
  '',
  'If you have one — and I would be amazed if you did not — would you put it up before Monday? Takes about three minutes: [link]',
  '',
  'And if you would rather not, that is completely fine and I will not mention it again.',
],{accent:GREEN}));

c.push(h3('2 · Reply to an NHS person who commented (Tier B, same day)'));
c.push(copyBlock([
  'Hi [name] — thanks for [the specific thing they said]. That line about [detail] is the one I keep hearing this week.',
  '',
  'Curious about your own version: when it happened, was there a point where you could see it coming? Almost everyone says yes, and almost everyone says they could not get anyone to act on it.',
  '',
  'No agenda in asking. The wall is anonymous if you ever want to put it up there.',
],{accent:GREEN}));

c.push(h3('3 · Diagnosis reply (someone buried one and ticked the box) — within 4 hours'));
c.push(copyBlock([
  'Hi [name] — you asked us to tell you why yours actually died. Here is the honest version.',
  '',
  'You said [what they said]. On the wall that clusters with [N] others, and underneath almost all of them sits the same thing: the process was never redesigned before the technology arrived. A tool cannot absorb a workflow problem, however good it is.',
  '',
  'The two questions that would tell you whether the next one goes the same way: who owned it day to day once the pilot team left, and what step of the actual work changed on day one?',
  '',
  'If it helps, our readiness assessment scores the foundations — 32 questions, ten minutes, results on screen, no call needed to see them: upull.ai/readiness',
  '',
  'And if you would rather just talk it through, I have 30 minutes this week.',
],{accent:GREEN}));

c.push(h3('4 · The 16:30 standup — ask these four, nothing else'));
c.push(copyBlock([
  '1.  How many new Tier A and Tier B leads today, and who are they?',
  '',
  '2.  Is anyone past the four-hour response window? Who is picking them up tonight?',
  '',
  '3.  What are people actually saying in the DMs — not the metrics, the words?',
  '',
  '4.  What changes tomorrow as a result?',
  '',
  '(Fifteen minutes. If it runs to thirty, you are reporting rather than deciding.)',
]));

c.push(h3('5 · Monday — the anchor post'));
c.push(p('The image is the death certificate. Full asset spec in the campaign document.'));
c.push(copyBlock([
  'Nobody signs one of these.',
  '',
  'That\'s the problem.',
  '',
  'When an NHS AI pilot dies, it doesn\'t get a post-mortem. It gets a renewal conversation that never happens, a slide quietly removed from the board pack, and a team who learned nothing — because nobody was ever allowed to write down what actually killed it.',
  '',
  'So we lose the pilot. And then we lose the lesson. And then, about eighteen months later, somebody in the next trust along buys the same thing and loses it again.',
  '',
  'I\'ve watched this happen for [X] years. This week we\'re doing something about it.',
  '',
  'We\'ve opened the NHS AI Graveyard.',
  '',
  'It\'s anonymous. No trust names. No vendor names. No individuals — ever. We moderate every single entry by hand before it goes anywhere near the wall.',
  '',
  'You tell us what it was meant to do, roughly what it cost, and what you think killed it. We publish the headstone.',
  '',
  'And on Sunday, we publish the pattern.',
  '',
  'I have a suspicion about what we\'ll find. I think the cause of death is going to be the same one, over and over and over.',
  '',
  '[N] pilots are already buried. Six of them are ours.',
  '',
  'Bury yours: upull.ai/graveyard',
  '',
  'If you\'ve ever watched something you genuinely believed in get quietly switched off — this one\'s for you.',
]));
c.push(spacer(120));
c.push(callout('Before you post this',[
  'Replace [X] with your real number of years. If it is under five, cut the sentence entirely rather than stretching it.',
  '"Six of them are ours" is the most important line in the post — it turns this from accusation into confession. Two entries each from the three of you. Make sure it is true before you publish it.',
  'The figures on the death certificate image must either be a real anonymised entry or carry a visible "illustrative" mark. Do not present an invented number as a finding.',
],NHS));

c.push(h3('6 · Tuesday — the carousel'));
c.push(copyBlock([
  '[N] in a day.',
  '',
  'I expected maybe ten. What I did not expect was how many people messaged privately first, to check it was really anonymous, before they submitted.',
  '',
  'That tells you something on its own. There is a lot of experience in the NHS that has never been allowed out of the building.',
  '',
  'Six headstones from the wall are below. Read the causes of death.',
  '',
  'One thing is already showing up more than anything else, and it is not the technology.',
  '',
  'Anonymous. Moderated by hand. No trusts, no vendors, no names: upull.ai/graveyard',
]));
c.push(spacer(120));
c.push(callout('If Monday was quiet',[
  'Do not inflate the number. If it is fourteen, say fourteen — a real fourteen beats a fabricated thirty-one, and this audience can smell rounding.',
  'If it is genuinely low, change the angle: "Six of these are ours. Here is why we went first." Honesty is recoverable. A made-up number is not.',
],NHS));

c.push(h3('7 · Sunday — the close'));
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
  'The honest caveats: self-selecting sample, self-reported figures, banded costs, nothing audited. Treat it as the most honest thing available rather than as research.',
  '',
  'But [N] entries is [N] more than anybody else has written down, and the pattern did not wobble once after the first thirty.',
  '',
  'The finding I cannot stop thinking about: [N] of [N] said their own team could not have kept it running without the supplier. The money did not buy a capability. It rented one.',
  '',
  'So — the practical bit, and I am going to be straight about where we are.',
  '',
  'We are a young company. We do not yet have a five-year NHS case study, and I am not going to pretend otherwise while running a campaign about intellectual honesty.',
  '',
  'What we have is a method, three founders who have spent their careers in and around this, and now the largest honest dataset I know of on why it keeps failing.',
  '',
  'What we want is one organisation to prove it with. One workflow, six weeks, a number your finance director will accept — and your own people able to run the next one without us.',
  '',
  'We think pharmacy is the right place to start. If you lead pharmacy somewhere and this sounds like a problem you have: message me.',
  '',
  'Thank you to everyone who was honest in public this week. It is harder than it looks.',
]));

/* ═════════════════════ HASSAN ═════════════════════ */
c.push(h1('HASSAN  ·  Founder'));
c.push(rich([['Your one job this week: ',{bold:true}],
  ['open the doors the others cannot, and land the pharmacy demonstrator. Your standing at HIMSS UK & Ireland, Healthcare UK and the NHS Innovation Accelerator is worth more reach than the company page will generate all year — and with only three of you, the demonstrator conversation has to sit with the strongest network.',{}]]));

c.push(h2('Before launch'));
c.push(bullet('Thursday — with Alex, reconcile the "three named deployments" claim on the homepage against what can be evidenced. This is the one a journalist would probe.'));
c.push(bullet('Friday — write your confession post. Choose a real failure of your own, specific enough to be uncomfortable.'));
c.push(bullet('Saturday — submit two seed entries to the wall.'));
c.push(bullet('Saturday — list fifteen people you will personally ask to share. Names, not a vague intention.'));
c.push(bullet('Saturday — build a named list of ten chief pharmacists or pharmacy transformation leads. Names and organisations, not a category.'));
c.push(bullet('Sunday — draft the HFMA approach so it is ready to send on Thursday. Send the first four pharmacy approaches so they land before the noise starts.'));

c.push(h2('Your day, every day — 45 minutes'));
c.push(bullet('07:30–08:00 — comment substantively on the day\'s anchor post within thirty minutes of it going live.'));
c.push(bullet('08:00–08:30 — reply to every comment on your own posts, individually, with a question back.'));
c.push(bullet('12:00–12:20 — comment on five other people\'s NHS AI posts. Genuine contribution, never promotion.'));
c.push(bullet('16:30 — standup. You report the pharmacy pipeline specifically.'));

c.push(h2('Your scripts'));

c.push(h3('1 · Your confession post (Tuesday)'));
c.push(copyBlock([
  'I buried one of my own on the NHS AI Graveyard this morning.',
  '',
  '[One paragraph: what it was, what you believed it would do, who it was for. Be specific about the ambition — that is what makes the ending land.]',
  '',
  '[One paragraph: how it actually ended. Resist making it dramatic. The truth is usually mundane — a funding cycle, a departure, a pilot that simply never became business as usual.]',
  '',
  'What I got wrong: [one sentence, and own something real. "We put the technology in before we had changed a single step of the process" is worth more than any case study on our website.]',
  '',
  'The wall is anonymous and moderated. Mine isn\'t — because I think somebody senior should go first.',
  '',
  'upull.ai/graveyard',
],{accent:GREEN}));
c.push(spacer(120));
c.push(callout('Why yours matters most',[
  'You are the most recognisable name of the three in this sector. A senior, credible figure naming a specific failure of their own is the thing people screenshot, and the reason others feel safe contributing.',
  'Post between 07:00 and 09:00, staggered 30 minutes from Sukhmeet so LinkedIn does not read near-identical posts as coordinated.',
],NHS));

c.push(h3('2 · Wednesday — the anchor post (the money)'));
c.push(p('Six-slide carousel. Structure is in the campaign document. This is the CFO post and the one that opens the HFMA route.'));
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
c.push(callout('Two rules for this post',[
  'Every number carries its denominator — "[N] of [N]", never a bare percentage. This is the post most likely to be quoted back at us, so it has to be unimpeachable.',
  'Share it into finance networks rather than digital ones. It is written for a different reader than the rest of the week.',
],NHS));

c.push(h3('3 · The HFMA approach (send Thursday)'));
c.push(copyBlock([
  'Dear [name],',
  '',
  'I am one of the founders of uPull.ai, and I am writing with something that might be of interest to HFMA members rather than with a company introduction.',
  '',
  'Over the past week we have been collecting anonymous accounts of NHS AI pilots that did not survive — what they were meant to do, roughly what they cost, and what the people involved think killed them. No organisations, suppliers or individuals are named, and every entry is moderated by hand.',
  '',
  'We now have [N] of them. The finance picture is more interesting than the technology one. Two questions in particular seem to matter: who actually ran the pilot day to day, and whether the organisation\'s own staff could have kept it running without the supplier. On [N] of [N] entries, the answer to the second was no.',
  '',
  'Which suggests a lot of this spend rented a capability rather than building one — and that is a question for finance leaders more than for digital ones.',
  '',
  'We are publishing the full dataset and method free, to everyone, whether they have any relationship with us or not. If it would be useful to HFMA members, I would be glad to share it ahead of publication, or to talk it through.',
  '',
  'With best wishes,',
  'Hassan Chaudhury',
],{accent:GREEN}));

c.push(h3('4 · Pharmacy outreach (send Sunday and through the week)'));
c.push(copyBlock([
  'Hi [name],',
  '',
  'I am one of the founders of uPull.ai. This is not a pitch, and there is nothing to buy at the end of it.',
  '',
  'We have spent the week collecting anonymous accounts of NHS AI pilots that died — [N] so far, all moderated, nothing named. The pharmacy entries are the ones I keep coming back to, because they are the only part of the sample where the pilots that survived were built and run by the organisation\'s own staff.',
  '',
  'Which is roughly our argument: the savings that last come from the workforce being able to do it themselves, not from the tool.',
  '',
  'We are looking for one organisation to prove that properly with. One workflow, six weeks, a measured result — and your team able to run the next one without us. We think pharmacy is the right place to start because the savings are measurable, the clinical leadership already exists, and the ROI is straightforward to benchmark.',
  '',
  'Would a half-hour conversation be worth your time? If the answer is that you do not need us, I will tell you that on the call.',
  '',
  '[link to the wall]',
],{accent:GREEN}));

c.push(h3('5 · Asking your network to share (Tuesday and Sunday)'));
c.push(copyBlock([
  '[name] — would you share this one?',
  '',
  'It is an anonymous wall of NHS AI pilots that died and what killed them. No trusts, no vendors, no individuals — all moderated by hand. We have put our own failures on it.',
  '',
  'It is not a pitch and there is nothing gated behind it. I think it is genuinely useful, and it only works if enough people see it to make the pattern real.',
  '',
  '[link]',
],{accent:GREEN}));
c.push(spacer(120));
c.push(p('Send this individually, to named people, with their name at the top. A broadcast message to fifteen people at once will get zero shares. Fifteen individual messages will get five or six.',{italics:true}));

c.push(h3('6 · Opening a call with a CFO or finance director'));
c.push(copyBlock([
  '"Thanks for the time. I want to be useful rather than pitch, so let me start with what we found rather than what we do.',
  '',
  'We collected [N] dead NHS AI pilots anonymously. The thing that surprised me was not the money — it was that on [N] of [N], the organisation\'s own staff could not have kept the thing running without the supplier. So the spend rented a capability instead of building one.',
  '',
  'Before I say anything about us: when you look at your own AI or digital spend over the last three years, how much of it do you think left a capability behind?"',
  '',
  '[Then stop talking. That question does the work.]',
],{accent:GREEN}));

c.push(h3('7 · Opening the demonstrator conversation'));
c.push(copyBlock([
  '"I want to be straight about where we are, because it is relevant to whether this is worth your time.',
  '',
  'We are a young company. We do not yet have a decade-long NHS case study — that is exactly what we are looking for a partner to build with us. So you would be taking a risk, and I would rather say that now than have you find it out in procurement.',
  '',
  'What you would get in return is senior founder-led attention that a more established firm would not give a first engagement, and a genuine commitment that your own people run it afterwards.',
  '',
  'So — what is the one workflow in your service where everyone already knows where the time goes?"',
  '',
  '[Then listen. If they name something specific in the first minute, this is a live conversation.]',
],{accent:GREEN}));

/* ═════════════════════ SUKHMEET ═════════════════════ */
c.push(h1('SUKHMEET  ·  Founder'));
c.push(rich([['Your one job this week: ',{bold:true}],
  ['Thursday and Friday. The video earns credibility with people who have heard every conference version of this argument — because it is deliberately not one. Friday is where the repositioning enters the market. Between them, they are the two posts that decide whether the week means anything.',{}]]));

c.push(h2('Before launch'));
c.push(bullet('Friday — write your confession post.'));
c.push(bullet('Saturday — submit two seed entries.'));
c.push(bullet('Saturday — film the Thursday video early so it is not a Thursday-morning panic. One take, on a phone.'));
c.push(bullet('Saturday — draft Friday\'s post while the video argument is fresh. They are two halves of the same point.'));
c.push(bullet('Saturday — list ten ICB, regional or national contacts you will personally ask to share.'));

c.push(h2('Your day, every day — 45 minutes'));
c.push(bullet('07:30–08:00 — comment on the day\'s anchor post within thirty minutes.'));
c.push(bullet('08:00–08:30 — reply to every comment on your own posts.'));
c.push(bullet('12:00–12:20 — five substantive comments on other people\'s posts.'));
c.push(bullet('16:30 — standup.'));

c.push(h2('Your scripts'));

c.push(h3('1 · Your confession post (Tuesday)'));
c.push(p('Same structure as Hassan\'s, in your own voice — what it was, how it ended, what you got wrong, and why you are not anonymous. Template is in Hassan\'s section.'));

c.push(h3('2 · Thursday — the video (75 seconds)'));
c.push(copyBlock([
  '[Straight to camera. No intro card. No music. Start mid-thought.]',
  '',
  'There\'s a version of this I\'m supposed to give at conferences.',
  '',
  'It has a slide with three logos on it and a number that goes up and to the right.',
  '',
  'This is the other one.',
  '',
  'We\'ve spent four days collecting dead NHS AI pilots. Anonymously. [N] of them so far. Somewhere north of £[N] in banded spend.',
  '',
  'And the thing that\'s striking me isn\'t the money. It\'s that almost every single one of these was a good idea. Sensible people. Real problems. Technology that mostly worked.',
  '',
  'They died because we asked the technology to do the difficult part.',
  '',
  'The difficult part isn\'t the model. The difficult part is that changing how a ward actually works is slow, political, unglamorous, and nobody gets promoted for it.',
  '',
  'So we skip it. We buy the thing. We run the pilot. And eight months later somebody quietly stops renewing it and we never speak of it again.',
  '',
  'That\'s the whole pattern. That\'s the wall.',
  '',
  'If you\'ve got one — it\'s anonymous, we moderate every entry by hand, and no trust or supplier is ever named.',
  '',
  'upull.ai/graveyard',
],{accent:GREEN}));
c.push(spacer(120));
c.push(callout('Filming notes',[
  'Phone, not a studio. The entire credibility of this video is in its lack of production — a polished version reads as marketing and undoes the week.',
  'One take. If it is slightly awkward, keep it. If you fluff a line and recover, keep that too.',
  'Burn in captions. Most of this audience watches on mute.',
  '[N] and £[N] must be the real running totals on Thursday morning, so record the figures last or leave a gap and add a caption.',
],NHS));

c.push(h3('3 · Friday — the anchor post (the turn)'));
c.push(copyBlock([
  'Five days of collecting dead NHS AI pilots, and I want to say the uncomfortable part out loud.',
  '',
  'Almost none of them failed for a technical reason.',
  '',
  'They failed because the foundations underneath them were never checked. Governance with no named owner. Data nobody had profiled. A workforce who found out in week three. A business case that assumed adoption rather than planning for it.',
  '',
  'Which means most of these deaths were predictable. Not in hindsight — in advance.',
  '',
  'But there is a second thing underneath that, and the wall has made it obvious in a way I did not expect.',
  '',
  'We asked who actually ran these pilots day to day. Overwhelmingly: the supplier, or a project team disbanded the moment the funding cycle closed. Then we asked whether the organisation\'s own staff could have kept it running alone. Overwhelmingly: no.',
  '',
  'So these were not really capabilities. They were rentals. And when the rental ended, the organisation was exactly where it started, minus the money.',
  '',
  'That is the thing I would want a chief executive to understand. The question is not "does this AI work". It is "who can still run this in two years when everyone in this room has moved on".',
  '',
  'Which is genuinely all our method is. Workflow first, AI second, and the people who do the work doing the redesign — so what is left behind when we go is a team that can do it again without us.',
  '',
  'We are deliberately building ourselves an exit. If we are still needed in three years, we have failed.',
  '',
  'If you want to know whether your own foundations would hold, our readiness assessment is free — 32 questions, eight domains, ten minutes. Your score is on the screen at the end. There is no call to book before you see it, and no card.',
  '',
  'upull.ai/readiness',
  '',
  'And the wall is still open: upull.ai/graveyard',
]));
c.push(spacer(120));
c.push(callout('This is the pivot post — handle with care',[
  '"We are deliberately building ourselves an exit" is the single most differentiating sentence uPull has. This post is where it enters the market.',
  'The first two thirds must be substance before the ask appears. If it reads as a pitch, the week\'s goodwill evaporates in one post.',
  '"Your score is on the screen at the end, no call to book before you see it" is the highest-converting line available to us. Do not cut it for length.',
],NHS));

c.push(h3('4 · ICB, regional and national outreach'));
c.push(copyBlock([
  'Hi [name] — thought this might be up your street.',
  '',
  'We have been collecting anonymous accounts of NHS AI pilots that did not survive. [N] so far, across [N] organisations. Nothing named — no trusts, no suppliers, no individuals — and every entry moderated by hand.',
  '',
  'The system-level finding is the one I think matters for you: most of these did not fail technically. They failed because the capability sat outside the organisation, so when the contract or the secondment ended, so did the pilot.',
  '',
  'We are publishing all of it free next week, method and limitations included. Happy to share it early if useful.',
  '',
  '[link]',
],{accent:GREEN}));

c.push(h3('5 · Opening a call with a CIO or transformation director'));
c.push(copyBlock([
  '"Before I say anything about us — you have probably run one of these yourself. Can I ask what happened to it?',
  '',
  '[Listen. Do not fill the silence.]',
  '',
  'That is almost exactly what the wall says. The pattern we keep seeing is not that the technology failed; it is that the work never changed shape around it, and the people who understood it were never inside the organisation.',
  '',
  'What would need to be true for the next one to survive contact with a ward?"',
],{accent:GREEN}));

/* ═════════════════════ SHARED SCRIPTS ═════════════════════ */
c.push(h1('Shared scripts — the awkward moments'));
c.push(p('All three of you should read this section. These are the situations most likely to arise, and improvising any of them in public is how a good week goes wrong.'));

c.push(h3('Someone says: "You are profiting from NHS failure."'));
c.push(copyBlock([
  '"Fair challenge, and worth answering properly.',
  '',
  'Six of the first entries are our own failures, and ours are not anonymous — we put our names on them. We are publishing the entire dataset and the method free, to everyone, whether anyone ever buys anything from us or not.',
  '',
  'If that still reads as extractive to you, I would genuinely rather hear it than not."',
],{accent:GREEN}));

c.push(h3('Someone says: "Isn\'t this just negative? The NHS gets enough of that."'));
c.push(copyBlock([
  '"I understand that, but I think the negativity is what happens now — pilots dying quietly, nobody allowed to say why, and the next team repeating it eighteen months later.',
  '',
  'Writing down the cause of death is the constructive act. And every entry we publish comes with what we would have done differently."',
],{accent:GREEN}));

c.push(h3('A trust or ICB says an entry identifies them'));
c.push(callout('Do this in order. Do not negotiate.',[
  '1.  Remove the entry immediately. Within four hours, and without asking them to justify it.',
  '2.  Reply personally, from a named person, confirming it is down. Apologise once, plainly, and do not over-explain.',
  '3.  Tell Alex, who logs it and reviews how it got through moderation.',
  '4.  Do not post about it publicly unless they do first.',
]));
c.push(spacer(140));
c.push(copyBlock([
  'Dear [name],',
  '',
  'Thank you for telling us. The entry is down — I removed it at [time] today, and it will not go back up.',
  '',
  'That should not have reached the wall and I am sorry it did. I moderate every entry by hand precisely to prevent this, and I am reviewing how it got past me.',
  '',
  'If there is anything else on the page that concerns you, please tell me directly and I will treat it the same way.',
  '',
  '[name]',
],{accent:GREEN}));

c.push(h3('A supplier contacts you, unhappy'));
c.push(copyBlock([
  '"Thanks for getting in touch. To be clear about the rules we set: no supplier or product is ever named on the wall, in any entry, and we moderate every submission by hand to enforce that.',
  '',
  'If you believe an entry identifies you by implication, tell me which one and I will take it down today — I will not ask you to argue the case.',
  '',
  'The wall is not about vendors. Most of these pilots involved technology that worked."',
],{accent:GREEN}));

c.push(h3('A journalist calls'));
c.push(callout('Alex or Hassan only. Sukhmeet refers them on.',[
  'Give them the numbers with denominators attached, the method, and the limitations — all of it, unprompted.',
  'Say plainly: self-selecting sample, self-reported figures, banded costs, nothing audited.',
  'Never speculate about which organisations are represented, even off the record.',
  'If asked what uPull sells, answer honestly and briefly, including that we do not yet have a long-run NHS case study. It will come out anyway, and it lands far better from us.',
],NHS));

c.push(h3('Someone asks: "Where have you done this before?"'));
c.push(copyBlock([
  '"Not at the scale you are asking about, and I am not going to dress that up.',
  '',
  'We are a young company. What we have is a method, three founders who have spent their careers in and around this problem, and the most honest dataset I know of on why it keeps failing.',
  '',
  'What we are looking for is one organisation to prove it properly with — which is why the entry point is small and deliberately low-risk. You should not be betting anything significant on an unproven partner, and we would not ask you to."',
],{accent:GREEN}));

c.push(spacer(200));
c.push(rule());
c.push(p('One workflow. Six weeks. Start by writing down why the last one died.',{italics:true,color:GREY,size:22}));

/* ───────────── DOC ───────────── */
const doc=new Document({
  creator:'uPull.ai',title:'The NHS AI Graveyard — Run sheets',
  numbering:{config:[{reference:'b',levels:[
    {level:0,format:LevelFormat.BULLET,text:'•',alignment:AlignmentType.LEFT,
      style:{paragraph:{indent:{left:460,hanging:240}}}}]}]},
  sections:[{properties:{page:{margin:{top:1300,right:1440,bottom:1300,left:1440}}},children:c}]
});
Packer.toBuffer(doc).then(b=>{
  fs.writeFileSync('/sessions/ecstatic-compassionate-fermat/mnt/outputs/uPull-Graveyard-Run-Sheets.docx',b);
  console.log('written',b.length);
});
