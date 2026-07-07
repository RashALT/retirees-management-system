import React, { useState, useMemo, useRef, useEffect } from "react";

/* ===== theme (white / dark gold / dark gray) ===== */
const C = {
  white: "#FFFFFF", canvas: "#F6F5F1", panel: "#FBFAF7",
  gold: "#9A7B2F", goldDeep: "#7E6324", goldTint: "#F3ECDD", goldLine: "#DECFA8",
  ink: "#2E2B25", dark: "#3D3B36", mid: "#6E6A61", faint: "#9A958B",
  border: "#E8E4DB", green: "#2F7A56", greenT: "#E8F1EC", red: "#A93A36", redT: "#F6E9E8",
};
const FONT = "'Segoe UI',Tahoma,'Geeza Pro','Arabic Typesetting',sans-serif";
const LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCI+CiAgPHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIHJ4PSIyOCIgZmlsbD0iIzlBN0IyRiIvPgogIDxyZWN0IHg9IjciIHk9IjciIHdpZHRoPSIxMDYiIGhlaWdodD0iMTA2IiByeD0iMjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMzAiIHN0cm9rZS13aWR0aD0iMiIvPgogIDxjaXJjbGUgY3g9IjYwIiBjeT0iNDQiIHI9IjE0IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTMzIDgyYzAtMTUgMTItMjUgMjctMjVzMjcgMTAgMjcgMjV2M0gzM3oiIGZpbGw9IiNmZmZmZmYiLz4KICA8cmVjdCB4PSIzNCIgeT0iOTIiIHdpZHRoPSI1MiIgaGVpZ2h0PSI3IiByeD0iMy41IiBmaWxsPSIjMkEzNTUwIi8+Cjwvc3ZnPgo=";
let FLOOR = 17500; // pension floor — editable system setting (persisted)
const APP_VERSION = "v1.0 RC2"; // Retirees Management System

/* ===== local storage (device-only persistence) ===== */
const STORE_KEY = "retirees_app_v1";
const storageOK = (() => {
  try { const k = "__rt_test"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k); return true; }
  catch (e) { return false; }
})();
const loadStore = () => {
  if (!storageOK) return null;
  try { const raw = window.localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
};
const saveStore = (obj) => {
  if (!storageOK) return false;
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(obj)); return true; }
  catch (e) { return false; }
};

const aed = (n) => new Intl.NumberFormat("ar-AE").format(Math.round(n || 0)) + " د.إ";
const comp = (o) => Math.max(0, FLOOR - (Number(o) || 0));

/* convert a UAE local mobile to an international wa.me link */
const waLink = (m) => {
  let d = (m || "").replace(/\D/g, "");
  if (d.startsWith("00971")) d = d.slice(2);
  else if (d.startsWith("971")) { /* already international */ }
  else if (d.startsWith("0")) d = "971" + d.slice(1);
  else if (d) d = "971" + d;
  return "https://wa.me/" + d;
};

/* responsive: true on phones (<=768px) */
function useIsMobile(bp = 768) {
  const get = () => (typeof window !== "undefined" ? window.innerWidth <= bp : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const f = () => setM(get());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return m;
}

/* ===== seed ===== */
const SEED = [
  { id: 1, num: "RET-2019-0142", name: "سعيد محمد الكتبي", rdate: "2019-03-15", mobile: "0501234567", notes: "",
    type: "retiree", pstatus: "نشط", original: 12000, pay: "paid", source: "صندوق معاشات الشارقة",
    bank: "بنك الإمارات دبي الوطني", start: "2019-04-01",
    bens: [],
    updates: [{ date: "2026-05-12", text: "تم تحديث رقم الحساب البنكي" }, { date: "2026-02-03", text: "تحديث بيانات التواصل" }] },
  { id: 2, num: "RET-2021-0317", name: "خالد عبدالله النقبي", rdate: "2021-07-01", mobile: "0529876543", notes: "تأخر شهادة البنك",
    type: "retiree", pstatus: "نشط", original: 15200, pay: "not_paid", source: "صندوق معاشات الشارقة",
    bank: "مصرف الشارقة الإسلامي", start: "2021-08-01",
    bens: [], updates: [], followUp: true },
  { id: 3, num: "RET-2017-0098", name: "ورثة المرحوم حمد الزعابي", rdate: "2017-01-10", mobile: "0561112233", notes: "تحويل المعاش للورثة",
    type: "heirs", pstatus: "نشط", original: 9000, pay: "paid", source: "صندوق معاشات الشارقة",
    bank: "بنك أبوظبي الأول", start: "2022-03-01",
    bens: [
      { name: "موزة الزعابي", rel: "الزوجة", authority: 6000, complementary: 2750, status: "active", suspendReason: "", notes: "" },
      { name: "أحمد الزعابي", rel: "ابن", authority: 3000, complementary: 1375, status: "active", suspendReason: "", notes: "طالب جامعي" },
      { name: "سارة الزعابي", rel: "ابنة", authority: 3000, complementary: 1375, status: "suspended",
        suspendReason: "إيقاف مؤقت لحين تحديث بيانات الحساب البنكي", notes: "" },
    ],
    updates: [{ date: "2026-04-20", text: "إيقاف حصة الوريثة سارة مؤقتاً لحين تحديث البيانات" }] },
  { id: 4, num: "RET-2020-0205", name: "ورثة المرحومة عائشة السويدي", rdate: "2020-05-20", mobile: "0567778899", notes: "",
    type: "heirs", pstatus: "معلّق", original: 11000, pay: "not_paid", source: "صندوق معاشات الشارقة",
    bank: "بنك الشارقة", start: "2023-01-01",
    bens: [{ name: "علي السويدي", rel: "الزوج", authority: 11000, complementary: 6500, status: "active", suspendReason: "", notes: "" }], updates: [] },
  { id: 5, num: "RET-2018-0061", name: "محمد جمعة الحمادي", rdate: "2018-11-30", mobile: "0501239876", notes: "المعاش يتجاوز الحد الأدنى",
    type: "retiree", pstatus: "نشط", original: 19500, pay: "paid", source: "صندوق معاشات الشارقة",
    bank: "بنك دبي التجاري", start: "2018-12-01",
    bens: [], updates: [] },
];

/* ===== tiny inline icons (no dependency) ===== */
const I = {
  dash: "M3 3h7v7H3V3zm0 11h7v7H3v-7zM14 3h7v7h-7V3zm0 11h7v7h-7v-7z",
  users: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM2 21a8 8 0 0120 0",
  report: "M3 20h18M7 20v-7M12 20V5M17 20v-10",
  search: "M11 4a7 7 0 105.2 11.7L21 21",
  plus: "M12 5v14M5 12h14", x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l4 4L19 6", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z",
  edit: "M4 20h4L20 8l-4-4L4 16v4z", down: "M12 4v12M7 11l5 5 5-5M5 20h14",
  up: "M12 20V8M7 13l5-5 5 5M5 4h14", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  print: "M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z",
  wa: "M21 11.5a8.5 8.5 0 01-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1121 11.5z",
  back: "M15 6l-6 6 6 6", doc: "M7 3h7l4 4v14H7zM14 3v4h4",
  flag: "M5 21V4h13l-3 4 3 4H5",
};
const Icon = ({ d, s = 18, c = "currentColor", w = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w}
    strokeLinecap="round" strokeLinejoin="round">{d.split("M").filter(Boolean).map((p, i) =>
      <path key={i} d={"M" + p} />)}</svg>
);

/* ===== reusable bits ===== */
const Badge = ({ tone = "gold", children }) => {
  const m = { gold: [C.goldTint, C.goldDeep, C.goldLine], green: [C.greenT, C.green, "#BFD9CB"],
    red: [C.redT, C.red, "#E3C2C0"], gray: ["#EFEDE8", C.mid, C.border] }[tone];
  return <span style={{ background: m[0], color: m[1], border: "1px solid " + m[2], borderRadius: 999,
    padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-block", whiteSpace: "nowrap" }}>{children}</span>;
};
const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{children || "—"}</span>
  </div>
);
const inp = { width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid " + C.border,
  borderRadius: 8, fontSize: 14, fontFamily: FONT, color: C.ink, background: C.white, outline: "none" };

/* ===== APP ===== */
export default function App() {
  const boot = loadStore();
  const [view, setView] = useState("dashboard");
  const [data, setData] = useState(boot && Array.isArray(boot.data) ? boot.data.map(normalizeRec) : SEED);
  const [settings] = useState(boot && boot.settings ? boot.settings : { floor: 17500 });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(null);
  const [report, setReport] = useState(null);
  const [showImport, setShowImport] = useState(false);
  FLOOR = Number(settings.floor) || 0;
  useEffect(() => { saveStore({ data, settings }); }, [data, settings]);

  const stats = useMemo(() => ({
    total: data.length,
    paid: data.filter((r) => r.pay === "paid").length,
    notpaid: data.filter((r) => r.pay === "not_paid").length,
    heirs: data.filter((r) => r.type === "heirs").length,
    retiree: data.filter((r) => r.type === "retiree").length,
  }), [data]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter((r) => {
      const hit = !s || r.num.toLowerCase().includes(s) || r.name.includes(q);
      const f = filter === "all" ? true
        : (filter === "paid" || filter === "not_paid") ? r.pay === filter : r.type === filter;
      return hit && f;
    });
  }, [data, q, filter]);

  const save = (r) => {
    if (r.id) setData((d) => d.map((x) => x.id === r.id ? r : x));
    else setData((d) => [{ ...r, id: Date.now() }, ...d]);
    setForm(null);
  };
  const update = (nr) => { setData((d) => d.map((x) => x.id === nr.id ? nr : x)); setOpen(nr); };
  const del = (rec) => { setData((d) => d.filter((x) => x.id !== rec.id)); setForm(null); setOpen(null); setView("dashboard"); };

  const today = new Date().toLocaleDateString("ar-AE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const NAV = [["dashboard", "لوحة المعلومات", I.dash], ["retirees", "سجلات المتقاعدين", I.users], ["reports", "البحث والتقارير", I.report]];

  return (
    <div dir="rtl" style={{ fontFamily: FONT, background: C.canvas, minHeight: "100vh", color: C.ink }}>
      <style>{"@media print{body *{visibility:hidden!important}#caseReport,#caseReport *{visibility:visible!important}#caseReport{position:absolute;inset:0;width:100%;box-shadow:none!important}.no-print{display:none!important}}"
        + ".rm-bottomnav{display:none}.rm-wrap{width:100%}"
        + "@media(max-width:768px){.rm-sidebar{display:none!important}.rm-main{padding:14px 14px 88px!important}.rm-bottomnav{display:flex!important}.rm-hide-mobile{display:none!important}.rm-grid2{grid-template-columns:1fr!important}.rm-drawer{max-width:100%!important}.rm-headpad{padding:10px 14px!important}}"
        + "@media(min-width:1100px){.rm-main{padding:30px 44px!important}.rm-wrap{max-width:1340px;margin-inline:auto}.rm-headpad{padding:14px 40px!important}}"
        + "@media(min-width:1500px){.rm-wrap{max-width:1440px}}"}</style>
      <div style={{ height: 4, background: "linear-gradient(90deg," + C.goldDeep + "," + C.gold + ")" }} />
      <header className="rm-headpad" style={{ background: C.white, borderBottom: "1px solid " + C.border, position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", gap: 12, padding: "12px 22px" }}>
        <img src={LOGO} alt="شعار النظام" style={{ width: 46, height: 46, objectFit: "contain" }} />
        <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.dark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>نظام إدارة المتقاعدين</div>
          <div style={{ fontSize: 10.5, color: C.faint, fontWeight: 700, letterSpacing: .3 }}>{APP_VERSION}</div>
        </div>
        <div className="rm-hide-mobile" style={{ fontSize: 12.5, color: C.mid, fontWeight: 600, background: C.canvas, border: "1px solid " + C.border,
          borderRadius: 9, padding: "8px 13px" }}>{today}</div>
      </header>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <aside className="rm-sidebar" style={{ width: 220, flexShrink: 0, padding: 16, borderInlineStart: "1px solid " + C.border,
          position: "sticky", top: 71, height: "calc(100vh - 71px)" }}>
          {NAV.map(([k, l, d]) => {
            const on = view === k;
            return (
              <button key={k} onClick={() => setView(k)} style={{ width: "100%", display: "flex", alignItems: "center",
                gap: 11, padding: "11px 13px", marginBottom: 6, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                textAlign: "right", cursor: "pointer", fontFamily: FONT,
                background: on ? C.goldTint : "transparent", color: on ? C.goldDeep : C.dark,
                borderInlineStart: "3px solid " + (on ? C.gold : "transparent") }}>
                <Icon d={d} c={on ? C.goldDeep : C.mid} /> {l}
              </button>
            );
          })}
          <div style={{ marginTop: 16, padding: 13, borderRadius: 12, background: C.white, border: "1px solid " + C.border }}>
            <div style={{ fontSize: 12, color: C.faint, fontWeight: 700 }}>الحد الأدنى للمعاش</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginTop: 4 }}>{aed(FLOOR)}</div>
          </div>
        </aside>

        <main className="rm-main" style={{ flex: 1, padding: "22px 26px", minWidth: 0 }}>
          <div className="rm-wrap">
          {view === "dashboard" && <Dashboard stats={stats} data={data} onOpen={setOpen} />}
          {view === "retirees" && (
            <Retirees {...{ list, q, setQ, filter, setFilter, onOpen: setOpen, onAdd: () => setForm(blank()), onImport: () => setShowImport(true) }} />
          )}
          {view === "reports" && <Reports data={data} />}
          </div>
        </main>
      </div>

      <nav className="rm-bottomnav" style={{ position: "fixed", bottom: 0, insetInline: 0, zIndex: 25, background: C.white,
        borderTop: "1px solid " + C.border, justifyContent: "space-around", boxShadow: "0 -2px 10px rgba(0,0,0,.05)" }}>
        {NAV.map(([k, l, d]) => {
          const on = view === k;
          return (
            <button key={k} onClick={() => setView(k)} style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", fontFamily: FONT,
              padding: "8px 2px", color: on ? C.goldDeep : C.mid, fontWeight: 700, fontSize: 11 }}>
              <Icon d={d} s={20} c={on ? C.goldDeep : C.mid} /> {l}
            </button>
          );
        })}
      </nav>

      {open && <Detail key={open.id} r={open} onClose={() => setOpen(null)}
        onEdit={() => { setForm(open); setOpen(null); }} onUpdate={update}
        onReport={() => setReport(open)} />}
      {form && <Form initial={form} onCancel={() => setForm(null)} onSave={save} onDelete={del} />}
      {report && <CaseReport r={report} onClose={() => setReport(null)} />}
      {showImport && <ImportModal data={data} setData={setData} onClose={() => setShowImport(false)} />}
    </div>
  );
}

const blank = () => ({ id: null, num: "", name: "", rdate: "", mobile: "", notes: "",
  type: "retiree", pstatus: "نشط", original: 0, pay: "not_paid", source: "صندوق معاشات الشارقة", bank: "", start: "",
  bens: [], updates: [], followUp: false });

/* guarantee collection fields exist (guards legacy/partial persisted data) */
const normalizeRec = (r) => ({
  ...r,
  bens: Array.isArray(r.bens) ? r.bens : [],
  updates: Array.isArray(r.updates) ? r.updates : [],
  followUp: !!r.followUp,
});
const blankHeir = () => ({ name: "", rel: "", authority: 0, complementary: 0, status: "active", suspendReason: "", notes: "" });

/* ===== Dashboard (clickable cards + drill-down) ===== */
function Dashboard({ stats, data, onOpen }) {
  const isMobile = useIsMobile();
  const [drill, setDrill] = useState(null);
  const cards = [
    { k: "total", l: "إجمالي المتقاعدين", v: stats.total, col: C.gold, f: () => true },
    { k: "paid", l: "معاشات مصروفة", v: stats.paid, col: C.green, f: (r) => r.pay === "paid" },
    { k: "notpaid", l: "معاشات غير مصروفة", v: stats.notpaid, col: C.red, f: (r) => r.pay === "not_paid" },
    { k: "heirs", l: "حالات الورثة", v: stats.heirs, col: C.gold, f: (r) => r.type === "heirs" },
    { k: "retiree", l: "حالات المتقاعدين", v: stats.retiree, col: C.dark, f: (r) => r.type === "retiree" },
  ];
  const active = drill && cards.find((c) => c.k === drill);
  const rows = active ? data.filter(active.f) : [];
  return (
    <div>
      <Head title="لوحة المعلومات" sub="انقر على أي بطاقة لعرض السجلات المرتبطة بها" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
        {cards.map((c) => (
          <button key={c.k} onClick={() => setDrill(c.k)} style={{ textAlign: "right", cursor: "pointer", fontFamily: FONT,
            background: drill === c.k ? C.goldTint : C.white, border: "1px solid " + (drill === c.k ? C.goldLine : C.border),
            borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, color: C.mid, fontWeight: 700 }}>{c.l}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: c.col, marginTop: 8, lineHeight: 1 }}>{c.v}</div>
          </button>
        ))}
      </div>

      {active ? (
        <div style={{ marginTop: 22, background: C.white, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid " + C.border }}>
            <h3 style={{ margin: 0, color: C.dark, fontSize: 15, fontWeight: 700, flex: 1 }}>{active.l} — {rows.length} سجل</h3>
            <button onClick={() => setDrill(null)} style={ghostBtn}><Icon d={I.back} s={15} /> رجوع</button>
          </div>
          {isMobile ? (
            <div style={{ padding: 12 }}>
              {rows.map((r) => (
                <MCard key={r.id} onClick={() => onOpen(r)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 14.5 }}>{r.name}</b>
                    {r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12.5, color: C.mid }}>
                    <span style={{ color: C.goldDeep, fontWeight: 700 }}>{r.num}</span>
                    <span>{r.type === "heirs" ? "ورثة" : "متقاعد"}</span>
                  </div>
                </MCard>
              ))}
              {rows.length === 0 && <div style={{ textAlign: "center", color: C.faint, padding: 24 }}>لا توجد سجلات.</div>}
            </div>
          ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
              <thead><tr style={{ background: C.panel, color: C.mid }}>
                {["الاسم", "رقم الملف", "نوع المستحق", "حالة الصرف"].map((h, i) => <th key={i} style={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => onOpen(r)} style={{ borderTop: "1px solid " + C.border, cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.goldTint}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={td}><b>{r.name}</b></td>
                    <td style={td}><b style={{ color: C.goldDeep }}>{r.num}</b></td>
                    <td style={td}>{r.type === "heirs" ? "ورثة" : "متقاعد"}</td>
                    <td style={td}>{r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: C.faint, padding: 30 }}>لا توجد سجلات.</td></tr>}
              </tbody>
            </table>
          </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 22, background: C.white, border: "1px solid " + C.border, borderRadius: 14, padding: 18 }}>
          <SecTitle>حالات تحتاج إلى متابعة</SecTitle>
          {data.filter((r) => r.followUp).length === 0 && (
            <div style={{ color: C.faint, padding: 8, fontSize: 13.5, lineHeight: 1.8 }}>
              لا توجد حالات في قائمة المتابعة. أضف أي حالة من زر «إضافة إلى قائمة المتابعة» داخل ملف المتقاعد.
            </div>
          )}
          {data.filter((r) => r.followUp).map((r) => (
            <div key={r.id} onClick={() => onOpen(r)} style={{ display: "flex", gap: 12, padding: "10px 0", cursor: "pointer",
              borderBottom: "1px solid " + C.border, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: r.pay === "not_paid" ? C.red : C.gold }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{r.num}</div>
              </div>
              {r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}
              <button onClick={(e) => { e.stopPropagation(); onOpen(r); }} style={{ ...ghostBtn, padding: "6px 12px" }}>متابعة</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Retirees list (Name / Retirement Number / Type only) ===== */
function Retirees({ list, q, setQ, filter, setFilter, onOpen, onAdd, onImport }) {
  const isMobile = useIsMobile();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Head title="سجلات المتقاعدين" sub={list.length + " سجل"} flush />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onImport} style={ghostBtn}><Icon d={I.up} s={16} /> استيراد من Excel</button>
          <button onClick={onAdd} style={goldBtn}><Icon d={I.plus} s={16} c="#fff" /> إضافة متقاعد</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span style={{ position: "absolute", insetInlineStart: 11, top: 9, color: C.faint }}><Icon d={I.search} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث برقم الملف، الاسم، أو الهوية…"
            style={{ ...inp, paddingInlineStart: 38 }} />
        </div>
        {[["all", "الكل"], ["paid", "مصروف"], ["not_paid", "غير مصروف"], ["retiree", "متقاعدون"], ["heirs", "ورثة"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "9px 15px", borderRadius: 9, fontSize: 13.5,
            fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            border: "1px solid " + (filter === k ? C.gold : C.border), background: filter === k ? C.goldTint : C.white,
            color: filter === k ? C.goldDeep : C.mid }}>{l}</button>
        ))}
      </div>
      {isMobile ? (
        <div style={{ marginTop: 14 }}>
          {list.map((r) => (
            <MCard key={r.id} onClick={() => onOpen(r)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 15 }}>{r.name}</b>
                {r.type === "heirs" ? <Badge>ورثة</Badge> : <Badge tone="gray">متقاعد</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: C.goldDeep, fontWeight: 700, marginTop: 5 }}>{r.num}</div>
            </MCard>
          ))}
          {list.length === 0 && <div style={{ textAlign: "center", color: C.faint, padding: 30 }}>لا توجد نتائج مطابقة.</div>}
        </div>
      ) : (
      <div style={{ background: C.white, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden", marginTop: 14 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead><tr style={{ background: C.panel, color: C.mid }}>
              {["الاسم", "رقم الملف", "نوع المستحق", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} onClick={() => onOpen(r)} style={{ borderTop: "1px solid " + C.border, cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = C.goldTint}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={td}><b>{r.name}</b></td>
                  <td style={td}><b style={{ color: C.goldDeep }}>{r.num}</b></td>
                  <td style={td}>{r.type === "heirs" ? <Badge>ورثة</Badge> : <Badge tone="gray">متقاعد</Badge>}</td>
                  <td style={{ ...td, textAlign: "left", color: C.mid }}><Icon d={I.eye} s={17} /></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: C.faint, padding: 34 }}>
                لا توجد نتائج مطابقة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

/* ===== Detail ===== */
function Detail({ r, onClose, onEdit, onUpdate, onReport }) {
  const [tab, setTab] = useState("record");
  const tabs = [["record", "السجل"], ["pension", "المعاش"], ["bens", "المستفيدون والورثة"], ["updates", "التحديثات"]];
  const [note, setNote] = useState(r.notes || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [upText, setUpText] = useState("");
  const [upDate, setUpDate] = useState(new Date().toISOString().slice(0, 10));
  const [heirEdit, setHeirEdit] = useState(null);
  const updates = [...(r.updates || [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  const saveNote = () => { onUpdate({ ...r, notes: note }); setNoteSaved(true); setTimeout(() => setNoteSaved(false), 1800); };
  const addUpdate = () => { if (!upText.trim()) return; onUpdate({ ...r, updates: [{ date: upDate, text: upText.trim() }, ...(r.updates || [])] }); setUpText(""); };
  const saveHeir = (h) => {
    const bens = [...r.bens];
    if (heirEdit.index == null) bens.push(h); else bens[heirEdit.index] = h;
    onUpdate({ ...r, bens }); setHeirEdit(null);
  };
  const delHeir = (i) => onUpdate({ ...r, bens: r.bens.filter((_, j) => j !== i) });

  return (
    <div style={overlay} onClick={onClose}>
      <div className="rm-drawer" style={drawer} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.dark }}>{r.name}</div>
            <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 700 }}>{r.num}</div>
          </div>
          <button onClick={() => onUpdate({ ...r, followUp: !r.followUp })}
            title={r.followUp ? "إزالة من قائمة المتابعة" : "إضافة إلى قائمة المتابعة"}
            style={r.followUp ? { ...goldBtn, background: C.green } : ghostBtn}>
            <Icon d={I.flag} s={14} c={r.followUp ? "#fff" : C.dark} /> متابعة</button>
          <button onClick={onReport} style={goldBtn}><Icon d={I.doc} s={15} c="#fff" /> تقرير الحالة</button>
          <button onClick={onEdit} style={ghostBtn}><Icon d={I.edit} s={14} /> تعديل</button>
          <button onClick={onClose} style={iconBtn}><Icon d={I.x} s={20} c={C.mid} /></button>
        </div>
        <div style={{ display: "flex", gap: 4, padding: "10px 18px 0", borderBottom: "1px solid " + C.border, flexWrap: "wrap" }}>
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ border: "none", background: "transparent", padding: "9px 13px",
              fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              color: tab === k ? C.goldDeep : C.mid, borderBottom: "2.5px solid " + (tab === k ? C.gold : "transparent") }}>{l}</button>
          ))}
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>
          {tab === "record" && (
            <div className="rm-grid2" style={grid2}>
              <Field label="رقم الملف">{r.num}</Field>
              <Field label="الاسم الكامل">{r.name}</Field>
              <Field label="تاريخ التقاعد">{r.rdate}</Field>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>رقم الهاتف</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: C.ink, fontWeight: 600, direction: "ltr" }}>{r.mobile || "—"}</span>
                  {r.mobile && (
                    <a href={waLink(r.mobile)} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.green, color: "#fff",
                        textDecoration: "none", borderRadius: 8, padding: "6px 11px", fontSize: 12.5, fontWeight: 700 }}>
                      <Icon d={I.wa} s={15} c="#fff" /> واتساب
                    </a>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>ملاحظات</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  placeholder="اكتب ملاحظاتك هنا…" style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={saveNote} style={goldBtn}><Icon d={I.check} s={15} c="#fff" /> حفظ الملاحظات</button>
                  {noteSaved && <span style={{ fontSize: 12.5, color: C.green, fontWeight: 700 }}>تم الحفظ ✓</span>}
                </div>
              </div>
            </div>
          )}
          {tab === "pension" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[["المعاش الأصلي", aed(r.original), C.dark], ["المعاش التكميلي", aed(comp(r.original)), C.gold]].map(([l, v, col], i) => (
                  <div key={i} style={{ flex: 1, minWidth: 150, background: C.panel, border: "1px solid " + C.border, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 12, color: C.faint, fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: col, marginTop: 5 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.faint, background: C.goldTint, border: "1px solid " + C.goldLine,
                borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                المعاش التكميلي = {aed(FLOOR)} − المعاش الأصلي (لا يقل عن صفر) · يُحسب تلقائياً
              </div>
              <div className="rm-grid2" style={grid2}>
                <Field label="نوع المستحق">{r.type === "heirs" ? "ورثة" : "متقاعد"}</Field>
                <Field label="حالة المعاش">{r.pstatus}</Field>
                <Field label="حالة الصرف">{r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}</Field>
                <Field label="مصدر المعاش">{r.source}</Field>
                <Field label="البنك">{r.bank}</Field>
                <Field label="تاريخ بدء الصرف">{r.start}</Field>
              </div>
            </div>
          )}
          {tab === "bens" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div style={{ flex: 1 }} />
                <button onClick={() => setHeirEdit({ index: null, heir: blankHeir() })} style={goldBtn}>
                  <Icon d={I.plus} s={15} c="#fff" /> إضافة مستفيد</button>
              </div>
              {r.bens.length === 0 && <div style={{ color: C.faint, textAlign: "center", padding: 14 }}>لا يوجد مستفيدون مسجّلون.</div>}
              {r.bens.map((b, i) => {
                return (
                  <div key={i} style={{ border: "1px solid " + C.border, borderRadius: 12, padding: 13, marginBottom: 9 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                      <b style={{ fontSize: 14.5 }}>{b.name}</b>
                      <span style={{ color: C.faint, fontSize: 13 }}>· {b.rel}</span>
                      <div style={{ flex: 1 }} />
                      {b.status === "active" ? <Badge tone="green">نشط</Badge> : <Badge tone="red">موقوف</Badge>}
                      <button onClick={() => setHeirEdit({ index: i, heir: { ...b } })} style={{ ...ghostBtn, padding: "5px 10px" }}><Icon d={I.edit} s={13} /> تعديل</button>
                      <button onClick={() => delHeir(i)} style={{ ...ghostBtn, padding: "5px 9px", color: C.red }}><Icon d={I.trash} s={13} c={C.red} /></button>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 150, background: C.panel, border: "1px solid " + C.border, borderRadius: 10, padding: "9px 12px" }}>
                        <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 700 }}>حصة جهة المعاش</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginTop: 3 }}>{aed(b.authority)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 150, background: C.panel, border: "1px solid " + C.border, borderRadius: 10, padding: "9px 12px" }}>
                        <div style={{ fontSize: 11.5, color: C.faint, fontWeight: 700 }}>المعاش التكميلي</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.gold, marginTop: 3 }}>{aed(b.complementary)}</div>
                      </div>
                    </div>
                    {b.status === "suspended" && b.suspendReason && (
                      <div style={{ marginTop: 9, fontSize: 12.5, color: C.red, background: C.redT, border: "1px solid #E3C2C0", borderRadius: 8, padding: "7px 11px" }}>
                        سبب الإيقاف: {b.suspendReason}
                      </div>
                    )}
                    {b.notes && <div style={{ fontSize: 12.5, color: C.faint, marginTop: 8 }}>{b.notes}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {tab === "updates" && (
            <div>
              <SecTitle>إضافة تحديث جديد</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
                <Lbl t="تفاصيل التحديث"><input style={inp} value={upText} onChange={(e) => setUpText(e.target.value)} placeholder="اكتب تفاصيل التحديث…" /></Lbl>
                <Lbl t="تاريخ التحديث"><input type="date" style={inp} value={upDate} onChange={(e) => setUpDate(e.target.value)} /></Lbl>
              </div>
              <button onClick={addUpdate} style={{ ...goldBtn, marginTop: 12 }}><Icon d={I.plus} s={15} c="#fff" /> إضافة التحديث</button>
              <div style={{ height: 20 }} />
              <SecTitle>آخر التحديثات على الملف</SecTitle>
              {updates.length === 0 && <div style={{ color: C.faint, padding: 8 }}>لا توجد تحديثات مسجّلة على هذا الملف.</div>}
              <div>
                {updates.map((u, i) => (
                  <div key={i} style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 11, height: 11, borderRadius: 11, background: C.gold, marginTop: 5, flexShrink: 0 }} />
                      {i < updates.length - 1 && <span style={{ width: 2, flex: 1, background: C.goldLine, marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <div style={{ fontSize: 12, color: C.gold, fontWeight: 700, direction: "ltr", textAlign: "right" }}>{u.date}</div>
                      <div style={{ fontSize: 14, color: C.ink, fontWeight: 600, marginTop: 2 }}>{u.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {heirEdit && <HeirForm initial={heirEdit.heir} onCancel={() => setHeirEdit(null)} onSave={saveHeir} />}
    </div>
  );
}

/* ===== Heir editor ===== */
function HeirForm({ initial, onCancel, onSave }) {
  const [h, setH] = useState({ ...initial });
  const set = (k, v) => setH((x) => ({ ...x, [k]: v }));
  const valid = h.name.trim() && h.rel.trim();
  return (
    <div style={{ ...overlay, zIndex: 60 }} onClick={onCancel}>
      <div className="rm-drawer" style={{ ...drawer, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, color: C.dark, flex: 1 }}>{initial.name ? "تعديل بيانات المستفيد" : "إضافة مستفيد / وريث"}</h2>
          <button onClick={onCancel} style={iconBtn}><Icon d={I.x} s={20} c={C.mid} /></button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>
          <div className="rm-grid2" style={grid2}>
            <Lbl t="اسم المستفيد *"><input style={inp} value={h.name} onChange={(e) => set("name", e.target.value)} /></Lbl>
            <Lbl t="صلة القرابة *"><input style={inp} value={h.rel} onChange={(e) => set("rel", e.target.value)} placeholder="الزوجة / ابن / ابنة…" /></Lbl>
            <Lbl t="حالة الصرف"><Sel value={h.status} onChange={(e) => set("status", e.target.value)} opts={[["active", "نشط"], ["suspended", "موقوف"]]} /></Lbl>
            <Lbl t="مبلغ حصة جهة المعاش (د.إ)"><input type="number" style={inp} value={h.authority} onChange={(e) => set("authority", Number(e.target.value))} /></Lbl>
            <Lbl t="المعاش التكميلي (د.إ)"><input type="number" style={inp} value={h.complementary} onChange={(e) => set("complementary", Number(e.target.value))} /></Lbl>
          </div>
          {h.status === "suspended" && (
            <div style={{ marginTop: 14 }}>
              <Lbl t="سبب الإيقاف"><input style={inp} value={h.suspendReason} onChange={(e) => set("suspendReason", e.target.value)} placeholder="اكتب سبب إيقاف الصرف…" /></Lbl>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Lbl t="ملاحظات"><input style={inp} value={h.notes} onChange={(e) => set("notes", e.target.value)} /></Lbl>
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid " + C.border, display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={!valid} onClick={() => onSave(h)} style={{ ...goldBtn, opacity: valid ? 1 : .5, cursor: valid ? "pointer" : "not-allowed" }}>
            <Icon d={I.check} s={16} c="#fff" /> حفظ</button>
          <button onClick={onCancel} style={ghostBtn}>إلغاء</button>
          {!valid && <span style={{ fontSize: 12, color: C.red }}>أدخل الاسم وصلة القرابة</span>}
        </div>
      </div>
    </div>
  );
}

/* ===== Add / Edit retiree form ===== */
function Form({ initial, onCancel, onSave, onDelete }) {
  const [r, setR] = useState({ ...initial });
  const set = (k, v) => setR((x) => ({ ...x, [k]: v }));
  const mobOk = !r.mobile || /^05\d{8}$/.test(r.mobile);
  const valid = r.num && r.name && mobOk;
  return (
    <div style={overlay}>
      <div className="rm-drawer" style={{ ...drawer, maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 17, color: C.dark, flex: 1 }}>{initial.id ? "تعديل بيانات المتقاعد" : "إضافة متقاعد جديد"}</h2>
          <button onClick={onCancel} style={iconBtn}><Icon d={I.x} s={20} c={C.mid} /></button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>
          <SecTitle>بيانات المتقاعد</SecTitle>
          <div className="rm-grid2" style={grid2}>
            <Lbl t="رقم الملف *"><input style={inp} value={r.num} onChange={(e) => set("num", e.target.value)} placeholder="RET-2026-0001" /></Lbl>
            <Lbl t="الاسم الكامل *"><input style={inp} value={r.name} onChange={(e) => set("name", e.target.value)} /></Lbl>
            <Lbl t="تاريخ التقاعد"><input type="date" style={inp} value={r.rdate} onChange={(e) => set("rdate", e.target.value)} /></Lbl>
            <Lbl t="رقم الهاتف" err={!mobOk ? "الصيغة: 05XXXXXXXX" : ""}>
              <input style={{ ...inp, direction: "ltr" }} value={r.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="05XXXXXXXX" /></Lbl>
            <div style={{ gridColumn: "1/-1" }}><Lbl t="ملاحظات"><input style={inp} value={r.notes} onChange={(e) => set("notes", e.target.value)} /></Lbl></div>
          </div>
          <div style={{ height: 16 }} />
          <SecTitle>معلومات المعاش</SecTitle>
          <div className="rm-grid2" style={grid2}>
            <Lbl t="نوع المستحق"><Sel value={r.type} onChange={(e) => set("type", e.target.value)} opts={[["retiree", "متقاعد"], ["heirs", "ورثة"]]} /></Lbl>
            <Lbl t="حالة المعاش"><Sel value={r.pstatus} onChange={(e) => set("pstatus", e.target.value)} opts={[["نشط", "نشط"], ["معلّق", "معلّق"], ["موقوف", "موقوف"]]} /></Lbl>
            <Lbl t="المعاش الأصلي (د.إ)"><input type="number" style={inp} value={r.original} onChange={(e) => set("original", Number(e.target.value))} /></Lbl>
            <Lbl t="حالة الصرف"><Sel value={r.pay} onChange={(e) => set("pay", e.target.value)} opts={[["not_paid", "غير مصروف"], ["paid", "مصروف"]]} /></Lbl>
            <Lbl t="البنك"><input style={inp} value={r.bank} onChange={(e) => set("bank", e.target.value)} /></Lbl>
            <Lbl t="تاريخ بدء الصرف"><input type="date" style={inp} value={r.start} onChange={(e) => set("start", e.target.value)} /></Lbl>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <div style={{ flex: 1, background: C.goldTint, border: "1px solid " + C.goldLine, borderRadius: 12, padding: 13 }}>
              <div style={{ fontSize: 12, color: C.mid, fontWeight: 700 }}>المعاش التكميلي (تلقائي)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, marginTop: 5 }}>{aed(comp(r.original))}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid " + C.border, display: "flex", gap: 10, alignItems: "center" }}>
          <button disabled={!valid} onClick={() => onSave(r)} style={{ ...goldBtn, opacity: valid ? 1 : .5, cursor: valid ? "pointer" : "not-allowed" }}>
            <Icon d={I.check} s={16} c="#fff" /> حفظ</button>
          <button onClick={onCancel} style={ghostBtn}>إلغاء</button>
          {!valid && <span style={{ fontSize: 12, color: C.red }}>أدخل رقم الملف والاسم</span>}
          {initial.id && <div style={{ flex: 1 }} />}
          {initial.id && <button onClick={() => { if (window.confirm("هل أنت متأكد من حذف ملف هذا المتقاعد؟ لا يمكن التراجع عن هذا الإجراء.")) onDelete(initial); }} style={{ ...ghostBtn, color: C.red, borderColor: "#E3C2C0" }}><Icon d={I.trash} s={15} c={C.red} /> حذف ملف المتقاعد</button>}
        </div>
      </div>
    </div>
  );
}

/* ===== Reports (no total pension) ===== */
function Reports({ data }) {
  const isMobile = useIsMobile();
  const [type, setType] = useState("all");
  const [pay, setPay] = useState("all");
  const [benS, setBenS] = useState("all");
  const [rFrom, setRFrom] = useState("");
  const [rTo, setRTo] = useState("");
  const [oMin, setOMin] = useState("");
  const [oMax, setOMax] = useState("");
  const [cMin, setCMin] = useState("");
  const [cMax, setCMax] = useState("");

  const res = useMemo(() => data.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (pay !== "all" && r.pay !== pay) return false;
    if (benS !== "all" && !r.bens.some((b) => b.status === benS)) return false;
    if (rFrom && r.rdate < rFrom) return false;
    if (rTo && r.rdate > rTo) return false;
    const o = Number(r.original), cc = comp(r.original);
    if (oMin !== "" && o < Number(oMin)) return false;
    if (oMax !== "" && o > Number(oMax)) return false;
    if (cMin !== "" && cc < Number(cMin)) return false;
    if (cMax !== "" && cc > Number(cMax)) return false;
    return true;
  }), [data, type, pay, benS, rFrom, rTo, oMin, oMax, cMin, cMax]);

  const sums = res.reduce((a, r) => ({ orig: a.orig + Number(r.original), comp: a.comp + comp(r.original) }), { orig: 0, comp: 0 });
  const reset = () => { setType("all"); setPay("all"); setBenS("all"); setRFrom(""); setRTo(""); setOMin(""); setOMax(""); setCMin(""); setCMax(""); };

  const exportExcel = () => {
    const head = ["رقم الملف", "الاسم", "نوع المستحق", "تاريخ التقاعد", "المعاش الأصلي", "المعاش التكميلي", "حالة الصرف"];
    const rows = res.map((r) => [r.num, r.name, r.type === "heirs" ? "ورثة" : "متقاعد", r.rdate, r.original, comp(r.original), r.pay === "paid" ? "مصروف" : "غير مصروف"]);
    const csv = "\ufeff" + [head, ...rows].map((a) => a.map((c) => '"' + c + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = "تقرير_المتقاعدين.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Head title="البحث والتقارير" sub="تصفية البيانات وتصدير النتائج" flush />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={reset} style={ghostBtn}>إعادة تعيين</button>
          <button onClick={exportExcel} style={goldBtn}><Icon d={I.down} s={16} c="#fff" /> تصدير Excel</button>
        </div>
      </div>
      <div style={{ marginTop: 16, background: C.white, border: "1px solid " + C.border, borderRadius: 14, padding: 18 }}>
        <SecTitle>عوامل التصفية</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          <Lbl t="نوع المستحق"><Sel value={type} onChange={(e) => setType(e.target.value)} opts={[["all", "الكل"], ["retiree", "متقاعد"], ["heirs", "ورثة"]]} /></Lbl>
          <Lbl t="حالة صرف المعاش"><Sel value={pay} onChange={(e) => setPay(e.target.value)} opts={[["all", "الكل"], ["paid", "مصروف"], ["not_paid", "غير مصروف"]]} /></Lbl>
          <Lbl t="حالة صرف المستفيد"><Sel value={benS} onChange={(e) => setBenS(e.target.value)} opts={[["all", "الكل"], ["active", "نشط"], ["suspended", "موقوف"]]} /></Lbl>
          <Lbl t="تاريخ التقاعد (من / إلى)">
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" style={inp} value={rFrom} onChange={(e) => setRFrom(e.target.value)} />
              <input type="date" style={inp} value={rTo} onChange={(e) => setRTo(e.target.value)} />
            </div></Lbl>
          <Lbl t="المعاش الأصلي (من / إلى)">
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="من" style={inp} value={oMin} onChange={(e) => setOMin(e.target.value)} />
              <input type="number" placeholder="إلى" style={inp} value={oMax} onChange={(e) => setOMax(e.target.value)} />
            </div></Lbl>
          <Lbl t="المعاش التكميلي (من / إلى)">
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="من" style={inp} value={cMin} onChange={(e) => setCMin(e.target.value)} />
              <input type="number" placeholder="إلى" style={inp} value={cMax} onChange={(e) => setCMax(e.target.value)} />
            </div></Lbl>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginTop: 16 }}>
        {[["عدد النتائج", res.length, C.dark], ["إجمالي المعاش الأصلي", aed(sums.orig), C.dark], ["إجمالي المعاش التكميلي", aed(sums.comp), C.gold]].map(([l, v, col], i) => (
          <div key={i} style={{ background: C.white, border: "1px solid " + C.border, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12.5, color: C.mid, fontWeight: 700 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: col, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>
      {isMobile ? (
        <div style={{ marginTop: 16 }}>
          {res.map((r) => (
            <MCard key={r.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 14.5 }}>{r.name}</b>
                {r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: C.goldDeep, fontWeight: 700, marginTop: 4 }}>{r.num} · {r.type === "heirs" ? "ورثة" : "متقاعد"}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12.5, color: C.mid, flexWrap: "wrap" }}>
                <span>الأصلي: <b style={{ color: C.ink }}>{aed(r.original)}</b></span>
                <span>التكميلي: <b style={{ color: C.goldDeep }}>{aed(comp(r.original))}</b></span>
              </div>
            </MCard>
          ))}
          {res.length === 0 && <div style={{ textAlign: "center", color: C.faint, padding: 26 }}>لا توجد نتائج مطابقة لعوامل التصفية المحددة.</div>}
        </div>
      ) : (
      <div style={{ marginTop: 16, background: C.white, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 760 }}>
            <thead><tr style={{ background: C.panel, color: C.mid }}>
              {["رقم الملف", "الاسم", "نوع المستحق", "تاريخ التقاعد", "الأصلي", "التكميلي", "حالة الصرف"].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {res.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid " + C.border }}>
                  <td style={td}><b style={{ color: C.goldDeep }}>{r.num}</b></td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.type === "heirs" ? "ورثة" : "متقاعد"}</td>
                  <td style={{ ...td, direction: "ltr", textAlign: "right" }}>{r.rdate}</td>
                  <td style={td}>{aed(r.original)}</td>
                  <td style={td}>{aed(comp(r.original))}</td>
                  <td style={td}>{r.pay === "paid" ? <Badge tone="green">مصروف</Badge> : <Badge tone="red">غير مصروف</Badge>}</td>
                </tr>
              ))}
              {res.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: C.faint, padding: 34 }}>لا توجد نتائج مطابقة لعوامل التصفية المحددة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}

/* ===== Case report (printable) ===== */
function CaseReport({ r, onClose }) {
  const updates = [...(r.updates || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const today = new Date().toLocaleDateString("ar-AE", { year: "numeric", month: "long", day: "numeric" });
  const rowS = { display: "flex", borderBottom: "1px solid " + C.border, padding: "7px 0", fontSize: 13.5 };
  const lab = { width: 170, color: C.mid, fontWeight: 700, flexShrink: 0 };
  const sec = { color: C.goldDeep, fontSize: 15, fontWeight: 800, margin: "20px 0 8px", paddingBottom: 6, borderBottom: "2px solid " + C.goldLine };
  return (
    <div style={{ ...overlay, background: "#3a372f", zIndex: 65, overflow: "auto", display: "block" }}>
      <div className="no-print" style={{ position: "sticky", top: 0, display: "flex", gap: 10, justifyContent: "flex-end",
        padding: "12px 18px", background: "#2e2b25" }}>
        <button onClick={() => window.print()} style={goldBtn}><Icon d={I.print} s={16} c="#fff" /> طباعة التقرير</button>
        <button onClick={onClose} style={{ ...ghostBtn, background: "transparent", color: "#fff", borderColor: "#5a554b" }}>
          <Icon d={I.x} s={16} c="#fff" /> إغلاق</button>
      </div>
      <div id="caseReport" dir="rtl" style={{ background: C.white, color: C.ink, fontFamily: FONT,
        width: "min(820px,94vw)", margin: "18px auto", padding: "32px 40px", borderRadius: 6,
        boxShadow: "0 10px 40px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "3px solid " + C.gold, paddingBottom: 16 }}>
          <img src={LOGO} alt="شعار النظام" style={{ width: 70, height: 70, objectFit: "contain" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>نظام إدارة المتقاعدين</div>
            <div style={{ fontSize: 15, color: C.gold, fontWeight: 700, marginTop: 2 }}>تقرير حالة</div>
          </div>
          <div style={{ textAlign: "left", fontSize: 12, color: C.mid }}>
            <div>رقم الملف</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.goldDeep, direction: "ltr" }}>{r.num}</div>
            <div style={{ marginTop: 6 }}>تاريخ التقرير: {today}</div>
          </div>
        </div>

        <div style={sec}>أولاً: البيانات الأساسية</div>
        <div style={rowS}><span style={lab}>الاسم الكامل</span><span style={{ fontWeight: 700 }}>{r.name}</span></div>
        <div style={rowS}><span style={lab}>نوع المستحق</span><span>{r.type === "heirs" ? "ورثة" : "متقاعد"}</span></div>
        <div style={rowS}><span style={lab}>تاريخ التقاعد</span><span>{r.rdate}</span></div>
        <div style={rowS}><span style={lab}>رقم الهاتف</span><span style={{ direction: "ltr" }}>{r.mobile || "—"}</span></div>

        <div style={sec}>ثانياً: معلومات المعاش</div>
        <div style={rowS}><span style={lab}>المعاش الأصلي</span><span style={{ fontWeight: 700 }}>{aed(r.original)}</span></div>
        <div style={rowS}><span style={lab}>المعاش التكميلي</span><span style={{ fontWeight: 700, color: C.goldDeep }}>{aed(comp(r.original))}</span></div>
        <div style={rowS}><span style={lab}>حالة المعاش</span><span>{r.pstatus}</span></div>
        <div style={rowS}><span style={lab}>حالة الصرف</span><span style={{ fontWeight: 700, color: r.pay === "paid" ? C.green : C.red }}>{r.pay === "paid" ? "مصروف" : "غير مصروف"}</span></div>
        <div style={rowS}><span style={lab}>مصدر المعاش</span><span>{r.source}</span></div>
        <div style={rowS}><span style={lab}>البنك</span><span>{r.bank}</span></div>
        <div style={rowS}><span style={lab}>تاريخ بدء الصرف</span><span>{r.start}</span></div>

        {r.type === "heirs" && (
          <>
            <div style={sec}>ثالثاً: المستفيدون والورثة</div>
            {r.bens.length === 0 && <div style={{ color: C.mid, padding: 6 }}>لا يوجد مستفيدون مسجّلون.</div>}
            {r.bens.map((b, i) => (
              <div key={i} style={{ border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <b>{b.name}</b><span style={{ color: C.mid, fontSize: 13 }}>· {b.rel}</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, color: b.status === "active" ? C.green : C.red }}>{b.status === "active" ? "نشط" : "موقوف"}</span>
                </div>
                <div style={{ display: "flex", gap: 24, marginTop: 6, fontSize: 13 }}>
                  <span>حصة جهة المعاش: <b>{aed(b.authority)}</b></span>
                  <span>المعاش التكميلي: <b style={{ color: C.goldDeep }}>{aed(b.complementary)}</b></span>
                </div>
                {b.status === "suspended" && b.suspendReason && <div style={{ marginTop: 6, fontSize: 12.5, color: C.red }}>سبب الإيقاف: {b.suspendReason}</div>}
                {b.notes && <div style={{ marginTop: 4, fontSize: 12.5, color: C.mid }}>ملاحظات: {b.notes}</div>}
              </div>
            ))}
          </>
        )}

        <div style={sec}>{r.type === "heirs" ? "رابعاً" : "ثالثاً"}: الملاحظات</div>
        <div style={{ fontSize: 13.5, color: C.ink, minHeight: 24 }}>{r.notes || "لا توجد ملاحظات."}</div>

        <div style={sec}>{r.type === "heirs" ? "خامساً" : "رابعاً"}: آخر التحديثات على الملف</div>
        {updates.length === 0 && <div style={{ color: C.mid, fontSize: 13 }}>لا توجد تحديثات مسجّلة.</div>}
        {updates.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "5px 0", fontSize: 13.5 }}>
            <span style={{ color: C.goldDeep, fontWeight: 700, width: 100, direction: "ltr", textAlign: "right" }}>{u.date}</span>
            <span>{u.text}</span>
          </div>
        ))}

        <div style={{ marginTop: 28, paddingTop: 14, borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mid }}>
          <span>أُعدّ هذا التقرير آلياً من نظام إدارة المتقاعدين.</span>
          <span>نظام إدارة المتقاعدين</span>
        </div>
      </div>
    </div>
  );
}

/* ===== mobile list card ===== */
const MCard = ({ onClick, children }) => (
  <div onClick={onClick} style={{ border: "1px solid " + C.border, borderRadius: 12, padding: 13, marginBottom: 10,
    background: C.white, cursor: onClick ? "pointer" : "default" }}>{children}</div>
);

/* ===== Excel / CSV bulk import ===== */
const IMPORT_COLS = [
  ["رقم الملف", "num", true],
  ["اسم المتقاعد", "name", true],
  ["نوع المستحق", "type"],
  ["رقم الهاتف", "mobile"],
  ["المعاش الأصلي", "original"],
  ["المعاش التكميلي", "origComp"],
  ["حالة الصرف", "pay"],
  ["ملاحظات", "notes"],
  ["اسم الوريث", "hName"],
  ["صلة القرابة", "hRel"],
  ["مبلغ حصة جهة المعاش", "hAuthority"],
  ["المعاش التكميلي للوريث", "hComp"],
  ["حالة صرف الوريث", "hStatus"],
  ["سبب الإيقاف", "hReason"],
  ["ملاحظات الوريث", "hNotes"],
];

function parseCSV(text) {
  text = String(text).replace(/^\uFEFF/, "");
  const rows = []; let row = []; let field = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* ignore */ }
      else field += ch;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

const mapType = (v) => { const s = String(v || "").trim().toLowerCase(); return (s === "ورثة" || s === "heirs" || s === "وريث") ? "heirs" : (s === "متقاعد" || s === "retiree") ? "retiree" : ""; };
const mapPay = (v) => { const s = String(v || "").trim().toLowerCase(); return (s === "مصروف" || s === "paid") ? "paid" : (s === "غير مصروف" || s.indexOf("not") >= 0) ? "not_paid" : ""; };
const mapHStatus = (v) => { const s = String(v || "").trim().toLowerCase(); return (s === "موقوف" || s === "suspended") ? "suspended" : "active"; };
const numOk = (v) => v === "" || v == null || !isNaN(Number(v));

const TEMPLATE_CSV = "\uFEFF" + IMPORT_COLS.map((c) => c[0]).join(",") + "\n"
  + ["RET-2026-1001", "سعيد أحمد المرّي", "متقاعد", "0501112233", "13000", "", "مصروف", "ملاحظة تجريبية", "", "", "", "", "", "", ""].join(",") + "\n"
  + ["RET-2026-1002", "ورثة المرحوم علي", "ورثة", "0509998877", "8000", "", "غير مصروف", "", "موزة علي", "الزوجة", "6000", "2750", "نشط", "", "ملاحظة وريث"].join(",") + "\n"
  + ["RET-2026-1002", "", "", "", "", "", "", "", "أحمد علي", "ابن", "3000", "1375", "موقوف", "تحديث بيانات الحساب", ""].join(",");

function buildPreview(rows, existingNums) {
  if (rows.length < 2) return { groups: [], headerOk: false };
  const header = rows[0].map((h) => String(h).trim());
  const idx = {};
  IMPORT_COLS.forEach((c) => { idx[c[1]] = header.indexOf(c[0]); });
  const get = (r, key) => { const i = idx[key]; return i >= 0 && i < r.length ? String(r[i]).trim() : ""; };

  const order = []; const map = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const num = get(r, "num");
    const key = num || ("__noid_" + i);
    if (!map[key]) { map[key] = { rows: [] }; order.push(key); }
    map[key].rows.push(r);
  }
  const seen = {};
  const groups = order.map((key) => {
    const first = map[key].rows[0];
    const num = get(first, "num");
    const name = get(first, "name");
    const issues = [];
    if (!num) issues.push("رقم الملف مفقود");
    if (!name) issues.push("اسم المتقاعد مفقود");
    const original = get(first, "original");
    if (!numOk(original)) issues.push("المعاش الأصلي غير رقمي");
    const bens = [];
    map[key].rows.forEach((r) => {
      const hn = get(r, "hName");
      if (hn) {
        const auth = get(r, "hAuthority"); const hc = get(r, "hComp");
        if (!numOk(auth)) issues.push("حصة جهة المعاش غير رقمية (" + hn + ")");
        if (!numOk(hc)) issues.push("المعاش التكميلي للوريث غير رقمي (" + hn + ")");
        bens.push({ name: hn, rel: get(r, "hRel"), authority: Number(auth) || 0, complementary: Number(hc) || 0,
          status: mapHStatus(get(r, "hStatus")), suspendReason: get(r, "hReason"), notes: get(r, "hNotes") });
      }
    });
    let type = mapType(get(first, "type"));
    if (!type) type = bens.length ? "heirs" : "retiree";
    let status = "valid";
    if (issues.length) status = "error";
    else if (num && (existingNums.has(num) || seen[num])) status = "dup";
    if (num) seen[num] = true;
    const record = {
      num, name, rdate: "", mobile: get(first, "mobile"), notes: get(first, "notes"),
      type, pstatus: "نشط", original: Number(original) || 0, pay: mapPay(get(first, "pay")) || "not_paid",
      source: "", bank: "", start: "", bens, updates: [], followUp: false,
    };
    return { num, name, type, heirs: bens.length, status, issues, record };
  });
  return { groups, headerOk: true };
}

function ImportModal({ data, setData, onClose }) {
  const [preview, setPreview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();
  const existingNums = new Set(data.map((r) => r.num));

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "قالب_استيراد_المتقاعدين.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const onFile = (file) => {
    setFileName(file.name);
    const r = new FileReader();
    r.onload = () => { try { setPreview(buildPreview(parseCSV(r.result), existingNums)); setSummary(null); } catch (e) { setPreview({ groups: [], headerOk: false }); } };
    r.readAsText(file, "utf-8");
  };
  const confirmImport = () => {
    const valid = preview.groups.filter((g) => g.status === "valid");
    const dup = preview.groups.filter((g) => g.status === "dup").length;
    const err = preview.groups.filter((g) => g.status === "error").length;
    const now = Date.now();
    const newRecs = valid.map((g, i) => ({ ...g.record, id: now + i }));
    setData((d) => [...newRecs, ...d]);
    setSummary({ imported: newRecs.length, dup, err });
    setPreview(null);
  };
  const counts = preview ? {
    valid: preview.groups.filter((g) => g.status === "valid").length,
    dup: preview.groups.filter((g) => g.status === "dup").length,
    err: preview.groups.filter((g) => g.status === "error").length,
  } : null;

  return (
    <div style={{ ...overlay, alignItems: "center", justifyContent: "center", zIndex: 80 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 14, width: "min(900px,96vw)",
        maxHeight: "90vh", overflowY: "auto", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: C.dark, flex: 1 }}>استيراد بيانات من Excel</h2>
          <button onClick={onClose} style={iconBtn}><Icon d={I.x} s={20} c={C.mid} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.mid, margin: "2px 0 14px", lineHeight: 1.8 }}>
          أداة لإدخال أعداد كبيرة من المتقاعدين والورثة دفعة واحدة. نزّل القالب، عبّئ البيانات في Excel،
          ثم احفظه بصيغة CSV (UTF-8) واستورده هنا. سيُعرض جدول مراجعة قبل الإضافة النهائية.
          (في النسخة المؤسسية المستقبلية سيتم ربط هذه العملية بخوادم الجهة مباشرة.)
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={downloadTemplate} style={ghostBtn}><Icon d={I.down} s={16} /> تنزيل القالب</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} style={goldBtn}><Icon d={I.up} s={16} c="#fff" /> اختيار ملف CSV</button>
          <input type="file" ref={fileRef} accept=".csv,text/csv" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />
          {fileName && <span style={{ alignSelf: "center", fontSize: 12.5, color: C.faint }}>{fileName}</span>}
        </div>

        <div style={{ fontSize: 12, color: C.faint, background: C.goldTint, border: "1px solid " + C.goldLine, borderRadius: 8, padding: "9px 12px", marginBottom: 16 }}>
          الأعمدة المطلوبة: <b style={{ color: C.goldDeep }}>{IMPORT_COLS.filter((c) => c[2]).map((c) => c[0]).join("، ")}</b> (إلزامية). باقي الأعمدة اختيارية. لإضافة ورثة لنفس المتقاعد، كرّر رقم الملف في صفوف الورثة.
        </div>

        {summary && (
          <div style={{ border: "1px solid " + C.border, borderRadius: 12, padding: 18 }}>
            <SecTitle>ملخّص الاستيراد</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[["سجلات مُضافة", summary.imported, C.green], ["سجلات مكررة (تم تجاوزها)", summary.dup, C.gold], ["صفوف بها أخطاء", summary.err, C.red]].map(([l, v, col], i) => (
                <div key={i} style={{ background: C.panel, border: "1px solid " + C.border, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 12.5, color: C.mid, fontWeight: 700 }}>{l}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: col, marginTop: 6 }}>{v}</div>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ ...goldBtn, marginTop: 16, width: "100%", justifyContent: "center" }}>تم</button>
          </div>
        )}

        {preview && !preview.headerOk && (
          <div style={{ color: C.red, background: C.redT, border: "1px solid #E3C2C0", borderRadius: 10, padding: 14, fontSize: 13.5, fontWeight: 700 }}>
            تعذّرت قراءة الملف. تأكد من أنه ملف CSV يحتوي صف العناوين والأعمدة المطلوبة.
          </div>
        )}

        {preview && preview.headerOk && (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <Badge tone="green">صالحة للإضافة: {counts.valid}</Badge>
              <Badge tone="gold">مكررة: {counts.dup}</Badge>
              <Badge tone="red">أخطاء: {counts.err}</Badge>
            </div>
            <div style={{ border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto", maxHeight: "42vh", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
                  <thead><tr style={{ background: C.panel, color: C.mid }}>
                    {["رقم الملف", "الاسم", "النوع", "الورثة", "الحالة", "الملاحظات"].map((h, i) => <th key={i} style={th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {preview.groups.map((g, i) => (
                      <tr key={i} style={{ borderTop: "1px solid " + C.border,
                        background: g.status === "error" ? C.redT : g.status === "dup" ? "#F4F1EA" : C.white }}>
                        <td style={td}><b style={{ color: g.num ? C.goldDeep : C.red }}>{g.num || "—"}</b></td>
                        <td style={td}>{g.name || <span style={{ color: C.red }}>—</span>}</td>
                        <td style={td}>{g.type === "heirs" ? "ورثة" : "متقاعد"}</td>
                        <td style={td}>{g.heirs || "—"}</td>
                        <td style={td}>{g.status === "valid" ? <Badge tone="green">صالح</Badge> : g.status === "dup" ? <Badge tone="gold">مكرر</Badge> : <Badge tone="red">خطأ</Badge>}</td>
                        <td style={{ ...td, color: C.red, fontSize: 12 }}>{g.issues.join("، ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={confirmImport} disabled={counts.valid === 0}
                style={{ ...goldBtn, opacity: counts.valid === 0 ? .5 : 1, cursor: counts.valid === 0 ? "not-allowed" : "pointer" }}>
                <Icon d={I.check} s={16} c="#fff" /> تأكيد استيراد {counts.valid} سجل</button>
              <button onClick={() => { setPreview(null); setFileName(""); }} style={ghostBtn}>اختيار ملف آخر</button>
              {counts.valid === 0 && <span style={{ fontSize: 12, color: C.red }}>لا توجد سجلات صالحة للإضافة.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== shared ===== */
const Head = ({ title, sub, flush }) => (
  <div style={{ marginBottom: flush ? 0 : 18 }}>
    <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.dark }}>{title}</h1>
    {sub && <div style={{ fontSize: 13.5, color: C.faint, marginTop: 4 }}>{sub}</div>}
  </div>
);
const SecTitle = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <h3 style={{ margin: 0, color: C.dark, fontSize: 15, fontWeight: 700 }}>{children}</h3>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg," + C.goldLine + ",transparent)" }} />
  </div>
);
const Lbl = ({ t, err, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <span style={{ fontSize: 12.5, color: C.mid, fontWeight: 700 }}>{t}</span>{children}
    {err && <span style={{ fontSize: 11.5, color: C.red }}>{err}</span>}
  </div>
);
const Sel = ({ opts, ...p }) => (
  <select {...p} style={{ ...inp }}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
);
const th = { textAlign: "right", padding: "12px 14px", fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap" };
const td = { padding: "12px 14px", color: C.ink };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const overlay = { position: "fixed", inset: 0, background: "rgba(40,38,32,.42)", zIndex: 50, display: "flex" };
const drawer = { background: C.white, width: "100%", maxWidth: 640, height: "100%", display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,.14)" };
const goldBtn = { display: "inline-flex", alignItems: "center", gap: 7, background: C.gold, color: C.white, border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT };
const ghostBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: C.white, color: C.dark, border: "1px solid " + C.border, borderRadius: 9, padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT };
const iconBtn = { background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "grid", placeItems: "center" };
