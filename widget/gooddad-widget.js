// 好爸爸小工具（Scriptable）
// 第一次：在 Scriptable 裡按 ▶ 執行，輸入好爸爸 App 的帳號密碼登入（只存登入憑證，不存密碼）。
// 之後：桌面長按 → 編輯主畫面 → ＋ → Scriptable → 選大小 → 長按小工具「編輯小工具」→ Script 選「好爸爸」。
const API_KEY="AIzaSyAKdSmAQ2yBd1bpk3C6fxBmgEQ8WZSkwmU",PROJECT="good-dad-6a69e";
const APP_URL="https://kaifazhelmc.github.io/good-dad/";
const KC="gooddad_refresh_token";
const LINES=["今晚的夜奶我來，你好好睡一覺，明天的你也值得被好好對待。", "謝謝你把{baby}帶來這個世界，這件事我會記一輩子。", "奶瓶我洗好了，你只要負責躺著就好。", "我們家{baby}的可愛，八成是遺傳到你，剩下兩成是我努力的結果。", "今天辛苦了。你不用表現得很堅強，在我面前累了就說累。", "我看到你凌晨三點還在抱著他，我都知道，謝謝你。", "這個週末下午是你的，想睡覺、想逛街、想發呆都可以，{baby}交給我。", "新手爸爸考試今天又多會一題：換尿布不被噴到。請老師給分。", "你想吃什麼？我下班帶回去，不用想健不健康。", "你當媽媽的樣子，比我想像中還要好。", "不管奶量多少，你都是{baby}最好的媽媽。", "明天早上我先起來，你多睡一個小時。", "{baby}今天對我笑了，我決定跟全世界宣布，但第一個先跟你說。", "謝謝你包容我手忙腳亂的樣子，我會越來越上手的。", "你最近都在照顧別人，今天換我照顧你。", "家事清單我認領了三項，今天已經做完兩項。", "老婆大人，今天的好爸爸點數已經存了不少，可以換一個抱抱嗎？", "有你在，這個家才像家。", "累的時候不用回訊息，看到就好。愛你。", "我把明天的副食品準備好了，冰箱第二層。"];

// ---------- 登入與讀資料 ----------
async function postJSON(url,body,form){const r=new Request(url);r.method="POST";
  if(form){r.headers={"Content-Type":"application/x-www-form-urlencoded"};r.body=body}else{r.headers={"Content-Type":"application/json"};r.body=JSON.stringify(body)}
  const j=await r.loadJSON();if(r.response.statusCode>=400)throw new Error((j.error&&j.error.message)||("HTTP "+r.response.statusCode));return j}
async function signIn(){const a=new Alert();a.title="登入好爸爸";a.message="用 App 裡「帳號同步」的同一組帳號密碼";
  a.addTextField("Email");a.addSecureTextField("密碼");a.addAction("登入");a.addCancelAction("取消");
  if(await a.presentAlert()===-1)throw new Error("取消登入");
  const j=await postJSON("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key="+API_KEY,{email:a.textFieldValue(0).trim(),password:a.textFieldValue(1),returnSecureToken:true});
  Keychain.set(KC,j.refreshToken);return {token:j.idToken,uid:j.localId}}
async function auth(){
  if(Keychain.contains(KC)){try{const j=await postJSON("https://securetoken.googleapis.com/v1/token?key="+API_KEY,"grant_type=refresh_token&refresh_token="+encodeURIComponent(Keychain.get(KC)),true);return {token:j.id_token,uid:j.user_id}}catch(e){if(config.runsInWidget)throw e;Keychain.remove(KC)}}
  if(config.runsInWidget)throw new Error("請先打開 Scriptable 執行一次並登入");
  return signIn()}
function fsVal(v){if(!v)return null;if("stringValue" in v)return v.stringValue;if("integerValue" in v)return +v.integerValue;if("doubleValue" in v)return v.doubleValue;if("booleanValue" in v)return v.booleanValue;
  if("mapValue" in v){const o={},f=v.mapValue.fields||{};for(const k in f)o[k]=fsVal(f[k]);return o}if("arrayValue" in v)return (v.arrayValue.values||[]).map(fsVal);return null}
async function loadData(){const a=await auth();
  const r=new Request(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${a.uid}`);r.headers={Authorization:"Bearer "+a.token};
  const j=await r.loadJSON();if(r.response.statusCode>=400)throw new Error("讀不到資料（"+r.response.statusCode+"）");
  const raw=fsVal({mapValue:{fields:j.fields||{}}}).data||{},d={};
  for(const k in raw){try{d[k]=JSON.parse(raw[k].v)}catch(_){d[k]=raw[k].v}}
  return d}

// ---------- 計算 ----------
const DAY=864e5;
function ymd(dt){return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0")}
function diff(a,b){return Math.round((Date.parse(b)-Date.parse(a))/DAY)}
function summarize(d,now){
  const t=ymd(now),baby=d.baby||"寶寶",born=!!d.born,date=d.date,w=d.wife||{};
  let big,label,sub;
  if(!date){label="好爸爸";big="—";sub="先在 App 設定日期"}
  else if(!born){const left=diff(t,date);if(left>0){label=baby+"預產期倒數";big=String(left);sub="天";const g=280-left;subWeek="懷孕 "+Math.floor(g/7)+" 週 "+(g%7)+" 天"}else{label=left===0?baby+"預產期":baby+"已過預產期";big=left===0?"今天":String(-left);sub=left===0?"":"天"}}
  else{const n=diff(date,t);if(n<60){label=baby+"出生第";big=String(n+1);sub="天"}else if(n<730){label=baby+"已經";big=String(Math.floor(n/30.44));sub="個月"}else{label=baby+"已經";big=String(Math.floor(n/365.25));sub="歲"}}
  const items=[];
  if(!born&&w.nextCheckup){const n=diff(t,w.nextCheckup);if(n>=0)items.push({ic:"🩺",t:n===0?"今天產檢":n===1?"明天產檢":n+" 天後產檢",s:(w.nextCheckup.slice(5).replace("-","/"))+(w.checkupTime?" "+w.checkupTime:"")+(w.hospital?" "+w.hospital:""),p:n<=2?0:2})}
  if(born&&Array.isArray(d.blog)){const lf=d.blog.slice().reverse().find(r=>/^feed|bottle/.test(r.k));if(lf){const m=Math.floor((now-lf.t)/6e4);items.push({ic:"🍼",t:"上次餵奶 "+(m<60?m+" 分鐘前":Math.floor(m/60)+" 小時 "+(m%60)+" 分前"),s:"",p:m>180?0:3})}}
  const td=(Array.isArray(d.todos)?d.todos:[]).filter(x=>!x.done).sort((a,b)=>(a.due||"9")<(b.due||"9")?-1:1);
  if(td.length)items.push({ic:"📝",t:td.length+" 項待辦",s:td[0].t,p:td[0].due&&td[0].due<=t?1:4});
  [["birthday","她的生日","🎂"],["anniversary","結婚紀念日","💍"],["metday","認識紀念日","💞"]].forEach(([k,l,ic])=>{if(!w[k])return;let nx=t.slice(0,4)+w[k].slice(4);if(diff(t,nx)<0)nx=(+t.slice(0,4)+1)+w[k].slice(4);const n=diff(t,nx);if(n<=14)items.push({ic,t:n===0?"今天是"+l:l+" "+n+" 天後",s:"",p:n<=1?0:2})});
  items.sort((a,b)=>a.p-b.p);
  const line=LINES[Math.floor(Date.parse(t)/DAY)%LINES.length].replace(/\{baby\}/g,baby);
  return {label,big,sub,items,line,todos:td.slice(0,4)}}
let subWeek="";

// ---------- 畫小工具 ----------
function bg(w){const g=new LinearGradient();g.colors=[new Color("#F07A3C"),new Color("#E0505A"),new Color("#B9479A")];g.locations=[0,.5,1];g.startPoint=new Point(0,0);g.endPoint=new Point(1,1);w.backgroundGradient=g}
function txt(stack,s,size,opts){const t=stack.addText(s);t.font=opts&&opts.bold?Font.boldSystemFont(size):Font.systemFont(size);t.textColor=new Color("#FFFFFF",opts&&opts.alpha!=null?opts.alpha:1);if(opts&&opts.lines)t.lineLimit=opts.lines;t.minimumScaleFactor=.7;return t}
function build(S,fam){
  const w=new ListWidget();bg(w);w.url=APP_URL;w.setPadding(14,14,14,14);w.refreshAfterDate=new Date(Date.now()+30*60e3);
  if(fam==="small"){txt(w,S.label,12,{alpha:.9,lines:1});const r=w.addStack();r.bottomAlignContent();txt(r,S.big,40,{bold:true});r.addSpacer(3);txt(r,S.sub,14,{bold:true});
    w.addSpacer();const it=S.items[0];if(it){txt(w,it.ic+" "+it.t,12,{bold:true,lines:1});if(it.s)txt(w,it.s,10,{alpha:.85,lines:1})}else txt(w,"今天沒有急事 ❤",12,{alpha:.9});return w}
  const top=w.addStack();top.centerAlignContent();const L=top.addStack();L.layoutVertically();txt(L,S.label,12,{alpha:.9,lines:1});const r=L.addStack();r.bottomAlignContent();txt(r,S.big,fam==="large"?48:40,{bold:true});r.addSpacer(3);txt(r,S.sub,14,{bold:true});if(subWeek)txt(L,subWeek,10,{alpha:.85});
  top.addSpacer(10);const R=top.addStack();R.layoutVertically();
  const its=S.items.slice(0,fam==="large"?4:3);if(!its.length)txt(R,"今天沒有急事，陪她聊聊天吧 ❤",12,{alpha:.95,lines:2});
  its.forEach((it,i)=>{if(i)R.addSpacer(4);txt(R,it.ic+" "+it.t,12,{bold:true,lines:1});if(it.s)txt(R,"   "+it.s,10,{alpha:.85,lines:1})});
  if(fam==="large"){w.addSpacer(10);const box=w.addStack();box.layoutVertically();box.backgroundColor=new Color("#FFFFFF",.16);box.cornerRadius=14;box.setPadding(10,12,10,12);
    txt(box,"今日話術",10,{alpha:.85,bold:true});box.addSpacer(2);txt(box,S.line,13,{lines:3});
    if(S.todos.length){w.addSpacer(10);txt(w,"我的待辦",10,{alpha:.85,bold:true});S.todos.forEach(x=>txt(w,"○ "+x.t+(x.due?"（"+x.due.slice(5).replace("-","/")+"）":""),12,{lines:1}))}}
  w.addSpacer();const f=w.addStack();txt(f,"好爸爸",9,{alpha:.7});f.addSpacer();const d=new DateFormatter();d.dateFormat="HH:mm";txt(f,"更新 "+d.string(new Date()),9,{alpha:.7});
  return w}
function errWidget(msg){const w=new ListWidget();bg(w);w.url=APP_URL;txt(w,"好爸爸",14,{bold:true});w.addSpacer(6);txt(w,msg,11,{alpha:.9,lines:4});return w}

// ---------- 主程式 ----------
let widget;
try{const d=await loadData();widget=build(summarize(d,new Date()),config.widgetFamily||"medium")}
catch(e){widget=errWidget(String(e.message||e))}
if(config.runsInWidget)Script.setWidget(widget);
else{await widget.presentMedium();}
Script.complete();
