/* Nexora — AI Operations Studio · investor concept demo
   All data on this site is synthetic. No documents are uploaded and no
   external AI, compliance or storage service is called by this script. */

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */

  function initNav() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("navigation");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Workflow simulator (workflow.html) ---------- */

  function initWorkflow() {
    var runBtn = document.getElementById("run-workflow");
    if (!runBtn) return; // not on this page

    var resetBtn = document.getElementById("reset-workflow");
    var downloadBtn = document.getElementById("download-evidence");
    var phaseLabel = document.getElementById("phase-label");
    var stageTitle = document.getElementById("stage-title");
    var stageDescription = document.getElementById("stage-description");
    var stageDetail = document.getElementById("stage-detail");
    var statusLine = document.getElementById("workflow-status");
    var auditLog = document.getElementById("audit-log");
    var stepItems = Array.prototype.slice.call(document.querySelectorAll(".steps li"));

    var timers = [];
    var evidence = null;

    var STAGES = [
      {
        phase: "Ready to begin",
        title: "A complete view of the incoming file.",
        description: "Run this sample pack to see extraction, validation and a mandatory review gate.",
        detail: function () {
          return docListHTML([
            ["Certificate of incorporation", "EN"],
            ["Business registration certificate", "繁中"],
            ["Director identity record", "EN"],
            ["Ownership declaration", "EN / 繁中"],
            ["Registered address proof", "EN"],
            ["Client engagement form", "EN"]
          ]);
        },
        log: null
      },
      {
        phase: "Extracting",
        title: "Fields extracted, source-linked.",
        description: "Every value keeps a pointer back to the page and document it came from.",
        detail: function () {
          return fieldListHTML([
            ["Entity name (EN)", "Harbour Trading Limited"],
            ["Entity name (繁中)", "海港貿易有限公司"],
            ["Incorporation date", "14 Mar 2021"],
            ["Registered address", "12/F, Central, Hong Kong"],
            ["Director", "CHEUNG, Alex"],
            ["Ownership", "100% — Harbour Holdings Ltd"]
          ]);
        },
        log: "Extraction complete — 6 documents, 18 fields, all source-linked."
      },
      {
        phase: "Validating",
        title: "Completeness checked. One conflict found.",
        description: "The pack is complete, but the English and Traditional Chinese entity names don't reconcile automatically.",
        detail: function () {
          return flagListHTML([
            { text: "All 6 required documents present", tag: "OK", warn: false },
            { text: "Director identity matches ownership declaration", tag: "OK", warn: false },
            { text: "EN / 繁中 entity name needs a human check", tag: "REVIEW", warn: true }
          ]);
        },
        log: "Validation run — 2 checks passed, 1 exception raised to the review queue."
      },
      {
        phase: "Awaiting your decision",
        title: "Human review — over to you.",
        description: "The simulation pauses here. Nothing proceeds until the flagged item is approved.",
        detail: function () {
          return (
            '<div class="review-note"><strong>Exception:</strong> confirm that “Harbour Trading Limited” and “海港貿易有限公司” refer to the same registered entity before the pack can complete.</div>' +
            '<div class="workflow-actions" style="margin-top:14px">' +
            '<button class="button lime" id="approve-review" type="button">Approve & continue →</button>' +
            "</div>"
          );
        },
        log: "Waiting at the review gate — flagged item requires explicit approval."
      },
      {
        phase: "Completing",
        title: "Pack approved. Preparing the output.",
        description: "The approved pack is assembled with the decision trail attached.",
        detail: function () {
          return evidenceSummaryHTML([
            ["Documents processed", "6"],
            ["Fields extracted", "18"],
            ["Exceptions raised", "1"],
            ["Exceptions resolved by reviewer", "1"],
            ["Reviewer decision", "Approved — names reconciled"]
          ]);
        },
        log: "Onboarding pack approved and assembled for delivery."
      },
      {
        phase: "Complete",
        title: "Evidence pack ready.",
        description: "Download a JSON record of this simulation's steps, sources and your sample decision.",
        detail: function () {
          return '<div class="review-note">This is a synthetic evidence file for demo purposes only — no real client data is included.</div>';
        },
        log: "Evidence pack generated. Nothing was sent externally."
      }
    ];

    function docListHTML(rows) {
      return (
        '<div class="document-list">' +
        rows
          .map(function (r) {
            return "<div>▤ " + r[0] + " <span>" + r[1] + "</span></div>";
          })
          .join("") +
        "</div>"
      );
    }

    function fieldListHTML(rows) {
      return (
        '<div class="field-list">' +
        rows
          .map(function (r) {
            return (
              '<div><span class="field-name">' +
              r[0] +
              '</span><span class="field-value">' +
              r[1] +
              "</span></div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    function flagListHTML(rows) {
      return (
        '<div class="flag-list">' +
        rows
          .map(function (r) {
            return (
              '<div class="' +
              (r.warn ? "warn" : "") +
              '"><span>' +
              r.text +
              '</span><span class="flag-tag">' +
              r.tag +
              "</span></div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    function evidenceSummaryHTML(rows) {
      return (
        '<div class="evidence-summary">' +
        rows
          .map(function (r) {
            return "<div><span>" + r[0] + "</span><strong>" + r[1] + "</strong></div>";
          })
          .join("") +
        "</div>"
      );
    }

    function setStep(index) {
      stepItems.forEach(function (li, i) {
        li.classList.toggle("active", i === index);
        li.classList.toggle("done", i < index);
      });
      var stage = STAGES[index];
      phaseLabel.textContent = stage.phase;
      stageTitle.textContent = stage.title;
      stageDescription.textContent = stage.description;
      stageDetail.innerHTML = stage.detail();
      if (index === 3) {
        var approveBtn = document.getElementById("approve-review");
        if (approveBtn) {
          approveBtn.addEventListener("click", function () {
            logLine("Reviewer approved — entity names confirmed as one company.");
            clearTimers();
            advanceFrom(4);
          });
        }
      }
    }

    function logLine(text) {
      var li = document.createElement("li");
      li.textContent = text;
      auditLog.appendChild(li);
      auditLog.scrollTop = auditLog.scrollHeight;
    }

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function advanceFrom(index) {
      if (index > 5) return;
      setStep(index);
      if (STAGES[index].log) logLine(STAGES[index].log);
      statusLine.textContent = "Step " + (index + 1) + " of 6 · " + STAGES[index].phase;

      if (index === 3) {
        statusLine.textContent = "Paused at the review gate · your decision required";
        return; // wait for explicit approval
      }
      if (index === 5) {
        statusLine.textContent = "Complete · evidence pack ready to download";
        resetBtn.disabled = false;
        downloadBtn.hidden = false;
        evidence = buildEvidence();
        return;
      }
      var t = setTimeout(function () {
        advanceFrom(index + 1);
      }, 1100);
      timers.push(t);
    }

    function buildEvidence() {
      return {
        case: "NX-024 · Harbour Trading Limited · 海港貿易有限公司",
        generated: new Date().toISOString(),
        note: "Synthetic demo data. No real client information.",
        steps: STAGES.map(function (s, i) {
          return { step: i + 1, phase: s.phase, log: s.log };
        }),
        exception: {
          field: "Entity name (EN / 繁中)",
          status: "Resolved",
          decision: "Approved by reviewer — names reconciled",
          decidedInSimulation: true
        }
      };
    }

    function downloadJSON(data, filename) {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function resetAll() {
      clearTimers();
      evidence = null;
      resetBtn.disabled = true;
      downloadBtn.hidden = true;
      runBtn.disabled = false;
      auditLog.innerHTML = "<li>Sample case created. No real client data.</li>";
      statusLine.textContent = "Ready · Sample documents only";
      setStep(0);
    }

    runBtn.addEventListener("click", function () {
      runBtn.disabled = true;
      resetBtn.disabled = false;
      logLine("Sample workflow started.");
      advanceFrom(1);
    });

    resetBtn.addEventListener("click", resetAll);

    downloadBtn.addEventListener("click", function () {
      if (!evidence) evidence = buildEvidence();
      downloadJSON(evidence, "nexora-sample-evidence-pack.json");
    });

    setStep(0);
  }

  /* ---------- Platform workspace demo (platform.html) ---------- */

  function initPlatform() {
    var panel = document.getElementById("workspace-panel");
    if (!panel) return;

    var tabs = Array.prototype.slice.call(document.querySelectorAll('button[role="tab"]'));

    var VIEWS = {
      dashboard: function () {
        return (
          panelHeading("Dashboard", "Synthetic workspace · sample data only") +
          statRow([
            ["6", "Cases this month"],
            ["18", "Exceptions raised"],
            ["94%", "Fields extracted clean"],
            ["2.1 days", "Avg. time to decision"]
          ]) +
          dataTable(
            ["Case", "Stage", "Status"],
            [
              ["NX-024 · Harbour Trading", "Human review", "review"],
              ["NX-019 · Meridian Corporate Services", "Complete", "ok"],
              ["NX-017 · Silverline Secretarial", "Extract", "wait"],
              ["NX-015 · Tideway Holdings", "Complete", "ok"]
            ]
          )
        );
      },
      projects: function () {
        return (
          panelHeading("Projects", "Recurring engagements · sample data only") +
          dataTable(
            ["Client", "Engagement", "Owner", "Status"],
            [
              ["Meridian Corporate Services", "Managed run", "A. Cheung", "ok"],
              ["Silverline Secretarial", "Outcome sprint", "H. Chaudhury", "wait"],
              ["Tideway Holdings", "Diagnostic", "S. Panesar", "ok"],
              ["Harbour Trading Limited", "Outcome sprint", "A. Cheung", "review"]
            ]
          )
        );
      },
      agents: function () {
        return (
          panelHeading("Agents", "Task-scoped automations · sample data only") +
          statRow([
            ["4", "Active in this workspace"],
            ["0", "Acting without review"],
            ["100%", "Outputs source-linked"]
          ]) +
          dataTable(
            ["Agent", "Role", "Status"],
            [
              ["Intake reader", "Collects & files incoming documents", "ok"],
              ["Field extractor", "Extracts source-linked fields", "ok"],
              ["Completeness checker", "Flags missing or conflicting items", "ok"],
              ["Pack assembler", "Prepares the approved output pack", "wait"]
            ]
          )
        );
      },
      evidence: function () {
        return (
          panelHeading("Evidence", "Decision trails · sample data only") +
          dataTable(
            ["Case", "Exception", "Decision", "Decided by"],
            [
              ["NX-024", "EN / 繁中 name mismatch", "Approved — reconciled", "Reviewer"],
              ["NX-019", "Address format", "Approved — corrected", "Reviewer"],
              ["NX-015", "None raised", "—", "—"]
            ]
          )
        );
      },
      reports: function () {
        return (
          panelHeading("Reports", "Delivery metrics · sample data only") +
          statRow([
            ["12", "Cases delivered to date"],
            ["1", "Exception per case, average"],
            ["0", "Cases completed without review"]
          ]) +
          '<p class="panel-empty">Quarterly and client-facing report templates are not yet built in this concept demo.</p>'
        );
      },
      clients: function () {
        return (
          panelHeading("Clients", "Sample account list · sample data only") +
          dataTable(
            ["Client", "Sector", "City", "Status"],
            [
              ["Meridian Corporate Services", "Corporate services", "London", "ok"],
              ["Silverline Secretarial", "Company secretarial", "Hong Kong", "wait"],
              ["Tideway Holdings", "Accounting take-on", "London", "ok"],
              ["Harbour Trading Limited", "Corporate services", "Hong Kong", "review"]
            ]
          )
        );
      }
    };

    function panelHeading(title, meta) {
      return (
        '<div class="panel-heading"><h2>' +
        title +
        "</h2><span>" +
        meta +
        "</span></div>"
      );
    }

    function statRow(items) {
      return (
        '<div class="stat-row">' +
        items
          .map(function (i) {
            return '<div class="stat-tile"><span>' + i[0] + "</span><small>" + i[1] + "</small></div>";
          })
          .join("") +
        "</div>"
      );
    }

    function dataTable(headers, rows) {
      var statusCol = headers.length - 1;
      var head = "<tr>" + headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
      var body = rows
        .map(function (row) {
          var cells = row
            .map(function (cell, i) {
              if (i === statusCol && ["ok", "review", "wait"].indexOf(cell) !== -1) {
                var label = cell === "ok" ? "On track" : cell === "review" ? "In review" : "Waiting";
                return '<td><span class="status-chip ' + cell + '">' + label + "</span></td>";
              }
              return "<td>" + cell + "</td>";
            })
            .join("");
          return "<tr>" + cells + "</tr>";
        })
        .join("");
      return '<table class="data-table">' + head + body + "</table>";
    }

    function renderView(name) {
      var build = VIEWS[name] || VIEWS.dashboard;
      panel.innerHTML = build();
    }

    function selectTab(tab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", tab.id);
      renderView(tab.getAttribute("data-view"));
      tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(tab);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(index + 1) % tabs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length];
        if (next) {
          e.preventDefault();
          selectTab(next);
        }
      });
    });

    renderView("dashboard");
  }

  /* ---------- Contact form (about.html / contact.html) ---------- */

  function initContact() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var result = document.getElementById("contact-result");
    var draftEl = document.getElementById("contact-draft");
    var downloadBtn = document.getElementById("download-enquiry");
    var currentDraft = "";

    var params = new URLSearchParams(window.location.search);
    var presetInterest = params.get("interest");
    if (presetInterest) {
      var select = form.querySelector('[name="interest"]');
      if (select) {
        Array.prototype.forEach.call(select.options, function (opt) {
          if (opt.value === presetInterest) select.value = presetInterest;
        });
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var lines = [
        "Nexora — enquiry draft (demo only, not sent)",
        "Generated: " + new Date().toLocaleString(),
        "",
        "Name: " + data.get("name"),
        "Work email: " + data.get("email"),
        "Company: " + data.get("company"),
        "Interested in: " + data.get("interest"),
        "",
        "Message:",
        data.get("message")
      ];
      currentDraft = lines.join("\n");
      draftEl.textContent = currentDraft;
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        if (!currentDraft) return;
        var blob = new Blob([currentDraft], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "nexora-enquiry-draft.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initWorkflow();
    initPlatform();
    initContact();
  });
})();
