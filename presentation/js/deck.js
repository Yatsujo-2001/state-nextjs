/*
  RESET — Internal Design Presentation
  Slide controller: keyboard / click / swipe navigation, fit-to-screen scaling,
  speaker-notes panel and #slide-N deep links.

  Keys
    → ↓ Space PageDown Enter : next
    ← ↑ PageUp Backspace     : previous
    Home / End               : first / last
    F                        : fullscreen
    N                        : speaker notes
    Esc                      : close notes
*/
(function () {
  "use strict";

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var total = slides.length;
  var panel = document.getElementById("notes-panel");
  var panelHead = document.getElementById("notes-head");
  var panelBody = document.getElementById("notes-body");
  var hint = document.getElementById("hint");
  var index = 0;

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--scale", String(s));
  }

  function fromHash() {
    var m = /^#slide-(\d+)$/.exec(window.location.hash);
    if (!m) return 0;
    return Math.min(total, Math.max(1, parseInt(m[1], 10))) - 1;
  }

  function show(n) {
    index = Math.max(0, Math.min(total - 1, n));
    slides.forEach(function (el, i) {
      var on = i === index;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-hidden", on ? "false" : "true");
    });
    var slide = slides[index];
    var notes = slide.querySelector(".notes");
    panelHead.textContent = pad(index + 1) + " / " + pad(total) + " — " + (slide.dataset.title || "");
    panelBody.innerHTML = notes ? notes.innerHTML : "";
    var h = "#slide-" + (index + 1);
    if (window.location.hash !== h) {
      try {
        window.history.replaceState(null, "", h);
      } catch (e) {
        /* some embedded viewers refuse history changes; navigation still works */
      }
    }
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  function toggleNotes(force) {
    var open = typeof force === "boolean" ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
  }

  function toggleFullscreen() {
    var doc = document;
    try {
      if (!doc.fullscreenElement) {
        var p = doc.documentElement.requestFullscreen && doc.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(function () {});
      } else if (doc.exitFullscreen) {
        var q = doc.exitFullscreen();
        if (q && q.catch) q.catch(function () {});
      }
    } catch (e) {
      /* fullscreen is optional */
    }
  }

  function dismissHint() {
    if (hint) hint.classList.add("gone");
  }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") {
      e.preventDefault(); next();
    } else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") {
      e.preventDefault(); prev();
    } else if (k === "Home") {
      e.preventDefault(); show(0);
    } else if (k === "End") {
      e.preventDefault(); show(total - 1);
    } else if (k === "f" || k === "F") {
      toggleFullscreen();
    } else if (k === "n" || k === "N") {
      toggleNotes();
    } else if (k === "Escape") {
      toggleNotes(false);
    } else {
      return;
    }
    dismissHint();
  });

  /* click: left third goes back, the rest goes forward */
  document.addEventListener("click", function (e) {
    if (panel.contains(e.target)) return;
    if (window.getSelection && String(window.getSelection()).length > 0) return;
    if (e.clientX < window.innerWidth / 3) prev(); else next();
    dismissHint();
  });

  /* swipe */
  var touchX = null;
  var touchY = null;
  document.addEventListener("touchstart", function (e) {
    if (panel.contains(e.target)) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
      dismissHint();
    }
  }, { passive: true });

  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", function () {
    var n = fromHash();
    if (n !== index) show(n);
  });

  fit();
  show(fromHash());
  window.setTimeout(dismissHint, 6000);
})();
