import { createMonitoringClient } from './monitoring';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, AlertTriangle, ArrowUpRight, Clock3, Database, Plus, RefreshCw, Server, ShieldCheck } from 'lucide-react';

type Service = { id: string; name: string; endpoint: string; status: string; createdAt: string };
type Log = { id: string; method: string; path: string; statusCode: number; durationMs: number; createdAt: string; service: { name: string } };
type Overview = { services: number; totalRequests: number; failedRequests: number; errorRate: number; avgLatencyMs: number; recentP95Ms: number; recentP99Ms: number; recent: Log[] };
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export default function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [monitorServiceId, setMonitorServiceId] = useState<string>(() => localStorage.getItem('pulseboard-monitor-service') ?? '');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const monitor = monitorServiceId ? createMonitoringClient(monitorServiceId) : null;
      const read = async <T,>(path: string): Promise<T> => {
        const response = monitor ? await monitor.request(`${API}${path}`) : await fetch(`${API}${path}`);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json() as Promise<T>;
      };
      const [o, s] = await Promise.all([read<Overview>('/api/overview'), read<Service[]>('/api/services')]);
      setOverview(o); setServices(s); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load data'); }
    finally { setBusy(false); }
  }, [monitorServiceId]);

  useEffect(() => { void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [load]);

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const res = await fetch(`${API}/api/services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, endpoint })
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json();
        throw new Error(body.error ?? 'Could not add service');
      }
      setName(''); setEndpoint(''); setShowForm(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add service'); }
    finally { setBusy(false); }
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Activity size={23}/></div><span>pulseboard<span className="brand-dot">.</span></span></div>
      <div className="nav-label">WORKSPACE</div>
      <div className="nav-item selected"><Activity size={18}/> Overview</div>
      <div className="nav-item"><Server size={18}/> Services</div>
      <div className="nav-item"><Database size={18}/> Request logs</div>
      <div className="sidebar-bottom"><span className="status-dot"/> Local development <div className="small-muted">Phase 1 · Foundation</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>Overview</strong></div><div className="top-right"><span className="live-pill"><span className="status-dot"/> Connected to local API</span><button className="icon-button" onClick={() => void load()} disabled={busy} aria-label="Refresh data"><RefreshCw size={17}/></button></div></header>
      <div className="content">
        <div className="heading"><div><div className="eyebrow">MONITORING OVERVIEW</div><h1>API Overview</h1><p>Monitor your services and request activity in one place.</p></div><button className="primary" onClick={() => setShowForm(v => !v)}><Plus size={17}/> Add service</button></div>
        {error && <div role="alert" className="error"><AlertTriangle size={17}/> {error} <button onClick={() => void load()}>Retry</button></div>}
        {showForm && <form className="service-form" onSubmit={e => void addService(e)}><label>Service name<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Payments API"/></label><label>Endpoint URL<input required type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.example.com"/></label><button className="primary" type="submit" disabled={busy}>Save service</button></form>}
        <div className="monitor-control"><label htmlFor="monitor-service">Track dashboard API requests under:</label><select id="monitor-service" value={monitorServiceId} onChange={e => {setMonitorServiceId(e.target.value); localStorage.setItem('pulseboard-monitor-service',e.target.value);}}><option value="">Off — choose a service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><span>Only requests made by this dashboard are tracked. Choose a service to enable SDK reporting.</span></div>
        <div className="stats">
          <Stat icon={<Server size={19}/>} label="Total services" value={overview?.services ?? '—'} note="Registered services"/>
          <Stat icon={<Activity size={19}/>} label="Total requests" value={overview?.totalRequests ?? '—'} note="All recorded requests"/>
          <Stat icon={<Clock3 size={19}/>} label="Avg. latency" value={overview ? `${overview.avgLatencyMs} ms` : '—'} note="Across all requests"/>
          <Stat icon={<ShieldCheck size={19}/>} label="Error rate" value={overview ? `${overview.errorRate}%` : '—'} note="HTTP 5xx responses"/>
        </div>
        <p className="latency-note">Latest 100 requests: p95 {overview?.recentP95Ms ?? 0} ms · p99 {overview?.recentP99Ms ?? 0} ms · Refreshes every 15 seconds</p>
        <div className="panel-grid">
          <section className="panel"><div className="panel-heading"><div><h2>Request activity</h2><p>Request metrics from your database.</p></div><span className="subtle-pill">Foundation</span></div><div className="chart-wrap">{overview?.recent.length ? <LatencyChart logs={overview.recent}/> : <div className="empty-services">No recorded requests yet</div>}</div></section>
          <section className="panel"><div className="panel-heading"><div><h2>Registered services</h2><p>Your monitored endpoints</p></div><span className="subtle-pill">{services.length} total</span></div><div className="services">{services.length ? services.map(s=><div className="service-row" key={s.id}><span className="service-icon"><Server size={17}/></span><div><strong>{s.name}</strong><div className="endpoint">{s.endpoint}</div></div><ArrowUpRight size={16} className="muted"/></div>) : <div className="empty-services"><Server size={29}/><strong>No services yet</strong><p>Add your first service to get started.</p></div>}</div></section>
        </div>
        <section className="panel logs"><div className="panel-heading"><div><h2>Recent requests</h2><p>Latest recorded API calls</p></div><span className="subtle-pill">Last 100</span></div><div className="table-scroll"><table><thead><tr><th>Service</th><th>Method</th><th>Path</th><th>Status</th><th>Latency</th><th>Time</th></tr></thead><tbody>{overview?.recent.length ? overview.recent.map(r=><tr key={r.id}><td>{r.service.name}</td><td>{r.method}</td><td>{r.path}</td><td><span className={r.statusCode >= 500 ? 'bad' : 'good'}>{r.statusCode}</span></td><td>{r.durationMs} ms</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>) : <tr><td className="empty-table" colSpan={6}>No request logs yet. Ingestion will be implemented in Phase 2.</td></tr>}</tbody></table></div></section>
        <footer>Pulseboard · Built with React, TypeScript, Express and PostgreSQL</footer>
      </div>
    </main>
  </div>;
}
function Stat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) {
  return <div className="stat"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

function LatencyChart({ logs }: { logs: Log[] }) {
  const data = [...logs].reverse().map((log, index) => ({
    index: index + 1, latency: log.durationMs
  }));
  return <ResponsiveContainer width="100%" height={245}>
    <LineChart data={data} margin={{ top: 15, right: 20, bottom: 5, left: 0 }}>
      <CartesianGrid stroke="#27344c" strokeDasharray="3 3"/>
      <XAxis dataKey="index" stroke="#8b9bb4" fontSize={11}/>
      <YAxis stroke="#8b9bb4" fontSize={11} unit="ms"/>
      <Tooltip contentStyle={{ background: '#111a2a', border: '1px solid #33415b' }}/>
      <Line type="monotone" dataKey="latency" stroke="#9587ff" dot={false} strokeWidth={2}/>
    </LineChart>
  </ResponsiveContainer>;
}
