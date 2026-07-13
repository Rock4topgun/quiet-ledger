import React, { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Plus, Download, Trash2, Lock, TrendingUp, TrendingDown } from "lucide-react";

const CATEGORIES = [
  { name: "Groceries", color: "#5B7A5B" },
  { name: "Rent", color: "#8B2E2E" },
  { name: "Transport", color: "#4A6FA5" },
  { name: "Dining", color: "#A67C3D" },
  { name: "Utilities", color: "#6B5B95" },
  { name: "Health", color: "#2F5233" },
  { name: "Fun", color: "#B85C38" },
  { name: "Other", color: "#7A7A6D" },
];

const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => d.slice(0, 7);

export default function QuietLedger() {
  const [entries, setEntries] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(),
    desc: "",
    amount: "",
    category: "Groceries",
    type: "debit",
  });
  const [showBudgets, setShowBudgets] = useState(false);

  useEffect(() => {
    try {
      const e = localStorage.getItem("quiet-ledger-entries");
      if (e) setEntries(JSON.parse(e));
    } catch {}
    try {
      const b = localStorage.getItem("quiet-ledger-budgets");
      if (b) setBudgets(JSON.parse(b));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("quiet-ledger-entries", JSON.stringify(entries));
  }, [entries, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("quiet-ledger-budgets", JSON.stringify(budgets));
  }, [budgets, loaded]);

  const currentMonth = monthKey(todayStr());
  const monthEntries = useMemo(
    () => entries.filter((e) => monthKey(e.date) === currentMonth),
    [entries, currentMonth]
  );

  const balance = useMemo(
    () => entries.reduce((s, e) => s + (e.type === "credit" ? e.amount : -e.amount), 0),
    [entries]
  );

  const monthIncome = monthEntries.filter((e) => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const monthSpend = monthEntries.filter((e) => e.type === "debit").reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = {};
    monthEntries
      .filter((e) => e.type === "debit")
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return CATEGORIES.map((c) => ({ name: c.name, value: map[c.name] || 0, color: c.color })).filter(
      (c) => c.value > 0
    );
  }, [monthEntries]);

  const addEntry = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0 || !form.desc.trim()) return;
    setEntries([
      { id: crypto.randomUUID(), ...form, amount: amt },
      ...entries,
    ]);
    setForm({ ...form, desc: "", amount: "" });
  };

  const removeEntry = (id) => setEntries(entries.filter((e) => e.id !== id));

  const exportCSV = () => {
    const rows = [["Date", "Description", "Category", "Type", "Amount"]];
    entries.forEach((e) => rows.push([e.date, e.desc, e.category, e.type, e.amount]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiet-ledger-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div style={{ minHeight: "100vh", background: "#101820", fontFamily: "'Iowan Old Style', Georgia, serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .mono { font-family: 'SF Mono', 'IBM Plex Mono', Consolas, monospace; }
        .stamp {
          display: inline-block;
          padding: 2px 8px;
          border: 1.5px solid currentColor;
          border-radius: 3px;
          transform: rotate(-1.5deg);
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: 'SF Mono', monospace;
        }
        .ledger-row:hover { background: rgba(244,239,225,0.03); }
        input, select { font-family: inherit; }
        input:focus, select:focus { outline: 2px solid #A67C3D; outline-offset: 1px; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #3a3f2f; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
          <h1 style={{ color: "#F4EFE1", fontSize: 32, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            Quiet Ledger
          </h1>
          <div className="stamp" style={{ color: "#A67C3D" }}>
            <Lock size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            local only
          </div>
        </div>
        <p style={{ color: "#8A8570", fontSize: 14, margin: "0 0 36px", fontFamily: "system-ui, sans-serif" }}>
          Nothing here connects to your bank. Nothing here is sold. It just adds up what you tell it.
        </p>

        <div
          style={{
            background: "#F4EFE1",
            borderRadius: 6,
            padding: "28px 32px",
            marginBottom: 28,
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: "#7A7460", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "system-ui, sans-serif" }}>
                Running balance
              </div>
              <div className="mono" style={{ fontSize: 36, fontWeight: 700, color: balance >= 0 ? "#2F5233" : "#8B2E2E" }}>
                {fmt(balance)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 28 }}>
              <div>
                <div style={{ fontSize: 12, color: "#7A7460", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={12} /> this month in
                </div>
                <div className="mono" style={{ fontSize: 18, color: "#2F5233" }}>{fmt(monthIncome)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#7A7460", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingDown size={12} /> this month out
                </div>
                <div className="mono" style={{ fontSize: 18, color: "#8B2E2E" }}>{fmt(monthSpend)}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#181f16", border: "1px solid #2a2f22", borderRadius: 6, padding: 20, marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="Description">
              <input
                type="text"
                placeholder="e.g. Farmers market"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
                style={inputStyle}
              />
            </Field>
            <Field label="Amount">
              <input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
                style={{ ...inputStyle }}
                className="mono"
              />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <button onClick={addEntry} style={addBtnStyle}>
              <Plus size={16} />
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {["debit", "credit"].map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                style={{
                  ...toggleStyle,
                  background: form.type === t ? (t === "debit" ? "#8B2E2E" : "#2F5233") : "transparent",
                  color: form.type === t ? "#F4EFE1" : "#8A8570",
                  borderColor: form.type === t ? "transparent" : "#3a3f2f",
                }}
              >
                {t === "debit" ? "Money out" : "Money in"}
              </button>
            ))}
          </div>
        </div>

        {byCategory.length > 0 && (
          <div style={{ background: "#181f16", border: "1px solid #2a2f22", borderRadius: 6, padding: "20px 20px 6px", marginBottom: 28 }}>
            <div style={{ color: "#8A8570", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
              This month by category
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byCategory} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#2a2f22" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8A8570", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#2a2f22" }} tickLine={false} />
                <YAxis tick={{ fill: "#8A8570", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#F4EFE1", border: "none", borderRadius: 4, fontFamily: "system-ui" }}
                  formatter={(v) => fmt(v)}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {byCategory.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: "#8A8570", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "system-ui, sans-serif" }}>
            Entries
          </div>
          <button onClick={exportCSV} style={exportBtnStyle}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        <div style={{ background: "#F4EFE1", borderRadius: 6, overflow: "hidden" }}>
          {sorted.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "#8A8570", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
              No entries yet. Add the first one above.
            </div>
          )}
          {sorted.map((e, i) => {
            const cat = CATEGORIES.find((c) => c.name === e.category);
            return (
              <div
                key={e.id}
                className="ledger-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 20px",
                  borderTop: i === 0 ? "none" : "1px solid #E3DBC4",
                }}
              >
                <div className="mono" style={{ color: "#9A9480", fontSize: 12, width: 78, flexShrink: 0 }}>
                  {e.date}
                </div>
                <div style={{ flex: 1, color: "#2A2A22", fontSize: 14, fontFamily: "system-ui, sans-serif" }}>{e.desc}</div>
                <div
                  className="stamp"
                  style={{ color: cat ? cat.color : "#7A7A6D", fontSize: 10, flexShrink: 0 }}
                >
                  {e.category}
                </div>
                <div
                  className="mono"
                  style={{ width: 100, textAlign: "right", fontWeight: 600, color: e.type === "credit" ? "#2F5233" : "#8B2E2E", flexShrink: 0 }}
                >
                  {e.type === "credit" ? "+" : "−"}{fmt(e.amount).replace("$", "")}
                </div>
                <button onClick={() => removeEntry(e.id)} style={deleteBtnStyle}>
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", color: "#4a4f3f", fontSize: 12, marginTop: 28, fontFamily: "system-ui, sans-serif" }}>
          Your entries are stored on this device for your account only — no bank connection, no ad network, no data resale.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#8A8570", marginBottom: 4, fontFamily: "system-ui, sans-serif" }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 10px",
  background: "#101820",
  border: "1px solid #2a2f22",
  borderRadius: 4,
  color: "#F4EFE1",
  fontSize: 13,
};

const addBtnStyle = {
  background: "#A67C3D",
  border: "none",
  borderRadius: 4,
  color: "#101820",
  width: 38,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const toggleStyle = {
  padding: "5px 12px",
  borderRadius: 4,
  border: "1px solid",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};

const exportBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "transparent",
  border: "1px solid #3a3f2f",
  color: "#8A8570",
  borderRadius: 4,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "system-ui, sans-serif",
};

const deleteBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#B8A98A",
  cursor: "pointer",
  padding: 4,
  flexShrink: 0,
};
