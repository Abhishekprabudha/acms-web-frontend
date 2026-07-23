import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../backend/Code.gs', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'backend/Code.gs' });

const tables = {};
const audits = [];
context.appendObject_ = (table, headers, record) => {
  tables[table] ??= [];
  tables[table].push(Object.fromEntries(headers.map((header) => [header, record[header] ?? ''])));
};
context.readObjects_ = (table) => tables[table] ?? [];
context.audit_ = (action, actor, detail) => audits.push({ action, actor, detail });

const notification = {
  notificationId: 'TEST-NOTIFICATION-001',
  recipientUserId: 'USR-1',
  channel: 'Email',
  template: 'Write verification',
  subject: 'Backend write confirmed',
  payload: '{}',
  status: 'Queued',
  attemptCount: 0,
  sentAt: '',
  createdAt: '2026-07-23T00:00:00Z',
  errorMessage: ''
};

const created = context.dispatch_({ action: 'recordCreate', table: 'Notifications', record: notification, actor: 'test' });
assert.equal(created.ok, true);
assert.deepEqual(JSON.parse(JSON.stringify(created.record)), notification);
assert.equal(audits.length, 1);
assert.equal(audits[0].action, 'recordCreate');

const fetched = context.dispatch_({ action: 'recordGet', table: 'Notifications', keyField: 'notificationId', keyValue: notification.notificationId });
assert.equal(fetched.ok, true);
assert.deepEqual(JSON.parse(JSON.stringify(fetched.record)), notification);
assert.throws(() => context.getRecord_('Notifications', 'unknown', 'value'), /Unknown key field/);
assert.ok(context.supportedActions_().includes('recordGet'));

console.log('Backend write and recordGet verification passed.');
