/**
 * Photography Tracker — Google Apps Script
 * =========================================
 * Paste this entire file into your Google Sheet's Script Editor:
 *   Extensions > Apps Script > replace Code.gs contents > Save
 *
 * Then deploy:
 *   Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone          ← required so the app can reach it
 *   Click Deploy > copy the Web App URL > paste into Settings in the tracker app
 *
 * The script writes three sheets: Jobs, Payments, Tasks.
 * It also supports full data pull (GET) back to the app.
 *
 * SECURITY NOTE:
 *   "Anyone" access means anyone with the URL can read/write your sheet.
 *   The URL is a long random token — treat it like a password. Do not share it publicly.
 *   For a solo or small-team setup this is fine. For wider use, add a shared secret
 *   check (see the AUTH_TOKEN section below).
 */

// ── Optional shared-secret auth ───────────────────────────────────────────────
// Set this to any random string, then enter the same string in the app's
// Settings page under "Sync Secret". Leave blank to disable auth check.
var AUTH_TOKEN = '';   // e.g. 'my-secret-abc123'

// ── Sheet names ───────────────────────────────────────────────────────────────
var SHEET_JOBS     = 'Jobs';
var SHEET_PAYMENTS = 'Payments';
var SHEET_TASKS    = 'Tasks';
var SHEET_META     = '_SyncMeta';

// ── Column definitions ────────────────────────────────────────────────────────
var JOB_COLS = [
  'id','client','phone','jobType','jobDate','location',
  'status','paymentStatus','totalFee','deposit','balance',
  'photographers','editors','clientSource','created','notes'
];

var PAYMENT_COLS = [
  'id','jobId','client','paymentDate','amount','method',
  'status','jobTotalFee','jobBalance','notes'
];

var TASK_COLS = [
  'id','jobId','client','task','dueDate','status','notes'
];

// ── Entry points ──────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!checkAuth(body.token)) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }
    var action = body.action;
    if (action === 'push') {
      return handlePush(body.data);
    }
    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    var token = (e.parameter && e.parameter.token) ? e.parameter.token : '';
    if (!checkAuth(token)) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }
    return handlePull();
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ── Push: app -> sheet ────────────────────────────────────────────────────────

function handlePush(data) {
  if (!data || !data.jobs || !data.payments || !data.tasks) {
    return jsonResponse({ ok: false, error: 'Invalid data payload' });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  writeSheet(ss, SHEET_JOBS,     JOB_COLS,     data.jobs,     jobRowMapper);
  writeSheet(ss, SHEET_PAYMENTS, PAYMENT_COLS, data.payments, paymentRowMapper);
  writeSheet(ss, SHEET_TASKS,    TASK_COLS,    data.tasks,    taskRowMapper);
  writeMeta(ss);

  return jsonResponse({ ok: true, synced: new Date().toISOString() });
}

// ── Pull: sheet -> app ────────────────────────────────────────────────────────

function handlePull() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var jobs     = readSheet(ss, SHEET_JOBS,     JOB_COLS,     jobFromRow);
  var payments = readSheet(ss, SHEET_PAYMENTS, PAYMENT_COLS, paymentFromRow);
  var tasks    = readSheet(ss, SHEET_TASKS,    TASK_COLS,    taskFromRow);

  return jsonResponse({ ok: true, data: { jobs: jobs, payments: payments, tasks: tasks } });
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────

function writeSheet(ss, name, cols, records, mapper) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();

  // Header row
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
  sheet.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  if (!records || records.length === 0) return;

  // Data rows
  var rows = records.map(function(rec) { return mapper(rec, cols); });
  sheet.getRange(2, 1, rows.length, cols.length).setValues(rows);

  // Auto-resize columns
  for (var c = 1; c <= cols.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

function readSheet(ss, name, cols, fromRow) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var data = sheet.getRange(2, 1, last - 1, cols.length).getValues();
  return data
    .filter(function(row) { return row[0] !== '' && row[0] !== null; })
    .map(function(row) { return fromRow(row, cols); });
}

function writeMeta(ss) {
  var sheet = ss.getSheetByName(SHEET_META) || ss.insertSheet(SHEET_META);
  sheet.clearContents();
  sheet.getRange('A1').setValue('Last Synced');
  sheet.getRange('B1').setValue(new Date().toISOString());
  sheet.getRange('A2').setValue('Synced By');
  sheet.getRange('B2').setValue('Photography Tracker App');
}

// ── Row mappers: record -> sheet row ──────────────────────────────────────────

function jobRowMapper(job, cols) {
  return cols.map(function(col) {
    var v = job[col];
    if (col === 'jobDate' || col === 'created') {
      return v ? excelSerialToDate(v) : '';
    }
    return (v === null || v === undefined) ? '' : v;
  });
}

function paymentRowMapper(p, cols) {
  return cols.map(function(col) {
    var v = p[col];
    if (col === 'paymentDate') {
      return v ? excelSerialToDate(v) : '';
    }
    return (v === null || v === undefined) ? '' : v;
  });
}

function taskRowMapper(t, cols) {
  return cols.map(function(col) {
    var v = t[col];
    if (col === 'dueDate') {
      return v ? excelSerialToDate(v) : '';
    }
    return (v === null || v === undefined) ? '' : v;
  });
}

// ── Row parsers: sheet row -> record ─────────────────────────────────────────

function jobFromRow(row, cols) {
  var obj = {};
  cols.forEach(function(col, i) {
    var v = row[i];
    if (col === 'jobDate' || col === 'created') {
      obj[col] = v ? dateToExcelSerial(v) : null;
    } else if (col === 'totalFee' || col === 'deposit' || col === 'balance') {
      obj[col] = Number(v) || 0;
    } else {
      obj[col] = v === '' ? '' : v;
    }
  });
  return obj;
}

function paymentFromRow(row, cols) {
  var obj = {};
  cols.forEach(function(col, i) {
    var v = row[i];
    if (col === 'paymentDate') {
      obj[col] = v ? dateToExcelSerial(v) : null;
    } else if (col === 'amount' || col === 'jobTotalFee' || col === 'jobBalance') {
      obj[col] = Number(v) || 0;
    } else {
      obj[col] = v === '' ? '' : v;
    }
  });
  return obj;
}

function taskFromRow(row, cols) {
  var obj = {};
  cols.forEach(function(col, i) {
    var v = row[i];
    if (col === 'dueDate') {
      obj[col] = v ? dateToExcelSerial(v) : null;
    } else {
      obj[col] = v === '' ? '' : v;
    }
  });
  return obj;
}

// ── Date conversion ───────────────────────────────────────────────────────────

function excelSerialToDate(serial) {
  // Excel serial 0 = 1899-12-30
  var d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  var y = d.getUTCFullYear();
  var m = String(d.getUTCMonth() + 1).padStart(2, '0');
  var day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function dateToExcelSerial(v) {
  var d;
  if (v instanceof Date) {
    d = v;
  } else {
    // Expecting 'YYYY-MM-DD'
    var parts = String(v).split('-');
    if (parts.length !== 3) return null;
    d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
  }
  return Math.round((d.getTime() / 86400000) + 25569);
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function checkAuth(token) {
  if (!AUTH_TOKEN || AUTH_TOKEN === '') return true;
  return token === AUTH_TOKEN;
}

// ── Response helper ───────────────────────────────────────────────────────────

function jsonResponse(obj) {
  var output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
