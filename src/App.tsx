import { useState, useEffect, useCallback } from 'react'
import { generateProject } from './generator'

interface FormData {
  productName: string
  serviceNameSuffix: string
  framework: 'quarkus' | 'spring-boot'
  projectCode: string
  groupId: string
  javaVersion: '21' | '25'
  teamOwner: string
  optionalFeatures: string[]
  grpcMode: string[]
  restClientName: string
}

const FEATURES = [
  { value: 'redis', label: 'Redis', icon: '⚡' },
  { value: 'mysql', label: 'MySQL', icon: '🗄️' },
  { value: 'mongodb', label: 'MongoDB', icon: '🍃' },
  { value: 'restClients', label: 'REST Client', icon: '🔗' },
  { value: 'sqs', label: 'SQS/SNS', icon: '📨' },
  { value: 'featureFlags', label: 'Feature Flags', icon: '🚩' },
  { value: 'grpc', label: 'gRPC', icon: '⚙️' },
]

const TEAMS = [
  { value: 'pitagorasampli/gg_academico_aprendizagem', label: 'Aprendizagem' },
  { value: 'pitagorasampli/gg_academico_avaliacao', label: 'Avaliação' },
  { value: 'pitagorasampli/gg_academico_comunicacao', label: 'Comunicação' },
  { value: 'pitagorasampli/gg_academico_interacao', label: 'Interação' },
  { value: 'pitagorasampli/gg_academico_plataforma', label: 'Plataforma' },
  { value: 'pitagorasampli/gg_academico_secretaria', label: 'SecFin' },
]

export default function App() {
  const [form, setForm] = useState<FormData>({
    productName: 'sofia',
    serviceNameSuffix: '',
    framework: 'quarkus',
    projectCode: '',
    groupId: 'br.com.sofia',
    javaVersion: '21',
    teamOwner: TEAMS[0].value,
    optionalFeatures: [],
    grpcMode: [],
    restClientName: '',
  })
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState('')

  const toggleFeature = (value: string) => {
    setForm(f => ({
      ...f,
      optionalFeatures: f.optionalFeatures.includes(value)
        ? f.optionalFeatures.filter(v => v !== value)
        : [...f.optionalFeatures, value],
    }))
  }

  const toggleGrpcMode = (value: string) => {
    setForm(f => ({
      ...f,
      grpcMode: f.grpcMode.includes(value)
        ? f.grpcMode.filter(v => v !== value)
        : [...f.grpcMode, value],
    }))
  }

  const isValid = form.serviceNameSuffix.trim().length > 0 && /^[A-Z]{2,5}$/.test(form.projectCode)
  const serviceName = `${form.productName}-${form.serviceNameSuffix}`

  const handleGenerate = useCallback(async () => {
    if (!isValid || generating) return
    setGenerating(true)
    try {
      await generateProject(form)
      setToast(`${serviceName}.zip baixado com sucesso!`)
      setTimeout(() => setToast(''), 3000)
    } finally {
      setGenerating(false)
    }
  }, [form, isValid, generating, serviceName])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleGenerate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate])

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-name">sofia<span>initializr</span></div>
          </div>
          <div className="header-meta">
            <span>Quarkus 3.35 • Spring Boot 4.0</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="main">
        {/* FORM */}
        <div className="form-section">
          {/* Project */}
          <div>
            <div className="section-title">Projeto</div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Produto</label>
                <input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Serviço</label>
                <input
                  placeholder="lps-backend"
                  value={form.serviceNameSuffix}
                  className={form.serviceNameSuffix ? 'valid' : ''}
                  onChange={e => setForm(f => ({ ...f, serviceNameSuffix: e.target.value }))}
                />
                <span className="hint">Nome final: {serviceName || '...'}</span>
              </div>
              <div className="form-group">
                <label>Código InternalCode</label>
                <input
                  placeholder="LPS"
                  value={form.projectCode}
                  className={form.projectCode ? (/^[A-Z]{2,5}$/.test(form.projectCode) ? 'valid' : 'invalid') : ''}
                  onChange={e => setForm(f => ({ ...f, projectCode: e.target.value.toUpperCase() }))}
                />
                <span className="hint">2-5 letras maiúsculas</span>
              </div>
              <div className="form-group">
                <label>GroupId Maven</label>
                <input value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Framework & Java */}
          <div>
            <div className="section-title">Runtime</div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Framework</label>
                <div className="framework-toggle">
                  <button
                    type="button"
                    className={`framework-option ${form.framework === 'quarkus' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, framework: 'quarkus' }))}
                  >
                    Quarkus <span className="fw-badge">3.35</span>
                  </button>
                  <button
                    type="button"
                    className={`framework-option ${form.framework === 'spring-boot' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, framework: 'spring-boot' }))}
                  >
                    Spring Boot <span className="fw-badge">4.0</span>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Java</label>
                <div className="framework-toggle">
                  <button
                    type="button"
                    className={`framework-option ${form.javaVersion === '21' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, javaVersion: '21' }))}
                  >
                    Java 21 <span className="fw-badge">LTS</span>
                  </button>
                  <button
                    type="button"
                    className={`framework-option ${form.javaVersion === '25' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, javaVersion: '25' }))}
                  >
                    Java 25
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Time owner</label>
                <select value={form.teamOwner} onChange={e => setForm(f => ({ ...f, teamOwner: e.target.value }))}>
                  {TEAMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="section-title">Dependências</div>
            <div className="features-grid" style={{ marginTop: '1rem' }}>
              {FEATURES.map(f => (
                <label
                  key={f.value}
                  className={`feature-chip ${form.optionalFeatures.includes(f.value) ? 'selected' : ''}`}
                >
                  <input type="checkbox" checked={form.optionalFeatures.includes(f.value)} onChange={() => toggleFeature(f.value)} />
                  <span className="feature-dot" />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* Conditional: gRPC mode */}
          {form.optionalFeatures.includes('grpc') && (
            <div className="conditional-section">
              <div className="section-title">gRPC</div>
              <div className="features-grid" style={{ marginTop: '1rem' }}>
                <label className={`feature-chip ${form.grpcMode.includes('server') ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.grpcMode.includes('server')} onChange={() => toggleGrpcMode('server')} />
                  <span className="feature-dot" />
                  Server
                </label>
                <label className={`feature-chip ${form.grpcMode.includes('client') ? 'selected' : ''}`}>
                  <input type="checkbox" checked={form.grpcMode.includes('client')} onChange={() => toggleGrpcMode('client')} />
                  <span className="feature-dot" />
                  Client
                </label>
              </div>
            </div>
          )}

          {/* Conditional: REST Client name */}
          {form.optionalFeatures.includes('restClients') && (
            <div className="conditional-section">
              <div className="section-title">REST Client</div>
              <div className="form-grid" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Nome do serviço</label>
                  <input placeholder="payment" value={form.restClientName} onChange={e => setForm(f => ({ ...f, restClientName: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-card">
            <h3>Resumo do projeto</h3>
            <div className="project-summary">
              <div className="summary-row">
                <span className="label">Artefato</span>
                <span className="value">{serviceName || '—'}</span>
              </div>
              <div className="summary-row">
                <span className="label">Framework</span>
                <span className="value">{form.framework === 'quarkus' ? 'Quarkus 3.35' : 'Spring Boot 4.0'}</span>
              </div>
              <div className="summary-row">
                <span className="label">Java</span>
                <span className="value">{form.javaVersion}</span>
              </div>
              <div className="summary-row">
                <span className="label">Pacote</span>
                <span className="value" style={{ fontSize: '0.75rem' }}>{form.groupId}.{form.serviceNameSuffix.replace(/-/g, '') || '...'}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span className="label">Dependências</span>
                <span className="value">{form.optionalFeatures.length}</span>
              </div>
              {form.optionalFeatures.length > 0 && (
                <div className="selected-features">
                  {form.optionalFeatures.map(f => (
                    <span key={f} className="selected-tag">{FEATURES.find(x => x.value === f)?.label}</span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-generate" disabled={!isValid || generating} onClick={handleGenerate}>
              <span className="icon">⬇</span>
              {generating ? 'Gerando...' : 'Gerar Projeto'}
            </button>
            <div className="shortcut-hint">
              <kbd>⌘</kbd> + <kbd>Enter</kbd> para gerar
            </div>
          </div>
        </aside>
      </main>

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
