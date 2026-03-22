import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [newExclusion, setNewExclusion] = useState({ type: 'app', pattern: '' })
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)

  const { data: exclusions } = useQuery({
    queryKey: ['exclusions'],
    queryFn: () => api.getExclusions(),
  })

  const addExclusion = useMutation({
    mutationFn: () => api.addExclusion(newExclusion.type, newExclusion.pattern),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusions'] })
      setNewExclusion(prev => ({ ...prev, pattern: '' }))
    },
  })

  const removeExclusion = useMutation({
    mutationFn: (id: number) => api.removeExclusion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exclusions'] }),
  })

  const triggerAnalysis = useMutation({
    mutationFn: () => api.triggerAnalysis(),
    onSuccess: (data) => {
      setAnalysisResult(`Found ${data.patternsFound} patterns, generated ${data.suggestionsGenerated} suggestions`)
      queryClient.invalidateQueries({ queryKey: ['patterns'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
    },
    onError: (err) => setAnalysisResult(`Error: ${(err as Error).message}`),
  })

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    retry: false,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Settings</h2>

      <Section title="System Status">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${health ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">API Server: {health ? 'Connected' : 'Disconnected'}</span>
        </div>
      </Section>

      <Section title="Analysis">
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Trigger pattern detection and AI coaching analysis manually.
        </p>
        <button onClick={() => triggerAnalysis.mutate()}
          disabled={triggerAnalysis.isPending}
          className="px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: 'var(--color-primary)', color: '#fff' }}>
          {triggerAnalysis.isPending ? 'Analyzing...' : 'Run Analysis Now'}
        </button>
        {analysisResult && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-primary-light)' }}>{analysisResult}</p>
        )}
      </Section>

      <Section title="Privacy Exclusions">
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Excluded apps and patterns are never recorded. Changes take effect on next capture service restart.
        </p>
        <div className="flex gap-2 mb-4">
          <select value={newExclusion.type}
            onChange={e => setNewExclusion(prev => ({ ...prev, type: e.target.value }))}
            className="rounded px-3 py-1.5 text-sm border"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <option value="app">App Name</option>
            <option value="title_regex">Title Regex</option>
            <option value="url_regex">URL Regex</option>
          </select>
          <input type="text"
            placeholder={newExclusion.type === 'app' ? 'e.g., 1Password' : 'e.g., .*private.*'}
            value={newExclusion.pattern}
            onChange={e => setNewExclusion(prev => ({ ...prev, pattern: e.target.value }))}
            className="flex-1 rounded px-3 py-1.5 text-sm border"
            style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          <button onClick={() => newExclusion.pattern && addExclusion.mutate()}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: 'var(--color-primary)', color: '#fff' }}>
            Add
          </button>
        </div>
        {exclusions && exclusions.length > 0 ? (
          <div className="space-y-2">
            {exclusions.map(rule => (
              <div key={rule.id} className="flex items-center justify-between px-3 py-2 rounded border"
                style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
                <div>
                  <span className="text-[10px] font-medium uppercase mr-2" style={{ color: 'var(--color-primary-light)' }}>
                    {rule.type}
                  </span>
                  <span className="text-sm">{rule.pattern}</span>
                </div>
                <button onClick={() => removeExclusion.mutate(rule.id)}
                  className="text-xs px-2 py-1 rounded" style={{ color: '#f43f5e' }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No exclusion rules configured.</p>
        )}
      </Section>

      <Section title="About">
        <div className="text-xs space-y-1" style={{ color: 'var(--color-text-muted)' }}>
          <p>Ambient Intelligence Layer v0.1.0 (MVP)</p>
          <p>All data is stored locally on this device.</p>
          <p>Data directory: ./data</p>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-5 border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {children}
    </div>
  )
}
