import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BookOpen, Bot, CalendarDays, CheckCircle2, ClipboardCheck, Database, Download, FileText, Gauge, Menu, Plane, Search, Settings, ShieldCheck, Users, Zap } from 'lucide-react';
import { getOpsRange, mockData } from './mockData.js';
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
  { key: 'admin', label: 'Admin', icon: Settings },
  { key: 'glossary', label: 'Glossary', icon: BookOpen }
];

const screenMeta = {
  command: { id: 'W01', title: 'Operations Command Center', subtitle: 'Planner / OCC / Admin workspace', features: ['Live operational readiness dashboard', 'KPI cards for flights, crewed percentage, exceptions and check-ins', 'Exception drill-down and AI daily brief', 'Connected to CheckIns, Recovery_Cases and Roster_Actual'] },
  flightsDetail: { id: 'W01-A', title: 'Flights Today Detail', subtitle: 'Date-filtered flight coverage, crew demand and status export', features: ['Flight-by-flight demand coverage', 'Crewing status and gate readiness', 'CSV download for selected date range', 'Designed for OCC flight dispatch reviews'] },
  exceptionsDetail: { id: 'W01-B', title: 'Open Exceptions Detail', subtitle: 'Operational exception queue for selected June dates', features: ['Priority, SLA and owner triage', 'Flight and crew-linked exceptions', 'Downloadable exception register', 'Recovery handoff ready'] },
  checkinsDetail: { id: 'W01-C', title: 'Late Check-ins Detail', subtitle: 'Crew attendance and evidence monitoring by day or range', features: ['Late, pending and checked-in evidence', 'Crew report versus actual timing', 'CSV export for attendance audit', 'Ops escalation focused'] },
  stabilityDetail: { id: 'W01-D', title: 'Roster Stability Detail', subtitle: 'Roster change health and stability drivers across June', features: ['Daily stability movement', 'Change pressure and exception mix', 'Downloadable stability dataset', 'Planner-ready roster quality insights'] },
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
  admin: { id: 'W27/W28/W31', title: 'Administration Console', subtitle: 'Rules, RBAC, system settings and support controls', features: ['Rule thresholds and master data', 'User provisioning and access scopes', 'Trigger schedules and backups', 'Maintenance banner and environment flags'] },
  glossary: { id: 'W32', title: 'ACMS Glossary & Acronym Copilot', subtitle: 'Complete acronym dictionary with searchable AI assistance', features: ['Every ACMS acronym expanded with operational meaning', 'Category filters across crew, flight, compliance, systems and analytics', 'AI copilot answers questions using the glossary context', 'Quick reference for planners, OCC, admins and crew users'] }
};


const glossaryTerms = [
  { acronym: 'ACMS', term: 'Airline Crew Management System', category: 'System', detail: 'End-to-end crew operations platform covering roster planning, crew records, check-in, absence, recovery, legality rules, analytics, integrations and administration.' },
  { acronym: 'Admin', term: 'Administrator', category: 'Security', detail: 'Privileged user or console area used to configure rules, master data, users, RBAC, backups, triggers and system settings.' },
  { acronym: 'AI', term: 'Artificial Intelligence', category: 'System', detail: 'Assistant capability used to search operational data, explain acronyms, summarize exceptions and recommend recovery actions.' },
  { acronym: 'API', term: 'Application Programming Interface', category: 'System', detail: 'Secure endpoint used by the frontend, Google Apps Script backend and integrations to exchange ACMS data.' },
  { acronym: 'Apps Script', term: 'Google Apps Script', category: 'System', detail: 'Google automation runtime used to expose Sheets-backed web app endpoints, triggers and backend jobs.' },
  { acronym: 'ATR', term: 'Avions de Transport Régional', category: 'Fleet', detail: 'Regional turboprop aircraft family used for fleet qualification and demand planning.' },
  { acronym: 'ATR72', term: 'ATR 72', category: 'Fleet', detail: 'Specific ATR regional aircraft type referenced in demo flight demand and crew requirement records.' },
  { acronym: 'Audit Log', term: 'Audit Log', category: 'Governance', detail: 'Chronological evidence trail for changes, validations, overrides, webhook calls and support actions.' },
  { acronym: 'B737', term: 'Boeing 737', category: 'Fleet', detail: 'Narrow-body jet fleet type requiring specific pilot and cabin crew qualifications.' },
  { acronym: 'Base', term: 'Crew Base', category: 'Airport/Base', detail: 'Crew home station used for assignment, reserve coverage, proximity checks and roster planning.' },
  { acronym: 'BKI', term: 'Kota Kinabalu International Airport', category: 'Airport/Base', detail: 'Airport or base code used for sectors, crew base data and recovery proximity checks.' },
  { acronym: 'CC', term: 'Cabin Crew', category: 'Crew', detail: 'Cabin crew rank responsible for passenger cabin safety, service and aircraft-specific cabin duties.' },
  { acronym: 'Check-in', term: 'Crew Check-in', category: 'Operations', detail: 'Day-of-operation attendance confirmation before report or departure, validated by time, location, device or network controls.' },
  { acronym: 'CPT', term: 'Captain', category: 'Crew', detail: 'Pilot in command and required flight deck rank in crew demand packages.' },
  { acronym: 'CRM', term: 'Crew Resource Management', category: 'Training', detail: 'Human factors, communication and teamwork training tracked as part of crew qualification validity.' },
  { acronym: 'Crew 360', term: 'Crew Profile 360', category: 'Crew', detail: 'Full crew profile view combining rank, base, fleet, status, documents, qualification, training and roster history.' },
  { acronym: 'Crew_Master', term: 'Crew Master Sheet', category: 'Backend', detail: 'Backend master data sheet containing crew identifiers, names, ranks, bases, fleets and status information.' },
  { acronym: 'Demand Gap', term: 'Demand Gap', category: 'Planning', detail: 'Flight demand item that lacks required crew mapping, aircraft data or assignment coverage.' },
  { acronym: 'Device Validation', term: 'Device Validation', category: 'Operations', detail: 'Check-in evidence confirming the crew member used an expected or trusted device.' },
  { acronym: 'ETA', term: 'Estimated Time of Arrival', category: 'Flight', detail: 'Projected arrival time used for recovery planning, disruption communication and duty impact assessment.' },
  { acronym: 'Exceptions ON', term: 'Exceptions Enabled', category: 'Planning', detail: 'Roster editor filter or mode showing conflicts, missing crew, legality warnings and operational exceptions.' },
  { acronym: 'FB', term: 'Flight Block', category: 'Roster', detail: 'Roster duty code for an assigned flying block or flight duty sequence; shown as green duty tiles in the roster timeline.' },
  { acronym: 'FDP', term: 'Flight Duty Period', category: 'Compliance', detail: 'Regulated duty window from report time through post-flight duties, checked by legality rules.' },
  { acronym: 'FO', term: 'First Officer', category: 'Crew', detail: 'Second pilot role paired with the captain for flight deck coverage.' },
  { acronym: 'FY', term: 'Firefly Flight Designator', category: 'Flight', detail: 'Flight number prefix used in demo records such as FY3124, FY2176, FY4020 and FY1108.' },
  { acronym: 'Gantt', term: 'Gantt Timeline', category: 'Planning', detail: 'Timeline view displaying crew duties, standby, training, leave, off days and conflicts across calendar days.' },
  { acronym: 'Geo', term: 'Geolocation Validation', category: 'Operations', detail: 'Check-in control validating that a crew member is at an approved reporting location.' },
  { acronym: 'GitHub Pages', term: 'GitHub Pages', category: 'System', detail: 'Static hosting target for deploying the Vite frontend through GitHub Actions.' },
  { acronym: 'Hard Block', term: 'Hard Block', category: 'Compliance', detail: 'Legality rule failure that must be resolved or formally overridden before roster publication.' },
  { acronym: 'JHB', term: 'Johor Bahru Airport', category: 'Airport/Base', detail: 'Airport or sector code used in flight demand, route qualification and recovery context.' },
  { acronym: 'JSON', term: 'JavaScript Object Notation', category: 'System', detail: 'Structured payload format used in Apps Script-compatible text/plain API requests and responses.' },
  { acronym: 'KPI', term: 'Key Performance Indicator', category: 'Analytics', detail: 'Management metric such as roster stability, utilization, recovery time, OTP, payroll readiness or check-in compliance.' },
  { acronym: 'KUL', term: 'Kuala Lumpur International Airport', category: 'Airport/Base', detail: 'Major airport/base code used in crew base, route and sector assignments.' },
  { acronym: 'Legality', term: 'Legality Validation', category: 'Compliance', detail: 'Rule checking process that evaluates rest, FDP, consecutive duty, qualification and expiry constraints.' },
  { acronym: 'LGK', term: 'Langkawi International Airport', category: 'Airport/Base', detail: 'Airport or sector code used in schedule, demand and route records.' },
  { acronym: 'Line Check', term: 'Line Check', category: 'Training', detail: 'Operational proficiency check tracked in qualification timelines and optimizer scenarios.' },
  { acronym: 'LVE', term: 'Leave', category: 'Roster', detail: 'Roster code for approved absence such as annual, medical, special or other authorized leave.' },
  { acronym: 'Maker-checker', term: 'Maker-checker Review', category: 'Governance', detail: 'Two-step control where one user submits a data change and another reviews or approves it.' },
  { acronym: 'Max FDP', term: 'Maximum Flight Duty Period', category: 'Compliance', detail: 'Configured upper limit for flight duty period duration, treated as a hard legality rule.' },
  { acronym: 'MC', term: 'Medical Certificate', category: 'Operations', detail: 'Evidence attached to sickness or absence cases and reviewed by operations controllers.' },
  { acronym: 'Min Rest', term: 'Minimum Rest', category: 'Compliance', detail: 'Required rest duration between duties, configured as a hard legality rule in the rules console.' },
  { acronym: 'MYR', term: 'Malaysian Ringgit', category: 'Analytics', detail: 'Currency used for scenario cost comparison and savings estimates.' },
  { acronym: 'No-show', term: 'Crew No-show', category: 'Operations', detail: 'Crew member did not report or check in as required, typically triggering escalation and recovery.' },
  { acronym: 'OCC', term: 'Operations Control Center', category: 'Operations', detail: 'Day-of-operation control team responsible for disruptions, escalations, recovery actions and operational briefings.' },
  { acronym: 'OFF', term: 'Off Duty', category: 'Roster', detail: 'Roster code for protected non-working time.' },
  { acronym: 'Open Trip', term: 'Open Trip', category: 'Planning', detail: 'Flight or duty pairing without sufficient assigned qualified crew.' },
  { acronym: 'OTP', term: 'On-Time Performance', category: 'Analytics', detail: 'Measure of flights operating to schedule, protected through early exception handling and crew recovery.' },
  { acronym: 'Overtime', term: 'Overtime Hours', category: 'Analytics', detail: 'Crew work above planned or contractual thresholds, tracked in scenario and management reporting.' },
  { acronym: 'PEN', term: 'Penang International Airport', category: 'Airport/Base', detail: 'Airport or base code used in crew base, sector and flight data.' },
  { acronym: 'Planner', term: 'Crew Planner', category: 'Crew', detail: 'User role responsible for roster building, validation, publication and demand coverage.' },
  { acronym: 'POST', term: 'HTTP POST Request', category: 'System', detail: 'API request method used to send action payloads to the Apps Script web app.' },
  { acronym: 'Preference Grant', term: 'Preference Grant Rate', category: 'Analytics', detail: 'Percentage of crew preferences satisfied within roster stability and legality constraints.' },
  { acronym: 'Published v3', term: 'Published Roster Version 3', category: 'Planning', detail: 'Example published roster state/version used in the roster editor filter strip.' },
  { acronym: 'RBAC', term: 'Role-Based Access Control', category: 'Security', detail: 'Permission model that limits users to approved capabilities based on role and operational scope.' },
  { acronym: 'RC', term: 'Recovery Case', category: 'Recovery', detail: 'Case identifier for disruptions requiring replacement crew, replanning, communication or escalation.' },
  { acronym: 'Reserve Pool', term: 'Reserve Pool', category: 'Recovery', detail: 'Available standby or reserve crew who can be called up for short-notice coverage.' },
  { acronym: 'Rest OK', term: 'Rest Compliant', category: 'Compliance', detail: 'Indicates a proposed crew replacement satisfies minimum rest requirements.' },
  { acronym: 'Roster_Actual', term: 'Actual Roster Sheet', category: 'Backend', detail: 'Backend sheet or dataset containing operated roster outcomes after day-of-operation changes.' },
  { acronym: 'Roster_Published', term: 'Published Roster Sheet', category: 'Backend', detail: 'Backend sheet containing the currently published roster used by operations.' },
  { acronym: 'Route Qualification', term: 'Route Qualification', category: 'Compliance', detail: 'Eligibility requirement that crew are qualified or approved for a route, sector or airport.' },
  { acronym: 'SBY', term: 'Standby', category: 'Roster', detail: 'Roster code for crew held available for short-notice operational coverage.' },
  { acronym: 'Scenario A/B', term: 'Scenario A/B Comparison', category: 'Planning', detail: 'Optimizer comparison of baseline and alternative rosters across cost, overtime, stability, preferences and risk.' },
  { acronym: 'Sector', term: 'Flight Sector', category: 'Flight', detail: 'Origin-destination leg such as KUL-PEN or SZB-BKI used in demand and route qualification.' },
  { acronym: 'SEP', term: 'Safety and Emergency Procedures', category: 'Training', detail: 'Recurring safety training requirement tracked for crew qualification validity.' },
  { acronym: 'SLA', term: 'Service Level Agreement', category: 'Operations', detail: 'Target handling time for exceptions such as late check-ins, no-shows, recovery cases and support queues.' },
  { acronym: 'Soft Warning', term: 'Soft Warning', category: 'Compliance', detail: 'Rule alert requiring review but not always blocking publication when justified.' },
  { acronym: 'STA', term: 'Scheduled Time of Arrival', category: 'Flight', detail: 'Published arrival time used in schedule, duty and disruption calculations.' },
  { acronym: 'STD', term: 'Scheduled Time of Departure', category: 'Flight', detail: 'Published departure time used to derive check-in deadlines, duty timelines and flight demand.' },
  { acronym: 'SZB', term: 'Sultan Abdul Aziz Shah Airport', category: 'Airport/Base', detail: 'Airport or sector code used in flight demand and route context.' },
  { acronym: 'TRN', term: 'Training', category: 'Roster', detail: 'Roster code for required training duty, simulator event, recurrent course or line check.' },
  { acronym: 'Trigger', term: 'Scheduled Trigger', category: 'Backend', detail: 'Automated Apps Script job used for sync, backup, retry, alerting or maintenance tasks.' },
  { acronym: 'Unassigned Trip', term: 'Unassigned Trip', category: 'Planning', detail: 'Scheduled duty or flight with missing crew assignment after roster build or recovery.' },
  { acronym: 'URL', term: 'Uniform Resource Locator', category: 'System', detail: 'Web address for the Apps Script /exec endpoint or local Vite development server.' },
  { acronym: 'Utilization', term: 'Crew Utilization', category: 'Analytics', detail: 'Measure of planned or actual crew usage by rank, fleet, base or period.' },
  { acronym: 'Vite', term: 'Vite Frontend Tooling', category: 'System', detail: 'Development and build tool used to run and bundle the React web application.' },
  { acronym: 'Webhook', term: 'Webhook Endpoint', category: 'Backend', detail: 'HTTP endpoint receiving ACMS actions such as roster retrieval, check-in posting, absence updates and notifications.' },
  { acronym: 'Wi-Fi', term: 'Wireless Network Validation', category: 'Operations', detail: 'Optional check-in evidence confirming an approved reporting-point network was used.' },
  { acronym: 'W01-W32', term: 'Screen Identifier Range', category: 'System', detail: 'Blueprint screen IDs used to label ACMS modules from command center through glossary.' }
];

function glossaryAnswer(question) {
  const text = question.trim().toLowerCase();
  if (!text) return 'Ask about any acronym, category or crew operations phrase in the glossary.';
  const matches = glossaryTerms.filter(item => [item.acronym, item.term, item.category, item.detail].join(' ').toLowerCase().includes(text));
  if (matches.length) {
    return matches.slice(0, 4).map(item => `${item.acronym} means ${item.term}. ${item.detail}`).join('\n\n');
  }
  const tokens = text.split(/\W+/).filter(Boolean);
  const fuzzy = glossaryTerms.filter(item => tokens.some(token => [item.acronym, item.term, item.category, item.detail].join(' ').toLowerCase().includes(token)));
  if (fuzzy.length) return `I found related glossary entries:\n\n${fuzzy.slice(0, 4).map(item => `• ${item.acronym} — ${item.term}: ${item.detail}`).join('\n')}`;
  return 'I could not find a direct glossary match. Try an acronym such as FB, FDP, RBAC, OCC, SBY, MC, STD or KPI.';
}

function toneClass(tone) { return tone === 'risk' ? 'risk' : tone === 'warn' ? 'warn' : tone === 'ok' ? 'ok' : 'info'; }

function Shell() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('acms-authenticated') === 'true');
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
  function handleLogin() { sessionStorage.setItem('acms-authenticated', 'true'); setIsAuthenticated(true); }
  function handleLogout() { sessionStorage.removeItem('acms-authenticated'); setIsAuthenticated(false); setActive('command'); }

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin}/>;

  const meta = screenMeta[active] || screenMeta.command;
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
        <div className="topActions"><button className="ghost" onClick={() => setActive('copilot')}><Bot size={16}/> Ask AI Copilot</button><button className="sync" onClick={ping}>{sync}</button><button className="ghost logoutBtn" onClick={handleLogout}>Sign out</button><div className="avatar">AI</div></div>
      </header>
      <FeatureStrip features={meta.features}/>
      <Screen active={active} setActive={setActive} apiUrl={apiUrl} setApiUrlState={setApiUrlState} saveUrl={saveUrl}/>
    </main>
  </div>;
}


function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submitLogin(event) {
    event.preventDefault();
    if (userId.trim().toUpperCase() === 'AIONOS' && password === 'AIONOS123') {
      setError('');
      onLogin();
      return;
    }
    setError('Invalid credentials. Use your assigned AIONOS access ID and password.');
  }

  return <main className="loginPage">
    <section className="loginHero" aria-label="ACMS secure login">
      <div className="loginVisual">
        <div className="brand loginBrand"><div className="brandMark">A</div><div><b>ACMS</b><span>AIONOS Crew Ops OS</span></div></div>
        <div className="radarCard">
          <div className="radarOrbit"><span/><span/><span/></div>
          <div><strong>Live crew command</strong><small>Roster, legality, recovery and OCC intelligence unified after sign-in.</small></div>
        </div>
        <div className="loginStats">
          <span><b>98%</b> payroll ready</span><span><b>216</b> active users</span><span><b>4.8k</b> webhook calls</span>
        </div>
      </div>
      <form className="loginCard" onSubmit={submitLogin}>
        <span className="securePill"><ShieldCheck size={16}/> Secure AIONOS Gateway</span>
        <h1>Welcome to ACMS</h1>
        <p>Sign in to enter the Airline Crew Management System command center.</p>
        <label>User ID<input value={userId} onChange={e => setUserId(e.target.value)} placeholder="AIONOS" autoComplete="username" autoFocus/></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="AIONOS123" autoComplete="current-password"/></label>
        {error ? <div className="loginError" role="alert">{error}</div> : <div className="loginHint">Demo access: User ID <b>AIONOS</b> · Password <b>AIONOS123</b></div>}
        <button className="loginButton" type="submit">Enter ACMS Command Center</button>
      </form>
    </section>
  </main>;
}

function FeatureStrip({features}) { return <section className="featureStrip">{features.map((f, i) => <div className="feature" key={f}><span>{String(i+1).padStart(2,'0')}</span>{f}</div>)}</section>; }

function Kpis({items = mockData.kpis, onSelect}) { return <div className="kpis">{items.map(k => <button className={`card kpi ${toneClass(k.tone)} ${onSelect ? 'clickable' : ''}`} key={k.label} onClick={() => onSelect?.(k)}><span>{k.label}</span><strong>{k.value}</strong><small>{k.note}</small></button>)}</div>; }

const duties = ['FB','SBY','TRN','OFF','LVE','FB','SBY','TRN','OFF','FB','SBY','FB'];
function Gantt({title='Live Operations Timeline', rows=12}) {
  const days = Array.from({length:14}, (_,i)=>String(i+1).padStart(2,'0'));
  return <div className="card ganttCard"><div className="cardTitle">{title}</div><div className="gantt"><div className="ganttHead"><span></span>{days.map(d=><b key={d}>D{d}</b>)}</div>{Array.from({length:rows},(_,r)=> <div className="ganttRow" key={r}><label>Crew {100+r}</label>{days.map((d,c)=> { const show = (r+c)%4===0 || (r*c)%9===0; const duty=duties[(r+c)%duties.length]; return <span className={show ? `tile ${duty.toLowerCase()}` : 'slot'} key={d}>{show ? duty : ''}{show && (r+c)%11===0 ? <i/>: null}</span>})}</div>)}</div></div>;
}

function Table({title, columns, rows, actions}) { return <div className="card tableCard"><div className="cardHeader"><div className="cardTitle">{title}</div>{actions}</div><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{columns.map(c=><td key={c}>{row[c] ?? row[c.toLowerCase()] ?? ''}</td>)}</tr>)}</tbody></table></div>; }

function DateRangePicker({ startDate, endDate, setStartDate, setEndDate }) {
  return <div className="datePanel card"><div><b>June operations calendar</b><span>Select one day or a group of days. Demo backend data is populated for every date in June 2026.</span></div><label>From<input type="date" min="2026-06-01" max="2026-06-30" value={startDate} onChange={e => setStartDate(e.target.value)}/></label><label>To<input type="date" min="2026-06-01" max="2026-06-30" value={endDate} onChange={e => setEndDate(e.target.value)}/></label></div>;
}
function exportCsv(filename, rows) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const csv = [columns.join(','), ...rows.map(row => columns.map(col => `"${String(row[col] ?? '').replaceAll('"','""')}"`).join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
function Command({ setActive }) { const [startDate,setStartDate]=useState('2026-06-01'); const [endDate,setEndDate]=useState('2026-06-30'); const range=getOpsRange(startDate,endDate); const items=[{label:'Flights Today',value:range.flights.length,note:`${range.days.length} June day(s) selected`,tone:'ok',screen:'flightsDetail'},{label:'Open Exceptions',value:range.exceptions.filter(x=>x.priority!=='Low').length,note:'high / medium triage',tone:'risk',screen:'exceptionsDetail'},{label:'Late Check-ins',value:range.checkins.filter(x=>x.status==='Late').length,note:'auto-escalated',tone:'warn',screen:'checkinsDetail'},{label:'Roster Stability',value:`${range.avgStability}%`,note:'average selected range',tone:'info',screen:'stabilityDetail'}]; return <><DateRangePicker startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate}/><Kpis items={items} onSelect={k=>setActive(k.screen)}/><div className="grid two"><Gantt/><Table title="Priority Exceptions" columns={['date','type','crew','flight','sla','priority']} rows={range.exceptions.slice(0,10)}/><Table title="Flights in Selected Range" columns={['date','flight','sector','std','aircraft','status']} rows={range.flights.slice(0,10)}/><MiniChart title="Recovery Cycle Time" /></div></>; }
function DetailScreen({ type }) { const [startDate,setStartDate]=useState('2026-06-01'); const [endDate,setEndDate]=useState('2026-06-30'); const range=getOpsRange(startDate,endDate); const configs={flightsDetail:{title:'Downloadable Flight Operations Register',cols:['date','flight','sector','std','sta','aircraft','need','status','gate','crewedPercent'],rows:range.flights,kpis:[{label:'Selected Flights',value:range.flights.length,note:'scheduled sectors',tone:'ok'},{label:'Open Trips',value:range.flights.filter(x=>x.status==='Open trip').length,note:'needs action',tone:'risk'},{label:'Delay Risks',value:range.flights.filter(x=>x.status==='Delay risk').length,note:'watchlist',tone:'warn'},{label:'Crewed Avg',value:'94%',note:'range estimate',tone:'info'}]},exceptionsDetail:{title:'Downloadable Exception Register',cols:['date','type','crew','flight','sla','priority','owner'],rows:range.exceptions,kpis:[{label:'All Exceptions',value:range.exceptions.length,note:'selected range',tone:'risk'},{label:'High Priority',value:range.exceptions.filter(x=>x.priority==='High').length,note:'OCC focus',tone:'risk'},{label:'Medium',value:range.exceptions.filter(x=>x.priority==='Med').length,note:'planner queue',tone:'warn'},{label:'SLA Owners',value:'4',note:'active desks',tone:'info'}]},checkinsDetail:{title:'Downloadable Check-in Audit',cols:['date','crew','flight','report','actual','status','evidence'],rows:range.checkins,kpis:[{label:'Check-ins',value:range.checkins.length,note:'selected range',tone:'info'},{label:'Late',value:range.checkins.filter(x=>x.status==='Late').length,note:'escalated',tone:'warn'},{label:'Pending',value:range.checkins.filter(x=>x.status==='Pending').length,note:'monitor',tone:'risk'},{label:'Evidence OK',value:range.checkins.filter(x=>x.evidence.includes('OK')).length,note:'validated',tone:'ok'}]},stabilityDetail:{title:'Downloadable Roster Stability Dataset',cols:['date','flightCount','exceptionCount','lateCheckIns','stability'],rows:range.days,kpis:[{label:'Average Stability',value:`${range.avgStability}%`,note:'selected range',tone:'info'},{label:'Best Day',value:`${Math.max(...range.days.map(x=>x.stability))}%`,note:'June peak',tone:'ok'},{label:'Change Load',value:range.exceptions.length,note:'exception pressure',tone:'warn'},{label:'Late Impact',value:range.checkins.filter(x=>x.status==='Late').length,note:'attendance pressure',tone:'risk'}]}}; const cfg=configs[type]; return <><DateRangePicker startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate}/><Kpis items={cfg.kpis}/><div className="grid two"><Table title={cfg.title} columns={cfg.cols} rows={cfg.rows} actions={<button className="downloadBtn" onClick={()=>exportCsv(`${type}-${startDate}-to-${endDate}.csv`, cfg.rows)}><Download size={15}/> Download CSV</button>}/><MiniChart title="Selected Range Trend" /></div></>; }

function Roster() { return <><div className="filters"><span>Fleet ATR</span><span>Base KUL</span><span>Rank All</span><span>Exceptions ON</span><span>Published v3</span><button>Validate</button><button>Publish</button></div><Gantt title="Modern Roster Editor · Multi-window Gantt" rows={14}/><div className="grid two"><Table title="Unassigned Trips" columns={['flight','sector','need','status']} rows={mockData.flights}/><Table title="Rotation Details" columns={['crew','rank','status','training']} rows={mockData.crew}/></div></>; }
function Demand() { return <><Kpis items={[{label:'Schedule Rows',value:'4,620',note:'next 90 days',tone:'info'},{label:'Demand Gaps',value:'11',note:'needs crew mapping',tone:'warn'},{label:'Aircraft Swaps',value:'7',note:'today',tone:'risk'},{label:'Import Health',value:'OK',note:'last 9 min',tone:'ok'}]}/><Table title="Flight Demand Packages" columns={['flight','sector','std','sta','aircraft','need','status']} rows={mockData.flights}/></>; }
function Crew() { return <><Kpis items={[{label:'Active Crew',value:'1,284',note:'rank/base/fleet mapped',tone:'info'},{label:'Expiring Docs',value:'42',note:'within 30 days',tone:'warn'},{label:'Qualified Pool',value:'91%',note:'eligible for schedule',tone:'ok'},{label:'Data Gaps',value:'23',note:'maker-checker queue',tone:'risk'}]}/><div className="grid two"><Table title="Crew Master 360" columns={['crewId','name','rank','base','fleet','status']} rows={mockData.crew}/><Gantt title="Qualification & Validity Timeline" rows={8}/></div></>; }
function Ops() { return <><Kpis items={[{label:'Due Check-ins',value:'84',note:'next 4h',tone:'info'},{label:'Late',value:'4',note:'escalated',tone:'warn'},{label:'No-show Risk',value:'2',note:'recovery ready',tone:'risk'},{label:'MC Review',value:'9',note:'pending OCC',tone:'info'}]}/><div className="grid two"><Table title="Check-In Monitor" columns={['crew','flight','status','sla']} rows={[{crew:'CPT-204',flight:'FY3124',status:'Late',sla:'12m'},{crew:'FO-872',flight:'FY4020',status:'Pending',sla:'28m'},{crew:'CC-519',flight:'FY2176',status:'Checked-in',sla:'OK'}]}/><Table title="Absence Desk" columns={['caseId','issue','flight','priority','status']} rows={mockData.recoveryCases}/></div></>; }
function Recovery() { return <><Kpis items={[{label:'Disruptions',value:'8',note:'active cases',tone:'risk'},{label:'Reserve Pool',value:'37',note:'available now',tone:'ok'},{label:'Best Option ETA',value:'14m',note:'legal replacement',tone:'info'},{label:'OTP Protected',value:'5',note:'flights saved',tone:'info'}]}/><div className="grid two"><Table title="Recovery Cases" columns={['caseId','issue','flight','priority','status']} rows={mockData.recoveryCases}/><Table title="Ranked Recommendations" columns={['crew','why','score']} rows={[{crew:'CPT Amir',why:'same base, rest OK',score:96},{crew:'CPT Shafiq',why:'reserve, fleet OK',score:91},{crew:'CPT Nadia',why:'legal but low rest',score:79}]}/></div><Gantt title="Before / After Recovery Timeline" rows={4}/></>; }
function Optimizer() { return <><Kpis items={[{label:'Scenario A Cost',value:'MYR 1.82M',note:'baseline roster',tone:'info'},{label:'Scenario B Cost',value:'MYR 1.75M',note:'4.1% saving',tone:'ok'},{label:'Preference Grant',value:'74%',note:'within stability cap',tone:'info'},{label:'Fatigue Risk',value:'Low',note:'12 warnings',tone:'warn'}]}/><div className="grid two"><Table title="Scenario Comparison" columns={['metric','base','optimized']} rows={[{metric:'Open trips',base:19,optimized:3},{metric:'Overtime hrs',base:420,optimized:278},{metric:'Standby days',base:188,optimized:172},{metric:'Free weekends equity',base:'61%',optimized:'83%'},{metric:'Line checks due',base:14,optimized:4}]}/><MiniChart title="Annual Block Hours Distribution" /></div><Gantt title="Optimization Impact Preview" rows={5}/></>; }
function Rules() { return <><Kpis items={[{label:'Rules Checked',value:'12,482',note:'this roster build',tone:'info'},{label:'Hard Blocks',value:'18',note:'must resolve',tone:'risk'},{label:'Soft Warnings',value:'63',note:'review required',tone:'warn'},{label:'Overrides',value:'7',note:'reason captured',tone:'info'}]}/><div className="grid two"><Table title="Legality Validation Console" columns={['rule','result','action','severity']} rows={mockData.rules}/><Table title="Rule Configuration Preview" columns={['parameter','value','type']} rows={[{parameter:'Min rest',value:'12h',type:'Hard'},{parameter:'Expiry alert',value:'90 days',type:'Soft'},{parameter:'Max consecutive duty',value:'6',type:'Hard'},{parameter:'Check-in window',value:'90m',type:'Soft'}]}/></div></>; }
function Reports() { return <><Kpis items={[{label:'Utilization',value:'76%',note:'fleet weighted',tone:'info'},{label:'Overtime',value:'-12%',note:'vs previous month',tone:'ok'},{label:'Unassigned Trips',value:'3',note:'after optimizer',tone:'warn'},{label:'Payroll Ready',value:'98%',note:'2 exceptions',tone:'ok'}]}/><div className="grid two"><MiniChart title="Crew Utilization by Rank"/><MiniChart title="Standby and Overtime Trend"/></div><Table title="Management KPI Report" columns={['kpi','current','target','status']} rows={[{kpi:'Roster stability',current:'88%',target:'85%',status:'Green'},{kpi:'Preference grant',current:'74%',target:'70%',status:'Green'},{kpi:'Fatigue warnings',current:'12',target:'<20',status:'Green'},{kpi:'Manual overrides',current:'7',target:'<10',status:'Green'}]}/></>; }
function Backend({apiUrl,setApiUrlState,saveUrl}) { return <><Kpis items={[{label:'Webhook Calls',value:'4,821',note:'today',tone:'info'},{label:'Failed Jobs',value:'6',note:'retry queued',tone:'risk'},{label:'Sheets Sync',value:'Live',note:'last 19 sec',tone:'ok'},{label:'Active Users',value:'216',note:'web + mobile',tone:'info'}]}/><div className="card config"><label>Apps Script Web App URL</label><div><input value={apiUrl} onChange={e=>setApiUrlState(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec"/><button onClick={saveUrl}>Save & Ping</button></div></div><div className="grid two"><Table title="Google Sheets Backend Map" columns={['sheet','records','status']} rows={[{sheet:'Crew_Master',records:'1,284',status:'OK'},{sheet:'Roster_Published',records:'38,402',status:'OK'},{sheet:'CheckIns',records:'912',status:'OK'},{sheet:'Recovery_Cases',records:'208',status:'OK'},{sheet:'Audit_Log',records:'87,112',status:'OK'}]}/><Table title="Apps Script API Monitor" columns={['endpoint','latency','status']} rows={[{endpoint:'/crew/login',latency:'280ms',status:'OK'},{endpoint:'/roster/get',latency:'310ms',status:'OK'},{endpoint:'/checkin/post',latency:'255ms',status:'OK'},{endpoint:'/absence/post',latency:'420ms',status:'OK'},{endpoint:'/notify',latency:'Retry',status:'Warn'}]}/></div></>; }
function Copilot() { const [q,setQ]=useState('Show flights with missing crew and recommend recovery'); const [answer,setAnswer]=useState('Ask a question to search across roster, crew, check-ins, exceptions and the acronym glossary.'); async function ask(){ const glossaryHit = glossaryAnswer(q); const res=await callAcms('aiCopilot',{question:q, glossary: glossaryTerms}); setAnswer(res?.answer || (glossaryHit.includes('could not find') ? 'Demo answer: 3 flights have crew gaps. Prioritize FY2176 missing CC, FY3124 no-show CPT and FY4020 delay duty risk. Recommended action is to call up reserve CPT Amir, confirm CC standby pool, then republish affected roster version.' : glossaryHit)); } return <div className="card copilot"><div className="cardTitle">AI Copilot</div><div className="searchbar"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask about rosters, recovery, KPIs or an acronym..."/><button onClick={ask}>Ask</button></div><div className="answer">{answer}</div><div className="quickQs">{['What does FDP mean?','Summarize open exceptions','Who has license expiring in 30 days?','Explain recovery option for FY3124','Draft OCC briefing'].map(x=><button key={x} onClick={()=>setQ(x)}>{x}</button>)}</div></div>; }

function Glossary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [question, setQuestion] = useState('What does FDP mean?');
  const [answer, setAnswer] = useState('Ask the glossary copilot to explain any acronym, category or operational phrase.');
  const categories = ['All', ...Array.from(new Set(glossaryTerms.map(item => item.category))).sort()];
  const filtered = glossaryTerms.filter(item => {
    const haystack = [item.acronym, item.term, item.category, item.detail].join(' ').toLowerCase();
    return (category === 'All' || item.category === category) && haystack.includes(query.toLowerCase());
  });
  function askGlossary() { setAnswer(glossaryAnswer(question)); }
  return <>
    <div className="glossaryHero card">
      <div><div className="cardTitle">Acronym Dictionary</div><p>Search every acronym used across ACMS screens, roster codes, crew roles, flight timing, compliance controls, airports and backend integrations.</p></div>
      <div className="glossarySearch"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search acronym, meaning, category or detail..."/></div>
    </div>
    <div className="filters glossaryFilters">{categories.map(item => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="grid two glossaryLayout">
      <div className="glossaryGrid">{filtered.map(item => <article className="card glossaryTerm" key={item.acronym}><span>{item.category}</span><h3>{item.acronym}</h3><b>{item.term}</b><p>{item.detail}</p></article>)}</div>
      <div className="card copilot glossaryCopilot"><div className="cardTitle">Glossary AI Copilot</div><div className="searchbar"><Bot size={18}/><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask what an acronym means..."/><button onClick={askGlossary}>Ask</button></div><div className="answer">{answer}</div><div className="quickQs">{['What does FB mean?','What is RBAC?','Show roster codes','What does STD mean?'].map(x=><button key={x} onClick={()=>setQuestion(x)}>{x}</button>)}</div></div>
    </div>
  </>;
}

function Admin() { return <><div className="grid two"><Table title="Rule Configuration" columns={['parameter','value','type']} rows={[{parameter:'Min rest',value:'12h',type:'Hard'},{parameter:'Max FDP',value:'13h',type:'Hard'},{parameter:'Medical expiry alert',value:'90/60/30d',type:'Soft'},{parameter:'Geo check-in',value:'Enabled',type:'Control'}]}/><Table title="Users & RBAC" columns={['role','users','scope']} rows={[{role:'Crew',users:1284,scope:'Self service'},{role:'Planner',users:24,scope:'Roster build'},{role:'OCC',users:18,scope:'Ops control'},{role:'Admin',users:7,scope:'System'}]}/></div><div className="card checklist"><div className="cardTitle">System Health Checklist</div>{['Daily trigger installed','Backup scheduled','Webhook deployment active','Protected ranges enabled','Audit logging enabled'].map(x=><p key={x}><CheckCircle2 size={16}/>{x}</p>)}</div></>; }
function MiniChart({title}) { const bars=[30,62,48,82,68,96,74]; return <div className="card chart"><div className="cardTitle">{title}</div><div className="bars">{bars.map((b,i)=><span key={i} style={{height:b+'%'}}><small>W{i+1}</small></span>)}</div></div>; }

function Screen(props) { const m = { command:<Command setActive={props.setActive}/>, flightsDetail:<DetailScreen type="flightsDetail"/>, exceptionsDetail:<DetailScreen type="exceptionsDetail"/>, checkinsDetail:<DetailScreen type="checkinsDetail"/>, stabilityDetail:<DetailScreen type="stabilityDetail"/>, roster:<Roster/>, demand:<Demand/>, crew:<Crew/>, ops:<Ops/>, recovery:<Recovery/>, optimizer:<Optimizer/>, rules:<Rules/>, reports:<Reports/>, backend:<Backend {...props}/>, copilot:<Copilot/>, admin:<Admin/>, glossary:<Glossary/> }; return <section className="screen">{m[props.active]}</section>; }

createRoot(document.getElementById('root')).render(<Shell />);
