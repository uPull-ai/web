import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Window} from 'happy-dom';
const html = readFileSync(new URL('../community.html', import.meta.url), 'utf8');
const code = html.slice(html.indexOf('  // Treat all stored'), html.indexOf('  function deletePost(id)'));
function setup() {
  const window = new Window();
  window.document.body.innerHTML = '<div id="forum-feed-target"></div>';
  const context = vm.createContext({document:window.document, console, currentFilter:'all', currentUser:null, isAdmin:false,
    livePosts:[], alert:()=>{}, reportPost:()=>{}, deletePost:()=>{}, fb:()=>({})});
  vm.runInContext(code,context);
  return {window,context,run:script=>vm.runInContext(script,context)};
}
const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
test('stored text, author, category and document ID cannot become executable HTML',()=>{
  const {window,context,run}=setup();
  context.livePosts=[{id:"x' onclick='alert(1)",user:payload,text:payload,cat:payload,likes:0,likedBy:[],reportedBy:[],time:'Just now'}];
  run('renderForum()');
  assert.equal(window.document.querySelectorAll('img,script,[onclick],[onerror]').length,0);
  assert.ok(window.document.querySelector('.forum-post').textContent.includes(payload));
  assert.equal(window.document.querySelector('.forum-post').dataset.type,'community');
});
test('legacy email names and malformed names are anonymous',()=>{
  const {context,run}=setup();
  for(const name of ['private@example.com','Name <private@example.com>',null,{},'']) {
    context.name=name; assert.equal(run('publicForumName(name)'), 'Community member');
  }
  assert.equal(run("publicForumName('Alex')"),'Alex');
});
test('reply text is safe and pending replies stay hidden from members',()=>{
  const {window,context,run}=setup();
  context.payload=payload;
  run(`openThreads.add('p'); const h=forumElement('section');h.dataset.thread='p';document.body.append(h);
    replyCache.set('p',{approved:[{user:'member@example.com',text:payload,status:'approved'}],pending:[{user:'Mod',text:'PRIVATE PENDING',status:'pending'}]});renderThread('p');`);
  assert.equal(window.document.querySelectorAll('img,script,[onclick],[onerror]').length,0);
  assert.ok(window.document.body.textContent.includes('Community member'));
  assert.ok(!window.document.body.textContent.includes('PRIVATE PENDING'));
  context.isAdmin=true;run("renderThread('p')");
  assert.ok(window.document.body.textContent.includes('PRIVATE PENDING'));
});
test('reply submission is nested, pending and never includes an email author',async()=>{
  const {window,context,run}=setup();let saved;
  context.currentUser={uid:'alice',email:'private@example.com'};
  context.fb=()=>({db:{},collection:(...args)=>args,serverTimestamp:()=> 'timestamp',addDoc:async(path,data)=>{saved={path,data}}});
  run(`openThreads.add('p'); const h=forumElement('section');h.dataset.thread='p';document.body.append(h);replyCache.set('p',{approved:[],pending:[]});renderThread('p');`);
  const input=window.document.querySelector('textarea');input.value=payload;
  window.document.querySelector('form').dispatchEvent(new window.Event('submit',{cancelable:true}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(Array.from(saved.path).slice(1),['posts','p','replies']);
  assert.equal(saved.data.status,'pending');assert.equal(saved.data.user,'Community member');assert.equal(saved.data.text,payload);
  assert.ok(window.document.body.textContent.includes('sent for approval'));
});
test('like transaction is idempotent and legacy counts are preserved',async()=>{
  const {context,run}=setup();let data={likes:4},writes=0;
  context.currentUser={uid:'alice'};
  context.fb=()=>({db:{},doc:()=> 'post',runTransaction:async(db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>data}),update:(ref,change)=>{writes++;data={...data,...change}}})});
  await run("likePost('p')"); await run("likePost('p')");
  assert.equal(writes,1);assert.equal(data.likes,5);assert.deepEqual(Array.from(data.likedBy),['alice']);
});
// Parse all inline scripts, including the Firebase module, for syntax regressions.
test('inline scripts parse',()=>{
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(match[1].includes('ld+json'))continue;
    let script=match[2];if(match[1].includes('module'))script=script.replace(/import\s+[\s\S]*?from\s+"[^"]+";/g,'');
    new vm.Script(script);
  }
});
