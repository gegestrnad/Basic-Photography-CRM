/**
 * back-handler.js — Android back button handling
 *
 * Intercepts the hardware back button in Android WebView so that:
 *  - Open modals/overlays close first (instead of navigating away)
 *  - On Dashboard: double-press back exits the app (with toast confirmation)
 *  - On other pages: back navigates to the previous page naturally
 *
 * Mechanism: history.pushState on page load creates a fake history entry;
 * the WebView's popstate event fires on back press, giving us a chance
 * to intercept before the native back action completes.
 */
(function() {
  'use strict';

  // Detect if this is the landing/dashboard page
  var path = location.pathname.replace(/\\/g, '/').split('/').pop() || '';
  var isDashboard = !path || path === 'index.html' || path === 'dashboard.html';

  // Push a history entry so the back button triggers popstate
  history.pushState({back: 1}, '', location.href);

  var exitArmed = false; // tracks first "no-modal" back press
  var ARM_TIMEOUT = 2000; // ms to reset the arm

  /**
   * Try to close the topmost open overlay by calling its specific
   * close function (which respects formDirty guards, etc.).
   * Returns true if an overlay was found and closed.
   */
  function closeTopOverlay() {
    var overlays = document.querySelectorAll(
      '.modal-overlay.open, .confirm-overlay.open'
    );
    if (overlays.length === 0) return false;

    var o = overlays[overlays.length - 1];
    var id = o.id;

    // Call the page-specific close function when available
    if (id === 'detailModal'       && window.closeModal)         { window.closeModal(); }
    else if (id === 'detailModal'  && window.closeDetail)        { window.closeDetail(); }
    else if (id === 'jobFormModal' && window.closeJobForm)      { window.closeJobForm(); }
    else if (id === 'taskDetailModal' && window.closeTaskDetail){ window.closeTaskDetail(); }
    else if (id === 'taskFormModal' && window.closeTaskForm)    { window.closeTaskForm(); }
    else if (id === 'payDetailModal' && window.closePayDetail)  { window.closePayDetail(); }
    else if (id === 'paymentFormModal' && window.closePaymentForm){ window.closePaymentForm(); }
    else if (id === 'confirmOverlay' && window.closeConfirm)    { window.closeConfirm(); }
    else {
      // Generic fallback – just hide it
      o.classList.remove('open');
    }
    return true;
  }

  window.addEventListener('popstate', function(e) {
    // ── Priority 1: close an open overlay ──
    if (closeTopOverlay()) {
      // Re-arm so the next back press also triggers us
      history.pushState({back: 1}, '', location.href);
      return;
    }

    // ── Priority 2: no overlay — handle exit / navigation ──
    if (!exitArmed) {
      // First back press with no overlay – arm the double-press
      exitArmed = true;

      if (isDashboard) {
        showToast('Press back again to exit');
      }

      // Re-arm so the next back press also reaches us
      history.pushState({back: 1}, '', location.href);

      // Auto-disarm after ARM_TIMEOUT so a single slow press doesn't
      // count as "double"
      setTimeout(function() { exitArmed = false; }, ARM_TIMEOUT);
    } else {
      // Second back press in quick succession – let the native action
      // proceed.  On Dashboard this means the WebView has no more
      // history → activity.finish() (app exits).  On other pages the
      // WebView navigates to the previous page.
      exitArmed = false;
      // DO NOT pushState here – let the current history entry be consumed
    }
  });
})();
