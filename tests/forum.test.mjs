import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {Window} from 'happy-dom';
const root=new URL('../', import.meta.url);
const html=readFileSync(new URL('community.html',root),'utf8');
const code=readFileSync(new URL('asset/community.js',root),'utf8');
async function setup(signedIn=false){
 const window=new Window({url:'https://upull.ai/community',settings:{enableJavaScriptEvaluation:false,disableJavaScriptFileLoading:true,enableCSSFileLoading:false}});window.document.write(html);window.document.querySelectorAll('script').forEach(node=>node.remove());
 const requests=[];const post={id:'12345678-1234-1234-1234-123456789abc',user:'private@example.org',text:'<img src=x onerror="alert(1)"><script>alert(2)</script>',cat:'clinical',likes:0,liked:false,createdAt:new Date().toISOString()};
 const fetch=async(url,options)=>{requests.push({url,options});const path=url.split('/website-community/')[1];let data=[];
 if(path==='session') data={user:signedIn?{id:'alice',displayName:'Alex',isAdmin:false}:null};
 else if(path.startsWith('posts?')) data=[post];
 else if(path.endsWith('/replies') && options.method==='POST')data={status:'pending'};
 else if(path.includes('/replies?'))data=[{user:'<b>name</b>',text:'<svg onload=alert(1)>',createdAt:new Date().toISOString()}];
 else if(path.endsWith('/like')){data={likes:1,liked:true};}
 else if(options.method==='POST')data={ok:true};
 return {ok:true,status:200,json:async()=>data};};
 const context=vm.createContext({window,document:window.document,fetch,AbortSignal,console,confirm:()=>true,prompt:()=>''});
 vm.runInContext(code,context);window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
 await new Promise(resolve=>setTimeout(resolve,20));
 return {window,requests,context};
}
test('uses existing sign-in without loading Firebase',()=>{assert.ok(!html.includes('firebasejs/'));assert.ok(!code.includes('localStorage'));const doc=new Window({settings:{enableJavaScriptEvaluation:false,disableJavaScriptFileLoading:true}});doc.document.write(html);assert.equal(doc.document.querySelector('#authSignedOut a').href,'https://academy.upull.ai/community/website-sign-in');});
test('public post text and legacy email names are safe',async()=>{const {window}=await setup();const host=window.document.getElementById('forum-feed-target');assert.equal(host.querySelectorAll('img,script,[onerror]').length,0);assert.ok(host.textContent.includes('<img src=x'));assert.ok(host.textContent.includes('Community member'));assert.ok(!host.textContent.includes('private@example.org'));});
test('requests send cookies only to the narrow Academy gateway',async()=>{const {requests}=await setup();assert.ok(requests.length>=2);for(const request of requests){const url=new URL(request.url);assert.equal(url.origin,'https://academy.upull.ai');assert.ok(url.pathname.startsWith('/api/website-community/'));assert.equal(request.options.credentials,'include');assert.equal(request.options.headers['X-Upull-Community'],'1');assert.ok(!('Authorization' in request.options.headers));}});
test('reply text is safe and submission is held for approval',async()=>{const {window,requests}=await setup(true);const button=[...window.document.querySelectorAll('.post-actions button')].find(b=>b.textContent==='Reply Thread');button.click();await new Promise(resolve=>setTimeout(resolve,5));const host=window.document.querySelector('.forum-replies');assert.equal(host.querySelectorAll('svg,b').length,0);assert.ok(host.textContent.includes('<svg'));const input=host.querySelector('textarea');input.value='A reply';host.querySelector('form').dispatchEvent(new window.Event('submit',{cancelable:true}));await new Promise(resolve=>setTimeout(resolve,5));const sent=requests.find(r=>r.options.method==='POST'&&r.url.endsWith('/replies'));assert.deepEqual(JSON.parse(sent.options.body),{text:'A reply'});assert.ok(host.textContent.includes('sent for approval'));});
test('signed-in member can post without supplying identity or a token',async()=>{const {window,requests,context}=await setup(true);window.document.getElementById('postText').value='My idea';await vm.runInContext('window.submitPost()',context);const sent=requests.find(r=>r.options.method==='POST'&&r.url.endsWith('/posts'));assert.deepEqual(JSON.parse(sent.options.body),{text:'My idea',category:'clinical'});});
test('inline scripts and community asset parse',()=>{new vm.Script(code);for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(!m[1].includes('ld+json'))new vm.Script(m[2]);}});
