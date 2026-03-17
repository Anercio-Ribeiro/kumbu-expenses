'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { EMOJI_PICKER, COLOR_PALETTE } from '@/lib/utils/category-defaults'
import { KanzaDialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

async function api(url: string, method = 'GET', body?: object) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro')
  return data
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Sub { id: string; name: string; icon: string; color?: string | null; isBuiltin: boolean; isArchived: boolean }
interface Cat { id: string; name: string; icon: string; color: string; isBuiltin: boolean; isArchived: boolean; subcategories: Sub[] }

// ─── Emoji + Color Picker ─────────────────────────────────────────────────────
function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ícone</p>
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
        {EMOJI_PICKER.map(e => (
          <button
            key={e} type="button"
            onClick={() => onChange(e)}
            className={cn('w-8 h-8 text-base rounded-lg hover:bg-accent transition-all flex items-center justify-center', value === e && 'bg-primary/20 ring-2 ring-primary')}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Ou escreve:</span>
        <input
          value={value} onChange={e => onChange(e.target.value)}
          maxLength={2}
          className="w-14 text-center bg-background border border-border rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <span className="text-2xl">{value}</span>
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cor</p>
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map(c => (
          <button
            key={c} type="button"
            onClick={() => onChange(c)}
            className={cn('w-7 h-7 rounded-full transition-all', value === c && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110')}
            style={{ background: c }}
          />
        ))}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">#</span>
          <input
            value={value.replace('#', '')}
            onChange={e => { if (/^[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange('#' + e.target.value) }}
            maxLength={6}
            className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ManageCategoriesClient({ initialCategories }: { initialCategories: Cat[] }) {
  const [categories, setCategories] = useState<Cat[]>(initialCategories)
  const [search, setSearch] = useState('')

  // Modal states
  const [newCat, setNewCat] = useState(false)
  const [editCat, setEditCat] = useState<Cat | null>(null)
  const [newSub, setNewSub] = useState<string | null>(null)   // categoryId
  const [editSub, setEditSub] = useState<Sub & { categoryId: string } | null>(null)

  // Form state for category
  const [catForm, setCatForm] = useState({ name: '', icon: '📦', color: '#8b91a8' })
  // Form state for subcategory
  const [subForm, setSubForm] = useState({ name: '', icon: '•' })

  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() =>
    categories.filter(c =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subcategories.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
    ), [categories, search])

  // ─── Handlers ───────────────────────────────────────────────────────────────
  async function handleCreateCategory() {
    if (!catForm.name.trim()) { toast.error('Nome obrigatório'); return }
    setLoading(true)
    try {
      const { category } = await api('/api/categories', 'POST', catForm)
      setCategories(prev => [...prev, { ...category, subcategories: [] }])
      setNewCat(false)
      setCatForm({ name: '', icon: '📦', color: '#8b91a8' })
      toast.success(`Categoria "${category.name}" criada!`)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleEditCategory() {
    if (!editCat) return
    setLoading(true)
    try {
      const { category } = await api(`/api/categories/${editCat.id}`, 'PATCH', catForm)
      setCategories(prev => prev.map(c => c.id === editCat.id ? { ...c, ...category } : c))
      setEditCat(null)
      toast.success('Categoria actualizada!')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleArchiveCategory(id: string, name: string) {
    if (!confirm(`Arquivar a categoria "${name}"? As despesas associadas não serão afectadas.`)) return
    try {
      await api(`/api/categories/${id}`, 'DELETE')
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Categoria arquivada')
    } catch (e: any) { toast.error(e.message) }
  }

  async function handleCreateSub() {
    if (!newSub || !subForm.name.trim()) { toast.error('Nome obrigatório'); return }
    setLoading(true)
    try {
      const { subcategory } = await api(`/api/categories/${newSub}`, 'POST', subForm)
      setCategories(prev => prev.map(c =>
        c.id === newSub ? { ...c, subcategories: [...c.subcategories, subcategory] } : c
      ))
      setNewSub(null)
      setSubForm({ name: '', icon: '•' })
      toast.success(`Sub-categoria "${subcategory.name}" criada!`)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleEditSub() {
    if (!editSub) return
    setLoading(true)
    try {
      const { subcategory } = await api(`/api/subcategories/${editSub.id}`, 'PATCH', subForm)
      setCategories(prev => prev.map(c =>
        c.id === editSub.categoryId
          ? { ...c, subcategories: c.subcategories.map(s => s.id === editSub.id ? { ...s, ...subcategory } : s) }
          : c
      ))
      setEditSub(null)
      toast.success('Sub-categoria actualizada!')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function handleArchiveSub(catId: string, subId: string, name: string) {
    if (!confirm(`Arquivar "${name}"?`)) return
    try {
      await api(`/api/subcategories/${subId}`, 'DELETE')
      setCategories(prev => prev.map(c =>
        c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c
      ))
      toast.success('Sub-categoria arquivada')
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar categorias…"
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-56"
        />
        <span className="text-sm text-muted-foreground">{categories.length} categorias, {categories.reduce((s, c) => s + c.subcategories.length, 0)} sub-categorias</span>
        <button
          onClick={() => { setCatForm({ name: '', icon: '📦', color: '#8b91a8' }); setNewCat(true) }}
          className="ml-auto bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          + Nova Categoria
        </button>
      </div>

      {/* Info banner */}
      <div className="kanza-card p-4 flex gap-3 border-primary/20 bg-primary/5">
        <span className="text-xl">💡</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          As categorias e sub-categorias aparecem ao registar despesas. Por exemplo, ao registar um gasto de <strong className="text-foreground">Transporte → Combustível</strong>, sabes exactamente como o dinheiro foi gasto. As categorias pré-definidas podem ser renomeadas mas não eliminadas.
        </p>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(cat => (
          <div key={cat.id} className="kanza-card overflow-hidden hover:border-current/20 transition-all" style={{ borderTopColor: cat.color, borderTopWidth: 3 }}>
            {/* Category header */}
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cat.color + '20' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{cat.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {cat.subcategories.length} sub-{cat.subcategories.length === 1 ? 'categoria' : 'categorias'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, icon: cat.icon, color: cat.color }) }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs"
                    title="Editar categoria"
                  >✏️</button>
                  {!cat.isBuiltin && (
                    <button
                      onClick={() => handleArchiveCategory(cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-xs"
                      title="Arquivar categoria"
                    >🗑️</button>
                  )}
                </div>
              </div>
            </div>

            {/* Subcategories */}
            <div className="px-4 pb-3 space-y-1">
              {cat.subcategories.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 group py-1.5 px-2 rounded-lg hover:bg-accent/40 transition-all">
                  <span className="text-base w-6 text-center flex-shrink-0">{sub.icon}</span>
                  <span className="text-xs flex-1">{sub.name}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => { setEditSub({ ...sub, categoryId: cat.id }); setSubForm({ name: sub.name, icon: sub.icon }) }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground text-[11px]"
                    >✏️</button>
                    {!sub.isBuiltin && (
                      <button
                        onClick={() => handleArchiveSub(cat.id, sub.id, sub.name)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive text-[11px]"
                      >✕</button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add subcategory button */}
              <button
                onClick={() => { setNewSub(cat.id); setSubForm({ name: '', icon: '•' }) }}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all"
              >
                <span className="text-lg leading-none">+</span>
                <span>Adicionar sub-categoria</span>
              </button>
            </div>
          </div>
        ))}

        {/* Create category card */}
        <button
          onClick={() => { setCatForm({ name: '', icon: '📦', color: '#8b91a8' }); setNewCat(true) }}
          className="kanza-card border-dashed border-2 flex flex-col items-center justify-center gap-3 min-h-[160px] hover:border-primary/50 hover:bg-accent/20 transition-all text-muted-foreground hover:text-foreground"
        >
          <span className="text-4xl">+</span>
          <span className="text-sm font-medium">Nova categoria</span>
        </button>
      </div>

      {/* ── Create Category Dialog ── */}
      <KanzaDialog open={newCat} onOpenChange={setNewCat} title="Nova Categoria" description="Cria uma categoria personalizada">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input
              value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Animais de Estimação, Música…"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <EmojiPicker value={catForm.icon} onChange={icon => setCatForm(f => ({ ...f, icon }))} />
          <ColorPicker value={catForm.color} onChange={color => setCatForm(f => ({ ...f, color }))} />

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: catForm.color + '30' }}>
              {catForm.icon}
            </div>
            <span className="font-semibold">{catForm.name || 'Pré-visualização'}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setNewCat(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button onClick={handleCreateCategory} disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A criar…' : 'Criar Categoria'}
            </button>
          </div>
        </div>
      </KanzaDialog>

      {/* ── Edit Category Dialog ── */}
      <KanzaDialog open={!!editCat} onOpenChange={v => !v && setEditCat(null)} title="Editar Categoria">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input
              value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <EmojiPicker value={catForm.icon} onChange={icon => setCatForm(f => ({ ...f, icon }))} />
          <ColorPicker value={catForm.color} onChange={color => setCatForm(f => ({ ...f, color }))} />
          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: catForm.color + '30' }}>
              {catForm.icon}
            </div>
            <span className="font-semibold">{catForm.name}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditCat(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button onClick={handleEditCategory} disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>
      </KanzaDialog>

      {/* ── Create Subcategory Dialog ── */}
      <KanzaDialog open={!!newSub} onOpenChange={v => !v && setNewSub(null)} title="Nova Sub-categoria" description={`Em: ${categories.find(c => c.id === newSub)?.name ?? ''}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input
              value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Combustível, Propinas, Netflix…"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <EmojiPicker value={subForm.icon} onChange={icon => setSubForm(f => ({ ...f, icon }))} />
          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl">
            <span className="text-2xl">{subForm.icon}</span>
            <span className="text-sm font-medium">{subForm.name || 'Pré-visualização'}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setNewSub(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button onClick={handleCreateSub} disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A criar…' : 'Criar'}
            </button>
          </div>
        </div>
      </KanzaDialog>

      {/* ── Edit Subcategory Dialog ── */}
      <KanzaDialog open={!!editSub} onOpenChange={v => !v && setEditSub(null)} title="Editar Sub-categoria">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input
              value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <EmojiPicker value={subForm.icon} onChange={icon => setSubForm(f => ({ ...f, icon }))} />
          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-xl">
            <span className="text-2xl">{subForm.icon}</span>
            <span className="text-sm font-medium">{subForm.name}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditSub(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button onClick={handleEditSub} disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>
      </KanzaDialog>
    </div>
  )
}
