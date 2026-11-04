// 產生 cal/<出生日>.ics：iPhone 主畫面 App 無法開啟自己產生的 .ics，要由網站提供檔案。
// 用法：node tools/gen-cal.js [起日 迄日]
const fs=require('fs');const h=fs.readFileSync('index.html','utf8');
const pick=(a,b)=>{const i=h.indexOf(a),j=h.indexOf(b,i);if(i<0||j<0)throw new Error(a);return h.slice(i,j)};
const code=pick('const RS={','const RD_C=')+pick('const VAC=[','function addMonths');
const {ROAD_ITEMS,VAC,CHK}=new Function(code+';return {ROAD_ITEMS,VAC,CHK}')();
const iso=d=>d.toISOString().slice(0,10);const P=s=>new Date(s+'T00:00:00Z');
const addD=(s,n)=>iso(new Date(P(s).getTime()+n*864e5));
const addM=(s,m)=>{const d=P(s),day=d.getUTCDate();d.setUTCMonth(d.getUTCMonth()+m);if(d.getUTCDate()<day)d.setUTCDate(0);return iso(d)};
const due=(b,l)=>l.m?addD(addM(b,l.m),-1):addD(b,l.d);
const esc=t=>String(t).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
function fold(line){const out=[];let cur='',n=0;for(const ch of line){const b=Buffer.byteLength(ch);if(n+b>73){out.push(cur);cur=' ';n=1}cur+=ch;n+=b}out.push(cur);return out.join('\r\n')}
const stamp='20261104T000000Z';
function ev(b,id,date,title,desc,alarms){const e=addD(date,1).replace(/-/g,'');const L=['BEGIN:VEVENT','UID:'+id+'-'+b+'@good-dad','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+date.replace(/-/g,''),'DTEND;VALUE=DATE:'+e,'SUMMARY:'+esc(title),'DESCRIPTION:'+esc(desc)];
 for(const t of alarms)L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(title),'TRIGGER:'+t,'END:VALARM');L.push('END:VEVENT');return L.map(fold).join('\r\n')}
const DUE=['-P13DT15H','-P2DT15H'],SOON=['-PT15H'];
function build(b){const E=[];const add=(...a)=>{E.push({date:a[1],s:ev(b,...a)})};
 add('plan',addD(b,6),'這週跑戶政一次辦完','報戶口、健保加保、媽媽生育給付、縣市生育補助，順便問鄉鎮市區公所有沒有加碼。詳細步驟看好爸爸 App。',SOON);
 for(const x of ROAD_ITEMS){if(!x.dl||(x.only&&x.only.city))continue;add(x.id,due(b,x.dl),'截止：'+x.t,(x.why||'')+'\n詳細步驟看好爸爸 App 路線圖。',DUE)}
 add('city',addD(b,29),'確認縣市生育補助期限','各縣市期限不同，最短約 1 個月。到好爸爸 App 的路線圖選戶籍地，看你縣市的金額和期限。',SOON);
 add('rota',addD(b,42),'滿 6 週：輪狀病毒疫苗可以開始打','有週數限制，打之前先問小兒科和最新公費規定。',SOON);
 VAC.forEach(([m,l,items],i)=>{if(m)add('vac'+i,addM(b,m),'疫苗：'+items.join('、'),l+'。實際日期以兒童健康手冊和醫師安排為準。',SOON)});
 CHK.forEach(([a,,l],i)=>{if(a)add('chk'+i,addM(b,a),'兒童健檢第 '+(i+1)+' 次可以做了','時段：'+l+'。帶兒童健康手冊和健保卡。',SOON)});
 add('allow2',addM(b,22),'準備換軌：滿 2 歲後改申請教育部育兒津貼','衛福部津貼只到未滿 2 歲，2 歲起要另外申請。',SOON);
 E.sort((a,c)=>a.date<c.date?-1:1);
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//good-dad//road//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:好爸爸',...E.map(x=>x.s),'END:VCALENDAR'].join('\r\n')+'\r\n'}
const [from='2026-11-05',to='2027-01-31']=process.argv.slice(2);fs.mkdirSync('cal',{recursive:true});let n=0;
for(let d=from;d<=to;d=addD(d,1)){fs.writeFileSync('cal/'+d+'.ics',build(d));n++}
const test=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//good-dad//road//ZH','METHOD:PUBLISH',ev('test','test','2026-11-08','好爸爸行事曆測試（看完可刪除）','看到這則就代表一鍵加入可以用。',['-PT15H']),'END:VCALENDAR'].join('\r\n')+'\r\n';fs.writeFileSync('cal/test.ics',test);
console.log('files',n,'events',(build('2026-12-17').match(/BEGIN:VEVENT/g)||[]).length);
