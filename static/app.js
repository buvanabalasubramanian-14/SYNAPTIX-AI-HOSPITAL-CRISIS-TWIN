/* ============================================================
   AI Hospital Crisis Twin - AI-Powered Hospital Crisis Prediction & Prevention
   Developed by Team SynaptiX
   Predict. Warn. Prevent. Protect.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    initClock();
    initCharts();
});

/* ==================== CLOCK ==================== */
function initClock() {
    const el = document.getElementById("clock");
    function tick() {
        const now = new Date();
        el.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    tick();
    setInterval(tick, 1000);
}

/* ==================== VIEW NAVIGATION (SPA) ==================== */
function go(view) {
    // Hide all views
    document.querySelectorAll(".view").forEach(function (v) {
        v.classList.remove("active");
    });
    // Show the target view
    const target = document.getElementById("view-" + view);
    if (target) target.classList.add("active");

    // Update sidebar active
    document.querySelectorAll(".side-item[data-view]").forEach(function (item) {
        item.classList.toggle("active", item.getAttribute("data-view") === view);
    });

    // Close mobile menu
    closeMobileNav();

    // Refresh dashboard overview content when shown
    if (view === "dashboard") {
        refreshOverview();
    }

    // Re-render charts when analytics view opens
    if (view === "analytics") {
        setTimeout(function () {
            if (window.chartsInitialized) {
                Object.values(window.chartInstances).forEach(function (c) { if (c) c.resize(); });
            }
        }, 150);
    }

    // Render crisis impact relationships when digital twin opens
    if (view === "twin") {
        renderTwinImpacts();
    }

    // Refresh the resource optimizer context for the active scenario when opened
    if (view === "resource") {
        applyResourceContext();
    }

    // Show the guided workflow progress bar during the crisis journey
    const wf = document.getElementById("wf-progress");
    if (wf) {
        if (view === "simulator" || view === "response" || view === "resource") {
            wf.style.display = "flex";
            if (!document.querySelector(".wfp-step.done,.wfp-step.current") && view === "simulator") updateWorkflowProgress("simulator");
        } else {
            wf.style.display = "none";
        }
    }
}

function refreshOverview() {
    const d = predictionData[currentPred] || predictionData.icu;
    const topCrisis = document.getElementById("overview-top-crisis");
    const topAction = document.getElementById("overview-top-action");
    if (topCrisis) topCrisis.textContent = d.crisis || d.name;
    if (topAction) topAction.textContent = d.reco;
}

function toggleMobileNav() {
    const overlay = document.getElementById("mobile-menu-overlay");
    const open = !overlay.classList.contains("show");
    overlay.classList.toggle("show");
    document.body.classList.toggle("nav-locked", open);
}
function closeMobileNav() {
    const overlay = document.getElementById("mobile-menu-overlay");
    if (overlay) {
        overlay.classList.remove("show");
        document.body.classList.remove("nav-locked");
    }
}

/* ==================== TOASTS ==================== */
function toast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const t = document.createElement("div");
    t.className = "toast " + (type || "info");
    const icon = document.createElement("div");
    icon.className = "toast-icon";
    if (type === "success") icon.textContent = "✓";
    else if (type === "error") icon.textContent = "✕";
    else icon.textContent = "ℹ";
    const text = document.createElement("span");
    text.className = "toast-text";
    text.textContent = message;
    t.appendChild(icon);
    t.appendChild(text);
    container.appendChild(t);
    setTimeout(function () {
        t.classList.add("removing");
        setTimeout(function () { t.remove(); }, 300);
    }, 3200);
}

/* ==================== DEPARTMENT DATA ==================== */
const deptData = {
    "ICU": { cap: 50, occ: 46, av: 4, risk: "CRITICAL", trend: "Increasing", issue: "ICU capacity approaching maximum. Elevated patient inflow detected.", reco: "Activate overflow beds and redirect non-critical patients immediately." },
    "EMERGENCY": { cap: 50, occ: 44, av: 6, risk: "HIGH", trend: "Increasing", issue: "Emergency patient load rising 18%. Triage handling high volume.", reco: "Deploy backup staff to triage and open observation area." },
    "GENERAL WARD": { cap: 200, occ: 144, av: 56, risk: "MODERATE", trend: "Stable", issue: "Ward occupancy at moderate level. Some bed clustering.", reco: "Balance patient distribution across ward sections." },
    "STAFF": { cap: 100, occ: 64, av: 36, risk: "MODERATE", trend: "Decreasing", issue: "Nurse availability below 70% safety threshold.", reco: "Notify backup medical staff and adjust shifts." },
    "LABORATORY": { cap: 50, occ: 24, av: 26, risk: "LOW", trend: "Decreasing", issue: "Laboratory within capacity. Test backlog low.", reco: "Maintain current capacity. No action needed." },
    "OPERATION THEATRE": { cap: 20, occ: 11, av: 9, risk: "MODERATE", trend: "Stable", issue: "OT scheduling backlog causing surgery delays.", reco: "Open second OT room to clear backlog." },
    "STAFF COORDINATION": { cap: 100, occ: 64, av: 36, risk: "MODERATE", trend: "Decreasing", issue: "Staff coordination under pressure from shift gaps.", reco: "Redistribute staff to critical departments." }
};

/* ==================== LIVE MONITOR: OPEN DEPT MODAL ==================== */
let currentDept = null;
function openDept(name) {
    const d = deptData[name];
    if (!d) return;
    currentDept = name;

    document.getElementById("dept-modal-title").textContent = name;
    const riskEl = document.getElementById("dept-modal-risk");
    riskEl.textContent = d.risk;
    riskEl.style.background = "rgba(239,68,68,0.12)";
    riskEl.style.color = "#f87171";
    if (d.risk === "HIGH") { riskEl.style.background = "rgba(245,158,11,0.12)"; riskEl.style.color = "#f59e0b"; }
    if (d.risk === "MODERATE") { riskEl.style.background = "rgba(34,211,238,0.12)"; riskEl.style.color = "#67e8f9"; }
    if (d.risk === "LOW") { riskEl.style.background = "rgba(34,197,94,0.12)"; riskEl.style.color = "#4ade80"; }
    document.getElementById("dept-modal-trend").textContent = "Trend: " + d.trend;
    document.getElementById("d-capacity").textContent = d.cap;
    document.getElementById("d-occupied").textContent = d.occ;
    document.getElementById("d-available").textContent = d.av;
    document.getElementById("d-issue").textContent = d.issue;
    document.getElementById("d-reco").textContent = d.reco;

    document.getElementById("dept-modal").classList.add("active");
}

function closeDeptModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("dept-modal").classList.remove("active");
}

function analyzeFutureRisk() {
    if (!currentDept) { toast("Select a department first", "error"); return; }
    analyzeFutureRiskForDept(currentDept);
}

function analyzeFutureRiskForDept(dept) {
    const mapping = { ICU: "icu", EMERGENCY: "emergency", "GENERAL WARD": "beds", WARD: "beds", STAFF: "staff", "STAFF COORDINATION": "staff", LABORATORY: "resources", "OPERATION THEATRE": "resources" };
    const key = mapping[dept] || "icu";
    go("predict");
    const btn = document.querySelector('.pred-scenario[data-pred="' + key + '"]');
    if (btn) selectPrediction(key, btn);
    const predD = predictionData[key];
    toast("Future risk analyzed for " + dept + ": " + predD.name + " predicted", "info");
}

function viewDetails() {
    toast("Detailed status for " + currentDept + " opened. " + d().issue, "info");
}

function requestDeptSupport() {
    toast("Support request sent for " + currentDept + " department", "success");
}

/* ==================== DIGITAL TWIN ==================== */
function selectTwinDept(el, name) {
    document.querySelectorAll(".twin-unit").forEach(function (u) { u.classList.remove("selected"); });
    el.classList.add("selected");

    const d = deptData[name];
    document.getElementById("twin-empty").style.display = "none";
    document.getElementById("twin-content").style.display = "block";
    document.getElementById("twin-title").textContent = name;
    document.getElementById("td-occu").textContent = d.occ + "/" + d.cap;
    const riskEl = document.getElementById("td-risk");
    riskEl.textContent = d.risk;
    riskEl.className = d.risk === "CRITICAL" ? "text-red" : d.risk === "HIGH" ? "text-orange" : d.risk === "MODERATE" ? "text-cyan" : "text-green";
    document.getElementById("td-beds").textContent = d.av;
    document.getElementById("td-result").style.display = "none";
}

function simulateDeptLoad() {
    const d = deptData[document.getElementById("twin-title").textContent] || deptData["ICU"];
    const res = document.getElementById("td-result");
    res.style.display = "block";
    res.innerHTML = "Loading " + determineScenarioImpact(document.getElementById("twin-title").textContent) + " simulated for <b>" + document.getElementById("twin-title").textContent + "</b>. Risk projected: <span class='" + (d.risk === "CRITICAL" ? "text-red" : "text-orange") + "'>" + d.risk + "</span>";
    toast("Load simulation complete for " + document.getElementById("twin-title").textContent, "success");
}

function determineScenarioImpact(dept) {
    if (dept === "ICU") return "+12% load";
    if (dept === "EMERGENCY") return "+18% load";
    return "+8% load";
}

function analyzeDept() {
    const name = document.getElementById("twin-title").textContent;
    const mapping = { ICU: "icu", EMERGENCY: "emergency", "GENERAL WARD": "beds", WARD: "beds", STAFF: "staff", "STAFF COORDINATION": "staff", LABORATORY: "resources", "OPERATION THEATRE": "resources" };
    const key = mapping[name] || "icu";
    go("predict");
    const btn = document.querySelector('.pred-scenario[data-pred="' + key + '"]');
    if (btn) selectPrediction(key, btn);
    toast("Predicted risk opened for " + name, "info");
}

function optimizeDept() {
    const name = document.getElementById("twin-title").textContent;
    const res = document.getElementById("td-result");
    res.style.display = "block";
    const d = deptData[name];
    res.innerHTML = "Resources optimized for <b>" + name + "</b>. Occupancy reduced, efficiency improved.";
    if (name === "ICU") {
        document.getElementById("td-occu").textContent = "38/50";
        document.getElementById("td-beds").textContent = "12";
    }
    toast("Resource optimization applied to " + name, "success");
}

/* ==================== EARLY WARNING ==================== */
const warningData = {
    1: { title: "ICU Overload Warning", sev: "CRITICAL", dept: "ICU", cause: "Increasing patient inflow, decreasing beds", impact: "ICU may run out of beds", reco: "Activate backup ICU beds and notify backup medical staff now", what: "ICU may run out of beds", when: "Within 45 minutes", why: "Increasing patient inflow, decreasing beds", affected: "ICU, Emergency, Staff", pred: "icu" },
    2: { title: "Emergency Patient Surge Warning", sev: "HIGH", dept: "Emergency", cause: "Regional influx of urgent cases", impact: "Emergency load may exceed capacity", reco: "Deploy backup staff to triage and open overflow area", what: "Emergency load may exceed capacity", when: "Within 2 hours", why: "Regional influx of urgent cases", affected: "Emergency, Triage, Staff", pred: "emergency" },
    3: { title: "Staff Shortage Warning", sev: "MEDIUM", dept: "Staff", cause: "Shift gaps and increased demand", impact: "Delayed patient care", reco: "Notify backup medical staff", what: "Delayed patient care", when: "Within 3 hours", why: "Shift gaps and increased demand", affected: "Staff, Emergency, ICU", pred: "staff" },
    4: { title: "Bed Shortage Warning", sev: "LOW", dept: "General Ward", cause: "Sustained high occupancy", impact: "Bed shortage for new patients", reco: "Redirect non-critical patients and activate backup beds", what: "Bed shortage for new patients", when: "Within 4 hours", why: "Sustained high occupancy", affected: "General Ward, Emergency", pred: "beds" },
    5: { title: "Resource Shortage Warning", sev: "MEDIUM", dept: "Operation Theatre", cause: "Equipment and supply usage rising", impact: "Equipment unavailability and delays", reco: "Activate backup equipment and coordinate restocking", what: "Equipment unavailability and delays", when: "Within 5 hours", why: "Equipment and supply usage rising", affected: "Operation Theatre, Staff", pred: "resources" }
};

let warningIds = [1, 2, 3, 4, 5];
let currentWarningId = 1;

function viewWarningDetail(id) {
    const w = warningData[id];
    if (!w) return;
    currentWarningId = id;
    document.getElementById("wm-title").textContent = w.title;
    const sevEl = document.getElementById("wm-sev");
    sevEl.textContent = w.sev;
    sevEl.className = "dept-risk sev-" + (w.sev === "CRITICAL" ? "crit" : w.sev === "HIGH" ? "high" : w.sev === "MEDIUM" ? "med" : "low");
    document.getElementById("wm-dept").textContent = w.dept;
    document.getElementById("wm-cause").textContent = "WHY: " + w.why;
    document.getElementById("wm-impact").textContent = "WHAT: " + w.what + " · WHEN: " + w.when;
    document.getElementById("wm-reco").textContent = "RECOMMENDED: " + w.reco;
    document.getElementById("warning-modal").classList.add("active");
}

function viewPreventionPlanFromModal() {
    closeWarningModal();
    viewPreventionPlan(currentWarningId);
}

function viewPreventionPlan(id) {
    const w = warningData[id];
    if (!w) return;
    toast("Opening preventive action plan for: " + w.title, "info");
    selectPreventionContext(w.pred);
    go("response");
}

function closeWarningModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("warning-modal").classList.remove("active");
}

function acknowledgeWarning(el) {
    const card = el.closest(".warning-card");
    card.classList.add("acknowledged");
    toast("Warning acknowledged", "info");
    closeWarningModal();
}

function acknowledgeFromModal() {
    const id = currentWarningId || 1;
    const card = document.querySelector('.warning-card[data-wid="' + id + '"]');
    if (card) {
        card.classList.add("acknowledged");
        toast("Warning acknowledged", "info");
    }
    closeWarningModal();
}

function resolveWarning(el) {
    const card = el.closest(".warning-card");
    const id = parseInt(card.getAttribute("data-wid"));
    card.classList.add("resolved");
    card.style.opacity = "0.4";
    card.style.pointerEvents = "none";
    warningIds = warningIds.filter(function (w) { return w !== id; });
    updateWarnCount();
    toast("Warning resolved", "success");
    closeWarningModal();
}

function resolveFromModal() {
    toast("Warning resolved", "success");
    closeWarningModal();
    // Resolve the first visible unresolved card
    const cards = document.querySelectorAll(".warning-card:not(.resolved)");
    if (cards.length > 0) {
        resolveWarning(cards[0].querySelector("button:not([onclick*='viewWarning']):not([onclick*='acknowledge'])") || cards[0]);
        const id = parseInt(cards[0].getAttribute("data-wid"));
        cards[0].classList.add("resolved");
        cards[0].style.opacity = "0.4";
        cards[0].style.pointerEvents = "none";
        warningIds = warningIds.filter(function (w) { return w !== id; });
        updateWarnCount();
    }
}

function updateWarnCount() {
    const tag = document.getElementById("warn-count");
    if (tag) tag.textContent = warningIds.length + " ALERTS";
    const dashAlerts = document.getElementById("dash-alerts");
    if (dashAlerts) dashAlerts.textContent = warningIds.length;
}

/* ==================== AI PREDICTION ==================== */
const predictionData = {
    icu: {
        name: "ICU OVERLOAD RISK", risk: "HIGH", conf: "89%", conf2: "92%", time: "45 MIN", meter: 72,
        analysis: "Data-driven reasons: increasing patient inflow, shrinking available ICU beds, and reduced staff availability detected in live hospital data.",
        impact: "ICU may run out of beds, delaying critical care. Emergency admissions may be redirected, increasing load on other departments.",
        reco: "Activate backup ICU beds and notify backup medical staff immediately to prevent escalation.",
        mapTo: 1, crisis: "ICU OVERLOAD RISK",
        aiScore: "89", trendDir: "Increasing",
        riskFactors: [["ICU Occupancy Trend", "Increasing", "text-red"], ["Emergency Patient Inflow", "High", "text-orange"], ["Available ICU Beds", "Decreasing", "text-orange"], ["Bed Release Rate", "Slow", "text-yellow"], ["Staff Availability", "Low", "text-orange"]],
        inputs: [["ICU Occupancy", "91%"], ["Emergency Inflow", "Increasing"], ["Available Beds", "9"], ["Staff Availability", "64%"]],
        trendText: "ICU occupancy increasing continuously over the last 4 hours (72% → 91%). Emergency load climbing. Available bed capacity decreasing. Staff availability trending below the 70% safety threshold.",
        conclusion: "ICU capacity may reach critical level",
        conclusionTime: "Expected within 1–4 hours"
    },
    emergency: {
        name: "EMERGENCY PATIENT SURGE RISK", risk: "HIGH", conf: "93%", conf2: "90%", time: "30 MIN", meter: 78,
        analysis: "Data-driven reasons: emergency department admission rate accelerating and predicted load to exceed 95% within 30 minutes.",
        impact: "Emergency area may be overwhelmed, causing longer triage wait times and delayed care for critical patients.",
        reco: "Deploy emergency backup staff and open triage overflow area to absorb the surge.",
        mapTo: 2, crisis: "EMERGENCY SURGE RISK",
        aiScore: "93", trendDir: "Increasing",
        riskFactors: [["Admission Rate", "Increasing", "text-red"], ["Triage Wait Time", "Rising", "text-orange"], ["Emergency Occupancy", "High", "text-orange"], ["Staff Availability", "Low", "text-orange"], ["Discharge Flow", "Slow", "text-yellow"]],
        inputs: [["Emergency Load", "88%"], ["Admission Rate", "+18%"], ["Triage Capacity", "Near Max"], ["Staff Availability", "64%"]],
        trendText: "Emergency admission rate accelerating with load climbing from 72% to 88% in 4 hours. Triage queue building. Backup capacity not yet activated.",
        conclusion: "Emergency department may become overwhelmed",
        conclusionTime: "Expected within 30 minutes"
    },
    beds: {
        name: "BED SHORTAGE RISK", risk: "MEDIUM", conf: "84%", conf2: "82%", time: "60 MIN", meter: 58,
        analysis: "Data-driven reasons: available beds dropping as occupancy rises across wards, with admission rate continuing to climb.",
        impact: "New patient admissions may be delayed or redirected due to lack of available beds.",
        reco: "Redirect non-critical patients and activate backup beds to keep capacity available.",
        mapTo: 4, crisis: "BED SHORTAGE RISK",
        aiScore: "84", trendDir: "Increasing",
        riskFactors: [["Ward Occupancy", "Rising", "text-orange"], ["Available Beds", "Decreasing", "text-red"], ["Admission Flow", "Sustained", "text-orange"], ["Discharge Rate", "Slow", "text-yellow"], ["Bed Release Rate", "Slow", "text-yellow"]],
        inputs: [["Ward Occupancy", "72%"], ["Available Beds", "56"], ["Admission Flow", "Steady"], ["Discharge Rate", "Low"]],
        trendText: "Ward occupancy climbing while available beds fall. Admission flow remains sustained and discharge rate is slow, shrinking bed buffer hour over hour.",
        conclusion: "Available beds may run out for new admissions",
        conclusionTime: "Expected within 1–4 hours"
    },
    staff: {
        name: "STAFF SHORTAGE RISK", risk: "MEDIUM", conf: "84%", conf2: "81%", time: "60 MIN", meter: 58,
        analysis: "Data-driven reasons: nurse availability dropped below the 70% safety threshold and further shortfall expected as shift continues.",
        impact: "Delayed patient care, increased workload, and reduced responsiveness in critical departments.",
        reco: "Notify backup medical staff and redistribute staff from lower-priority departments.",
        mapTo: 3, crisis: "STAFF SHORTAGE RISK",
        aiScore: "84", trendDir: "Decreasing",
        riskFactors: [["Nurse Availability", "Below 70%", "text-red"], ["Shift Coverage", "Gaps", "text-orange"], ["Workload", "Rising", "text-orange"], ["Overtime Capacity", "Low", "text-yellow"], ["Backup Pool", "Unused", "text-orange"]],
        inputs: [["Staff Availability", "64%"], ["Safety Threshold", "70%"], ["Shift Gaps", "3 open"], ["ICU Workload", "High"]],
        trendText: "Staff availability falling from 70% to 64% over the shift. Multiple open shifts and rising workload in ICU and Emergency. Back up staff pool not yet activated.",
        conclusion: "Staff availability may drop below safe levels",
        conclusionTime: "Expected within 1–3 hours"
    },
    resources: {
        name: "RESOURCE SHORTAGE RISK", risk: "LOW", conf: "77%", conf2: "74%", time: "120 MIN", meter: 40,
        analysis: "Data-driven reasons: equipment and supply usage rising while restock capacity remains fixed.",
        impact: "Potential equipment unavailability and supply delays for scheduled procedures.",
        reco: "Activate backup equipment and coordinate restocking to avoid shortages.",
        mapTo: 5, crisis: "RESOURCE SHORTAGE RISK",
        aiScore: "77", trendDir: "Increasing",
        riskFactors: [["Equipment Usage", "Rising", "text-orange"], ["Supply Stock Level", "Medium", "text-yellow"], ["Restock Capacity", "Fixed", "text-yellow"], ["OT Utilization", "High", "text-orange"], ["Oxygen Reserve", "Stable", "text-green"]],
        inputs: [["Equipment Utilization", "78%"], ["Supply Stock", "Medium"], ["OT Load", "55%"], ["Oxygen Reserve", "Stable"]],
        trendText: "Equipment and supply usage rising while restock capacity remains fixed. Two scheduled procedures may be affected if usage continues at this pace.",
        conclusion: "Critical equipment or supplies may run short",
        conclusionTime: "Expected within 2–6 hours"
    },
    mass: {
        name: "MASS CASUALTY EVENT RISK", risk: "CRITICAL", conf: "96%", conf2: "94%", time: "20 MIN", meter: 92,
        analysis: "Data-driven reasons: simultaneous critical patient inflow across all departments detected with emergency capacity and ICU beds nearing zero buffer.",
        impact: "Care capacity may be overwhelmed hospital-wide, causing severe delays for critical patients across every department.",
        reco: "Activate the full emergency response protocol and coordinate nearby hospital support immediately.",
        mapTo: 6, crisis: "MASS CASUALTY EVENT RISK",
        aiScore: "96", trendDir: "Critical",
        riskFactors: [["Patient Inflow", "Critical", "text-red"], ["Emergency Capacity", "Critical", "text-red"], ["ICU Beds", "Critical", "text-red"], ["Staff Availability", "Low", "text-orange"], ["Multi-Dept Load", "Critical", "text-red"]],
        inputs: [["Emergency Load", "92%"], ["ICU Beds", "2"], ["Staff Availability", "52%"], ["Multi-Dept Load", "Critical"]],
        trendText: "Critical patient inflow detected simultaneously across Emergency, ICU and General Ward. Capacity buffers exhausted. Hospital-wide response required immediately.",
        conclusion: "Hospital-wide capacity may be overwhelmed",
        conclusionTime: "Expected within 20–60 minutes"
    }
};

let currentPred = "icu";
let workflowSeverity = "HIGH";
let workflowActive = false;

function selectPrediction(key, el) {
    currentPred = key;
    document.querySelectorAll(".pred-scenario").forEach(function (p) { p.classList.remove("active"); });
    el.classList.add("active");

    const d = predictionData[key];
    if (!d) return;
    document.getElementById("pred-name").textContent = d.name;
    const riskEl = document.getElementById("pred-risk");
    riskEl.textContent = d.risk;
    riskEl.className = d.risk === "HIGH" || d.risk === "CRITICAL" ? "pm-value text-red" : d.risk === "MEDIUM" ? "pm-value text-orange" : "pm-value text-green";
    document.getElementById("pred-conf").textContent = d.conf;
    document.getElementById("pred-conf2").textContent = d.conf2;
    document.getElementById("pred-time").textContent = d.time;
    document.getElementById("pred-meter").style.width = d.meter + "%";
    document.getElementById("pred-analysis").textContent = d.analysis;
    if (document.getElementById("pred-impact")) document.getElementById("pred-impact").textContent = d.impact;
    document.getElementById("pred-reco").textContent = d.reco;

    // Explainable AI: factor list + chips
    if (document.getElementById("pred-ai-score")) document.getElementById("pred-ai-score").textContent = d.aiScore;
    if (document.getElementById("pred-ai-conf")) document.getElementById("pred-ai-conf").textContent = d.conf2;
    if (document.getElementById("pred-trend")) {
        document.getElementById("pred-trend").textContent = d.trendDir;
        document.getElementById("pred-trend").className = "ai-chip-value " + (d.trendDir === "Increasing" ? "text-red" : d.trendDir === "Decreasing" ? "text-orange" : "text-green");
    }
    const factors = document.getElementById("pred-factors");
    if (factors) {
        factors.innerHTML = "";
        d.riskFactors.forEach(function (f) {
            const row = document.createElement("div");
            row.className = "ai-factor";
            const label = document.createElement("span");
            label.textContent = f[0];
            const val = document.createElement("b");
            val.className = f[2] || "text-orange";
            val.textContent = f[1];
            row.appendChild(label);
            row.appendChild(val);
            factors.appendChild(row);
        });
    }

    // Prediction logic pipeline
    if (document.getElementById("pred-inputs")) {
        const inputsBox = document.getElementById("pred-inputs");
        inputsBox.innerHTML = "";
        d.inputs.forEach(function (inp) {
            const t = document.createElement("span");
            t.className = "logic-tag";
            t.textContent = inp[0] + " → " + inp[1];
            inputsBox.appendChild(t);
        });
    }
    if (document.getElementById("pred-trend-text")) document.getElementById("pred-trend-text").textContent = d.trendText;
    if (document.getElementById("pred-assessment")) document.getElementById("pred-assessment").innerHTML = "Risk Score: <b class='text-red'>" + d.aiScore + "%</b> &nbsp;·&nbsp; Confidence: <b class='text-purple'>" + d.conf2 + "</b> &nbsp;·&nbsp; Trend: <b class='text-orange'>" + d.trendDir + "</b>";
    if (document.getElementById("pred-conclusion")) document.getElementById("pred-conclusion").textContent = "🚨 " + d.conclusion;
    if (document.getElementById("pred-conclusion-time")) document.getElementById("pred-conclusion-time").textContent = d.conclusionTime + " · " + d.time;

    // Highlight affected departments in the Digital Twin
    const affected = riskAffectedDepts(key);
    document.querySelectorAll(".twin-unit").forEach(function (u) {
        const dep = u.getAttribute("data-dept") || "";
        const hit = affected.indexOf(dep) !== -1 || dep.indexOf("STAFF") === 0 && affected.indexOf("STAFF") !== -1;
        u.classList.toggle("risk-highlight", hit);
    });

    // Update twin impact relationships when visible
    renderTwinImpacts();

    toast("Predicted risk loaded: " + d.name, "info");
}

function riskAffectedDepts(key) {
    const map = {
        icu: ["ICU", "EMERGENCY", "STAFF"],
        emergency: ["EMERGENCY", "ICU", "STAFF"],
        beds: ["GENERAL WARD", "EMERGENCY", "ICU"],
        staff: ["STAFF", "ICU", "EMERGENCY"],
        resources: ["OPERATION THEATRE", "STAFF", "LABORATORY"]
    };
    return map[key] || [];
}

/* ==================== DIGITAL TWIN IMPACT RELATIONSHIPS ==================== */
const twinImpactData = {
    icu: { crisis: "ICU OVERLOAD RISK", impacts: [["ICU", "Critical", "red"], ["Emergency", "High", "orange"], ["Staff", "Increased workload", "orange"], ["General Ward", "Moderate impact", "yellow"]] },
    emergency: { crisis: "EMERGENCY SURGE RISK", impacts: [["Emergency", "Critical", "red"], ["ICU", "High", "orange"], ["Staff", "Increased workload", "orange"]] },
    beds: { crisis: "BED SHORTAGE RISK", impacts: [["General Ward", "Critical", "red"], ["Emergency", "High", "orange"], ["ICU", "Moderate impact", "yellow"]] },
    staff: { crisis: "STAFF SHORTAGE RISK", impacts: [["Staff", "Critical", "red"], ["ICU", "High", "orange"], ["Emergency", "High", "orange"]] },
    resources: { crisis: "RESOURCE SHORTAGE RISK", impacts: [["Operation Theatre", "High", "orange"], ["Staff", "Moderate impact", "yellow"], ["Laboratory", "Low impact", "green"]] },
    mass: { crisis: "MASS CASUALTY EVENT RISK", impacts: [["Emergency", "Critical", "red"], ["ICU", "Critical", "red"], ["Staff", "Critical", "red"], ["General Ward", "High", "orange"]] }
};

const twinDeptStatus = {
    "ICU": ["91%", "CRITICAL", "red"], "EMERGENCY": ["88%", "HIGH", "orange"], "GENERAL WARD": ["72%", "MODERATE", "yellow"],
    "STAFF": ["64%", "WARNING", "orange"], "LABORATORY": ["48%", "NORMAL", "green"], "OPERATION THEATRE": ["55%", "NORMAL", "green"]
};

function renderTwinImpacts() {
    const box = document.getElementById("twin-impacts");
    if (!box) return;
    const d = twinImpactData[currentPred] || twinImpactData.icu;
    let html = '<div class="ti-crisis">ACTIVE RISK: <b>' + d.crisis + '</b></div>';
    html += '<div class="ti-legend"><span class="ti-badge ti-source">SOURCE DEPT</span><span class="ti-arrow">→</span><span class="ti-badge ti-noteb">AFFECTED DEPT · ESTIMATED IMPACT</span></div>';
    html += '<div class="ti-flow">';
    d.impacts.forEach(function (imp, idx) {
        if (idx === 0) {
            html += '<div class="ti-row"><span class="ti-badge ti-source">' + imp[0] + ' · SOURCE</span></div>';
        } else {
            html += '<div class="ti-row"><span class="ti-badge ti-source">SOURCE</span>' +
                '<span class="ti-arrow">→</span>' +
                '<span class="ti-badge ti-aff ti-' + imp[2] + '">' + imp[0] + ' · ' + imp[1] + '</span></div>';
        }
    });
    html += '</div>';
    box.innerHTML = html;
    // mark affected twin units
    document.querySelectorAll(".twin-unit").forEach(function (u) {
        const dep = u.getAttribute("data-dept") || "";
        const hit = d.impacts.some(function (i) { return i[0].indexOf(dep) !== -1 || dep.indexOf(i[0]) !== -1; });
        u.classList.toggle("risk-highlight", hit);
    });
}

function goToWarning() {
    const d = predictionData[currentPred];
    toast("Opening early warning for: " + d.crisis, "info");
    go("warning");
    const cards = document.querySelectorAll(".warning-card");
    cards.forEach(function (card) {
        card.classList.remove("highlight");
        if (parseInt(card.getAttribute("data-wid")) === d.mapTo) card.classList.add("highlight");
    });
}

/* ==================== CRISIS SIMULATOR ==================== */
// state
let simScenario = "icu";
let simIntensity = "MEDIUM";
let simRunning = false;
let simPaused = false;
let simTimer = null;
let simStep = 0;
const simBaseline = { patients: 126, emergency: 88, icu: 91, staff: 64, risk: 72 };

const simConfigs = {
    surge: { patientsT: 260, emergencyT: 96, icuT: 95, staffT: 55, riskT: 88, label: "Sudden Patient Surge" },
    mass: { patientsT: 420, emergencyT: 99, icuT: 98, staffT: 48, riskT: 96, label: "Mass Casualty Event" },
    icu: { patientsT: 160, emergencyT: 90, icuT: 99, staffT: 58, riskT: 92, label: "ICU Overload" },
    staff: { patientsT: 140, emergencyT: 92, icuT: 93, staffT: 35, riskT: 90, label: "Staff Shortage" },
    beds: { patientsT: 190, emergencyT: 95, icuT: 96, staffT: 52, riskT: 88, label: "Bed Shortage" },
    emergency: { patientsT: 220, emergencyT: 99, icuT: 94, staffT: 50, riskT: 89, label: "Emergency Patient Surge" }
};

/* Dynamic simulation result sets per scenario + severity */
const simResultSets = {
    icu: {
        title: "ICU OVERLOAD",
        explanation: "Based on the current operational trend, failure to take preventive action may result in ICU overload, increased emergency waiting time, and higher staff workload.",
        moderate: { icu: "91% → 95%", emerg: "88% → 91%", staff: "High → Critical", beds: "9 → 4", risk: "High → Critical" },
        high: { icu: "91% → 97%", emerg: "88% → 94%", staff: "High → Critical", beds: "9 → 3", risk: "High → Critical" },
        critical: { icu: "91% → 98%", emerg: "88% → 96%", staff: "High → Critical", beds: "9 → 2", risk: "High → Critical" }
    },
    emergency: {
        title: "EMERGENCY PATIENT SURGE",
        explanation: "Based on the current operational trend, failure to take preventive action may result in emergency overload, longer patient waiting times, and reduced available capacity.",
        moderate: { icu: "88% → 94%", emerg: "88% → 94%", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" },
        high: { icu: "88% → 96%", emerg: "88% → 96%", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" },
        critical: { icu: "88% → 98%", emerg: "88% → 98%", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" }
    },
    staff: {
        title: "STAFF SHORTAGE",
        explanation: "Based on the current operational trend, failure to take preventive action may result in reduced staff availability, critical department coverage gaps, and reduced emergency response capacity.",
        moderate: { icu: "64% → 55%", emerg: "Moderate → High", staff: "High → Critical", beds: "Reduced", risk: "High → Critical" },
        high: { icu: "64% → 52%", emerg: "Moderate → Critical", staff: "High → Critical", beds: "Reduced", risk: "High → Critical" },
        critical: { icu: "64% → 48%", emerg: "Moderate → Critical", staff: "High → Critical", beds: "Reduced", risk: "High → Critical" }
    },
    beds: {
        title: "BED SHORTAGE",
        explanation: "Based on the current operational trend, failure to take preventive action may result in bed shortage, increasing patient placement delay, and rising emergency holding load.",
        moderate: { icu: "9 → 5", emerg: "High → High", staff: "Moderate → High", beds: "Moderate → High", risk: "High → Critical" },
        high: { icu: "9 → 3", emerg: "High → Critical", staff: "Moderate → High", beds: "Moderate → High", risk: "High → Critical" },
        critical: { icu: "9 → 2", emerg: "High → Critical", staff: "Moderate → High", beds: "Moderate → High", risk: "High → Critical" }
    },
    mass: {
        title: "MASS CASUALTY EVENT",
        explanation: "Based on the current operational trend, failure to take preventive action may result in multi-department overload, critical staff workload, and severe system-wide impact.",
        moderate: { icu: "High → Critical", emerg: "High → Critical", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" },
        high: { icu: "High → Critical", emerg: "High → Critical", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" },
        critical: { icu: "High → Critical", emerg: "High → Critical", staff: "High → Critical", beds: "Decreasing", risk: "High → Critical" }
    }
};

const simResultLabels = {
    icu: ["ICU Occupancy", "Emergency Load", "Staff Workload", "Available Beds", "Overall Hospital Risk"],
    emergency: ["Emergency Load", "Patient Waiting Time", "Staff Workload", "Available Emergency Capacity", "Overall Hospital Risk"],
    staff: ["Staff Availability", "Department Coverage", "Staff Workload", "Emergency Response Capacity", "Overall Hospital Risk"],
    beds: ["Available Beds", "Patient Placement Delay", "Emergency Holding Load", "General Ward Capacity", "Overall Hospital Risk"],
    mass: ["ICU Capacity", "Emergency Load", "Staff Workload", "Available Beds", "Overall Hospital Risk"]
};

function selectSimScenario(el) {
    document.querySelectorAll(".scenario-card").forEach(function (c) { c.classList.remove("selected"); });
    el.classList.add("selected");
    simScenario = el.getAttribute("data-scn");
    if (!simRunning) resetSimDisplay();
}

function selectSimIntensity(el) {
    document.querySelectorAll(".intensity-option").forEach(function (b) { b.classList.remove("active"); });
    el.classList.add("active");
    simIntensity = el.getAttribute("data-int");
}

function startSimulation() {
    if (simRunning) { toast("Simulation already running", "info"); return; }
    simRunning = true;
    simStep = 0;
    simPaused = false;
    document.getElementById("sim-idle").style.display = "none";
    document.getElementById("sim-live").style.display = "block";
    document.getElementById("sim-stage").classList.add("running");
    document.getElementById("sim-impact").style.display = "none";

    // Reset baseline values
    setSimValue("sm-patients", simBaseline.patients);
    setSimValue("sm-emergency", simBaseline.emergency + "%");
    setSimValue("sm-icu", simBaseline.icu + "%");
    setSimValue("sm-staff", simBaseline.staff + "%");
    setSimValue("sm-risk", simBaseline.risk);

    const phases = [
        "INITIALIZING SIMULATION...",
        "ESCALATING PATIENT INFLOW...",
        "INCREASING EMERGENCY LOAD...",
        "ADJUSTING ICU OCCUPANCY...",
        "REDUCING STAFF AVAILABILITY...",
        "RISK SCORE ASSESSING...",
        "UPDATING DIGITAL TWIN...",
        "AI CRISIS ANALYSIS...",
        "CALCULATING PREDICTED IMPACT...",
        "RECOMMENDING RESPONSE PLAN..."
    ];

    simStep = 0;
    updateSimPhase(phases[simStep]);
    toast("Simulation started: " + simConfigs[simScenario].label + " (" + simIntensity + ")", "info");
    updateWorkflowProgress("simulator");

    simTimer = setInterval(function () {
        if (simPaused) return;
        simStep++;
        if (simStep >= phases.length) {
            // End simulation
            clearInterval(simTimer);
            simTimer = null;
            simRunning = false;
            document.getElementById("sim-phase").textContent = "SIMULATION COMPLETE";
            document.getElementById("ai-text").textContent = "Simulation complete. Predicted impact shown — view the prevention solution to avoid this outcome.";
            document.getElementById("sim-impact").style.display = "block";
            simulateProtectedDepartments();
            toast("Simulation complete. View impact.", "success");
            return;
        }

        updateSimPhase(phases[simStep]);

        // Live value updates based on progress
        const cfg = simConfigs[simScenario];
        const intFactor = simIntensity === "LOW" ? 0.4 : simIntensity === "MEDIUM" ? 0.7 : simIntensity === "HIGH" ? 1 : 1.3;
        const progress = simStep / phases.length;

        // Patient count
        const patients = Math.round(simBaseline.patients + (cfg.patientsT - simBaseline.patients) * progress * intFactor);
        setSimValue("sm-patients", patients);

        // Emergency
        const emerg = Math.round(simBaseline.emergency + (cfg.emergencyT - simBaseline.emergency) * progress * intFactor);
        setSimValue("sm-emergency", Math.min(99, emerg) + "%");

        // ICU
        const icu = Math.round(simBaseline.icu + (cfg.icuT - simBaseline.icu) * progress * intFactor);
        setSimValue("sm-icu", Math.min(99, icu) + "%");

        // Staff
        const staff = Math.round(simBaseline.staff + (cfg.staffT - simBaseline.staff) * progress * intFactor);
        setSimValue("sm-staff", Math.max(20, staff) + "%");

        // Risk
        const risk = Math.round(simBaseline.risk + (cfg.riskT - simBaseline.risk) * progress * intFactor);
        setSimValue("sm-risk", risk);

        updateSimTwin(icu, emerg, staff, progress);
        updateSimAI(progress, cfg);
    }, 700);
}

function updateSimPhase(text) {
    document.getElementById("sim-phase").textContent = text;
}

function setSimValue(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(val);
    el.classList.remove("text-red");
    el.classList.remove("text-orange");
    const n = parseInt(val);
    if (id === "sm-risk") {
        if (n > 85) { el.classList.add("text-red"); }
        else if (n > 75) { el.classList.add("text-orange"); }
    }
}

function updateSimTwin(icu, emerg, staff, progress) {
    const pills = document.querySelectorAll("#sts-row .sts-pill");
    pills.forEach(function (pill) {
        const dep = pill.getAttribute("data-dep");
        let heat = false;
        if (dep === "ICU" && icu > 94) heat = true;
        if (dep === "Emergency" && emerg > 94) heat = true;
        if (dep === "Staff" && staff < 55) heat = true;
        if (dep === "General Ward" && emerg > 90) heat = true;
        if (heat) pill.classList.add("hot");
    });
}

function updateSimAI(progress, cfg) {
    const aiEl = document.getElementById("ai-text");
    if (progress < 0.3) aiEl.textContent = cfg.label + " detected. Patient inflow increasing sharply.";
    else if (progress < 0.55) aiEl.textContent = "Emergency and ICU load climbing toward critical thresholds.";
    else if (progress < 0.8) aiEl.textContent = "Risk score rising. Staff availability declining. Issuing early warning.";
    else aiEl.textContent = "Predicted crisis: " + cfg.label + ". Preparing impact report and prevention solution.";
}

function simulateProtectedDepartments() {
    renderSimResult();
}

function renderSimResult() {
    const box = document.getElementById("sim-result-metrics");
    const ctx = document.getElementById("sim-result-context");
    const expl = document.getElementById("sim-result-explanation");
    if (!box) return;
    const set = simResultSets[simScenario] || simResultSets.icu;
    const sevKey = simIntensity === "LOW" ? "moderate" : simIntensity === "MEDIUM" ? "moderate" : simIntensity === "HIGH" ? "high" : "critical";
    const sev = set[sevKey] || set.critical;
    const labels = simResultLabels[simScenario] || simResultLabels.icu;
    ctx.textContent = "SCENARIO: " + set.title + " · SEVERITY: " + simIntensity;
    box.innerHTML = "";
    ["icu", "emergency", "staff", "beds", "risk"].forEach(function (k, i) {
        const cell = document.createElement("div");
        cell.className = "simp-cell";
        const l = document.createElement("span");
        l.textContent = labels[i];
        const v = document.createElement("b");
        v.className = "text-red";
        v.textContent = sev[k];
        cell.appendChild(l);
        cell.appendChild(v);
        box.appendChild(cell);
    });
    if (expl) expl.textContent = set.explanation;
}

function togglePause() {
    const btn = document.getElementById("pause-btn");
    if (!simRunning && !simTimer) return;
    simPaused = !simPaused;
    if (simPaused) {
        btn.textContent = "▶ RESUME";
        toast("Simulation paused", "info");
        document.getElementById("sim-phase").textContent = "PAUSED";
    } else {
        btn.textContent = "⏸ PAUSE";
        toast("Simulation resumed", "info");
    }
}

function viewImpact() {
    document.getElementById("sim-impact").style.display = "block";
    toast("Impact analysis displayed", "info");
}

function activateSimResponse() {
    const simPredMap = { surge: "emergency", mass: "mass", icu: "icu", staff: "staff", beds: "beds", emergency: "emergency" };
    const key = simPredMap[simScenario] || "icu";
    selectPreventionContext(key, simIntensity, true);
    toast("Opening recommended preventive actions for the simulated crisis", "success");
    go("response");
    updateWorkflowProgress("plan");
}

function selectPreventionContext(predKey, severity, fromWorkflow) {
    const d = predictionData[predKey] || predictionData.icu;
    currentPred = predKey;
    if (severity) workflowSeverity = severity;
    if (fromWorkflow) workflowActive = true;
    document.getElementById("prevention-crisis").textContent = d.crisis || d.name;
    document.getElementById("prevention-note").textContent = "Take these actions to prevent " + (d.crisis || d.name).toLowerCase() + " and reduce the risk level.";
    document.getElementById("prevention-risk-before").textContent = d.risk;
    document.getElementById("prevention-risk-before").className = "text-" + (d.risk === "HIGH" || d.risk === "CRITICAL" ? "red" : d.risk === "MEDIUM" ? "orange" : "green");
    applyCrisisActions(predKey);
    updateImpactFlow();
    renderActionPurposes(predKey);
    if (fromWorkflow) {
        document.getElementById("res-context-text").textContent = (d.crisis || d.name) + " · " + (severity || "High") + " · Optimization follows preventive actions";
    }
}

let lastPlanKey = null;
function applyCrisisActions(predKey) {
    const plans = {
        icu: [
            ["Activate Backup ICU Beds", "+12 ICU beds · ICU 91%→74% · Beds 9→21", "ACTIVATE BACKUP ICU BEDS", "Activate 12 Backup ICU Beds? ICU occupancy will drop from 91% to 74% and available beds will rise from 9 to 21."],
            ["Redirect Non-Critical Patients", "Emergency load 88%→76%", "REDIRECT NON-CRITICAL PATIENTS", "Redirect non-critical patients? Emergency load will drop from 88% to 76%."],
            ["Notify Backup Medical Staff", "Staff availability 64%→80%", "NOTIFY BACKUP STAFF", "Notify backup medical staff? Staff availability will improve from 64% to 80%."],
            ["Increase Emergency Triage Capacity", "-25% triage wait time", "OPEN TRIAGE OVERFLOW AREA", "Open the triage overflow area? Triage wait time will reduce by 25%."],
            ["Coordinate Nearby Hospital Support", "-20% local overload", "REQUEST NEARBY SUPPORT", "Request nearby hospital support? Local overload will reduce by 20%."],
            ["Activate Backup Ventilation Equipment", "+18% equipment readiness", "ACTIVATE BACKUP EQUIPMENT", "Activate backup ventilation equipment? Equipment readiness will improve by 18%."]
        ],
        emergency: [
            ["Deploy Backup Staff to Triage", "Emergency load 88%→76%", "DEPLOY BACKUP STAFF", "Deploy backup staff to triage? Emergency load will drop from 88% to 76%."],
            ["Open Triage Overflow Area", "-25% triage wait time", "OPEN TRIAGE OVERFLOW AREA", "Open the triage overflow area? Triage wait time will reduce by 25%."],
            ["Notify Nearby Hospitals of Surge", "-20% local overload", "NOTIFY NEARBY HOSPITALS", "Notify nearby hospitals of the surge? Local overload will reduce by 20%."],
            ["Divert Non-Critical Cases", "Emergency load 88%→80%", "DIVERT NON-CRITICAL CASES", "Divert non-critical cases? Emergency load will reduce."],
            ["Increase ICU Admission Buffer", "ICU 91%→84%", "INCREASE ICU BUFFER", "Increase the ICU admission buffer? ICU pressure will reduce."],
            ["Activate Backup Ambulance Response", "+18% transport capacity", "ACTIVATE BACKUP RESPONSE", "Activate backup ambulance response? Transport capacity will improve."]
        ],
        staff: [
            ["Call In Backup Medical Staff", "Staff availability 64%→80%", "CALL IN BACKUP STAFF", "Call in backup medical staff? Staff availability will rise to 80%."],
            ["Redistribute Staff to ICU/Emergency", "+15% coverage in critical depts", "REDISTRIBUTE STAFF", "Redistribute staff to ICU and Emergency? Coverage in critical departments will improve."],
            ["Adjust Shift Schedules", "+8% evening coverage", "ADJUST SHIFT SCHEDULES", "Adjust shift schedules? Evening coverage will improve."],
            ["Enable Overtime for Critical Roles", "+10% coverage", "ENABLE OVERTIME", "Enable overtime for critical roles? Coverage will improve."],
            ["Request Staff Support from Nearby Hospital", "-20% local overload", "REQUEST STAFF SUPPORT", "Request staff support from a nearby hospital? Local overload will reduce."],
            ["Reduce Non-Essential Procedures", "Staff freed for priority care", "REDUCE NON-ESSENTIAL PROCEDURES", "Reduce non-essential procedures? Staff will be freed for priority care."]
        ],
        beds: [
            ["Activate Backup Beds", "+30 extra beds", "ACTIVATE BACKUP BEDS", "Activate backup beds? 30 additional beds will be available."],
            ["Redirect Non-Critical Patients", "Ward occupancy 72%→68%", "REDIRECT NON-CRITICAL PATIENTS", "Redirect non-critical patients? Ward pressure will reduce."],
            ["Prioritize Discharge Planning", "+12 beds freed per hour", "PRIORITIZE DISCHARGES", "Prioritize discharge planning? Beds will be freed faster."],
            ["Coordinate Nearby Hospital Transfer", "-20% local bed pressure", "COORDINATE TRANSFERS", "Coordinate transfers with a nearby hospital? Local bed pressure will reduce."],
            ["Open Overflow Ward", "+20 bed capacity", "OPEN OVERFLOW WARD", "Open the overflow ward? 20 additional beds will be available."],
            ["Optimize Bed Allocation", "+10% bed utilization", "OPTIMIZE BED ALLOCATION", "Optimize bed allocation? Utilization will improve."]
        ],
        mass: [
            ["Activate Emergency Response Protocol", "-30 min response time", "ACTIVATE RESPONSE PROTOCOL", "Activate the emergency response protocol? Response time will improve."],
            ["Open Emergency Overflow Areas", "+40 treatment stations", "OPEN OVERFLOW AREAS", "Open emergency overflow areas? 40 additional treatment stations will be available."],
            ["Deploy Backup Staff", "Staff availability 64%→85%", "DEPLOY BACKUP STAFF", "Deploy backup staff? Coverage will rise to 85%."],
            ["Coordinate Nearby Hospital Support", "+35 transfer capacity", "COORDINATE NEARBY SUPPORT", "Coordinate nearby hospital support? Transfer capacity will increase."],
            ["Prioritize Critical Patient Triage", "-40% triage delay", "PRIORITIZE TRIAGE", "Prioritize critical patient triage? Triage delay will reduce."],
            ["Activate Backup ICU Capacity", "ICU capacity +15 beds", "ACTIVATE BACKUP ICU", "Activate backup ICU capacity? 15 additional beds will be available."]
        ],
        resources: [
            ["Activate Backup Equipment", "+18% equipment readiness", "ACTIVATE BACKUP EQUIPMENT", "Activate backup equipment? Equipment readiness will improve."],
            ["Coordinate Restocking", "+15% supply availability", "COORDINATE RESTOCKING", "Coordinate restocking? Supply availability will improve."],
            ["Prioritize Critical Equipment Maintenance", "+10% uptime", "PRIORITIZE MAINTENANCE", "Prioritize critical equipment maintenance? Uptime will improve."],
            ["Request Equipment from Nearby Hospital", "+12% equipment availability", "REQUEST EQUIPMENT SUPPORT", "Request equipment from a nearby hospital? Availability will improve."],
            ["Optimize Oxygen Supply", "+15% oxygen reserve", "OPTIMIZE OXYGEN SUPPLY", "Optimize the oxygen supply? Reserve will improve."],
            ["Activate Backup Power / Equipment Prep", "+10% readiness", "PREPARE BACKUP SYSTEMS", "Prepare backup systems? Overall readiness will improve."]
        ]
    };
    const list = plans[predKey] || plans.icu;
    const newPlan = predKey !== lastPlanKey;
    lastPlanKey = predKey;
    let changed = false;
    for (let i = 1; i <= 6; i++) {
        const btn = document.getElementById("act-btn-" + i);
        const impact = document.querySelector('.response-action[data-act="' + i + '"] .act-impact');
        if (!btn) continue;
        if (btn.textContent.indexOf("COMPLETED") !== -1 || btn.textContent.indexOf("ACTIVE") !== -1) continue;
        const meta = list[i - 1];
        if (meta) {
            document.querySelector('.response-action[data-act="' + i + '"] .act-name').textContent = meta[0];
            if (impact) impact.textContent = "Impact: " + meta[1];
            btn.textContent = meta[2];
            btn.disabled = false;
            btn.setAttribute("data-confirm-msg", meta[3]);
            btn.setAttribute("data-confirm-title", meta[2].replace(/([A-Z])/g, function (m, g) { return m[0].toLowerCase() === m[0] ? m : " " + m; }).trim().replace(/\s+/g, " ") + "?");
            // Default every recommended action to selected when the scenario plan changes
            if (newPlan) {
                const sel = document.getElementById("act-sel-" + i);
                if (sel) { sel.classList.add("selected"); sel.textContent = "✓"; }
            }
            changed = true;
        }
    }
    return changed;
}

/* Action purpose copy + selection + workflow helpers */
const actionPurposeMap = {
    icu: ["Increase ICU capacity by activating available backup beds.", "Reduce pressure on the emergency department by redirecting non-critical patients.", "Ensure enough staff on hand by notifying backup medical personnel.", "Speed up triage to reduce waiting times in the emergency area.", "Relieve local overload by coordinating support from nearby hospitals.", "Improve readiness by activating backup ventilation equipment."],
    emergency: ["Deploy backup staff to triage to absorb the patient surge.", "Open the triage overflow area to handle the increased volume.", "Notify nearby hospitals of the surge to share the load.", "Divert non-critical cases to reduce emergency pressure.", "Increase the ICU admission buffer to protect critical cases.", "Activate backup ambulance response for additional transport."],
    staff: ["Call in backup medical staff to restore safe coverage.", "Redistribute staff to ICU and Emergency where the need is highest.", "Adjust shift schedules to improve coverage across the day.", "Enable overtime for critical roles to cover gaps.", "Request staff support from a nearby hospital to ease the load.", "Reduce non-essential procedures to free staff for priority care."],
    beds: ["Activate backup beds to increase available capacity.", "Redirect non-critical patients to ease ward pressure.", "Prioritize discharge planning to free beds faster.", "Coordinate transfers with a nearby hospital to reduce bed pressure.", "Open the overflow ward to add bed capacity.", "Optimize bed allocation to improve utilization."],
    resources: ["Activate backup equipment to improve readiness.", "Coordinate restocking to increase supply availability.", "Prioritize critical equipment maintenance for uptime.", "Request equipment from a nearby hospital to boost availability.", "Optimize the oxygen supply to strengthen the reserve.", "Prepare backup systems for higher overall readiness."]
};

const actionTitles = {
    icu: ["Activate Backup ICU Beds", "Redirect Non-Critical Patients", "Notify Backup Medical Staff", "Increase Emergency Triage Capacity", "Coordinate Nearby Hospital Support", "Activate Backup Ventilation Equipment"],
    emergency: ["Deploy Backup Staff to Triage", "Open Triage Overflow Area", "Notify Nearby Hospitals of Surge", "Divert Non-Critical Cases", "Increase ICU Admission Buffer", "Activate Backup Ambulance Response"],
    staff: ["Call In Backup Medical Staff", "Redistribute Staff to ICU/Emergency", "Adjust Shift Schedules", "Enable Overtime for Critical Roles", "Request Staff Support from Nearby Hospital", "Reduce Non-Essential Procedures"],
    beds: ["Activate Backup Beds", "Redirect Non-Critical Patients", "Prioritize Discharge Planning", "Coordinate Nearby Hospital Transfer", "Open Overflow Ward", "Optimize Bed Allocation"],
    resources: ["Activate Backup Equipment", "Coordinate Restocking", "Prioritize Critical Equipment Maintenance", "Request Equipment from Nearby Hospital", "Optimize Oxygen Supply", "Activate Backup Power / Equipment Prep"]
};

function renderActionPurposes(predKey) {
    const purposes = actionPurposeMap[predKey] || actionPurposeMap.icu;
    for (let i = 1; i <= 6; i++) {
        const el = document.getElementById("act-purpose-" + i);
        if (el && purposes[i - 1]) el.textContent = purposes[i - 1];
    }
}

function toggleActionSelect(n, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const sel = document.getElementById("act-sel-" + n);
    const btn = document.getElementById("act-btn-" + n);
    if (!sel) return;
    if (btn && (btn.textContent.indexOf("COMPLETED") !== -1 || btn.textContent.indexOf("ACTIVE") !== -1)) { toast("Action already active", "info"); return; }
    const checked = sel.classList.contains("selected");
    sel.classList.toggle("selected", !checked);
    sel.textContent = checked ? "" : "✓";
    toast(checked ? "Action deselected" : "Action " + n + " selected", "info");
}

function goToResourceOptimizer() {
    updateWorkflowProgress("resource");
    go("resource");
}

function updateWorkflowProgress(step) {
    document.getElementById("wf-progress").style.display = "flex";
    const map = { simulator: 0, plan: 1, action: 2, resource: 3, reduction: 4 };
    const idx = map[step] !== undefined ? map[step] : -1;
    const steps = document.querySelectorAll(".wfp-step");
    steps.forEach(function (s, i) {
        s.classList.remove("done");
        s.classList.remove("current");
        s.classList.remove("future");
        if (i < idx) s.classList.add("done");
        else if (i === idx) s.classList.add("current");
        else s.classList.add("future");
    });
}

/* ==================== PREVENTIVE ACTION IMPACT FLOW ==================== */
const impactFlowData = {
    icu: { occL: "ICU Occupancy", bedsL: "Available ICU Beds", before: { occ: "91%", beds: "9", risk: "89%", level: "CRITICAL" }, after: { occ: "74%", beds: "21", risk: "54%", level: "HIGH" }, action: "Activate Backup ICU Beds", riskT: "89% → 54%", capT: "9 → 21 beds", occT: "91% → 74%" },
    emergency: { occL: "Emergency Load", bedsL: "Triage Stations", before: { occ: "88%", beds: "6", risk: "93%", level: "HIGH" }, after: { occ: "76%", beds: "12", risk: "61%", level: "MEDIUM" }, action: "Open Triage Overflow Area", riskT: "93% → 61%", capT: "6 → 12 stations", occT: "88% → 76%" },
    beds: { occL: "Ward Occupancy", bedsL: "Available Beds", before: { occ: "72%", beds: "9", risk: "84%", level: "MEDIUM" }, after: { occ: "65%", beds: "39", risk: "61%", level: "MEDIUM" }, action: "Activate Backup Beds", riskT: "84% → 61%", capT: "9 → 39 beds", occT: "72% → 65%" },
    staff: { occL: "Staff Availability", bedsL: "Shift Coverage", before: { occ: "64%", beds: "—", risk: "84%", level: "MEDIUM" }, after: { occ: "80%", beds: "—", risk: "58%", level: "MEDIUM" }, action: "Call In Backup Medical Staff", riskT: "84% → 58%", capT: "—", occT: "64% → 80%" },
    resources: { occL: "Equipment Utilization", bedsL: "Supply Availability", before: { occ: "78%", beds: "—", risk: "77%", level: "LOW" }, after: { occ: "90%", beds: "—", risk: "52%", level: "LOW" }, action: "Activate Backup Equipment", riskT: "77% → 52%", capT: "—", occT: "78% → 90%" },
    mass: { occL: "Emergency Capacity", bedsL: "Available Beds", before: { occ: "92%", beds: "2", risk: "96%", level: "CRITICAL" }, after: { occ: "58%", beds: "34", risk: "58%", level: "HIGH" }, action: "Activate Emergency Response Protocol", riskT: "96% → 58%", capT: "2 → 34 beds", occT: "92% → 58%" }
};

function updateImpactFlow() {
    const d = impactFlowData[currentPred] || impactFlowData.icu;
    const set = function (id, v, cls) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = v;
        if (cls) el.className = cls;
    };
    const done = document.querySelectorAll(".act-status.completed").length;
    set("lbl-occ", d.occL, null);
    set("lbl-beds", d.bedsL, null);
    const aEl = document.getElementById("im-before-occ");
    if (aEl && aEl.parentNode) aEl.parentNode.querySelector("span").textContent = d.occL;
    const bEl = document.getElementById("im-before-beds");
    if (bEl && bEl.parentNode) bEl.parentNode.querySelector("span").textContent = d.bedsL;
    const a2El = document.getElementById("im-after-occ");
    if (a2El && a2El.parentNode) a2El.parentNode.querySelector("span").textContent = d.occL;
    const b2El = document.getElementById("im-after-beds");
    if (b2El && b2El.parentNode) b2El.parentNode.querySelector("span").textContent = d.bedsL;

    set("im-before-occ", d.before.occ, "text-red");
    set("im-before-beds", d.before.beds, "text-orange");
    set("im-before-risk", d.before.risk, "text-red");
    set("im-before-level", d.before.level, d.before.level === "CRITICAL" || d.before.level === "HIGH" ? "text-red" : "text-orange");

    set("im-action-name", d.action, null);
    set("im-action-status", done === 0 ? "READY" : done >= 6 ? "ALL ACTIVE" : "ACTIVE", done === 0 ? "imp-status" : "imp-status active");

    set("im-after-occ", d.after.occ, "text-green");
    set("im-after-beds", d.after.beds, "text-green");
    set("im-after-risk", d.after.risk, "text-green");
    set("im-after-level", d.after.level, "text-green");

    set("im-metric-risk", d.riskT, "text-green");
    set("im-metric-cap", d.capT, "text-green");
    set("im-metric-occ", d.occT, "text-green");
}

function nearbySupport() {
    toast("Opening nearby hospital support", "info");
    go("support");
}

function optimizeResources() {
    toast("Opening Resource Optimizer", "info");
    go("resource");
}

function resetSimulation() {
    if (simTimer) { clearInterval(simTimer); simTimer = null; }
    simRunning = false;
    simPaused = false;
    document.getElementById("sim-live").style.display = "none";
    document.getElementById("sim-idle").style.display = "block";
    document.getElementById("sim-stage").classList.remove("running");
    document.getElementById("sim-impact").style.display = "none";
    document.querySelectorAll("#sts-row .sts-pill").forEach(function (p) { p.classList.remove("hot"); });
    document.getElementById("ai-text").textContent = "Analyzing scenario parameters...";
    toast("Simulation reset", "info");
}

function resetSimDisplay() {
    if (simRunning === false) {
        document.getElementById("sim-live").style.display = "none";
        document.getElementById("sim-idle").style.display = "block";
    }
}

/* ==================== PREVENTIVE ACTION PLAN ==================== */
function activateAction(n) {
    const btn = document.getElementById("act-btn-" + n);
    if (!btn) return;
    if (btn.textContent.indexOf("ACTIVE") === -1 && btn.textContent.indexOf("COMPLETED") === -1 && btn.textContent.indexOf("CONFIRM") === -1) {
        showActionConfirm(n);
        return;
    }
}

function showActionConfirm(n) {
    const btn = document.getElementById("act-btn-" + n);
    if (!btn) return;
    if (btn.disabled) { toast("Action already applied", "info"); return; }
    const title = btn.getAttribute("data-confirm-title") || btn.textContent + "?";
    const msg = btn.getAttribute("data-confirm-msg") || "Confirm this preventive action?";
    const overlay = document.getElementById("confirm-overlay");
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-msg").textContent = msg;
    overlay.setAttribute("data-action", n);
    overlay.setAttribute("data-requested", btn.textContent);
    overlay.classList.add("activate");
}

// Confirmation dialog controls
window.app = window.app || {};
window.app.confirmAction = function () {
    const overlay = document.getElementById("confirm-overlay");
    const n = overlay.getAttribute("data-action");
    overlay.classList.remove("activate");
    activateActionTask(parseInt(n), overlay.getAttribute("data-requested"));
};
window.app.cancelAction = function () {
    const overlay = document.getElementById("confirm-overlay");
    overlay.classList.remove("activate");
};

function activateActionTask(n, name) {
    const btn = document.getElementById("act-btn-" + n);
    const status = document.getElementById("act-status-" + n);
    const prog = document.getElementById("act-progress-" + n);
    if (!btn || !status || !prog) return;
    if (btn.textContent.indexOf("ACTIVE") !== -1 || btn.textContent.indexOf("COMPLETED") !== -1) { toast("Action already active", "info"); return; }

    btn.disabled = true;
    btn.textContent = "ACTIVATING...";
    status.textContent = "ACTIVE";
    status.className = "act-status active";

    // Apply metric updates immediately with animation
    applyActionMetrics(n);

    // animate progress
    let w = 0;
    const progInt = setInterval(function () {
        w += 8;
        prog.querySelector(".act-progress-fill").style.width = w + "%";
        if (w >= 100) {
            clearInterval(progInt);
            status.textContent = "COMPLETED";
            status.className = "act-status completed";
            btn.textContent = "COMPLETED ✓";
            btn.style.opacity = "0.6";
            updateResponseCount();
            toast("Preventive action successfully activated", "success");
        }
    }, 120);
}

function applyActionMetrics(n) {
    // Update live metrics to show risk reduction after the action
    const target = {
        1: { icuV: "74%", riskV: "HIGH", healthV: 82, bedV: "21", riskColor: "text-orange" },
        2: { emergencyV: "76%", riskV: "HIGH", healthV: 84 },
        3: { staffV: "80%", riskV: "HIGH", healthV: 86 },
        4: { riskV: "MEDIUM", healthV: 88 },
        5: { emergencyV: "72%", riskV: "MEDIUM", healthV: 90 },
        6: { riskV: "MEDIUM", healthV: 91 }
    };
    const t = target[n];
    if (!t) return;
    const dashIcu = document.getElementById("dash-icu");
    const dashEmerg = document.getElementById("dash-emergency");
    const dashStaff = document.getElementById("dash-staff");
    const dashRisk = document.getElementById("dash-risk");
    const healthScore = document.getElementById("health-score");
    const healthFill = document.getElementById("health-fill");
    const healthStatus = document.getElementById("health-status");

    if (t.icuV && dashIcu) dashIcu.textContent = t.icuV;
    if (t.emergencyV && dashEmerg) dashEmerg.textContent = t.emergencyV;
    if (t.staffV && dashStaff) dashStaff.textContent = t.staffV;
    if (t.riskV && dashRisk) {
        dashRisk.textContent = t.riskV === "HIGH" ? 62 : t.riskV === "MEDIUM" ? 45 : 30;
        dashRisk.className = "dash-kpi-value " + (t.riskColor || "text-orange");
    }
    if (t.healthV && healthScore) {
        healthScore.textContent = t.healthV;
        if (healthFill) healthFill.style.width = t.healthV + "%";
        if (healthStatus) {
            healthStatus.textContent = t.healthV > 80 ? "STABLE" : t.healthV > 60 ? "MODERATE RISK" : "HIGH RISK";
        }
    }
    if (t.bedV) {
        // available-beds figure is shown via the impact flow / resource optimizer panels
    }
    // Update prevention risk after label
    const afterEl = document.getElementById("prevention-risk-after");
    if (afterEl && t.riskV) afterEl.textContent = t.riskV;
}

function activateAllActions() {
    const selected = [];
    for (let i = 1; i <= 6; i++) {
        const sel = document.getElementById("act-sel-" + i);
        const btn = document.getElementById("act-btn-" + i);
        if (btn && sel && sel.classList.contains("selected") && btn.textContent.indexOf("ACTIVE") === -1 && btn.textContent.indexOf("COMPLETED") === -1) {
            selected.push(i);
        }
    }
    if (selected.length === 0) {
        toast("Select at least one preventive action to activate", "info");
        return;
    }
    selected.forEach(function (n) {
        const btn = document.getElementById("act-btn-" + n);
        if (btn) activateActionTask(n, btn.textContent);
    });
    toast("Activating " + selected.length + " selected preventive action" + (selected.length > 1 ? "s" : ""), "success");
}

function updateResponseCount() {
    const completed = document.querySelectorAll(".act-status.completed").length;
    const label = document.getElementById("resp-overall");
    if (label) label.textContent = completed + " / 6 PREVENTIVE ACTIONS ACTIVE";
    const badge = document.getElementById("resp-status-badge");
    if (badge) badge.textContent = completed >= 6 ? "PLAN COMPLETE" : "PLAN IN PROGRESS";
    const ls = document.getElementById("ls-response");
    if (ls) ls.textContent = completed >= 1 ? "ACTIVATED" : "READY";
    updateImpactFlow();
    renderActivatedList();
    if (completed >= 1) updateWorkflowProgress("action");
}

function renderActivatedList() {
    const box = document.getElementById("as-actions");
    const panel = document.getElementById("action-success");
    if (!box || !panel) return;
    const names = [];
    for (let i = 1; i <= 6; i++) {
        const st = document.getElementById("act-status-" + i);
        if (st && st.classList.contains("completed")) {
            const nm = document.getElementById("act-purpose-" + i);
            const title = document.querySelector('.response-action[data-act="' + i + '"] .act-name');
            names.push(title ? title.textContent.replace(/([A-Z])/g, function (m) { return m === m.charAt(0) ? m : m; }) : "Action " + i);
        }
    }
    if (names.length > 0) {
        box.innerHTML = "";
        names.forEach(function (n) {
            const row = document.createElement("div");
            row.className = "as-action";
            const chk = document.createElement("span");
            chk.className = "as-action-check";
            chk.textContent = "✓";
            const txt = document.createElement("span");
            txt.textContent = n + " Activated";
            row.appendChild(chk);
            row.appendChild(txt);
            box.appendChild(row);
        });
        const d = impactFlowData[currentPred] || impactFlowData.icu;
        const set = function (id, v, cls) { const el = document.getElementById(id); if (!el) return; el.textContent = v; if (cls) el.className = cls; };
        const lbl1 = document.getElementById("as-lbl1");
        if (lbl1) lbl1.textContent = d.occL;
        const lbl2 = document.getElementById("as-lbl2");
        if (lbl2) lbl2.textContent = d.occL;
        set("as-before-occ", d.before.occ, "text-red");
        set("as-before-risk", d.before.risk, "text-red");
        set("as-before-level", d.before.level, "text-red");
        set("as-after-occ", d.after.occ, "text-green");
        set("as-after-risk", d.after.risk, "text-green");
        set("as-after-level", d.after.level, "text-green");
        panel.style.display = "block";
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

/* ==================== RESOURCE OPTIMIZER (GUIDED WORKFLOW) ==================== */
let optimized = false;
let optimizedKey = null;

const resourceOptSets = {
    icu: {
        context: "ICU Overload",
        rows: [
            ["Available ICU Beds", "9", "21", 20, 84, 21],
            ["Staff Distribution", "Inefficient", "Optimized", 30, 86, null],
            ["ICU Capacity", "91%", "74%", 91, 74, 74],
            ["Overall Efficiency", "62%", "87%", 62, 87, 87]
        ],
        impacts: { eff: "+25%", risk: "89% → 54%", cap: "9 → 21 beds", res: "+22%" },
        rr: { beforeProb: "89%", afterProb: "54%", beforeLevel: "Critical Risk", afterLevel: "High Risk", riskT: "89% → 54%", capT: "9 → 21 beds", effT: "62% → 87%" }
    },
    emergency: {
        context: "Emergency Patient Surge",
        rows: [
            ["Available Emergency Capacity", "48", "86", 38, 86, 86],
            ["Staff on Triage", "10", "24", 35, 80, 24],
            ["Emergency Load", "88%", "76%", 88, 76, 76],
            ["Overall Efficiency", "61%", "84%", 61, 84, 84]
        ],
        impacts: { eff: "+23%", risk: "93% → 61%", cap: "6 → 12 stations", res: "+20%" },
        rr: { beforeProb: "93%", afterProb: "61%", beforeLevel: "High Risk", afterLevel: "Medium Risk", riskT: "93% → 61%", capT: "6 → 12 stations", effT: "61% → 84%" }
    },
    staff: {
        context: "Staff Shortage",
        rows: [
            ["Staff Availability", "64%", "80%", 64, 80, 80],
            ["Department Coverage", "Moderate", "High", 40, 82, null],
            ["Shift Coverage", "70%", "88%", 70, 88, 88],
            ["Overall Efficiency", "58%", "84%", 58, 84, 84]
        ],
        impacts: { eff: "+26%", risk: "84% → 58%", cap: "+16% coverage", res: "+24%" },
        rr: { beforeProb: "84%", afterProb: "58%", beforeLevel: "High Risk", afterLevel: "Medium Risk", riskT: "84% → 58%", capT: "+16% coverage", effT: "58% → 84%" }
    },
    beds: {
        context: "Bed Shortage",
        rows: [
            ["Available Beds", "9", "39", 20, 84, 39],
            ["Placement Delay", "High", "Low", 30, 84, null],
            ["General Ward Capacity", "72%", "64%", 72, 64, 64],
            ["Overall Efficiency", "60%", "83%", 60, 83, 83]
        ],
        impacts: { eff: "+23%", risk: "84% → 61%", cap: "9 → 39 beds", res: "+21%" },
        rr: { beforeProb: "84%", afterProb: "61%", beforeLevel: "High Risk", afterLevel: "Medium Risk", riskT: "84% → 61%", capT: "9 → 39 beds", effT: "60% → 83%" }
    },
    mass: {
        context: "Mass Casualty Event",
        rows: [
            ["Emergency Capacity", "45", "88", 35, 88, 88],
            ["Available Beds", "9", "34", 20, 85, 34],
            ["Staff Deployment", "Insufficient", "Optimized", 30, 86, null],
            ["Overall Efficiency", "52%", "86%", 52, 86, 86]
        ],
        impacts: { eff: "+34%", risk: "96% → 58%", cap: "9 → 34 beds", res: "+30%" },
        rr: { beforeProb: "96%", afterProb: "58%", beforeLevel: "Critical Risk", afterLevel: "High Risk", riskT: "96% → 58%", capT: "9 → 34 beds", effT: "52% → 86%" }
    },
    resources: {
        context: "Resource Shortage",
        rows: [
            ["Equipment Readiness", "78%", "94%", 78, 94, 94],
            ["Supply Availability", "60%", "85%", 60, 85, 85],
            ["Equipment Utilization", "70%", "88%", 70, 88, 88],
            ["Overall Efficiency", "64%", "88%", 64, 88, 88]
        ],
        impacts: { eff: "+24%", risk: "77% → 52%", cap: "+22% availability", res: "+20%" },
        rr: { beforeProb: "77%", afterProb: "52%", beforeLevel: "Medium Risk", afterLevel: "Low Risk", riskT: "77% → 52%", capT: "+22% availability", effT: "64% → 88%" }
    }
};

function workflowPredKey() {
    const m = { icu: "icu", emergency: "emergency", staff: "staff", beds: "beds", mass: "mass", surge: "emergency", resources: "resources" };
    if (workflowActive && m[simScenario]) return m[simScenario];
    return currentPred || "icu";
}

function severityLabel() {
    const sev = workflowActive ? simIntensity : workflowSeverity;
    return { LOW: "Low", MEDIUM: "Moderate", HIGH: "High", CRITICAL: "Critical" }[sev] || "High";
}

function applyResourceContext() {
    const key = workflowPredKey();
    const set = resourceOptSets[key] || resourceOptSets.icu;
    const items = document.querySelectorAll(".res-outer .res-compare .res-item");
    items.forEach(function (item, i) {
        const isAfter = i >= 4;
        const rowIdx = isAfter ? i - 4 : i;
        const row = set.rows[rowIdx];
        if (!row) return;
        const spans = item.querySelectorAll(".res-row span");
        if (spans[0]) spans[0].textContent = row[0];
        if (spans[1]) spans[1].textContent = isAfter ? row[2] : row[1];
        const fill = item.querySelector(".resource-fill");
        const alreadyDone = isAfter && optimizedKey === key && optimized;
        if (fill) fill.style.width = (isAfter ? (alreadyDone ? row[4] : 0) : row[3]) + "%";
    });
    const s = document.getElementById("ri-eff");
    if (s) s.textContent = set.impacts.eff;
    if (document.getElementById("ri-risk")) document.getElementById("ri-risk").textContent = set.impacts.risk;
    if (document.getElementById("ri-cap")) document.getElementById("ri-cap").textContent = set.impacts.cap;
    if (document.getElementById("ri-res")) document.getElementById("ri-res").textContent = set.impacts.res;
    const rr = set.rr;
    if (document.getElementById("rr-before-level")) document.getElementById("rr-before-level").textContent = rr.beforeLevel;
    if (document.getElementById("rr-before-prob")) document.getElementById("rr-before-prob").textContent = rr.beforeProb + " Crisis Probability";
    if (document.getElementById("rr-after-level")) document.getElementById("rr-after-level").textContent = rr.afterLevel;
    if (document.getElementById("rr-after-prob")) document.getElementById("rr-after-prob").textContent = rr.afterProb + " Crisis Probability";
    if (document.getElementById("rr-m-risk")) document.getElementById("rr-m-risk").textContent = rr.riskT;
    if (document.getElementById("rr-m-cap")) document.getElementById("rr-m-cap").textContent = rr.capT;
    if (document.getElementById("rr-m-eff")) document.getElementById("rr-m-eff").textContent = rr.effT;
    const ctx = document.getElementById("res-context-text");
    if (ctx) ctx.textContent = set.context + " Risk · " + severityLabel() + " · Optimization follows preventive actions";
    if (optimizedKey !== key) {
        optimized = false;
        optimizedKey = key;
        const card = document.getElementById("rr-card");
        if (card) card.style.display = "none";
        const os = document.getElementById("opt-status");
        if (os) os.style.display = "none";
    }
}

function runOptimization() {
    if (optimized) { toast("Resources already optimized for this scenario", "info"); return; }
    document.getElementById("overlay").classList.add("active");
    let step = 0;
    const steps = ["Analyzing resource distribution...", "Redistributing staff...", "Allocating beds...", "Optimizing equipment..."];
    const overlayStep = document.getElementById("overlay-step");
    const overlayBar = document.getElementById("overlay-bar");

    const int = setInterval(function () {
        step++;
        if (step <= steps.length) {
            overlayStep.textContent = steps[step - 1];
            overlayBar.style.width = (step / steps.length * 100) + "%";
        } else {
            clearInterval(int);
            setTimeout(function () {
                document.getElementById("overlay").classList.remove("active");
                finalizeOptimization();
            }, 300);
        }
    }, 800);
}

function finalizeOptimization() {
    optimized = true;
    const set = resourceOptSets[workflowPredKey()] || resourceOptSets.icu;

    set.rows.forEach(function (row, i) {
        const bar = document.querySelectorAll(".optimized-side .resource-bar .resource-fill")[i];
        if (bar) {
            let w = 0;
            const target = isNaN(row[4]) ? 80 : row[4];
            const int = setInterval(function () {
                w += Math.max(2, Math.round(target / 14));
                if (w >= target) w = target;
                bar.style.width = w + "%";
                if (w >= target) clearInterval(int);
            }, 30);
        }
        const valSpan = document.querySelectorAll(".optimized-side .res-row span")[i * 2 + 1];
        if (valSpan) {
            if (row[5] !== null && row[5] !== undefined && !isNaN(row[5])) {
                const numeric = /(\d+(\.\d+)?)/;
                const from = parseInt(row[1].match(numeric) ? row[1].match(numeric)[1] : 0, 10);
                const to = row[5];
                const suffix = row[2].replace(numeric, "");
                let cur = from;
                const int = setInterval(function () {
                    cur += Math.max(1, Math.round((to - from) / 12));
                    if (cur >= to) cur = to;
                    valSpan.textContent = cur + suffix;
                    if (cur >= to) clearInterval(int);
                }, 40);
            } else {
                valSpan.textContent = row[2];
            }
        }
    });

    const os = document.getElementById("opt-status");
    if (os) os.style.display = "block";
    const card = document.getElementById("rr-card");
    if (card) card.style.display = "block";
    updateWorkflowProgress("reduction");
    toast("AI resource optimization complete — risk reduction achieved", "success");
    const cardBox = document.getElementById("rr-card");
    if (cardBox) cardBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ==================== NEARBY HOSPITALS ==================== */
const hospitalData = {
    "City General Hospital": { beds: 34, icu: 18, emerg: 42, score: 92 },
    "Metro Care Hospital": { beds: 48, icu: 26, emerg: 55, score: 88 },
    "LifeCare Medical Center": { beds: 27, icu: 12, emerg: 35, score: 71 }
};

function viewHospital(el, name) {
    const h = hospitalData[name];
    document.getElementById("hm-title").textContent = name;
    document.getElementById("hm-beds").textContent = h.beds;
    document.getElementById("hm-icu").textContent = h.icu + "%";
    document.getElementById("hm-emerg").textContent = h.emerg + "%";
    document.getElementById("hm-score").textContent = h.score + "/100";
    document.getElementById("hospital-modal").classList.add("active");
    toast("Hospital details loaded: " + name, "info");
}

function closeHospitalModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("hospital-modal").classList.remove("active");
}

function requestHospitalSupport(el, name) {
    el.disabled = true;
    el.textContent = "REQUEST SENT ✓";
    toast("Support request sent to " + name, "success");
    const card = el.closest(".coord-card");
    if (card) {
        const status = card.querySelector(".coord-status");
        status.style.display = "block";
        status.textContent = "REQUEST SENT";
        status.style.background = "rgba(59,130,246,0.1)";
        status.style.border = "1px solid rgba(59,130,246,0.3)";
        status.style.color = "#67e8f9";
        setTimeout(function () {
            status.textContent = "SUPPORT CONFIRMED";
            status.style.background = "rgba(34,197,94,0.1)";
            status.style.border = "1px solid rgba(34,197,94,0.3)";
            status.style.color = "#4ade80";
            toast(name + " has confirmed support", "success");
        }, 2000);
    }
}

function transferPatients(el, name) {
    toast("Patient transfer initiated to " + name, "success");
    const card = el.closest(".coord-card");
    if (card) {
        const status = card.querySelector(".coord-status");
        status.style.display = "block";
        status.textContent = "TRANSFER IN PROGRESS...";
        status.style.background = "rgba(245,158,11,0.1)";
        status.style.border = "1px solid rgba(245,158,11,0.3)";
        status.style.color = "#f59e0b";
        setTimeout(function () {
            status.textContent = "TRANSFER COMPLETED ✓";
            status.style.background = "rgba(34,197,94,0.1)";
            status.style.border = "1px solid rgba(34,197,94,0.3)";
            status.style.color = "#4ade80";
            toast("Patient transfer completed to " + name, "success");
        }, 2500);
    }
}

/* ==================== DASHBOARD FEED ==================== */
function addDashboardEvent() {
    const timeline = document.querySelector(".mini-timeline");
    if (!timeline) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
    const item = document.createElement("div");
    item.className = "mt-item";
    const dot = document.createElement("span");
    dot.className = "mt-dot c";
    const txt = document.createElement("span");
    txt.className = "mt-text";
    txt.textContent = time + " — Live metrics refreshed by AI";
    item.appendChild(dot);
    item.appendChild(txt);
    timeline.insertBefore(item, timeline.firstChild);
    while (timeline.children.length > 6) timeline.removeChild(timeline.lastChild);
    toast("Live feed refreshed", "success");
}

/* ==================== COMMAND CENTER MODES ==================== */
function setCommandMode(mode, el) {
    document.querySelectorAll(".mode-btn").forEach(function (b) { b.classList.remove("active"); b.classList.remove("critical-mode"); b.classList.remove("ready-mode"); });
    el.classList.add("active");

    const panel = document.getElementById("command-panel");
    const title = document.getElementById("cmd-center-title");
    const badge = document.getElementById("cmd-mode-badge");
    const alerts = document.getElementById("cmd-alerts");

    alerts.innerHTML = "";
    panel.classList.remove("critical");
    panel.classList.remove("ready");

    if (mode === "ACTIVE") {
        el.classList.add("active");
        badge.textContent = "MODE: ACTIVE";
        title.textContent = "PREVENTION SYSTEM — ACTIVE";
        toast("Prevention monitoring ACTIVE", "success");
    } else if (mode === "CRITICAL") {
        el.classList.add("critical-mode");

        badge.textContent = "MODE: CRITICAL";
        title.textContent = "PREVENTION SYSTEM — CRITICAL ALERT";
        panel.classList.add("critical");
        document.getElementById("c-risk").textContent = "CRITICAL";
        document.getElementById("c-risk").className = "cmd-value text-red";

        // Add crisis alerts
        const alertsData = [
            "⚠ CRITICAL: ICU capacity at 98%",
            "⚠ HIGH: Emergency load rising sharply",
            "⚠ WARNING: Staff availability below 40%"
        ];
        alertsData.forEach(function (text) {
            const a = document.createElement("div");
            a.className = "cmd-alert";
            a.textContent = text;
            alerts.appendChild(a);
        });
        toast("Prevention system switched to CRITICAL mode", "error");
    } else if (mode === "READY") {
        el.classList.add("ready-mode");
        badge.textContent = "MODE: READY";
        title.textContent = "PREVENTION SYSTEM — STABLE / READY";
        panel.classList.add("ready");
        document.getElementById("c-risk").textContent = "LOW";
        document.getElementById("c-risk").className = "cmd-value text-green";

        const a = document.createElement("div");
        a.className = "cmd-alert success";
        a.textContent = "✓ System recovered. All departments stable and within capacity.";
        alerts.appendChild(a);
        toast("Prevention system set to READY — system stable", "success");
    }

    const topbarMode = document.getElementById("topbar-mode");
    if (topbarMode) topbarMode.textContent = "SYSTEM STATUS: " + mode;
}

/* ==================== CHARTS ==================== */
window.chartInstances = {};
window.chartsInitialized = false;

/* ==================== RISK TREND ANALYSIS ==================== */
const trendSets = {
    icu: { label: "ICU OCCUPANCY", hist: [72, 76, 81, 86, 91], pred: [94, 97, 100], bound: { min: 40, max: 100 } },
    emergency: { label: "EMERGENCY PATIENT LOAD", hist: [65, 70, 75, 82, 88], pred: [92, 95, 98], bound: { min: 30, max: 100 } },
    staff: { label: "STAFF AVAILABILITY", hist: [72, 70, 68, 66, 64], pred: [62, 59, 55], bound: { min: 20, max: 100 } },
    overall: { label: "OVERALL HOSPITAL RISK", hist: [72, 76, 81, 86, 91], pred: [94, 97, 100], bound: { min: 40, max: 100 } }
};
let currentTrendMetric = "overall";

function buildTrendChart() {
    const el = document.getElementById("chart-trend");
    if (!el) return;
    const s = trendSets[currentTrendMetric] || trendSets.overall;
    const labels = ["-4H", "-3H", "-2H", "-1H", "NOW", "+1H", "+2H", "+4H"];
    const histData = s.hist.concat([null, null, null]);
    const predData = [null, null, null, null, s.hist[4]].concat(s.pred);
    if (window.chartInstances.trend) window.chartInstances.trend.destroy();
    window.chartInstances.trend = new Chart(el, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                { label: "Historical Data", data: histData, borderColor: "#22d3ee", backgroundColor: "rgba(34,211,238,0.08)", fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: [3, 3, 3, 3, 8, 0, 0, 0], pointBackgroundColor: "#22d3ee", pointBorderColor: "#0b1220", pointBorderWidth: [0, 0, 0, 0, 2, 0, 0, 0] },
                { label: "AI Predicted Future", data: predData, borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.05)", borderDash: [6, 4], tension: 0.4, borderWidth: 2.5, pointRadius: [0, 0, 0, 0, 0, 4, 4, 4], pointBackgroundColor: "#ef4444", pointBorderColor: "#0b1220" }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + c.parsed.y + "%"; } } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: "#a5b3d0" } },
                y: { grid: { color: "rgba(70,120,220,0.08)" }, min: s.bound.min, max: s.bound.max, ticks: { callback: function (v) { return v + "%"; } } }
            }
        }
    });
}

function selectTrendMetric(key, el) {
    currentTrendMetric = key;
    document.querySelectorAll(".tm-btn").forEach(function (b) { b.classList.remove("active"); });
    el.classList.add("active");
    buildTrendChart();
}

function initCharts() {
    Chart.defaults.color = "#a5b3d0";
    Chart.defaults.font.family = "'Inter', sans-serif";
    window.chartsInitialized = true;

    buildTrendChart();

    // Department capacity
    const capEl = document.getElementById("chart-capacity");
    if (capEl) {
        window.chartInstances.capacity = new Chart(capEl, {
            type: "bar",
            data: {
                labels: ["ICU", "Emergency", "Ward", "OT", "Lab", "Staff"],
                datasets: [{ label: "Occupancy %", data: [91, 88, 72, 55, 48, 64], backgroundColor: ["#ef4444","#f59e0b","#eab308","#3b82f6","#22c55e","#8b5cf6"], borderRadius: 6, borderSkipped: false, barThickness: 24 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(70,120,220,0.08)" }, max: 100, ticks: { callback: function(v){ return v + "%"; } } } } }
        });
    }

    // Risk trend
    const riskEl = document.getElementById("chart-risk-trend");
    if (riskEl) {
        window.chartInstances.risk = new Chart(riskEl, {
            type: "line",
            data: {
                labels: ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
                datasets: [{ label: "Risk Index", data: [30, 35, 42, 50, 55, 63, 72, 68, 74, 78, 72, 72], borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)", fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: "rgba(70,120,220,0.08)" } }, y: { grid: { color: "rgba(70,120,220,0.08)" }, min: 0, max: 100, ticks: { callback: function(v){ return v; } } } } }
        });
    }

    // Alert distribution
    const alEl = document.getElementById("chart-alerts");
    if (alEl) {
        window.chartInstances.alerts = new Chart(alEl, {
            type: "doughnut",
            data: { labels: ["Critical", "High", "Medium", "Low"], datasets: [{ data: [1, 1, 2, 1], backgroundColor: ["#ef4444","#f59e0b","#eab308","#22c55e"], borderColor: "rgba(5,10,24,0.8)", borderWidth: 3, hoverOffset: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: "55%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, font: { size: 10 } } } } }
        });
    }

    // Crisis impact
    const ciEl = document.getElementById("chart-crisis");
    if (ciEl) {
        window.chartInstances.crisis = new Chart(ciEl, {
            type: "bar",
            data: {
                labels: ["ICU", "Emergency", "Staff", "Beds"],
                datasets: [{ label: "Impact %", data: [18, 22, 15, 12], backgroundColor: ["#ef4444","#f59e0b","#8b5cf6","#3b82f6"], borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(70,120,220,0.08)" }, ticks: { callback: function(v){ return v + "%"; } } } } }
        });
    }

    // Before vs After
    const baEl = document.getElementById("chart-beforeafter");
    if (baEl) {
        window.chartInstances.beforeafter = new Chart(baEl, {
            type: "bar",
            data: {
                labels: ["Staff Coverage", "Bed Availability", "Equipment Utilization", "Overall Efficiency"],
                datasets: [
                    { label: "Before", data: [40, 20, 78, 62], backgroundColor: "#ef4444", borderRadius: 6 },
                    { label: "After", data: [73, 80, 92, 88], backgroundColor: "#22c55e", borderRadius: 6 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(70,120,220,0.08)" }, max: 100, ticks: { callback: function(v){ return v + "%"; } } } } }
        });
    }
}

/* helper: use latest department data for viewDetails */
function d() { return deptData[currentDept] || deptData["ICU"]; }

/* ==================== AUTHORIZED ACCESS GATE (ROLE-BASED LOGIN) ==================== */
let sessionUser = null;

function showLoginError(msg) {
    const el = document.getElementById("login-error");
    if (el) el.textContent = msg || "";
}

function loginUser() {
    const empid = (document.getElementById("login-empid").value || "").trim();
    const pass = (document.getElementById("login-password").value || "").trim();
    const role = document.getElementById("login-role").value || "";
    const deniedMsg = "Access Denied — Invalid credentials. This platform is restricted to authorized hospital personnel.";
    if (!empid || !pass || !role) {
        showLoginError(deniedMsg);
        return;
    }
    if (empid !== "admin@citygeneralhospital.com" || pass !== "SynaptiX@2026" || role !== "Hospital Administrator") {
        showLoginError(deniedMsg);
        return;
    }
    showLoginError("");
    sessionUser = { empid: empid, role: role };
    document.body.classList.remove("login-mode");
    document.getElementById("user-role").textContent = role;
    document.getElementById("user-id").textContent = "Authorized User · " + empid;
    document.getElementById("user-chip").style.display = "flex";
    go("dashboard");
    toast("Access Granted — Authorized Hospital Personnel Verified", "success");
}

function logoutUser() {
    sessionUser = null;
    if (document.getElementById("login-empid")) document.getElementById("login-empid").value = "";
    if (document.getElementById("login-password")) document.getElementById("login-password").value = "";
    if (document.getElementById("login-role")) document.getElementById("login-role").value = "";
    showLoginError("");
    if (document.getElementById("user-chip")) document.getElementById("user-chip").style.display = "none";
    document.body.classList.add("login-mode");
    toast("Signed out. Returning to authorized access.", "info");
}

(function initLoginGate() {
    const gates = ["login-empid", "login-password"];
    gates.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener("keydown", function (e) {
            if (e.key === "Enter") loginUser();
        });
    });
})();
