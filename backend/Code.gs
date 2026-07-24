/** ACMS Sheets backend. Set script property ACMS_SPREADSHEET_ID before deployment. */
var SHEETS = {
  CREW: 'Crew_Master', ROSTER: 'Roster_Actual', RATES: 'Allowance_Rates',
  RUNS: 'Allowance_Runs', LINES: 'Allowance_Lines', IMPORTS: 'Roster_Import_Batches', ALLOWANCE_RULES: 'Allowance_Rules', MEAL_RATES: 'Meal_Rates', APPROVALS: 'Allowance_Approvals', ADJUSTMENTS: 'Allowance_Adjustments', REPORTS: 'Allowance_Reports', DISTRIBUTION: 'Allowance_Distribution', ATTENDANCE: 'Attendance', AUDIT: 'Audit_Log',
  ROSTER_PUBLISHED: 'Roster_Published', FLIGHT_OPERATIONS: 'Flight_Operations', CHECKINS: 'CheckIns',
  EXCEPTIONS: 'Operational_Exceptions', RECOVERY: 'Recovery_Cases', QUALIFICATIONS: 'Crew_Qualifications',
  MEDICAL: 'Crew_Medical', AVAILABILITY: 'Crew_Availability', RULES: 'Rules_Config', RULE_EVALUATIONS: 'Rule_Evaluations', POLICIES: 'HR_Policies', USERS: 'User_RBAC',
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
function supportedActions_() { return ['ping','setupSeedData','setupOperationalSheets','schemaList','sheetSummary','operationalList','recordCreate','recordUpdate','crewList','allowanceImport','allowanceCalculate','allowanceGetRun','allowanceListRuns','allowanceAdvanceStatus','allowanceCreateAdjustment','allowanceFinalize','attendanceCreate']; }
function dispatch_(r) {
  var action = r.action;
  if (action === 'ping') return { ok: true, service: 'ACMS allowance backend', actions: supportedActions_() };
  if (action === 'setupSeedData') return setupSeedData_();
  if (action === 'setupOperationalSheets') return setupOperationalSheets_(r.actor || 'web');
  if (action === 'schemaList') return { ok: true, sheets: sheetSchemas_() };
  if (action === 'sheetSummary') return sheetSummary_();
  if (action === 'operationalList') return operationalList_(r.sheet, r.startDate, r.endDate);
  if (action === 'recordCreate') return createRecord_(r.table, r.record || {}, r.actor || 'web');
  if (action === 'recordUpdate') return updateRecord_(r.table, r.keyField, r.keyValue, r.record || {}, r.actor || 'web');
  if (action === 'crewList') return { ok: true, crew: readObjects_(SHEETS.CREW) };
  if (action === 'allowanceImport') return importAllowanceRoster_(r.month, r.rows || [], r.actor || 'web');
  if (action === 'allowanceCalculate') return calculateAllowance_(r.month, r.actor || 'web');
  if (action === 'allowanceGetRun') return getRun_(r.runId);
  if (action === 'allowanceListRuns') return { ok: true, runs: readObjects_(SHEETS.RUNS) };
  if (action === 'allowanceAdvanceStatus') return advanceAllowanceStatus_(r.runId, r.status, r.actor || 'web', r.comment || '');
  if (action === 'allowanceCreateAdjustment') return createAllowanceAdjustment_(r.adjustment || {}, r.actor || 'web');
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
var CORE_SHEET_HEADERS = {
  Crew_Master: ['crewId','name','crewType','rank','designation','base','fleet','email','managementPilot','instructor','status','medical','license','training','active'],
  Roster_Actual: ['activityId','importBatchId','date','crewId','flight','sector','dutyType','operatingMinutes','paxingMinutes','diversionMinutes','returnToChockMinutes','fdpExtensionMinutes','productiveHours','layoverMinutes','nightStopRegion','breakfastEligible','lunchEligible','dinnerEligible','simulatorMinutes','instructorMinutes','groundDutyMinutes','remarks'],
  Allowance_Rates: ['crewType','code','region','rate','effectiveFrom','effectiveTo','active'],
  Roster_Import_Batches: ['importBatchId','month','sourceFileName','rowCount','validRowCount','invalidRowCount','status','createdAt','createdBy','validationSummary'],
  Allowance_Rules: ['ruleId','crewType','code','description','effectiveFrom','effectiveTo','active','approvedBy','approvedAt'],
  Meal_Rates: ['region','mealType','startLocalTime','endLocalTime','rate','effectiveFrom','effectiveTo','active'],
  Allowance_Runs: ['runId','month','importBatchId','status','createdAt','createdBy','checkedAt','checkedBy','approvedAt','approvedBy','finalizedAt','finalizedBy','totalAmount','crewCount'],
  Allowance_Lines: ['runId','crewId','name','crewType','sourceActivityCount','productiveHours','layoverMinutes','layoverCreditHours','breakfastAmount','lunchAmount','dinnerAmount','productivityAllowance','productivityIncentive','flightAllowance','simulatorAllowance','instructorAllowance','groundDutyAllowance','adjustmentAmount','totalAmount','status'],
  Allowance_Approvals: ['approvalId','runId','fromStatus','toStatus','actor','comment','createdAt'],
  Allowance_Adjustments: ['adjustmentId','runId','crewId','activityId','component','amount','reason','status','requestedBy','approvedBy','createdAt','approvedAt'],
  Allowance_Reports: ['reportId','runId','crewId','template','version','status','fileUrl','generatedAt','generatedBy'],
  Allowance_Distribution: ['distributionId','runId','crewId','recipientEmail','reportId','status','attemptCount','sentAt','errorMessage','createdAt'],
  Attendance: ['id','crewId','date','flight','reportTime','status','evidence','notes','submittedAt'],
  Audit_Log: ['timestamp','action','actor','detail']
};
function tableHeaders_(name) { return OPERATIONAL_SHEET_HEADERS[name] || CORE_SHEET_HEADERS[name]; }
function sheetSchemas_() { return Object.keys(SHEETS).map(function(key) { var name=SHEETS[key]; return { name:name, headers:tableHeaders_(name) || [] }; }); }
function createRecord_(table, record, actor) {
  var headers=tableHeaders_(table); if (!headers) throw new Error('Unsupported table: '+table);
  var clean={}; headers.forEach(function(header) { clean[header]=record[header] === undefined ? '' : record[header]; });
  appendObject_(table, headers, clean); audit_('recordCreate', actor, {table:table, record:clean});
  return {ok:true, table:table, record:clean};
}
function updateRecord_(table, keyField, keyValue, record, actor) {
  var headers=tableHeaders_(table); if (!headers) throw new Error('Unsupported table: '+table);
  if (!keyField || keyValue === undefined || keyValue === '') throw new Error('keyField and keyValue are required');
  var sheet=ensureSheet_(table, headers), values=sheet.getDataRange().getValues(), keyColumn=values[0].indexOf(keyField);
  if (keyColumn < 0) throw new Error('Unknown key field: '+keyField);
  var rowIndex=values.findIndex(function(row,index) { return index > 0 && String(row[keyColumn]) === String(keyValue); });
  if (rowIndex < 1) throw new Error('Record not found for '+keyField+'='+keyValue);
  headers.forEach(function(header) { if (record[header] !== undefined) sheet.getRange(rowIndex+1, values[0].indexOf(header)+1).setValue(record[header]); });
  var saved=readObjects_(table)[rowIndex-1]; audit_('recordUpdate', actor, {table:table, keyField:keyField, keyValue:keyValue, record:record});
  return {ok:true, table:table, record:saved};
}
function setupOperationalSheets_(actor) {
  Object.keys(OPERATIONAL_SHEET_HEADERS).forEach(function(name) {
    var sheet = ensureSheet_(name, OPERATIONAL_SHEET_HEADERS[name]);
    sheet.setFrozenRows(1);
  });
  audit_('setupOperationalSheets', actor, { sheets:Object.keys(OPERATIONAL_SHEET_HEADERS) });
  return { ok:true, message:'Operational sheets are ready. Existing data was not changed.', sheets:sheetSchemas_() };
}

function setupSeedData_() {
  var data = seedData_(), operational = operationalSeedData_();
  Object.keys(operational).forEach(function(name) { data[name] = operational[name]; });
  Object.keys(data).forEach(function (name) {
    var rows = data[name], headers = CORE_SHEET_HEADERS[name] || OPERATIONAL_SHEET_HEADERS[name] || Object.keys(rows[0]); var sheet = ensureSheet_(name, headers);
    sheet.clearContents(); sheet.appendRow(headers);
    if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(function (r) { return headers.map(function (h) { return r[h]; }); }));
    sheet.setFrozenRows(1);
  });
  setupOperationalSheets_('system');
  audit_('setupSeedData', 'system', { sheets: Object.keys(data) });
  return { ok: true, message: 'Allowance and operational demo datasets installed.', sheets: Object.keys(data) };
}
function seedData_() { return {
  Crew_Master: [
    {crewId:'CPT-204',name:'A. Rahman',crewType:'FLIGHT',rank:'CPT',designation:'Captain',base:'KUL',fleet:'ATR',email:'a.rahman@firefly.demo',managementPilot:false,instructor:false,status:'Ready',medical:'Valid',license:'Valid',training:'SEP due 42d',active:true},
    {crewId:'FO-872',name:'S. Tan',crewType:'FLIGHT',rank:'FO',designation:'First Officer',base:'PEN',fleet:'ATR',email:'s.tan@firefly.demo',managementPilot:false,instructor:true,status:'Training',medical:'Valid',license:'Valid',training:'Line check',active:true},
    {crewId:'CC-519',name:'N. Lim',crewType:'CABIN',rank:'CC',base:'KUL',fleet:'ATR',status:'Ready',medical:'Valid',license:'N/A',training:'CRM valid',active:true},
    {crewId:'CPT-355',name:'R. Kumar',crewType:'FLIGHT',rank:'CPT',base:'BKI',fleet:'B737',status:'Med expiring',medical:'Expiring',license:'Valid',training:'Valid',active:true},
    {crewId:'FO-111',name:'M. Lee',crewType:'FLIGHT',rank:'FO',base:'KUL',fleet:'ATR',status:'Ready',medical:'Valid',license:'Valid',training:'Valid',active:true},
    {crewId:'CC-644',name:'J. Wong',crewType:'CABIN',rank:'CC',base:'PEN',fleet:'ATR',status:'Standby',medical:'Valid',license:'N/A',training:'Valid',active:true},
    {crewId:'CC-390',name:'F. Aziz',crewType:'CABIN',rank:'CC',base:'KUL',fleet:'B737',status:'Ready',medical:'Valid',license:'N/A',training:'CRM valid',active:true},
    {crewId:'CPT-718',name:'D. Chong',crewType:'FLIGHT',rank:'CPT',base:'SZB',fleet:'B737',status:'Ready',medical:'Valid',license:'Valid',training:'Valid',active:true},
    {crewId:'FO-226',name:'P. Singh',crewType:'FLIGHT',rank:'FO',base:'JHB',fleet:'ATR',status:'Standby',medical:'Valid',license:'Valid',training:'Line check',active:true},
    {crewId:'CC-812',name:'L. Goh',crewType:'CABIN',rank:'CC',base:'BKI',fleet:'B737',status:'Leave',medical:'Valid',license:'N/A',training:'Valid',active:true}
  ],
  Roster_Actual: [
    {activityId:'ACT-001',importBatchId:'IMP-2026-06-SEED',date:'2026-06-02',crewId:'CC-519',flight:'FY3124',sector:'KUL-PEN',dutyType:'FLIGHT',operatingMinutes:330,paxingMinutes:0,diversionMinutes:0,returnToChockMinutes:0,fdpExtensionMinutes:0,productiveHours:5.5,layoverMinutes:135,nightStopRegion:'Malaysia',breakfastEligible:true,lunchEligible:true,dinnerEligible:false,simulatorMinutes:0,instructorMinutes:0,groundDutyMinutes:0,remarks:'Cabin layover credit'},
    {activityId:'ACT-002',importBatchId:'IMP-2026-06-SEED',date:'2026-06-06',crewId:'CC-519',flight:'FY3196',sector:'PEN-KUL',dutyType:'FLIGHT',operatingMinutes:360,paxingMinutes:0,diversionMinutes:0,returnToChockMinutes:0,fdpExtensionMinutes:0,productiveHours:6,layoverMinutes:240,nightStopRegion:'Malaysia',breakfastEligible:false,lunchEligible:false,dinnerEligible:true,simulatorMinutes:0,instructorMinutes:0,groundDutyMinutes:0,remarks:'Cabin layover credit'},
    {activityId:'ACT-003',importBatchId:'IMP-2026-06-SEED',date:'2026-06-03',crewId:'FO-872',flight:'FY3021',sector:'PEN-JHB',dutyType:'FLIGHT',operatingMinutes:360,paxingMinutes:30,diversionMinutes:0,returnToChockMinutes:15,fdpExtensionMinutes:0,productiveHours:6,layoverMinutes:0,nightStopRegion:'Malaysia',breakfastEligible:true,lunchEligible:false,dinnerEligible:false,simulatorMinutes:120,instructorMinutes:60,groundDutyMinutes:0,remarks:'Simulator and instructor activity'},
    {activityId:'ACT-004',importBatchId:'IMP-2026-06-SEED',date:'2026-06-04',crewId:'CPT-204',flight:'FY3066',sector:'KUL-LGK',dutyType:'FLIGHT',operatingMinutes:390,paxingMinutes:0,diversionMinutes:0,returnToChockMinutes:0,fdpExtensionMinutes:30,productiveHours:6.5,layoverMinutes:0,nightStopRegion:'Malaysia',breakfastEligible:false,lunchEligible:true,dinnerEligible:false,simulatorMinutes:0,instructorMinutes:0,groundDutyMinutes:120,remarks:'FDP extension and ground duty'},
    {activityId:'ACT-005',importBatchId:'IMP-2026-06-SEED',date:'2026-06-07',crewId:'CC-644',flight:'FY3288',sector:'PEN-SZB',dutyType:'FLIGHT',operatingMinutes:300,paxingMinutes:0,diversionMinutes:0,returnToChockMinutes:0,fdpExtensionMinutes:0,productiveHours:5,layoverMinutes:180,nightStopRegion:'Malaysia',breakfastEligible:false,lunchEligible:true,dinnerEligible:false,simulatorMinutes:0,instructorMinutes:0,groundDutyMinutes:0,remarks:'Three-hour cabin layover credit'}
  ],
  Allowance_Rates: [
    {crewType:'CABIN',code:'PRODUCTIVITY_ALLOWANCE',region:'ALL',rate:12,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},
    {crewType:'CABIN',code:'PRODUCTIVITY_INCENTIVE',region:'ALL',rate:8,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},
    {crewType:'FLIGHT',code:'FLIGHT_HOUR_ALLOWANCE',region:'ALL',rate:25,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},
    {crewType:'FLIGHT',code:'SIMULATOR_ALLOWANCE',region:'ALL',rate:15,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},
    {crewType:'FLIGHT',code:'INSTRUCTOR_ALLOWANCE',region:'ALL',rate:20,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},
    {crewType:'ALL',code:'GROUND_DUTY_ALLOWANCE',region:'ALL',rate:10,effectiveFrom:'2026-01-01',effectiveTo:'',active:true}
  ],
  Roster_Import_Batches: [{importBatchId:'IMP-2026-06-SEED',month:'2026-06',sourceFileName:'june-actual-roster.csv',rowCount:5,validRowCount:5,invalidRowCount:0,status:'VALIDATED',createdAt:'2026-06-01T00:00:00.000Z',createdBy:'system',validationSummary:'Seeded allowance roster'}],
  Allowance_Rules: [{ruleId:'CABIN-LAYOVER-001',crewType:'CABIN',code:'LAYOVER_CREDIT',description:'2:00–2:59 = 1 hour; 3:00–11:00 = 3 hours',effectiveFrom:'2026-01-01',effectiveTo:'',active:true,approvedBy:'payroll@acms.demo',approvedAt:'2026-01-01T00:00:00.000Z'}],
  Meal_Rates: [{region:'Malaysia',mealType:'BREAKFAST',startLocalTime:'07:01',endLocalTime:'09:00',rate:26,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},{region:'Malaysia',mealType:'LUNCH',startLocalTime:'12:01',endLocalTime:'14:00',rate:39,effectiveFrom:'2026-01-01',effectiveTo:'',active:true},{region:'Malaysia',mealType:'DINNER',startLocalTime:'19:01',endLocalTime:'21:00',rate:65,effectiveFrom:'2026-01-01',effectiveTo:'',active:true}],
  Allowance_Runs: [{runId:'RUN-2026-05-001',month:'2026-05',importBatchId:'',status:'FINALIZED',createdAt:'2026-06-01T00:00:00.000Z',createdBy:'payroll@acms.demo',checkedAt:'2026-06-03T00:00:00.000Z',checkedBy:'checker@acms.demo',approvedAt:'2026-06-04T00:00:00.000Z',approvedBy:'approver@acms.demo',finalizedAt:'2026-06-05T00:00:00.000Z',finalizedBy:'approver@acms.demo',totalAmount:0,crewCount:0}],
  Allowance_Lines: [{runId:'RUN-2026-05-001',crewId:'CC-519',name:'N. Lim',crewType:'CABIN',sourceActivityCount:0,productiveHours:0,layoverMinutes:0,layoverCreditHours:0,breakfastAmount:0,lunchAmount:0,dinnerAmount:0,productivityAllowance:0,productivityIncentive:0,flightAllowance:0,simulatorAllowance:0,instructorAllowance:0,groundDutyAllowance:0,adjustmentAmount:0,totalAmount:0,status:'FINALIZED'}],
  Allowance_Approvals: [{approvalId:'APR-202605',runId:'RUN-2026-05-001',fromStatus:'APPROVED',toStatus:'FINALIZED',actor:'approver@acms.demo',comment:'Seeded finalized run',createdAt:'2026-06-05T00:00:00.000Z'}],
  Allowance_Adjustments: [{adjustmentId:'ADJ-202605',runId:'RUN-2026-05-001',crewId:'CC-519',activityId:'',component:'OTHER',amount:0,reason:'Seed record',status:'APPROVED',requestedBy:'payroll@acms.demo',approvedBy:'approver@acms.demo',createdAt:'2026-06-05T00:00:00.000Z',approvedAt:'2026-06-05T00:00:00.000Z'}],
  Allowance_Reports: [{reportId:'RPT-202605-CC519',runId:'RUN-2026-05-001',crewId:'CC-519',template:'Cabin',version:1,status:'ARCHIVED',fileUrl:'',generatedAt:'2026-06-05T00:00:00.000Z',generatedBy:'system'}],
  Allowance_Distribution: [{distributionId:'DST-202605-CC519',runId:'RUN-2026-05-001',crewId:'CC-519',recipientEmail:'',reportId:'RPT-202605-CC519',status:'SENT',attemptCount:1,sentAt:'2026-06-05T00:00:00.000Z',errorMessage:'',createdAt:'2026-06-05T00:00:00.000Z'}]
}; }
// Read-only operational access for frontend modules. Sheet names are allow-listed to prevent arbitrary workbook access.
function operationalList_(sheet, startDate, endDate) {
  if (!OPERATIONAL_SHEET_HEADERS[sheet]) throw new Error('Unsupported operational sheet: ' + sheet);
  var rows = readObjects_(sheet);
  if (startDate || endDate) rows = rows.filter(function(row) { var date = String(row.date || row.periodStart || ''); return (!startDate || date >= startDate) && (!endDate || date <= endDate); });
  return { ok:true, sheet:sheet, rows:rows, count:rows.length };
}
function sheetSummary_() {
  var names = Object.keys(SHEETS).map(function(key) { return SHEETS[key]; });
  return { ok:true, sheets:names.map(function(name) { return { sheet:name, records:readObjects_(name).length, status:db_().getSheetByName(name) ? 'OK' : 'MISSING' }; }) };
}

// Creates a realistic June 2026 operational pack: 480 flights, 360 check-ins, 300 exceptions,
// plus records for every remaining operational module. It is intentionally deterministic for demos.
function operationalSeedData_() {
  var out = {}, flights=[], checkins=[], exceptions=[], published=[], changes=[];
  var crew = ['CPT-204','FO-872','CC-519','CPT-355','FO-111','CC-644','CC-390','CPT-718','FO-226','CC-812'];
  var routes = ['KUL-PEN','PEN-JHB','SZB-BKI','KUL-LGK','JHB-KUL','PEN-SZ','KUL-BKI','LGK-PEN'];
  var exceptionTypes = ['No-show','Rest risk','Missing CC','License expiry','Aircraft swap','Late check-in','Route qualification','Medical review'];
  for (var d=1; d<=30; d++) {
    var date='2026-06-'+('0'+d).slice(-2);
    for (var i=0; i<16; i++) {
      var flight='FY'+(2000+(d-1)*37+i*11), fleet=i%3===2?'B737':'ATR72', status=['Crewed','Crewed','Crewed','Missing CC','Delay risk','Open trip'][(d+i*2)%6];
      flights.push({flightId:'FLT-'+date+'-'+i,date:date,flight:flight,sector:routes[(d+i)%routes.length],std:('0'+(5+(i*2+d)%16)).slice(-2)+':'+('0'+((10+i*7+d*3)%60)).slice(-2),sta:('0'+(7+(i*2+d)%16)).slice(-2)+':'+('0'+((28+i*7+d*3)%60)).slice(-2),aircraft:fleet,need:fleet==='B737'?'CPT/FO/4CC':'CPT/FO/2CC',status:status,gate:'A'+(1+(d+i)%12),crewedPercent:(88+(d+i)%11)+'%',sourceUpdatedAt:date+'T04:00:00Z'});
      published.push({rosterId:'ROS-'+date+'-'+i,version:'Published v3',date:date,crewId:crew[(d+i)%crew.length],flight:flight,dutyType:'FLIGHT',reportTime:'05:30',releaseTime:'13:30',base:['KUL','PEN','BKI'][i%3],fleet:fleet,status:status,publishedAt:date+'T00:00:00Z',publishedBy:'planner@acms.demo'});
      if (i<12) checkins.push({checkInId:'CHK-'+date+'-'+i,date:date,crewId:crew[(d+i)%crew.length],flight:flight,reportTime:'05:30',actualTime:'05:'+('0'+(30+(d+i)%25)).slice(-2),status:(d+i)%5===0?'Late':(d+i)%7===0?'Pending':'Checked-in',evidence:['Geo OK','Wi-Fi OK','Device OK','Manual review'][i%4],location:'KUL T1',deviceId:'DEV-'+(100+i),submittedAt:date+'T05:30:00Z'});
    }
    for (var e=0;e<10;e++) { var exFlight=flights[flights.length-16+(e%16)].flight; exceptions.push({exceptionId:'EXC-'+date+'-'+e,date:date,type:exceptionTypes[(d+e)%exceptionTypes.length],crewId:crew[(d+e*2)%crew.length],flight:exFlight,slaMinutes:8+(d+e*6)%80,priority:['High','Med','Low'][(d+e)%3],owner:['OCC Desk','Planner','Recovery','Training'][e%4],status:e%4===0?'Open':'In review',openedAt:date+'T04:00:00Z',resolvedAt:'',notes:'Seeded operational exception'}); }
    changes.push({changeId:'CHG-'+date,rosterId:'ROS-'+date+'-0',version:'Published v3',date:date,crewId:crew[d%crew.length],flight:flights[flights.length-16].flight,field:'status',oldValue:'Crewed',newValue:d%4===0?'Delay risk':'Crewed',reason:'Operations update',changedAt:date+'T06:00:00Z',changedBy:'occ@acms.demo',approvedBy:'planner@acms.demo'});
  }
  out.Flight_Operations=flights; out.Roster_Published=published; out.CheckIns=checkins; out.Attendance=checkins.slice(0,120).map(function(row,n){ return {id:'ATT-SEED-'+n,crewId:row.crewId,date:row.date,flight:row.flight,reportTime:row.reportTime,status:row.status === 'Checked-in' ? 'Present' : row.status,evidence:row.evidence,notes:'Seeded from check-in',submittedAt:row.submittedAt}; }); out.Operational_Exceptions=exceptions; out.Roster_Changes=changes;
  out.Recovery_Cases=exceptions.slice(0,80).map(function(x,n){return {caseId:'REC-'+(n+1),exceptionId:x.exceptionId,issue:x.type,flight:x.flight,priority:x.priority,status:n%3===0?'Open':'Resolved',assignedCrewId:crew[(n+3)%crew.length],decision:'Reserve crew proposed',score:80+n%19,openedAt:x.openedAt,resolvedAt:n%3===0?'':x.date+'T10:00:00Z',owner:x.owner,notes:'Seeded recovery workflow'};});
  out.Crew_Qualifications=crew.map(function(id,n){return {qualificationId:'QUAL-'+id,crewId:id,fleet:n%3===0?'B737':'ATR',qualificationType:n%3===2?'CRM':'Type rating',validFrom:'2025-01-01',expiryDate:n%4===0?'2026-07-15':'2027-01-31',status:'Valid',checkedAt:'2026-06-01T00:00:00Z',checkedBy:'training@acms.demo'};});
  out.Crew_Medical=crew.map(function(id,n){return {medicalId:'MED-'+id,crewId:id,certificateType:'Class 1',validFrom:'2025-07-01',expiryDate:n===3?'2026-07-20':'2027-06-30',status:n===3?'Expiring':'Valid',documentUrl:'https://example.invalid/medical/'+id,reviewedAt:'2026-06-01T00:00:00Z',reviewedBy:'hr@acms.demo'};});
  out.Crew_Availability=crew.map(function(id,n){return {availabilityId:'AVL-'+id,crewId:id,date:'2026-06-15',availabilityStatus:n%5===1?'Training':'Ready',startTime:'00:00',endTime:'23:59',reason:'June roster baseline',source:'Seed',updatedAt:'2026-06-01T00:00:00Z'};});
  out.Rules_Config=[{ruleId:'RULE-REST',rule:'Minimum rest',parameter:'Min rest',value:'12h',type:'Hard',severity:'Hard',active:true,effectiveFrom:'2026-01-01',effectiveTo:'',updatedAt:'2026-06-01T00:00:00Z',updatedBy:'admin@acms.demo'},{ruleId:'RULE-FDP',rule:'Maximum FDP',parameter:'Max FDP',value:'13h',type:'Hard',severity:'Hard',active:true,effectiveFrom:'2026-01-01',effectiveTo:'',updatedAt:'2026-06-01T00:00:00Z',updatedBy:'admin@acms.demo'},{ruleId:'RULE-MED',rule:'Medical expiry',parameter:'Expiry alert',value:'90 days',type:'Soft',severity:'Soft',active:true,effectiveFrom:'2026-01-01',effectiveTo:'',updatedAt:'2026-06-01T00:00:00Z',updatedBy:'admin@acms.demo'}];
  out.Rule_Evaluations=exceptions.slice(0,120).map(function(x,n){return {evaluationId:'EVAL-'+n,rosterId:'ROS-'+x.date+'-0',ruleId:n%2?'RULE-REST':'RULE-MED',date:x.date,crewId:x.crewId,flight:x.flight,result:n%5===0?'Fail':n%3===0?'Warn':'Pass',severity:n%5===0?'Hard':'Soft',action:n%5===0?'Block publish':'Review',overrideReason:'',evaluatedAt:x.openedAt,evaluatedBy:'rules@acms.demo'};});
  out.HR_Policies=[{policyId:'POL-ALLOW',policy:'Allowance calculation & distribution',version:'1.0',owner:'Payroll / Crew Ops',effective:'2026-06-01',status:'Approved',documentUrl:'',approvedBy:'payroll@acms.demo',approvedAt:'2026-06-01T00:00:00Z',reviewDueDate:'2027-06-01'},{policyId:'POL-ATT',policy:'Crew attendance and reporting',version:'1.0',owner:'OCC',effective:'2026-06-01',status:'Approved',documentUrl:'',approvedBy:'occ@acms.demo',approvedAt:'2026-06-01T00:00:00Z',reviewDueDate:'2027-06-01'},{policyId:'POL-MED',policy:'Medical certificate review',version:'1.0',owner:'HR Operations',effective:'2026-06-01',status:'Review due',documentUrl:'',approvedBy:'hr@acms.demo',approvedAt:'2026-06-01T00:00:00Z',reviewDueDate:'2026-07-01'}];
  out.User_RBAC=['Crew','Planner','OCC','Admin'].map(function(role,n){return {userId:'USR-'+n,email:role.toLowerCase()+'@acms.demo',name:role+' Demo User',role:role,scope:role==='Crew'?'Self service':'All operations',crewId:n===0?'CC-519':'',active:true,lastLoginAt:'2026-06-30T08:00:00Z',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-06-01T00:00:00Z'};});
  out.Optimizer_Scenarios=[{scenarioId:'OPT-A',name:'Scenario A',periodStart:'2026-06-01',periodEnd:'2026-06-30',status:'Baseline',totalCost:1820000,openTrips:19,overtimeHours:420,preferenceGrantPercent:61,stabilityPercent:78,createdAt:'2026-06-01T00:00:00Z',createdBy:'planner@acms.demo'},{scenarioId:'OPT-B',name:'Scenario B',periodStart:'2026-06-01',periodEnd:'2026-06-30',status:'Optimized',totalCost:1750000,openTrips:3,overtimeHours:278,preferenceGrantPercent:74,stabilityPercent:83,createdAt:'2026-06-02T00:00:00Z',createdBy:'optimizer@acms.demo'}];
  out.Notifications=exceptions.slice(0,50).map(function(x,n){return {notificationId:'NOT-'+n,recipientUserId:'USR-'+(n%4),channel:n%2?'Email':'Push',template:'Exception alert',subject:x.type+' · '+x.flight,payload:'{}',status:n%11===0?'Retry':'Sent',attemptCount:n%11===0?2:1,sentAt:n%11===0?'':x.openedAt,createdAt:x.openedAt,errorMessage:n%11===0?'Temporary delivery failure':''};});
  return out;
}

function rate_(rates, crewType, code, date) {
  var eligible=rates.filter(function(r) { return r.code === code && (r.crewType === crewType || r.crewType === 'ALL') && String(r.active) === 'true' && (!r.effectiveFrom || r.effectiveFrom <= date) && (!r.effectiveTo || r.effectiveTo >= date); });
  var row=eligible.sort(function(a,b){ return String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)); })[0];
  if (!row) throw new Error('Missing active rate for ' + crewType + '/' + code + ' on ' + date); return Number(row.rate);
}
function mealRate_(rates, region, mealType, date) {
  var row=rates.filter(function(r){ return r.region === region && r.mealType === mealType && String(r.active) === 'true' && (!r.effectiveFrom || r.effectiveFrom <= date) && (!r.effectiveTo || r.effectiveTo >= date); })[0];
  return row ? Number(row.rate) : 0;
}
function layoverCredit_(minutes) { return minutes >= 180 && minutes <= 660 ? 3 : minutes >= 120 && minutes < 180 ? 1 : 0; }
function importAllowanceRoster_(month, rows, actor) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('month must use YYYY-MM.');
  if (!rows.length) throw new Error('At least one roster row is required.');
  var crewIds=readObjects_(SHEETS.CREW).map(function(c){return c.crewId;}), invalid=[];
  rows.forEach(function(row, index){ if (!row.crewId || crewIds.indexOf(row.crewId) < 0 || !row.date || String(row.date).slice(0,7) !== month || !row.dutyType) invalid.push(index+1); });
  var batchId='IMP-'+month+'-'+Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss');
  var status=invalid.length ? 'REJECTED' : 'VALIDATED';
  var batch={importBatchId:batchId,month:month,sourceFileName:'allowance-roster.csv',rowCount:rows.length,validRowCount:rows.length-invalid.length,invalidRowCount:invalid.length,status:status,createdAt:new Date().toISOString(),createdBy:actor,validationSummary:invalid.length ? 'Invalid rows: '+invalid.join(', ') : 'All rows validated'};
  appendObject_(SHEETS.IMPORTS, CORE_SHEET_HEADERS[SHEETS.IMPORTS], batch);
  if (!invalid.length) rows.forEach(function(row,index){ var record={activityId:row.activityId || batchId+'-'+(index+1),importBatchId:batchId,date:row.date,crewId:row.crewId,flight:row.flight||'',sector:row.sector||'',dutyType:row.dutyType,operatingMinutes:row.operatingMinutes||0,paxingMinutes:row.paxingMinutes||0,diversionMinutes:row.diversionMinutes||0,returnToChockMinutes:row.returnToChockMinutes||0,fdpExtensionMinutes:row.fdpExtensionMinutes||0,productiveHours:row.productiveHours||0,layoverMinutes:row.layoverMinutes||0,nightStopRegion:row.nightStopRegion||'Malaysia',breakfastEligible:!!row.breakfastEligible,lunchEligible:!!row.lunchEligible,dinnerEligible:!!row.dinnerEligible,simulatorMinutes:row.simulatorMinutes||0,instructorMinutes:row.instructorMinutes||0,groundDutyMinutes:row.groundDutyMinutes||0,remarks:row.remarks||''}; appendObject_(SHEETS.ROSTER, CORE_SHEET_HEADERS[SHEETS.ROSTER], record); });
  audit_('allowanceImport', actor, batch); return {ok:!invalid.length,batch:batch,invalidRows:invalid};
}
function calculateAllowance_(month, actor) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new Error('month must use YYYY-MM.');
  var existing=readObjects_(SHEETS.RUNS).filter(function(r){return r.month===month && ['DRAFT','CHECKED','APPROVED'].indexOf(r.status)>=0;})[0]; if(existing) return getRun_(existing.runId);
  var crew=readObjects_(SHEETS.CREW).filter(function(r){return String(r.active)==='true';}), roster=readObjects_(SHEETS.ROSTER).filter(function(r){return String(r.date).slice(0,7)===month;}), rates=readObjects_(SHEETS.RATES), meals=readObjects_(SHEETS.MEAL_RATES);
  var batchIds=roster.map(function(r){return r.importBatchId;}).filter(Boolean), runId='RUN-'+month+'-'+Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss');
  var lines=crew.map(function(c){
    var duties=roster.filter(function(r){return r.crewId===c.crewId;}), hours=duties.reduce(function(sum,r){return sum+Number(r.productiveHours||0);},0), layover=duties.reduce(function(sum,r){return sum+Number(r.layoverMinutes||0);},0), credit=c.crewType==='CABIN'?duties.reduce(function(sum,r){return sum+layoverCredit_(Number(r.layoverMinutes||0));},0):0;
    var breakfast=duties.reduce(function(sum,r){return sum+(String(r.breakfastEligible)==='true'?mealRate_(meals,r.nightStopRegion||'Malaysia','BREAKFAST',r.date):0);},0), lunch=duties.reduce(function(sum,r){return sum+(String(r.lunchEligible)==='true'?mealRate_(meals,r.nightStopRegion||'Malaysia','LUNCH',r.date):0);},0), dinner=duties.reduce(function(sum,r){return sum+(String(r.dinnerEligible)==='true'?mealRate_(meals,r.nightStopRegion||'Malaysia','DINNER',r.date):0);},0);
    var sim=duties.reduce(function(sum,r){return sum+Number(r.simulatorMinutes||0);},0)/60, instructor=duties.reduce(function(sum,r){return sum+Number(r.instructorMinutes||0);},0)/60, ground=duties.reduce(function(sum,r){return sum+Number(r.groundDutyMinutes||0);},0)/60;
    var date=month+'-01', pa=c.crewType==='CABIN'?(hours+credit)*rate_(rates,'CABIN','PRODUCTIVITY_ALLOWANCE',date):0, pi=c.crewType==='CABIN'?(hours+credit)*rate_(rates,'CABIN','PRODUCTIVITY_INCENTIVE',date):0, fa=c.crewType==='FLIGHT'?hours*rate_(rates,'FLIGHT','FLIGHT_HOUR_ALLOWANCE',date):0, sa=c.crewType==='FLIGHT'?sim*rate_(rates,'FLIGHT','SIMULATOR_ALLOWANCE',date):0, ia=c.crewType==='FLIGHT'?instructor*rate_(rates,'FLIGHT','INSTRUCTOR_ALLOWANCE',date):0, ga=ground*rate_(rates,'ALL','GROUND_DUTY_ALLOWANCE',date), total=pa+pi+fa+sa+ia+ga+breakfast+lunch+dinner;
    return {runId:runId,crewId:c.crewId,name:c.name,crewType:c.crewType,sourceActivityCount:duties.length,productiveHours:hours.toFixed(2),layoverMinutes:layover,layoverCreditHours:credit,breakfastAmount:breakfast.toFixed(2),lunchAmount:lunch.toFixed(2),dinnerAmount:dinner.toFixed(2),productivityAllowance:pa.toFixed(2),productivityIncentive:pi.toFixed(2),flightAllowance:fa.toFixed(2),simulatorAllowance:sa.toFixed(2),instructorAllowance:ia.toFixed(2),groundDutyAllowance:ga.toFixed(2),adjustmentAmount:'0.00',totalAmount:total.toFixed(2),status:'DRAFT'};
  });
  var total=lines.reduce(function(sum,l){return sum+Number(l.totalAmount);},0), run={runId:runId,month:month,importBatchId:batchIds[0]||'',status:'DRAFT',createdAt:new Date().toISOString(),createdBy:actor,checkedAt:'',checkedBy:'',approvedAt:'',approvedBy:'',finalizedAt:'',finalizedBy:'',totalAmount:total.toFixed(2),crewCount:lines.length};
  appendObject_(SHEETS.RUNS, CORE_SHEET_HEADERS[SHEETS.RUNS], run); lines.forEach(function(l){appendObject_(SHEETS.LINES, CORE_SHEET_HEADERS[SHEETS.LINES], l);}); audit_('allowanceCalculate',actor,{runId:runId,month:month,importBatchId:run.importBatchId}); return {ok:true,run:run,lines:lines};
}
function getRun_(runId) { var run=readObjects_(SHEETS.RUNS).filter(function(r){return r.runId===runId;})[0]; if(!run) throw new Error('Allowance run not found: '+runId); return {ok:true,run:run,lines:readObjects_(SHEETS.LINES).filter(function(l){return l.runId===runId;}),adjustments:readObjects_(SHEETS.ADJUSTMENTS).filter(function(a){return a.runId===runId;})}; }
function advanceAllowanceStatus_(runId,status,actor,comment) { var transitions={DRAFT:'CHECKED',CHECKED:'APPROVED',APPROVED:'FINALIZED'}; var result=getRun_(runId), current=result.run.status; if(transitions[current]!==status) throw new Error('Invalid allowance status transition from '+current+' to '+status); var fields={}; if(status==='CHECKED'){fields.checkedAt=new Date().toISOString();fields.checkedBy=actor;} if(status==='APPROVED'){fields.approvedAt=new Date().toISOString();fields.approvedBy=actor;} if(status==='FINALIZED'){fields.finalizedAt=new Date().toISOString();fields.finalizedBy=actor;} if((status==='APPROVED'||status==='FINALIZED')&&(actor===result.run.createdBy||actor===result.run.checkedBy)) throw new Error('Segregation of duties: preparer/checker cannot '+status.toLowerCase()+' this run.'); fields.status=status; updateRecord_(SHEETS.RUNS,'runId',runId,fields,actor); var approval={approvalId:'APR-'+new Date().getTime(),runId:runId,fromStatus:current,toStatus:status,actor:actor,comment:comment,createdAt:new Date().toISOString()}; appendObject_(SHEETS.APPROVALS,CORE_SHEET_HEADERS[SHEETS.APPROVALS],approval); audit_('allowanceAdvanceStatus',actor,approval); return getRun_(runId); }
function createAllowanceAdjustment_(adjustment,actor) {
  ['runId','crewId','component','amount','reason'].forEach(function(k){if(adjustment[k]===undefined||adjustment[k]==='')throw new Error('adjustment.'+k+' is required');});
  var run=getRun_(adjustment.runId).run; if(run.status==='FINALIZED') throw new Error('Finalized runs require a new correction run.');
  var record={adjustmentId:'ADJ-'+new Date().getTime(),runId:adjustment.runId,crewId:adjustment.crewId,activityId:adjustment.activityId||'',component:adjustment.component,amount:Number(adjustment.amount).toFixed(2),reason:adjustment.reason,status:'APPROVED',requestedBy:actor,approvedBy:actor,createdAt:new Date().toISOString(),approvedAt:new Date().toISOString()};
  appendObject_(SHEETS.ADJUSTMENTS,CORE_SHEET_HEADERS[SHEETS.ADJUSTMENTS],record);
  var sheet=ensureSheet_(SHEETS.LINES,CORE_SHEET_HEADERS[SHEETS.LINES]), values=sheet.getDataRange().getValues(), headers=values[0], runCol=headers.indexOf('runId'), crewCol=headers.indexOf('crewId'), adjustmentCol=headers.indexOf('adjustmentAmount'), totalCol=headers.indexOf('totalAmount');
  var rowIndex=values.findIndex(function(row,index){return index>0 && row[runCol]===record.runId && row[crewCol]===record.crewId;});
  if(rowIndex<1) throw new Error('Allowance line not found for '+record.crewId);
  var currentAdjustment=Number(values[rowIndex][adjustmentCol]||0), currentTotal=Number(values[rowIndex][totalCol]||0), amount=Number(record.amount);
  sheet.getRange(rowIndex+1,adjustmentCol+1).setValue((currentAdjustment+amount).toFixed(2)); sheet.getRange(rowIndex+1,totalCol+1).setValue((currentTotal+amount).toFixed(2));
  var total=readObjects_(SHEETS.LINES).filter(function(line){return line.runId===record.runId;}).reduce(function(sum,line){return sum+Number(line.totalAmount||0);},0);
  updateRecord_(SHEETS.RUNS,'runId',record.runId,{totalAmount:total.toFixed(2)},actor); audit_('allowanceCreateAdjustment',actor,record); return {ok:true,adjustment:record,run:getRun_(record.runId).run};
}
function finalizeRun_(runId,actor) { return advanceAllowanceStatus_(runId,'FINALIZED',actor,'Finalized for payroll'); }

function createAttendance_(attendance, actor) { ['crewId','date','flight','reportTime','status'].forEach(function(k){if(!attendance[k])throw new Error('attendance.'+k+' is required');}); var record={id:'ATT-'+new Date().getTime(),crewId:attendance.crewId,date:attendance.date,flight:attendance.flight,reportTime:attendance.reportTime,status:attendance.status,evidence:attendance.evidence||'',notes:attendance.notes||'',submittedAt:attendance.submittedAt||new Date().toISOString()}; appendObject_(SHEETS.ATTENDANCE,Object.keys(record),record); audit_('attendanceCreate',actor,record); return {ok:true,id:record.id,attendance:record}; }
