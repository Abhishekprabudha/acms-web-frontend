import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, Bot, CalendarDays, CheckCircle2, ClipboardCheck, Clock, Database, FileText, Gauge, Menu, Plane, RefreshCcw, Search, Settings, ShieldCheck, Users, Zap } from 'lucide-react';
import { mockData } from './mockData.js';
import { callAcms, getApiUrl, setApiUrl } from './api.js';
import './styles.css';

const nav = [
  { key: 'command', label: 'Command Center', icon: Gauge },
  { key: 'roster', label: 'Roster Editor', icon: CalendarDays },
  { key: 'demand', label: 'Flight Demand', icon: Plane },
  { key: 'crew', label: 'Crew 360', icon: Users },
  { key: 'ops', label: 'Check-in / Absence', icon: ClipboardCheck },
  { key: 'recovery', label: 'Recovery', icon: Zap },
  { key: 'optimizer', label: 'Scenario Lab', icon: Activity },
  { key: 'rules', label: 'Rules', icon: ShieldCheck },
  { key: 'reports', label: 'Analytics', icon: FileText },
  { key: 'backend', label: 'Sheets + Webhook', icon: Database },
  { key: 'copilot', label: 'AI Copilot', icon: Bot },
  { key: 'admin', label: 'Admin', icon: Settings }
];

const screenMeta = {
  command: { id: 'W01', title: 'Operations Command Center', subtitle: 'Planner / OCC / Admin workspace', features: ['Live operational readiness dashboard', 'KPI cards for flights, crewed percentage, exceptions and check-ins', 'Exception drill-down and AI daily brief', 'Connected to CheckIns, Recovery_Cases and Roster_Actual'] },
  roster: { id: 'W02', title: 'Modern Roster Editor', subtitle: 'Monthly multi-window Gantt workspace', features: ['Crew rows, duty tiles and roster state toggle', 'Color-coded duty, standby, training, leave and exceptions', 'Manual edit with rule validation before save', 'Planned, published and actual roster comparison'] },
  demand: { id: 'W03', title: 'Flight Demand Board', subtitle: 'Schedule demand and crew requirement control', features: ['Flight schedule import', 'Aircraft type and crew requirement mapping', 'Schedule deltas and missing demand flags', 'Export to roster build'] },
  crew: { id: 'W06', title: 'Crew Profile & Qualification 360', subtitle: 'Eligibility, documents and roster history', features: ['Eligibility snapshot across rank, base, fleet and route', 'License, medical, training and recency timeline', 'Document links and maker-checker updates', 'Data quality exceptions'] },
  ops: { id: 'W10/W11', title: 'Absence, No-show & Check-in Desk', subtitle: 'Day-of-operation attendance control', features: ['Due/pending/late/no-show tabs', 'Geo/Wi-Fi/device validation result', 'MC attachment review', 'Escalation and recovery trigger'] },
  recovery: { id: 'W13', title: 'Recovery Workbench', subtitle: 'Disruption resolution with ranked replacement options', features: ['Disruption case queue by priority and SLA', 'Ranked legal replacement recommendations', 'Reserve call-up and roster update actions', 'Audit of recommendation and override reason'] },
  optimizer: { id: 'W14', title: 'Optimizer Scenario Lab', subtitle: 'Compare roster alternatives before publishing', features: ['Scenario A/B comparison', 'Cost, overtime, stability and preference grant', 'Equal distribution for standby, free weekends and block hours', 'Fatigue and legality impact preview'] },
  rules: { id: 'W15', title: 'Rule & Legality Console', subtitle: 'Validation, explainability and override controls', features: ['Hard blocks and soft warnings', 'Rule configuration preview', 'Override rights with mandatory reason capture', 'Audit-ready evidence of every rule execution'] },
  reports: { id: 'W22', title: 'Analytics & KPI Dashboard', subtitle: 'Management scorecards and exportable KPIs', features: ['Utilization, roster quality and governance trends', 'Recovery time and leave demand', 'Training expiry and check-in compliance', 'Payroll readiness and KPI snapshots'] },
  backend: { id: 'W25/W26', title: 'Google Sheets + Apps Script Monitor', subtitle: 'Webhook health and backend sheet governance', features: ['Endpoint status, latency and failed calls', 'Google Sheet schema and record count monitoring', 'Retry queue and payload inspection', 'Backup and trigger status'] },
  copilot: { id: 'W29', title: 'AI Copilot & Natural Language Search', subtitle: 'Assistant layer for roster data and suggested actions', features: ['Ask roster questions', 'Summarize exceptions', 'Explain recommendations', 'Draft recovery notifications and daily briefings'] },
  admin: { id: 'W27/W28/W31', title: 'Administration Console', subtitle: 'Rules, RBAC, system settings and support controls', features: ['Rule thresholds and master data', 'User provisioning and access scopes', 'Trigger schedules and backups', 'Maintenance banner and environment flags'] }
};

function toneClass(tone) { return tone === 'risk' ? 'risk' : tone === 'warn' ? 'warn' : tone === 'ok' ? 'ok' : 'info'; }

function Shell() {
  const [active, setActive] = useState('command');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [sync, setSync] = useState('Demo data');

  async function ping() {
    setSync('Checking...');
    const res = await callAcms('ping');
    setSync(res?.ok ? 'All Sync' : 'Demo data');
  }

  useEffect(() => { ping(); }, []);

  function saveUrl() { setApiUrl(apiUrl); ping(); }

  const meta = screenMeta[active];
  const Icon = nav.find(n => n.key === active)?.icon || Gauge;

  return <div className="app">
    <aside className={sidebarOpen ? 'sidebar' : 'sidebar collapsed'}>
      <div className="brand"><div className="brandMark">A</div><div><b>ACMS</b><span>Crew Ops OS</span></div></div>
      <nav>{nav.map(item => { const NIcon = item.icon; return <button key={item.key} className={active === item.key ? 'nav active' : 'nav'} onClick={() => setActive(item.key)}><NIcon size={18}/><span>{item.label}</span></button>})}</nav>
      <div className="backendPill"><span>Live Sheets Backend</span><b>{sync}</b></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="iconBtn" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20}/></button>
        <div className="titleBlock"><div className="screenId"><Icon size={18}/>{meta.id}</div><h1>{meta.title}</h1><p>{meta.subtitle}</p></div>
        <div className="topActions"><button className="ghost" onClick={() => setActive('copilot')}><Bot size={16}/> Ask AI Copilot</button><button className="sync" onClick={ping}>{sync}</button><div className="avatar">AP</div></div>
      </header>
      <FeatureStrip features={meta.features}/>
      <Screen active={active} apiUrl={apiUrl} setApiUrlState={setApiUrlState} saveUrl={saveUrl}/>
    </main>
  </div>;
}

function FeatureStrip({features}) { return <section className="featureStrip">{features.map((f, i) => <div className="feature" key={f}><span>{String(i+1).padStart(2,'0')}</span>{f}</div>)}</section>; }

function Kpis({items = mockData.kpis}) { return <div className="kpis">{items.map(k => <div className={`card kpi ${toneClass(k.tone)}`} key={k.label}><span>{k.label}</span><strong>{k.value}</strong><small>{k.note}</small></div>)}</div>; }

const duties = ['FB','SBY','TRN','OFF','LVE','FB','SBY','TRN','OFF','FB','SBY','FB'];
function Gantt({title='Live Operations Timeline', rows=12}) {
  const days = Array.from({length:14}, (_,i)=>String(i+1).padStart(2,'0'));
  return <div className="card ganttCard"><div className="cardTitle">{title}</div><div className="gantt"><div className="ganttHead"><span></span>{days.map(d=><b key={d}>D{d}</b>)}</div>{Array.from({length:rows},(_,r)=> <div className="ganttRow" key={r}><label>Crew {100+r}</label>{days.map((d,c)=> { const show = (r+c)%4===0 || (r*c)%9===0; const duty=duties[(r+c)%duties.length]; return <span className={show ? `tile ${duty.toLowerCase()}` : 'slot'} key={d}>{show ? duty : ''}{show && (r+c)%11===0 ? <i/>: null}</span>})}</div>)}</div></div>;
}

function Table({title, columns, rows}) { return <div className="card tableCard"><div className="cardTitle">{title}</div><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{columns.map(c=><td key={c}>{row[c] ?? row[c.toLowerCase()] ?? ''}</td>)}</tr>)}</tbody></table></div>; }

function Command() { return <><Kpis/><div className="grid two"><Gantt/><Table title="Priority Exceptions" columns={['type','crew','sla','priority']} rows={mockData.exceptions}/><Table title="Flights Today" columns={['flight','sector','std','aircraft','status']} rows={mockData.flights}/><MiniChart title="Recovery Cycle Time" /></div></>; }

function Roster() { return <><div className="filters"><span>Fleet ATR</span><span>Base KUL</span><span>Rank All</span><span>Exceptions ON</span><span>Published v3</span><button>Validate</button><button>Publish</button></div><Gantt title="Modern Roster Editor · Multi-window Gantt" rows={14}/><div className="grid two"><Table title="Unassigned Trips" columns={['flight','sector','need','status']} rows={mockData.flights}/><Table title="Rotation Details" columns={['crew','rank','status','training']} rows={mockData.crew}/></div></>; }
function Demand() { return <><Kpis items={[{label:'Schedule Rows',value:'4,620',note:'next 90 days',tone:'info'},{label:'Demand Gaps',value:'11',note:'needs crew mapping',tone:'warn'},{label:'Aircraft Swaps',value:'7',note:'today',tone:'risk'},{label:'Import Health',value:'OK',note:'last 9 min',tone:'ok'}]}/><Table title="Flight Demand Packages" columns={['flight','sector','std','sta','aircraft','need','status']} rows={mockData.flights}/></>; }
function Crew() { return <><Kpis items={[{label:'Active Crew',value:'1,284',note:'rank/base/fleet mapped',tone:'info'},{label:'Expiring Docs',value:'42',note:'within 30 days',tone:'warn'},{label:'Qualified Pool',value:'91%',note:'eligible for schedule',tone:'ok'},{label:'Data Gaps',value:'23',note:'maker-checker queue',tone:'risk'}]}/><div className="grid two"><Table title="Crew Master 360" columns={['crewId','name','rank','base','fleet','status']} rows={mockData.crew}/><Gantt title="Qualification & Validity Timeline" rows={8}/></div></>; }
function Ops() { return <><Kpis items={[{label:'Due Check-ins',value:'84',note:'next 4h',tone:'info'},{label:'Late',value:'4',note:'escalated',tone:'warn'},{label:'No-show Risk',value:'2',note:'recovery ready',tone:'risk'},{label:'MC Review',value:'9',note:'pending OCC',tone:'info'}]}/><div className="grid two"><Table title="Check-In Monitor" columns={['crew','flight','status','sla']} rows={[{crew:'CPT-204',flight:'FY3124',status:'Late',sla:'12m'},{crew:'FO-872',flight:'FY4020',status:'Pending',sla:'28m'},{crew:'CC-519',flight:'FY2176',status:'Checked-in',sla:'OK'}]}/><Table title="Absence Desk" columns={['caseId','issue','flight','priority','status']} rows={mockData.recoveryCases}/></div></>; }
function Recovery() { return <><Kpis items={[{label:'Disruptions',value:'8',note:'active cases',tone:'risk'},{label:'Reserve Pool',value:'37',note:'available now',tone:'ok'},{label:'Best Option ETA',value:'14m',note:'legal replacement',tone:'info'},{label:'OTP Protected',value:'5',note:'flights saved',tone:'info'}]}/><div className="grid two"><Table title="Recovery Cases" columns={['caseId','issue','flight','priority','status']} rows={mockData.recoveryCases}/><Table title="Ranked Recommendations" columns={['crew','why','score']} rows={[{crew:'CPT Amir',why:'same base, rest OK',score:96},{crew:'CPT Shafiq',why:'reserve, fleet OK',score:91},{crew:'CPT Nadia',why:'legal but low rest',score:79}]}/></div><Gantt title="Before / After Recovery Timeline" rows={4}/></>; }
function Optimizer() { return <><Kpis items={[{label:'Scenario A Cost',value:'MYR 1.82M',note:'baseline roster',tone:'info'},{label:'Scenario B Cost',value:'MYR 1.75M',note:'4.1% saving',tone:'ok'},{label:'Preference Grant',value:'74%',note:'within stability cap',tone:'info'},{label:'Fatigue Risk',value:'Low',note:'12 warnings',tone:'warn'}]}/><div className="grid two"><Table title="Scenario Comparison" columns={['metric','base','optimized']} rows={[{metric:'Open trips',base:19,optimized:3},{metric:'Overtime hrs',base:420,optimized:278},{metric:'Standby days',base:188,optimized:172},{metric:'Free weekends equity',base:'61%',optimized:'83%'},{metric:'Line checks due',base:14,optimized:4}]}/><MiniChart title="Annual Block Hours Distribution" /></div><Gantt title="Optimization Impact Preview" rows={5}/></>; }
function Rules() { return <><Kpis items={[{label:'Rules Checked',value:'12,482',note:'this roster build',tone:'info'},{label:'Hard Blocks',value:'18',note:'must resolve',tone:'risk'},{label:'Soft Warnings',value:'63',note:'review required',tone:'warn'},{label:'Overrides',value:'7',note:'reason captured',tone:'info'}]}/><div className="grid two"><Table title="Legality Validation Console" columns={['rule','result','action','severity']} rows={mockData.rules}/><Table title="Rule Configuration Preview" columns={['parameter','value','type']} rows={[{parameter:'Min rest',value:'12h',type:'Hard'},{parameter:'Expiry alert',value:'90 days',type:'Soft'},{parameter:'Max consecutive duty',value:'6',type:'Hard'},{parameter:'Check-in window',value:'90m',type:'Soft'}]}/></div></>; }
function Reports() { return <><Kpis items={[{label:'Utilization',value:'76%',note:'fleet weighted',tone:'info'},{label:'Overtime',value:'-12%',note:'vs previous month',tone:'ok'},{label:'Unassigned Trips',value:'3',note:'after optimizer',tone:'warn'},{label:'Payroll Ready',value:'98%',note:'2 exceptions',tone:'ok'}]}/><div className="grid two"><MiniChart title="Crew Utilization by Rank"/><MiniChart title="Standby and Overtime Trend"/></div><Table title="Management KPI Report" columns={['kpi','current','target','status']} rows={[{kpi:'Roster stability',current:'88%',target:'85%',status:'Green'},{kpi:'Preference grant',current:'74%',target:'70%',status:'Green'},{kpi:'Fatigue warnings',current:'12',target:'<20',status:'Green'},{kpi:'Manual overrides',current:'7',target:'<10',status:'Green'}]}/></>; }
function Backend({apiUrl,setApiUrlState,saveUrl}) { return <><Kpis items={[{label:'Webhook Calls',value:'4,821',note:'today',tone:'info'},{label:'Failed Jobs',value:'6',note:'retry queued',tone:'risk'},{label:'Sheets Sync',value:'Live',note:'last 19 sec',tone:'ok'},{label:'Active Users',value:'216',note:'web + mobile',tone:'info'}]}/><div className="card config"><label>Apps Script Web App URL</label><div><input value={apiUrl} onChange={e=>setApiUrlState(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/><button onClick={saveUrl}>Save & Ping</button></div></div><div className="grid two"><Table title="Google Sheets Backend Map" columns={['sheet','records','status']} rows={[{sheet:'Crew_Master',records:'1,284',status:'OK'},{sheet:'Roster_Published',records:'38,402',status:'OK'},{sheet:'CheckIns',records:'912',status:'OK'},{sheet:'Recovery_Cases',records:'208',status:'OK'},{sheet:'Audit_Log',records:'87,112',status:'OK'}]}/><Table title="Apps Script API Monitor" columns={['endpoint','latency','status']} rows={[{endpoint:'/crew/login',latency:'280ms',status:'OK'},{endpoint:'/roster/get',latency:'310ms',status:'OK'},{endpoint:'/checkin/post',latency:'255ms',status:'OK'},{endpoint:'/absence/post',latency:'420ms',status:'OK'},{endpoint:'/notify',latency:'Retry',status:'Warn'}]}/></div></>; }
function Copilot() { const [q,setQ]=useState('Show flights with missing crew and recommend recovery'); const [answer,setAnswer]=useState('Ask a question to search across roster, crew, check-ins and exceptions.'); async function ask(){ const res=await callAcms('aiCopilot',{question:q}); setAnswer(res?.answer || 'Demo answer: 3 flights have crew gaps. Prioritize FY2176 missing CC, FY3124 no-show CPT and FY4020 delay duty risk. Recommended action is to call up reserve CPT Amir, confirm CC standby pool, then republish affected roster version.'); } return <div className="card copilot"><div className="cardTitle">AI Copilot</div><div className="searchbar"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)}/><button onClick={ask}>Ask</button></div><div className="answer">{answer}</div><div className="quickQs">{['Summarize open exceptions','Who has license expiring in 30 days?','Explain recovery option for FY3124','Draft OCC briefing'].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div></div>; }
function Admin() { return <><div className="grid two"><Table title="Rule Configuration" columns={['parameter','value','type']} rows={[{parameter:'Min rest',value:'12h',type:'Hard'},{parameter:'Max FDP',value:'13h',type:'Hard'},{parameter:'Medical expiry alert',value:'90/60/30d',type:'Soft'},{parameter:'Geo check-in',value:'Enabled',type:'Control'}]}/><Table title="Users & RBAC" columns={['role','users','scope']} rows={[{role:'Crew',users:1284,scope:'Self service'},{role:'Planner',users:24,scope:'Roster build'},{role:'OCC',users:18,scope:'Ops control'},{role:'Admin',users:7,scope:'System'}]}/></div><div className="card checklist"><div className="cardTitle">System Health Checklist</div>{['Daily trigger installed','Backup scheduled','Webhook deployment active','Protected ranges enabled','Audit logging enabled'].map(x=><p key={x}><CheckCircle2 size={16}/>{x}</p>)}</div></>; }
function MiniChart({title}) { const bars=[30,62,48,82,68,96,74]; return <div className="card chart"><div className="cardTitle">{title}</div><div className="bars">{bars.map((b,i)=><span key={i} style={{height:b+'%'}}><small>W{i+1}</small></span>)}</div></div>; }

function Screen(props) { const m = { command:<Command/>, roster:<Roster/>, demand:<Demand/>, crew:<Crew/>, ops:<Ops/>, recovery:<Recovery/>, optimizer:<Optimizer/>, rules:<Rules/>, reports:<Reports/>, backend:<Backend {...props}/>, copilot:<Copilot/>, admin:<Admin/> }; return <section className="screen">{m[props.active]}</section>; }

createRoot(document.getElementById('root')).render(<Shell />);
