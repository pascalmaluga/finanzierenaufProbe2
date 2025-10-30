import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { jsPDF } from "jspdf";

/* ===== ALH Corporate Design ===== */
const RGB = (r, g, b) => `rgb(${r}, ${g}, ${b})`;
const CI = {
  red: RGB(190, 13, 62),       // Header/CTA
  blueDark: RGB(0, 71, 103),   // Buttons / Tabellenkopf
  green: RGB(66, 126, 91),     // Fondsguthaben-Linie
  greyLine: RGB(100, 109, 116),
  grey: "#6E6E6E",
  white: "#FFFFFF",
};

const nf = new Intl.NumberFormat("de-DE");
const fmtEUR = (v) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(v || 0);

const card = {
  background: CI.white,
  border: "1px solid rgba(227,6,19,0.12)",
  borderRadius: 18,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  padding: 16,
};
const label = { fontSize: 12, color: CI.grey, marginBottom: 6, fontWeight: 600 };
const input = { padding: "8px 10px", border: "1px solid #d0d5dd", borderRadius: 10, fontSize: 14 };
const btnPrimary = { background: CI.red, color: "#fff", border: 0, borderRadius: 16, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const btnSecondary = { background: CI.blueDark, color: "#fff", border: 0, borderRadius: 16, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };

/* ===== Reusable: Autoplay-Video mit Fallback-Overlay ===== */
function AutoPlayVideo({ src, poster, height = 260, rounded = 16 }) {
  const ref = useRef(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    (async () => {
      try {
        v.muted = true;
        v.playsInline = true;
        await v.play();
        setBlocked(false);
      } catch {
        setBlocked(true);
      }
    })();
  }, [src]);

  const manualStart = async () => {
    const v = ref.current;
    if (!v) return;
    try { await v.play(); setBlocked(false); } catch {}
  };

  return (
    <div style={{ borderRadius: rounded, overflow: "hidden", position: "relative" }}>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        style={{ width: "100%", height, objectFit: "cover", display: "block" }}
      >
        <source src={src} type="video/mp4" />
        Ihr Browser unterstützt das Video-Element nicht.
      </video>

      {blocked && (
        <button
          onClick={manualStart}
          style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.65)", color: "#fff", border: 0, borderRadius: 999,
            padding: "14px 22px", fontWeight: 800, cursor: "pointer"
          }}
        >
          ▶ Video starten
        </button>
      )}
    </div>
  );
}

/* ===== Stepper ===== */
function Stepper({ step }) {
  const steps = ["Hinführung", "Einwände", "Rechner"];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
      {steps.map((s, i) => {
        const idx = i + 1;
        const active = step === idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: active ? CI.red : "#e7e8ec",
                color: active ? "#fff" : "#111",
                borderRadius: 14,
                padding: "6px 12px",
                fontWeight: active ? 700 : 500,
                minWidth: 90,
                textAlign: "center",
              }}
            >
              {idx}. {s}
            </div>
            {idx < steps.length && <div style={{ width: 22, height: 2, background: "#d7d8de" }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Step 1: Intro (Video) ===== */
function Step1Intro({ onNext }) {
  return (
    <div style={{ ...card }}>
      {/* Dein Start-Video */}
      <AutoPlayVideo src={"/Zuhausegefunden.mp4"} poster={undefined} />
      <div
        style={{
          background: CI.red, color: "#fff", borderRadius: 16, padding: 16,
          fontSize: 18, fontWeight: 800, textAlign: "center", marginTop: 12,
        }}
      >
        Hey! Willst du nicht irgendwann auch mal ein Haus oder eine Wohnung dein Eigen nennen?
        <br />
        Wie wäre es, wenn wir schon <b>heute</b> dafür auf Probe finanzieren?
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
        <button onClick={onNext} style={btnSecondary}>Weiter</button>
      </div>
    </div>
  );
}

/* ===== Step 2: Einwände → Antwort-Videos ===== */
const OBJECTIONS = [
  { title: "Ich zahle doch schon Miete, das reicht.", src: "/MietevsRate.mp4" },
  { title: "Was, wenn ich in 5 Jahren gar nicht kaufen will?", src: "/Fondsguthaben_DeineFlexibilit%C3%A4t.mp4" }, // ä encodiert
  { title: "Das ist mir bestimmt zu teuer.", src: "/WarmmieteSparen.mp4" },
  { title: "Fonds sind doch unsicher.", src: "/Fonds_Rendite_Orientierung.mp4" },
  { title: "Ich weiß nicht, ob das zu mir passt.", src: "/Probeangebot_Transparent_Flexibel.mp4" },
];

function Step2Objections({ onNext }) {
  const [active, setActive] = useState(0);
  return (
    <div style={{ ...card }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {OBJECTIONS.map((e, i) => (
          <button
            key={e.title}
            onClick={() => setActive(i)}
            style={{
              background: i === active ? CI.blueDark : "#eef1f5",
              color: i === active ? "#fff" : "#111",
              border: 0,
              borderRadius: 14,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {i + 1}. {e.title}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <AutoPlayVideo src={OBJECTIONS[active].src} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button onClick={onNext} style={btnPrimary}>Weiter zum Rechner</button>
      </div>
    </div>
  );
}

/* ===== App (Step 3: Rechner inkl. PDF) ===== */
export default function App() {
  const [step, setStep] = useState(1); // 1: Intro, 2: Einwände, 3: Rechner

  // Eingaben
  const [warmmiete, setWarmmiete] = useState(1000);
  const [kaufpreis, setKaufpreis] = useState(400000);
  const [rendite, setRendite] = useState(6.0);      // Renditeerwartung
  const [zins, setZins] = useState(3.5);            // % p.a.
  const [tilgung, setTilgung] = useState(2.0);      // % p.a.
  const [nebenkostenPct, setNebenkostenPct] = useState(10.0); // % vom Kaufpreis

  // Abgeleitete Größen
  const initialLoan = useMemo(() => kaufpreis * (1 + nebenkostenPct / 100), [kaufpreis, nebenkostenPct]);
  const zinsPA = useMemo(() => zins / 100, [zins]);
  const tilgungPA = useMemo(() => tilgung / 100, [tilgung]);

  const monatsrateFinanzierung = useMemo(
    () => (initialLoan * (zinsPA + tilgungPA)) / 12,
    [initialLoan, zinsPA, tilgungPA]
  );
  const monatlDifferenz = Math.max(0, monatsrateFinanzierung - warmmiete);

  // Simulation Fondsguthaben (ohne LTV)
  const results = useMemo(() => {
    const r_annual = (rendite || 0) / 100;
    const r_month = Math.pow(1 + r_annual, 1 / 12) - 1;
    const kosten_month = (0.013 + 0.002) / 12; // 1,5% p.a. Kosten
    const stueckkosten = 36;

    let fondsguthaben = 0;
    let kumSparrate = 0;
    const arr = [];
    for (let m = 1; m <= 15 * 12; m++) {
      if ((m - 1) % 12 === 0) fondsguthaben -= stueckkosten; // Jahresanfang
      fondsguthaben = fondsguthaben * (1 + r_month - kosten_month) + monatlDifferenz;
      kumSparrate += monatlDifferenz;

      if (m % 12 === 0) {
        const jahr = m / 12;
        arr.push({
          jahr,
          fondsguthaben: Math.max(0, Math.round(fondsguthaben)),
          sparrate: Math.round(kumSparrate),
        });
      }
    }
    return arr;
  }, [rendite, monatlDifferenz]);

  /* ===== PDF Export ===== */
  const exportPDF = () => {
    try {
      // Seite 1 (Portrait)
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const drawHeader = (title) => {
        const pw = pdf.internal.pageSize.getWidth();
        pdf.setFillColor(190, 13, 62);
        pdf.rect(0, 0, pw, 64, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text(title, pw / 2, 40, { align: "center" });
        pdf.setFont("helvetica", "normal");
      };

      let margin = 32;
      let pageWidth = pdf.internal.pageSize.getWidth();
      let pageHeight = pdf.internal.pageSize.getHeight();

      drawHeader("Finanzieren auf Probe");
      let y = 90;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(0);

      // Linke Spalte
      pdf.text(`Deine aktuelle Warmmiete: ${nf.format(warmmiete)} € / Monat`, margin, y); y += 20;
      pdf.text(`Aktueller Kaufpreis einer Wunschimmobilie: ${nf.format(kaufpreis)} €`, margin, y); y += 20;
      pdf.text(`Renditeerwartung: ${rendite.toFixed(1)} % p.a.`, margin, y); y += 20;
      pdf.text(`Zins: ${zins.toFixed(1)} % p.a.`, margin, y); y += 20;
      pdf.text(`Tilgung: ${tilgung.toFixed(1)} % p.a.`, margin, y); y += 20;
      pdf.text(`Nebenkosten: ${nebenkostenPct.toFixed(1)} % vom Kaufpreis`, margin, y); y += 30;

      // Rechte Spalte
      let yRight = 90;
      const xRight = margin + 350;
      pdf.text(`Monatliche Finanzierungsrate: ${fmtEUR(monatsrateFinanzierung)}`, xRight, yRight); yRight += 20;
      pdf.text(`Monatliche Sparrate: ${fmtEUR(monatlDifferenz)}`, xRight, yRight); yRight += 30;

      if (results.length > 0) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(190, 13, 62);
        pdf.text("Kapitalentwicklung (jährlich, bis 15 Jahre)", margin, y);
        pdf.setFont("helvetica", "normal");
        y += 20;

        const tableX = margin;
        const tableW = pageWidth - margin * 2;
        const yearW = 60;
        const fondW = Math.round((tableW - yearW) * 0.45);
        const saveW = tableW - yearW - fondW;
        const headerH = 22;
        const rowH = 20;

        // Header
        pdf.setFillColor(0, 71, 103);
        pdf.setTextColor(255, 255, 255);
        pdf.rect(tableX, y - 14, tableW, headerH, "F");
        pdf.text("Jahr", tableX + 8, y + 2);
        pdf.text("Fondsguthaben (€)", tableX + yearW + fondW / 2, y + 2, { align: "center" });
        pdf.text("Kumulierte Sparrate (€)", tableX + yearW + fondW + saveW - 8, y + 2, { align: "right" });

        // Body
        const bodyTop = y + headerH + 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(0);
        results.forEach((r, i) => {
          const rowY = bodyTop + i * rowH;
          pdf.setDrawColor(235);
          pdf.line(tableX, rowY, tableX + tableW, rowY);
          pdf.text(String(r.jahr), tableX + 8, rowY + 14);
          pdf.text(nf.format(r.fondsguthaben), tableX + yearW + fondW / 2, rowY + 14, { align: "center" });
          pdf.text(nf.format(r.sparrate), tableX + yearW + fondW + saveW - 8, rowY + 14, { align: "right" });
        });

        // Disclaimer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        pdf.text(
          "Beispielhafte, unverbindliche Berechnung. Kosten: 1,3 % Vertragskosten + 0,2 % Fondskosten p.a.; Stückkosten 36 € p.a. (ab Jahresbeginn). Sparrate = Finanzierungsrate – Warmmiete.",
          margin,
          pageHeight - 24,
          { maxWidth: pageWidth - margin * 2 }
        );
      }

      // Seite 2 (Landscape) – Chart
      const addLandscapePage = () => {
        try { pdf.addPage("a4", "landscape"); return; } catch (e) {}
        try { pdf.addPage({ orientation: "landscape" }); return; } catch (e) {}
        pdf.addPage();
      };
      addLandscapePage();

      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 32;

      // Kopfband
      pdf.setFillColor(190, 13, 62);
      pdf.rect(0, 0, pw, 64, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Finanzieren auf Probe", pw / 2, 40, { align: "center" });

      // Titel
      let y2 = 100;
      pdf.setTextColor(190, 13, 62);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Kapitalverlauf", m, y2);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0);
      y2 += 30;

      // Chart-Box
      const leftGutter = 72;
      const chartX = m + leftGutter;
      const chartY = y2;
      const chartW = pw - m * 2 - leftGutter;
      const chartH = 300;

      pdf.setDrawColor(0);
      pdf.rect(chartX, chartY, chartW, chartH);

      const maxFond = Math.max(...results.map((r) => r.fondsguthaben), 1);
      const maxSpar = Math.max(...results.map((r) => r.sparrate), 1);
      const maxVal = Math.ceil(Math.max(maxFond, maxSpar) / 50000) * 50000;
      const minVal = 0;
      const range = Math.max(1, maxVal - minVal);
      const scaleX = results.length > 1 ? chartW / (results.length - 1) : 0;
      const scaleY = chartH / range;

      // Y-Achse + Hilfslinien
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9);
      for (let val = 0; val <= maxVal; val += 50000) {
        const yy = chartY + chartH - (val - minVal) * scaleY;
        pdf.setDrawColor(0); pdf.line(chartX - 6, yy, chartX, yy);
        pdf.setDrawColor(230); pdf.line(chartX, yy, chartX + chartW, yy);
        pdf.setTextColor(60); pdf.text(nf.format(val), chartX - 10, yy + 3, { align: "right" });
      }

      // X-Achse (Jahre)
      const xStep = Math.max(1, Math.ceil(results.length / 6));
      for (let i = 0; i < results.length; i += xStep) {
        const px = chartX + i * scaleX;
        const yr = results[i].jahr;
        pdf.setDrawColor(0);
        pdf.line(px, chartY + chartH, px, chartY + chartH + 4);
        pdf.setTextColor(60);
        pdf.text(String(yr), px, chartY + chartH + 16, { align: "center" });
      }
      pdf.setFontSize(10); pdf.setTextColor(80);
      pdf.text("Jahre", chartX + chartW / 2, chartY + chartH + 30, { align: "center" });

      // Linien
      pdf.setDrawColor(66, 126, 91); pdf.setLineWidth(2);
      results.forEach((r, i) => {
        const px = chartX + i * scaleX;
        const py = chartY + chartH - (r.fondsguthaben - minVal) * scaleY;
        if (i === 0) pdf.moveTo(px, py); else pdf.lineTo(px, py);
      });
      if (results.length > 1) pdf.stroke();

      pdf.setDrawColor(100, 109, 116); pdf.setLineWidth(2);
      results.forEach((r, i) => {
        const px = chartX + i * scaleX;
        const py = chartY + chartH - (r.sparrate - minVal) * scaleY;
        if (i === 0) pdf.moveTo(px, py); else pdf.lineTo(px, py);
      });
      if (results.length > 1) pdf.stroke();

      // Legende
      const legendY = chartY + chartH + 50;
      pdf.setDrawColor(66, 126, 91); pdf.setLineWidth(3);
      pdf.line(m, legendY, m + 24, legendY);
      pdf.setTextColor(0); pdf.text("Fondsguthaben", m + 32, legendY + 3);
      pdf.setDrawColor(100, 109, 116);
      pdf.line(m + 160, legendY, m + 184, legendY);
      pdf.text("Kumulierte Sparrate", m + 192, legendY + 3);

      pdf.save(`Finanzieren_auf_Probe_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF-Export fehlgeschlagen.");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 10 }}>
        <div style={{ background: CI.red, color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.2 }}>Finanzieren auf Probe</span>
        </div>
      </div>

      <Stepper step={step} />

      {step === 1 && <Step1Intro onNext={() => setStep(2)} />}
      {step === 2 && <Step2Objections onNext={() => setStep(3)} />}

      {step === 3 && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Eingaben */}
          <div style={{ ...card }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <div style={label}>Deine aktuelle Warmmiete (€ / Monat)</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="range" min={0} max={3000} step={10} value={warmmiete} onChange={(e) => setWarmmiete(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" step={10} value={warmmiete} onChange={(e) => setWarmmiete(Number(e.target.value))} style={{ ...input, width: 110 }} />
                </div>
              </div>
              <div>
                <div style={label}>Aktueller Kaufpreis einer Wunschimmobilie (€)</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="range" min={100000} max={1500000} step={10000} value={kaufpreis} onChange={(e) => setKaufpreis(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" value={kaufpreis} onChange={(e) => setKaufpreis(Number(e.target.value))} style={{ ...input, width: 160 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <div style={label}>Renditeerwartung (% p.a.)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="range" min={0} max={15} step={0.1} value={rendite} onChange={(e) => setRendite(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" step={0.1} value={rendite} onChange={(e) => setRendite(Number(e.target.value))} style={{ ...input, width: 80 }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={label}>Monatliche Finanzierungsrate</div>
                  <div style={{ ...input, background: "#f7f7f9", width: 160 }}>{fmtEUR(monatsrateFinanzierung)}</div>
                </div>
                <div>
                  <div style={label}>Monatliche Sparrate</div>
                  <div style={{ ...input, background: "#f7f7f9", width: 160 }}>{fmtEUR(monatlDifferenz)}</div>
                </div>
              </div>
            </div>

            {/* Zins / Tilgung / Nebenkosten */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <div style={label}>Zins (% p.a.)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="range" min={0} max={10} step={0.1} value={zins} onChange={(e) => setZins(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" step={0.1} value={zins} onChange={(e) => setZins(Number(e.target.value))} style={{ ...input, width: 80 }} />
                </div>
              </div>

              <div>
                <div style={label}>Tilgung (% p.a.)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="range" min={0} max={10} step={0.1} value={tilgung} onChange={(e) => setTilgung(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" step={0.1} value={tilgung} onChange={(e) => setTilgung(Number(e.target.value))} style={{ ...input, width: 80 }} />
                </div>
              </div>

              <div>
                <div style={label}>Nebenkosten (% vom Kaufpreis)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="range" min={0} max={15} step={0.1} value={nebenkostenPct} onChange={(e) => setNebenkostenPct(Number(e.target.value))} style={{ width: "100%" }} />
                  <input type="number" step={0.1} value={nebenkostenPct} onChange={(e) => setNebenkostenPct(Number(e.target.value))} style={{ ...input, width: 80 }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <button style={btnSecondary} onClick={exportPDF}>PDF exportieren</button>
            </div>

            <ul style={{ color: CI.grey, fontSize: 13, marginTop: 12, paddingLeft: 16 }}>
              <li>Deine monatliche Belastung: Zins + Tilgung (z. B. 3,5 % + 2,0 %)</li>
              <li>Deine monatliche Einzahlung (Sparrate): Finanzierungsrate minus Warmmiete</li>
              <li>Kosten: <b>1,3 % Vertragskosten</b> + <b>0,2 % Fondskosten</b> p.a.; <b>Stückkosten 36 € p.a.</b> (ab Jahresbeginn)</li>
            </ul>
          </div>

          {/* Ergebnisse: Tabelle */}
          <div style={{ ...card }}>
            <h2 style={{ color: CI.red, margin: 0, marginBottom: 8, fontSize: 18 }}>Kapitalentwicklung (jährlich, bis 15 Jahre)</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: CI.blueDark, color: CI.white }}>
                    <th style={{ textAlign: "center", padding: 8, border: "1px solid #003247" }}>Jahr</th>
                    <th style={{ textAlign: "center", padding: 8, border: "1px solid #003247" }}>Fondsguthaben (€)</th>
                    <th style={{ textAlign: "center", padding: 8, border: "1px solid #003247" }}>Kumulierte Sparrate (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.jahr}>
                      <td style={{ padding: 8, border: "1px solid #f3d6d8", textAlign: "center" }}>{r.jahr}</td>
                      <td style={{ padding: 8, border: "1px solid #f3d6d8", textAlign: "center" }}>{nf.format(r.fondsguthaben)}</td>
                      <td style={{ padding: 8, border: "1px solid #f3d6d8", textAlign: "center" }}>{nf.format(r.sparrate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ergebnisse: Chart */}
          <div style={{ ...card }}>
            <h2 style={{ color: CI.red, margin: 0, marginBottom: 8, fontSize: 18 }}>Kapitalverlauf</h2>
            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jahr" label={{ value: "Jahre", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(v) => nf.format(v)} />
                  <Tooltip formatter={(value) => nf.format(value) + " €"} />
                  <Legend />
                  <Line type="monotone" dataKey="fondsguthaben" stroke={CI.green} strokeWidth={3} dot={false} name="Fondsguthaben" />
                  <Line type="monotone" dataKey="sparrate" stroke={CI.greyLine} strokeWidth={3} dot={false} name="Kumulierte Sparrate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Abschlussband */}
          <div style={{ background: CI.red, color: "#fff", borderRadius: 16, padding: 16, fontWeight: 700, textAlign: "center" }}>
            Setzen Sie heute den Kurs: Mit Ihrer Sparrate bauen Sie planbar Fondsguthaben auf.
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} style={{ ...btnSecondary, opacity: step === 1 ? 0.5 : 1 }}>Zurück</button>
        <button disabled={step === 3} onClick={() => setStep((s) => Math.min(3, s + 1))} style={{ ...btnPrimary, opacity: step === 3 ? 0.5 : 1 }}>Weiter</button>
      </div>
    </div>
  );
}
