const fs=require('fs');const root=require('path').dirname(require.resolve('firebase-tools/package.json'))+'/lib/';
(async()=>{
 await require(root+'requireAuth').requireAuth({project:'upull-ai',nonInteractive:true});
 const {Client}=require(root+'apiv2');const client=new Client({urlPrefix:'https://firebaserules.googleapis.com',apiVersion:'v1'});
 const cases=[];
 function test(name,method,path,auth,old,data,expect,admin=false){cases.push({name,test:{expectation:expect,request:{path:'/databases/(default)/documents/'+path,method,auth:auth?{uid:auth,token:{}}:null,resource:{data}},resource:{data:old},functionMocks:[{function:'exists',args:[{anyValue:{}}],result:{value:admin}}]}})}
 for (const path of ['posts/p','posts/p/replies/r','blogComments/c']) {
   for (const auth of [null,'author','moderator']) {
     test('retired read '+path+' '+auth,'get',path,auth,{uid:'author',status:'approved'},null,'DENY',auth==='moderator');
     test('retired create '+path+' '+auth,'create',path,auth,null,{uid:auth,status:'pending'},'DENY',auth==='moderator');
     test('retired update '+path+' '+auth,'update',path,auth,{uid:auth},{uid:auth,text:'changed'},'DENY',auth==='moderator');
   }
 }
 test('unrelated vendor feed retained','get','vendorPosts/p',null,{},null,'ALLOW');
 test('own admin lookup retained','get','admins/alice','alice',{},null,'ALLOW');
 test('self assigning admin denied','create','admins/alice','alice',null,{},'DENY');
 const res=await client.post('/projects/upull-ai:test',{source:{files:[{name:'firestore.rules',content:fs.readFileSync(process.argv[2],'utf8')}]},testSuite:{testCases:cases.map(c=>c.test)}});
 if(res.body.issues) console.log(JSON.stringify(res.body.issues));
 let failures=0;(res.body.testResults||[]).forEach((r,i)=>{console.log(cases[i].name+': '+r.state);if(r.state!=='SUCCESS'){failures++; console.log(JSON.stringify(r));}});
 if(!res.body.testResults || failures)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
