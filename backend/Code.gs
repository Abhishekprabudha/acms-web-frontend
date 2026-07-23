/** ACMS Sheets backend. Set script property ACMS_SPREADSHEET_ID before deployment. */
var SHEETS = {
  CREW: 'Crew_Master', ROSTER: 'Roster_Actual', RATES: 'Allowance_Rates',
  RUNS: 'Allowance_Runs', LINES: 'Allowance_Lines', ATTENDANCE: 'Attendance', AUDIT: 'Audit_Log',
  ROSTER_PUBLISHED: 'Roster_Published', FLIGHT_OPERATIONS: 'Flight_Operations', CHECKINS: 'CheckIns',
  EXCEPTIONS: 'Operational_Exceptions', RECOVERY: 'Recovery_Cases', QUALIFICATIONS: 'Crew_Qualifications',
  MEDICAL: 'Crew_Medical', AVAILABILITY: 'Crew_Availability', RULES: 'Rules_Config',
  RULE_EVALUATIONS: 'Rule_Evaluations', POLICIES: 'HR_Policies', USERS: 'User_RBAC',
  ROSTER_CHANGES: 'Roster_Changes', OPTIMIZER: 'Optimizer_Scenarios', NOTIFICATIONS: 'Notifications'
};

// These sheets are additive operational schemas. They are intentionally empty when created;
// importing or writing live operational data must not overwrite an existing workbook.
var OPERATIONAL_SHEET_HEADERS = {
  Roster_Published: ['rosterId','version','date','crewId','flight','dutyType','reportTime','releaseTime','base','fleet','status','publishedAt','publishedBy'],
  Flight_Operations: ['flightId','date','flight','sector','std','sta','aircraft','need','status','gate','crewedPercent','sourceUpdatedAt'],
  CheckIns: ['checkInId','date','crewId','flight','reportTime','actualTime','status','evidence','location','deviceId','submittedAt'],
  Operational_Exceptions: ['exceptionId','date','type','crewId','flight','slaMinutes','priority','owner','status','openedAt','resolvedAt','notes'],
  Recovery_Cases: ['caseId','exceptionId','issue','flight','priority','status','assignedCrewId','decision','score','openedAt','resolvedAt','owner','notes'],
  Crew_Qualifications: ['qualificationId','crewId','fleet','qualificationType','validFrom','expiryDate','status','checkedAt','checkedBy'],
  Crew_Medical: ['medicalId','crewId','certificateType','validFrom','expiryDate','status','documentUrl','reviewedAt','reviewedBy'],
  Crew_Availability: ['availabilityId','crewId','date','availabilityStatus','startTime','endTime','reason','source','updatedAt'],
  Rules_Config: ['ruleId','rule','parameter','value','type','severity','active','effectiveFrom','effectiveTo','updatedAt','updatedBy'],
  Rule_Evaluations: ['evaluationId','rosterId','ruleId','date','crewId','flight','result','severity','action','overrideReason','evaluatedAt','evaluatedBy'],
  HR_Policies: ['policyId','policy','version','owner','effective','status','documentUrl','approvedBy','approvedAt','reviewDueDate'],
  User_RBAC: ['userId','email','name','role','scope','crewId','active','lastLoginAt','createdAt','updatedAt'],
  Roster_Changes: ['changeId','rosterId','version','date','crewId','flight','field','oldValue','newValue','reason','changedAt','changedBy','approvedBy'],
  Optimizer_Scenarios: ['scenarioId','name','periodStart','periodEnd','status','totalCost','openTrips','overtimeHours','preferenceGrantPercent','stabilityPercent','createdAt','createdBy'],
  Notifications: ['notificationId','recipientUserId','channel','template','subject','payload','status','attemptCount','sentAt','createdAt','errorMessage']
};

function doGet() { return json_({ ok: true, service: 'ACMS allowance backend', actions: supportedActions_() }); }
function doPost(e) {
  try {
    var request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var result = dispatch_(request);
    return json_(result);
  } catch (error) {
    return json_({ ok: false, message: error.message, stack: error.stack });
  }
}
function json_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function supportedActions_() { return ['ping','setupSeedData','setupOperationalSheets','schemaList','crewList','allowanceCalculate','allowanceGetRun','allowanceListRuns','allowanceFinalize','attendanceCreate']; }
function dispatch_(r) {
  var action = r.action;
  if (action === 'ping') return { ok: true, service: 'ACMS allowance backend', actions: supportedActions_() };
  if (action === 'setupSeedData') return setupSeedData_();
  if (action === 'setupOperationalSheets') return setupOperationalSheets_(r.actor || 'web');
  if (action === 'schemaList') return { ok: true, sheets: sheetSchemas_() };
  if (action === 'crewList') return { ok: true, crew: readObjects_(SHEETS.CREW) };
  if (action === 'allowanceCalculate') return calculateAllowance_(r.month, r.actor || 'web');
  if (action === 'allowanceGetRun') return getRun_(r.runId);
  if (action === 'allowanceListRuns') return { ok: true, runs: readObjects_(SHEETS.RUNS) };
  if (action === 'allowanceFinalize') return finalizeRun_(r.runId, r.actor || 'web');
  if (action === 'attendanceCreate') return createAttendance_(r.attendance || {}, r.actor || 'web');
  throw new Error('Unsupported action: ' + action);
}
function db_() {
  var id = PropertiesService.getScriptProperties().getProperty('ACMS_SPREADSHEET_ID');
  if (!id) throw new Error('Set the ACMS_SPREADSHEET_ID script property, then call setupSeedData.');
  return SpreadsheetApp.openById(id);
}
function ensureSheet_(name, headers) {
  var sheet = db_().getSheetByName(name) || db_().insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
}
function readObjects_(name) {
  var sheet = db_().getSheetByName(name); if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues(), headers = values.shift();
  return values.filter(function (row) { return row.some(function (v) { return v !== ''; }); }).map(function (row) {
    var obj = {}; headers.forEach(function (key, i) { obj[key] = row[i]; }); return obj;
  });
}
function appendObject_(name, headers, obj) { ensureSheet_(name, headers).appendRow(headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; })); }
function audit_(action, actor, detail) { appendObject_(SHEETS.AUDIT, ['timestamp','action','actor','detail'], { timestamp: new Date().toISOString(), action: action, actor: actor, detail: JSON.stringify(detail) }); }
function sheetSchemas_() { return Object.keys(OPERATIONAL_SHEET_HEADERS).map(function(name) { return { name:name, headers:OPERATIONAL_SHEET_HEADERS[name] }; }); }
function setupOperationalSheets_(actor) {
  Object.keys(OPERATIONAL_SHEET_HEADERS).forEach(function(name) {
    var sheet = ensureSheet_(name, OPERATIONAL_SHEET_HEADERS[name]);
    sheet.setFrozenRows(1);
  });
  audit_('setupOperationalSheets', actor, { sheets:Object.keys(OPERATIONAL_SHEET_HEADERS) });
  return { ok:true, message:'Operational sheets are ready. Existing data was not changed.', sheets:sheetSchemas_() };
}

function setupSeedData_() {
  var data = seedData_();
  Object.keys(data).forEach(function (name) {
    var rows = data[name], headers = Object.keys(rows[0]); var sheet = ensureSheet_(name, headers);
    sheet.clearContents(); sheet.appendRow(headers);
    if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(function (r) { return headers.map(function (h) { return r[h]; }); }));
    sheet.setFrozenRows(1);
  });
  setupOperationalSheets_('system');
  audit_('setupSeedData', 'system', { sheets: Object.keys(data) });
  return { ok: true, message: 'Allowance datasets and operational sheet schemas installed.', sheets: Object.keys(data).concat(Object.keys(OPERATIONAL_SHEET_HEADERS)) };
}
function seedData_() { return {
  Crew_Master: [
    {crewId:'CPT-204',name:'A. Rahman',crewType:'FLIGHT',rank:'CPT',base:'KUL',active:true},
    {crewId:'FO-872',name:'S. Tan',crewType:'FLIGHT',rank:'FO',base:'PEN',active:true},
    {crewId:'CC-519',name:'N. Lim',crewType:'CABIN',rank:'CC',base:'KUL',active:true},
    {crewId:'CPT-355',name:'R. Kumar',crewType:'FLIGHT',rank:'CPT',base:'BKI',active:true},
    {crewId:'FO-111',name:'M. Lee',crewType:'FLIGHT',rank:'FO',base:'KUL',active:true},
    {crewId:'CC-644',name:'J. Wong',crewType:'CABIN',rank:'CC',base:'PEN',active:true},
    {crewId:'CC-390',name:'F. Aziz',crewType:'CABIN',rank:'CC',base:'KUL',active:true}
  ],
  Roster_Actual: [
    {date:'2026-06-02',crewId:'CPT-204',dutyType:'FLIGHT',productiveHours:6.5,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-04',crewId:'CPT-204',dutyType:'FLIGHT',productiveHours:7,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-03',crewId:'FO-872',dutyType:'FLIGHT',productiveHours:6,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-05',crewId:'FO-872',dutyType:'FLIGHT',productiveHours:7.5,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-02',crewId:'CC-519',dutyType:'FLIGHT',productiveHours:5.5,layoverMinutes:135,mealEligible:true},
    {date:'2026-06-06',crewId:'CC-519',dutyType:'FLIGHT',productiveHours:6,layoverMinutes:240,mealEligible:true},
    {date:'2026-06-04',crewId:'CPT-355',dutyType:'FLIGHT',productiveHours:8,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-08',crewId:'FO-111',dutyType:'FLIGHT',productiveHours:6.5,layoverMinutes:0,mealEligible:true},
    {date:'2026-06-03',crewId:'CC-644',dutyType:'FLIGHT',productiveHours:5,layoverMinutes:150,mealEligible:true},
    {date:'2026-06-07',crewId:'CC-644',dutyType:'FLIGHT',productiveHours:6,layoverMinutes:180,mealEligible:true},
    {date:'2026-06-09',crewId:'CC-390',dutyType:'FLIGHT',productiveHours:5.5,layoverMinutes:90,mealEligible:true}
  ],
  Allowance_Rates: [
    {crewType:'CABIN',code:'PRODUCTIVITY_ALLOWANCE',rate:12,effectiveFrom:'2026-01-01',active:true},
    {crewType:'CABIN',code:'PRODUCTIVITY_INCENTIVE',rate:8,effectiveFrom:'2026-01-01',active:true},
    {crewType:'FLIGHT',code:'FLIGHT_HOUR_ALLOWANCE',rate:25,effectiveFrom:'2026-01-01',active:true},
    {crewType:'ALL',code:'MEAL_ALLOWANCE',rate:18,effectiveFrom:'2026-01-01',active:true}
  ],
  Allowance_Runs: [{runId:'RUN-2026-05-001',month:'2026-05',status:'FINALIZED',createdAt:'2026-06-01T00:00:00.000Z',finalizedAt:'2026-06-05T00:00:00.000Z',totalAmount:0,crewCount:0}],
  Allowance_Lines: [{runId:'RUN-2026-05-001',crewId:'CC-519',name:'N. Lim',crewType:'CABIN',productiveHours:0,layoverMinutes:0,layoverCreditHours:0,mealCount:0,productivityAllowance:0,productivityIncentive:0,flightAllowance:0,mealAllowance:0,totalAmount:0,status:'FINALIZED'}]
}; }
function rate_(rates, crewType, code) { var row = rates.filter(function(r) { return r.code === code && (r.crewType === crewType || r.crewType === 'ALL') && String(r.active) === 'true'; })[0]; if (!row) throw new Error('Missing active rate for ' + crewType + '/' + code); return Number(row.rate); }
function layoverCredit_(minutes) { return minutes >= 180 && minutes <= 660 ? 3 : minutes >= 120 && minutes < 180 ? 1 : 0; }
function calculateAllowance_(month, actor) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('month must use YYYY-MM.');
  var existing = readObjects_(SHEETS.RUNS).filter(function(r) { return r.month === month && r.status === 'DRAFT'; })[0];
  if (existing) return getRun_(existing.runId);
  var crew = readObjects_(SHEETS.CREW).filter(function(r) { return String(r.active) === 'true'; });
  var roster = readObjects_(SHEETS.ROSTER).filter(function(r) { return String(r.date).slice(0, 7) === month; }); var rates = readObjects_(SHEETS.RATES);
  var runId = 'RUN-' + month + '-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss');
  var lines = crew.map(function(c) {
    var duties = roster.filter(function(r) { return r.crewId === c.crewId; });
    var hours = duties.reduce(function(s,r) { return s + Number(r.productiveHours || 0); },0), layover = duties.reduce(function(s,r) { return s + Number(r.layoverMinutes || 0); },0);
    var credit = c.crewType === 'CABIN' ? duties.reduce(function(s,r) { return s + layoverCredit_(Number(r.layoverMinutes || 0)); },0) : 0;
    var meals = duties.filter(function(r) { return String(r.mealEligible) === 'true'; }).length;
    var pa = c.crewType === 'CABIN' ? (hours + credit) * rate_(rates,'CABIN','PRODUCTIVITY_ALLOWANCE') : 0;
    var pi = c.crewType === 'CABIN' ? (hours + credit) * rate_(rates,'CABIN','PRODUCTIVITY_INCENTIVE') : 0;
    var fa = c.crewType === 'FLIGHT' ? hours * rate_(rates,'FLIGHT','FLIGHT_HOUR_ALLOWANCE') : 0;
    var ma = meals * rate_(rates,'ALL','MEAL_ALLOWANCE'), total = pa + pi + fa + ma;
    return {runId:runId,crewId:c.crewId,name:c.name,crewType:c.crewType,productiveHours:hours.toFixed(2),layoverMinutes:layover,layoverCreditHours:credit,mealCount:meals,productivityAllowance:pa.toFixed(2),productivityIncentive:pi.toFixed(2),flightAllowance:fa.toFixed(2),mealAllowance:ma.toFixed(2),totalAmount:total.toFixed(2),status:'DRAFT'};
  });
  var total = lines.reduce(function(s,l) { return s + Number(l.totalAmount); },0), run = {runId:runId,month:month,status:'DRAFT',createdAt:new Date().toISOString(),finalizedAt:'',totalAmount:total.toFixed(2),crewCount:lines.length};
  appendObject_(SHEETS.RUNS, Object.keys(run), run); lines.forEach(function(l) { appendObject_(SHEETS.LINES, Object.keys(l), l); }); audit_('allowanceCalculate', actor, {runId:runId,month:month}); return {ok:true,run:run,lines:lines};
}
function getRun_(runId) { var run = readObjects_(SHEETS.RUNS).filter(function(r) { return r.runId === runId; })[0]; if (!run) throw new Error('Allowance run not found: ' + runId); return {ok:true,run:run,lines:readObjects_(SHEETS.LINES).filter(function(l) { return l.runId === runId; })}; }
function finalizeRun_(runId, actor) { var result=getRun_(runId); if (result.run.status === 'FINALIZED') return result; var sheet=db_().getSheetByName(SHEETS.RUNS), values=sheet.getDataRange().getValues(), statusCol=values[0].indexOf('status')+1, finalCol=values[0].indexOf('finalizedAt')+1, row=values.findIndex(function(r,i){return i && r[0]===runId;})+1; sheet.getRange(row,statusCol).setValue('FINALIZED'); sheet.getRange(row,finalCol).setValue(new Date().toISOString()); audit_('allowanceFinalize',actor,{runId:runId}); return getRun_(runId); }
function createAttendance_(attendance, actor) { ['crewId','date','flight','reportTime','status'].forEach(function(k){if(!attendance[k])throw new Error('attendance.'+k+' is required');}); var record={id:'ATT-'+new Date().getTime(),crewId:attendance.crewId,date:attendance.date,flight:attendance.flight,reportTime:attendance.reportTime,status:attendance.status,evidence:attendance.evidence||'',notes:attendance.notes||'',submittedAt:attendance.submittedAt||new Date().toISOString()}; appendObject_(SHEETS.ATTENDANCE,Object.keys(record),record); audit_('attendanceCreate',actor,record); return {ok:true,id:record.id,attendance:record}; }
