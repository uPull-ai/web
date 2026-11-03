const fs=require('fs');const root=require('path').dirname(require.resolve('firebase-tools/package.json'))+'/lib/';
(async()=>{
 await require(root+'requireAuth').requireAuth({project:'upull-ai',nonInteractive:true});
 const {Client}=require(root+'apiv2');const client=new Client({urlPrefix:'https://firebaserules.googleapis.com',apiVersion:'v1'});
 const cases=[];
 function test(name,method,path,auth,old,data,expect,admin=false){cases.push({name,test:{expectation:expect,request:{path:'/databases/(default)/documents/'+path,method,auth:auth?{uid:auth,token:{}}:null,resource:{data}},resource:{data:old},functionMocks:[{function:'exists',args:[{anyValue:{}}],result:{value:admin}}]}})}
 const old={uid:'author',likes:0,likedBy:[],text:'hello'};
 test('first like','update','posts/p','alice',old,{...old,likes:1,likedBy:['alice']},'ALLOW');
 test('repeat like','update','posts/p','alice',{...old,likes:1,likedBy:['alice']},{...old,likes:2,likedBy:['alice','alice']},'DENY');
 test('legacy first like','update','posts/p','alice',{uid:'author',likes:4},{uid:'author',likes:5,likedBy:['alice']},'ALLOW');
 test('forged count','update','posts/p','alice',old,{...old,likes:100,likedBy:['alice']},'DENY');
 test('forged other voter','update','posts/p','alice',old,{...old,likes:1,likedBy:['bob']},'DENY');
 test('edit own text','update','posts/p','author',old,{...old,text:'changed'},'DENY');
 test('anonymous like','update','posts/p',null,old,{...old,likes:1,likedBy:['alice']},'DENY');
 test('public approved reply','get','posts/p/replies/r',null,{status:'approved'},null,'ALLOW');
 test('hide pending reply','get','posts/p/replies/r',null,{status:'pending'},null,'DENY');
 test('hide pending from author','get','posts/p/replies/r','author',{uid:'author',status:'pending'},null,'DENY');
 test('moderator pending reply','get','posts/p/replies/r','moderator',{status:'pending'},null,'ALLOW',true);
 test('self approval','update','posts/p/replies/r','author',{uid:'author',status:'pending'},{uid:'author',status:'approved'},'DENY');
 test('public approved blog','get','blogComments/c',null,{status:'approved'},null,'ALLOW');
 test('hide pending blog','get','blogComments/c',null,{status:'pending'},null,'DENY');
 test('self assign admin','create','admins/alice','alice',null,{},'DENY');
 test('own admin lookup','get','admins/alice','alice',{},null,'ALLOW');
 test('other admin lookup','get','admins/bob','alice',{},null,'DENY');
 const res=await client.post('/projects/upull-ai:test',{source:{files:[{name:'firestore.rules',content:fs.readFileSync(process.argv[2],'utf8')}]},testSuite:{testCases:cases.map(c=>c.test)}});
 if(res.body.issues) console.log(JSON.stringify(res.body.issues));
 let failures=0;(res.body.testResults||[]).forEach((r,i)=>{console.log(cases[i].name+': '+r.state);if(r.state!=='SUCCESS'){failures++; console.log(JSON.stringify(r));}});
 if(!res.body.testResults || failures)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1});
