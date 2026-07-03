/* ==========================================================
   Photography Tracker — Cloud Sync Module (cloud-sync.js)
   Google Sheets via Apps Script.

   HOW TO USE:
     1. Add <script src="cloud-sync.js"></script> AFTER data.js
        in every HTML page (dashboard, jobs, payments, tasks, settings).
     2. That's it. If no Script URL is configured in Settings,
        the module is dormant and nothing changes.
   ========================================================== */

var CloudSync = (function () {

  var SYNC_URL_KEY    = 'photo_tracker_sync_url';
  var SYNC_TOKEN_KEY  = 'photo_tracker_sync_token';
  var SYNC_AUTO_KEY   = 'photo_tracker_sync_auto';
  var SYNC_STATUS_KEY = 'photo_tracker_sync_status';

  // ── Config accessors ────────────────────────────────────────

  function getUrl()       { return localStorage.getItem(SYNC_URL_KEY)   || ''; }
  function getToken()     { return localStorage.getItem(SYNC_TOKEN_KEY) || ''; }
  function isAutoSync()   { return localStorage.getItem(SYNC_AUTO_KEY)  === 'true'; }
  function isConfigured() { return getUrl().startsWith('https://'); }

  function saveConfig(url, token, autoSync) {
    localStorage.setItem(SYNC_URL_KEY,   url.trim());
    localStorage.setItem(SYNC_TOKEN_KEY, token.trim());
    localStorage.setItem(SYNC_AUTO_KEY,  autoSync ? 'true' : 'false');
  }

  // ── Status badge ─────────────────────────────────────────────

  function getLastStatus() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_STATUS_KEY)) || null;
    } catch(e) { return null; }
  }

  function setStatus(ok, message) {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      ok: ok,
      message: message,
      time: new Date().toISOString()
    }));
  }

  // ── Push: send localStorage data to Sheets ──────────────────

  function push(onDone) {
    if (!isConfigured()) {
      if (onDone) onDone(false, 'No sync URL configured');
      return;
    }

    var data = {
      jobs:     DataStore.getJobs(),
      payments: DataStore.getPayments(),
      tasks:    DataStore.getTasks()
    };

    var payload = JSON.stringify({
      action: 'push',
      token:  getToken(),
      data:   data
    });

    fetch(getUrl(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    payload
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.ok) {
        setStatus(true, 'Synced at ' + _fmtTime(new Date()));
        if (onDone) onDone(true, 'Synced');
      } else {
        setStatus(false, 'Push error: ' + (json.error || 'unknown'));
        if (onDone) onDone(false, json.error || 'Push failed');
      }
    })
    .catch(function(err) {
      setStatus(false, 'Network error: ' + err.message);
      if (onDone) onDone(false, err.message);
    });
  }

  // ── Pull: load Sheets data into localStorage ─────────────────

  function pull(onDone) {
    if (!isConfigured()) {
      if (onDone) onDone(false, 'No sync URL configured');
      return;
    }

    var url = getUrl() + '?token=' + encodeURIComponent(getToken());

    fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.ok && json.data) {
        // Merge lists from existing data (sheet doesn't store lists)
        var currentLists = DataStore.getLists();
        json.data.lists = currentLists;
        DataStore.importData(JSON.stringify(json.data));
        setStatus(true, 'Pulled at ' + _fmtTime(new Date()));
        if (onDone) onDone(true, 'Data loaded from Sheets');
      } else {
        setStatus(false, 'Pull error: ' + (json.error || 'unknown'));
        if (onDone) onDone(false, json.error || 'Pull failed');
      }
    })
    .catch(function(err) {
      setStatus(false, 'Network error: ' + err.message);
      if (onDone) onDone(false, err.message);
    });
  }

  // ── Auto-sync hook ───────────────────────────────────────────
  // Patches DataStore._save so every write silently pushes to Sheets.
  // Fires push after a 1.5s debounce to batch rapid sequential saves.

  var _debounceTimer = null;

  function _installAutoSyncHook() {
    var originalSave = DataStore._save.bind(DataStore);

    DataStore._save = function() {
      originalSave();                        // always save locally first
      if (!isAutoSync() || !isConfigured()) return;
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(function() {
        push(function(ok, msg) {
          // Silently update status — no toast during auto-sync to avoid
          // interrupting the user mid-flow. Status is visible in Settings.
          console.log('[CloudSync] auto-push:', ok ? 'OK' : msg);
        });
      }, 1500);
    };
  }

  // ── Init ─────────────────────────────────────────────────────

  function init() {
    _installAutoSyncHook();
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _fmtTime(d) {
    return String(d.getHours()).padStart(2,'0') + ':' +
           String(d.getMinutes()).padStart(2,'0') + ':' +
           String(d.getSeconds()).padStart(2,'0');
  }

  // ── Public API ────────────────────────────────────────────────

  return {
    init:         init,
    push:         push,
    pull:         pull,
    saveConfig:   saveConfig,
    getUrl:       getUrl,
    getToken:     getToken,
    isAutoSync:   isAutoSync,
    isConfigured: isConfigured,
    getLastStatus: getLastStatus
  };

})();

// Auto-initialise as soon as the script loads
CloudSync.init();
