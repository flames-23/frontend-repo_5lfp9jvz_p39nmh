import { useEffect, useMemo, useState } from 'react'

function formatCurrency(n) {
  const num = Number(n || 0)
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function Stat({ label, value, accent = 'blue' }) {
  const accentMap = {
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-700 border-blue-200',
    green: 'from-green-500/10 to-green-500/5 text-green-700 border-green-200',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-700 border-purple-200',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-700 border-amber-200',
  }
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${accentMap[accent]} p-5`}> 
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}

function Section({ title, children, action }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Table({ cols, rows, empty = 'No data yet.' }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            {cols.map((c) => (
              <th key={c} className="py-2 pr-6 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="py-6 text-gray-400" colSpan={cols.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((cell, j) => (
                  <td key={j} className="py-2 pr-6 text-gray-800">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function useBackend() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const get = (path) => fetch(`${baseUrl}${path}`).then((r) => r.json())
  const post = (path, body) => fetch(`${baseUrl}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json())
  return { baseUrl, get, post }
}

export default function App() {
  const { baseUrl, get, post } = useBackend()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [funds, setFunds] = useState([])
  const [agencies, setAgencies] = useState([])
  const [programs, setPrograms] = useState([])
  const [allocations, setAllocations] = useState([])
  const [disbursements, setDisbursements] = useState([])
  const [error, setError] = useState('')

  // Simple form states
  const [fundForm, setFundForm] = useState({ code: '', name: '', fiscal_year: new Date().getFullYear(), total_budget: '', description: '' })
  const [agencyForm, setAgencyForm] = useState({ code: '', name: '', description: '' })
  const [programForm, setProgramForm] = useState({ code: '', name: '', fund_code: '', agency_code: '', allocated_amount: '', description: '' })
  const [allocationForm, setAllocationForm] = useState({ program_code: '', amount: '', allocation_date: new Date().toISOString().slice(0,10), status: 'approved', notes: '' })
  const [disbForm, setDisbForm] = useState({ allocation_id: '', amount: '', disbursement_date: new Date().toISOString().slice(0,10), recipient: '', status: 'sent', notes: '' })

  const loadAll = async () => {
    try {
      setLoading(true)
      const [sum, fs, as, ps, als, ds] = await Promise.all([
        get('/api/summary'),
        get('/api/funds'),
        get('/api/agencies'),
        get('/api/programs'),
        get('/api/allocations'),
        get('/api/disbursements'),
      ])
      setSummary(sum)
      setFunds(fs)
      setAgencies(as)
      setPrograms(ps)
      setAllocations(als)
      setDisbursements(ds)
      setError('')
    } catch (e) {
      setError(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const submit = async (type) => {
    try {
      if (type === 'fund') {
        const body = { ...fundForm, fiscal_year: Number(fundForm.fiscal_year), total_budget: Number(fundForm.total_budget || 0) }
        await post('/api/fund', body)
        setFundForm({ code: '', name: '', fiscal_year: new Date().getFullYear(), total_budget: '', description: '' })
      }
      if (type === 'agency') {
        await post('/api/agency', agencyForm)
        setAgencyForm({ code: '', name: '', description: '' })
      }
      if (type === 'program') {
        const body = { ...programForm, allocated_amount: Number(programForm.allocated_amount || 0) }
        await post('/api/program', body)
        setProgramForm({ code: '', name: '', fund_code: '', agency_code: '', allocated_amount: '', description: '' })
      }
      if (type === 'allocation') {
        const body = { ...allocationForm, amount: Number(allocationForm.amount || 0) }
        await post('/api/allocation', body)
        setAllocationForm({ program_code: '', amount: '', allocation_date: new Date().toISOString().slice(0,10), status: 'approved', notes: '' })
      }
      if (type === 'disbursement') {
        const body = { ...disbForm, amount: Number(disbForm.amount || 0) }
        await post('/api/disbursement', body)
        setDisbForm({ allocation_id: '', amount: '', disbursement_date: new Date().toISOString().slice(0,10), recipient: '', status: 'sent', notes: '' })
      }
      await loadAll()
    } catch (e) {
      alert(e?.message || 'Failed to submit')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Government Fund Management</h1>
            <p className="text-sm text-gray-500">Backend: {baseUrl}</p>
          </div>
          <div className="flex gap-2">
            <a href="/test" className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">Run Connectivity Test</a>
            <button onClick={loadAll} className="px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Refresh</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700">{error}</div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Total Funds" value={summary ? summary.total_funds : '—'} accent="blue" />
          <Stat label="Total Budget" value={summary ? formatCurrency(summary.total_budget) : '—'} accent="green" />
          <Stat label="Total Allocated" value={summary ? formatCurrency(summary.total_allocated) : '—'} accent="amber" />
          <Stat label="Total Disbursed" value={summary ? formatCurrency(summary.total_disbursed) : '—'} accent="purple" />
        </div>

        {/* Quick Add Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section
            title="Add Fund"
            action={<button onClick={() => submit('fund')} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm">Save</button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Code" value={fundForm.code} onChange={(e)=>setFundForm(v=>({...v, code:e.target.value}))} />
              <input className="input" placeholder="Name" value={fundForm.name} onChange={(e)=>setFundForm(v=>({...v, name:e.target.value}))} />
              <input className="input" type="number" placeholder="Fiscal Year" value={fundForm.fiscal_year} onChange={(e)=>setFundForm(v=>({...v, fiscal_year:e.target.value}))} />
              <input className="input" type="number" placeholder="Total Budget" value={fundForm.total_budget} onChange={(e)=>setFundForm(v=>({...v, total_budget:e.target.value}))} />
              <input className="input md:col-span-2" placeholder="Description" value={fundForm.description} onChange={(e)=>setFundForm(v=>({...v, description:e.target.value}))} />
            </div>
          </Section>

          <Section
            title="Add Agency"
            action={<button onClick={() => submit('agency')} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm">Save</button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" placeholder="Code" value={agencyForm.code} onChange={(e)=>setAgencyForm(v=>({...v, code:e.target.value}))} />
              <input className="input" placeholder="Name" value={agencyForm.name} onChange={(e)=>setAgencyForm(v=>({...v, name:e.target.value}))} />
              <input className="input" placeholder="Description" value={agencyForm.description} onChange={(e)=>setAgencyForm(v=>({...v, description:e.target.value}))} />
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section
            title="Add Program"
            action={<button onClick={() => submit('program')} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm">Save</button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" placeholder="Code" value={programForm.code} onChange={(e)=>setProgramForm(v=>({...v, code:e.target.value}))} />
              <input className="input" placeholder="Name" value={programForm.name} onChange={(e)=>setProgramForm(v=>({...v, name:e.target.value}))} />
              <select className="input" value={programForm.fund_code} onChange={(e)=>setProgramForm(v=>({...v, fund_code:e.target.value}))}>
                <option value="">Select Fund</option>
                {funds.map((f)=> <option key={f._id} value={f.code}>{f.code} — {f.name}</option>)}
              </select>
              <select className="input" value={programForm.agency_code} onChange={(e)=>setProgramForm(v=>({...v, agency_code:e.target.value}))}>
                <option value="">Select Agency</option>
                {agencies.map((a)=> <option key={a._id} value={a.code}>{a.code} — {a.name}</option>)}
              </select>
              <input className="input" type="number" placeholder="Allocated Amount" value={programForm.allocated_amount} onChange={(e)=>setProgramForm(v=>({...v, allocated_amount:e.target.value}))} />
              <input className="input" placeholder="Description" value={programForm.description} onChange={(e)=>setProgramForm(v=>({...v, description:e.target.value}))} />
            </div>
          </Section>

          <Section
            title="Add Allocation"
            action={<button onClick={() => submit('allocation')} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm">Save</button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select className="input" value={allocationForm.program_code} onChange={(e)=>setAllocationForm(v=>({...v, program_code:e.target.value}))}>
                <option value="">Select Program</option>
                {programs.map((p)=> <option key={p._id} value={p.code}>{p.code} — {p.name}</option>)}
              </select>
              <input className="input" type="number" placeholder="Amount" value={allocationForm.amount} onChange={(e)=>setAllocationForm(v=>({...v, amount:e.target.value}))} />
              <input className="input" type="date" value={allocationForm.allocation_date} onChange={(e)=>setAllocationForm(v=>({...v, allocation_date:e.target.value}))} />
              <select className="input" value={allocationForm.status} onChange={(e)=>setAllocationForm(v=>({...v, status:e.target.value}))}>
                <option>approved</option>
                <option>pending</option>
                <option>rejected</option>
              </select>
              <input className="input md:col-span-2" placeholder="Notes" value={allocationForm.notes} onChange={(e)=>setAllocationForm(v=>({...v, notes:e.target.value}))} />
            </div>
          </Section>
        </div>

        <Section
          title="Add Disbursement"
          action={<button onClick={() => submit('disbursement')} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm">Save</button>}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="input" placeholder="Allocation ID" value={disbForm.allocation_id} onChange={(e)=>setDisbForm(v=>({...v, allocation_id:e.target.value}))} />
            <input className="input" type="number" placeholder="Amount" value={disbForm.amount} onChange={(e)=>setDisbForm(v=>({...v, amount:e.target.value}))} />
            <input className="input" type="date" value={disbForm.disbursement_date} onChange={(e)=>setDisbForm(v=>({...v, disbursement_date:e.target.value}))} />
            <input className="input" placeholder="Recipient" value={disbForm.recipient} onChange={(e)=>setDisbForm(v=>({...v, recipient:e.target.value}))} />
            <select className="input" value={disbForm.status} onChange={(e)=>setDisbForm(v=>({...v, status:e.target.value}))}>
              <option>sent</option>
              <option>scheduled</option>
              <option>failed</option>
            </select>
            <input className="input md:col-span-5" placeholder="Notes" value={disbForm.notes} onChange={(e)=>setDisbForm(v=>({...v, notes:e.target.value}))} />
          </div>
        </Section>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Funds">
            <Table
              cols={["Code", "Name", "Year", "Budget"]}
              rows={funds.map(f => [f.code, f.name, f.fiscal_year, formatCurrency(f.total_budget)])}
              empty="Add a fund to get started."
            />
          </Section>
          <Section title="Agencies">
            <Table
              cols={["Code", "Name", "Description"]}
              rows={agencies.map(a => [a.code, a.name, a.description || '—'])}
              empty="Add an agency to organize programs."
            />
          </Section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Programs">
            <Table
              cols={["Code", "Name", "Fund", "Agency", "Allocated"]}
              rows={programs.map(p => [p.code, p.name, p.fund_code, p.agency_code, formatCurrency(p.allocated_amount)])}
              empty="Create a program under a fund and agency."
            />
          </Section>
          <Section title="Allocations">
            <Table
              cols={["Program", "Amount", "Date", "Status"]}
              rows={allocations.map(a => [a.program_code, formatCurrency(a.amount), a.allocation_date, a.status])}
              empty="Record allocations to track obligations."
            />
          </Section>
        </div>

        <Section title="Disbursements">
          <Table
            cols={["Allocation ID", "Amount", "Date", "Recipient", "Status"]}
            rows={disbursements.map(d => [d.allocation_id, formatCurrency(d.amount), d.disbursement_date, d.recipient, d.status])}
            empty="Log disbursements when payments are sent."
          />
        </Section>

        {/* Simple bar viz using CSS */}
        <Section title="Allocation by Program (Top 8)">
          <div className="space-y-2">
            {(summary?.by_program || []).slice(0,8).map(item => {
              const max = Math.max(1, ...(summary?.by_program || []).map(x => x.allocated || 0))
              const width = `${Math.min(100, (item.allocated / max) * 100)}%`
              return (
                <div key={item.program_code}>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">{item.program_code || 'Unknown'}</span>
                    <span>{formatCurrency(item.allocated)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded">
                    <div className="h-2 bg-indigo-500 rounded" style={{ width }} />
                  </div>
                </div>
              )
            })}
            {(!summary || (summary.by_program || []).length === 0) && (
              <p className="text-sm text-gray-500">No allocation data yet.</p>
            )}
          </div>
        </Section>

        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}
      </main>

      <style>{`
        .input { @apply w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500; }
      `}</style>
    </div>
  )
}
