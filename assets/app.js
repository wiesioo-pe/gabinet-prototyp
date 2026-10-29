// Prototyp: wyłącznie ulepszenia. Bez JS strona i nawigacja działają normalnie.
(function () {
  "use strict";

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* tryb prywatny itp. */ } }
  };

  // --- Komunikat o urlopie (demonstracja stanu sterowanego z panelu) ---
  function initVacation() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("urlop") === "1") store.set("proto-urlop", "1");
    if (params.get("urlop") === "0") store.set("proto-urlop", "0");
    var on = store.get("proto-urlop") === "1";
    var apply = function () {
      document.querySelectorAll("[data-vacation]").forEach(function (el) { el.hidden = !on; });
      document.querySelectorAll("[data-vacation-off]").forEach(function (el) { el.hidden = on; });
      document.querySelectorAll("[data-toggle-vacation]").forEach(function (a) {
        a.textContent = on ? "Ukryj komunikat o urlopie" : "Pokaż komunikat o urlopie";
        a.setAttribute("href", on ? "?urlop=0" : "?urlop=1");
      });
    };
    document.querySelectorAll("[data-toggle-vacation]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        on = !on;
        store.set("proto-urlop", on ? "1" : "0");
        apply();
      });
    });
    apply();
  }

  // --- Formularz kontaktowy: walidacja i stany (w docelowej wersji walidacja jest po stronie serwera) ---
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var summary = document.getElementById("form-errors");
    var summaryList = summary.querySelector("ul");
    var sendError = document.getElementById("send-error");
    var submit = form.querySelector("button[type=submit]");
    var message = form.querySelector("#f-message");
    var counter = document.getElementById("f-message-count");
    var simulateFailure = false;

    document.querySelectorAll("[data-simulate-failure]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        simulateFailure = true;
        a.textContent = "Następna wysyłka zakończy się błędem";
      });
    });

    if (message && counter) {
      var update = function () { counter.textContent = message.value.length + " / 500 znaków"; };
      message.addEventListener("input", update);
      update();
    }

    function setError(id, text) {
      var field = form.querySelector("#" + id).closest(".field");
      var err = field.querySelector(".error");
      var input = field.querySelector("input, textarea");
      if (text) {
        field.classList.add("has-error");
        err.textContent = text;
        input.setAttribute("aria-invalid", "true");
      } else {
        field.classList.remove("has-error");
        input.removeAttribute("aria-invalid");
      }
      return text;
    }

    function validContact(v) {
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      var digits = v.replace(/[\s()+\-]/g, "");
      var phone = /^\d{9,15}$/.test(digits) && /^[+\d\s()\-]+$/.test(v);
      return email || phone;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      sendError.hidden = true;
      var name = form.querySelector("#f-name").value.trim();
      var contact = form.querySelector("#f-contact").value.trim();
      var msg = message ? message.value : "";
      var errors = [];

      var e1 = setError("f-name", !name ? "Potrzebne jest imię lub pseudonim." : (name.length > 80 ? "Maksymalnie 80 znaków." : ""));
      if (e1) errors.push(["f-name", "Imię lub pseudonim"]);
      var e2 = setError("f-contact", !contact ? "Potrzebny jest adres e-mail albo numer telefonu." :
        (!validContact(contact) ? "Format nie jest rozpoznany. Przykład: imie@domena.pl lub +48 500 000 000." : ""));
      if (e2) errors.push(["f-contact", "Kontakt zwrotny"]);
      var e3 = setError("f-message", msg.length > 500 ? "Wiadomość może mieć maksymalnie 500 znaków." : "");
      if (e3) errors.push(["f-message", "Wiadomość"]);

      if (errors.length) {
        summaryList.innerHTML = "";
        errors.forEach(function (pair) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#" + pair[0];
          a.textContent = pair[1];
          li.appendChild(a);
          summaryList.appendChild(li);
        });
        summary.hidden = false;
        summary.focus();
        return;
      }
      summary.hidden = true;

      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      var label = submit.querySelector("span");
      var original = label.textContent;
      label.textContent = "Wysyłanie wiadomości…";

      window.setTimeout(function () {
        if (simulateFailure) {
          simulateFailure = false;
          submit.disabled = false;
          submit.removeAttribute("aria-busy");
          label.textContent = "Spróbuj ponownie";
          sendError.hidden = false;
          sendError.focus();
          return;
        }
        // Sukces: przejście na stronę potwierdzenia bez danych w adresie.
        window.location.href = "potwierdzenie.html";
        label.textContent = original;
      }, 900);
    });
  }

  // --- Panel: podgląd na żywo ---
  function initPanel() {
    var panel = document.getElementById("panel-form");
    if (!panel) return;
    var $ = function (id) { return document.getElementById(id); };
    var fmt = function (n) { return Math.round(n).toLocaleString("pl-PL"); };
    var dateFmt = function (v) {
      if (!v) return "…";
      var d = new Date(v + "T12:00:00");
      return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
    };

    function render() {
      var cons = parseFloat($("p-consult").value) || 0;
      var sess = parseFloat($("p-session").value) || 0;
      $("pv-consult").textContent = fmt(cons) + " zł";
      $("pv-session").textContent = fmt(sess) + " zł";
      $("pv-month").textContent = fmt(sess * 4) + "–" + fmt(sess * 5) + " zł";
      $("pv-hours").textContent = $("p-hours").value || "…";
      $("pv-reply").textContent = ($("p-reply-min").value || "1") + "–" + ($("p-reply-max").value || "2");
      var on = $("p-vac-on").checked;
      $("vac-fields").hidden = !on;
      $("pv-vacation").hidden = !on;
      $("pv-vac-title").textContent = "Przerwa urlopowa: " + dateFmt($("p-vac-from").value) + " – " + dateFmt($("p-vac-to").value);
      $("pv-vac-text").textContent = $("p-vac-text").value;
    }
    panel.addEventListener("input", render);
    panel.addEventListener("change", render);
    panel.addEventListener("submit", function (e) {
      e.preventDefault();
      var toast = $("panel-toast");
      toast.hidden = false;
      toast.focus();
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initVacation();
    initContactForm();
    initPanel();
  });
})();
