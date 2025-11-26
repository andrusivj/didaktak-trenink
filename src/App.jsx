
import React, { useEffect, useState } from 'react'
import questionsData from './data/questions.json'

function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? JSON.parse(s) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])
  return [state, setState]
}

export default function App(){
  const [questions] = useState(questionsData)
  const [filter, setFilter] = useState('Vše')
  const [mode, setMode] = useState('study')
  const [progress, setProgress] = useLocalStorage('progress_v1', {})

  const categories = ['Vše', ...Array.from(new Set(questions.map(q=>q.category)))]
  const filtered = filter === 'Vše' ? questions : questions.filter(q=>q.category===filter)

  // session state
  const [index, setIndex] = useState(0)
  const [shuffled, setShuffled] = useState(() => shuffle(filtered.map(q=>q.id)))

  useEffect(()=>{
    setShuffled(shuffle(filtered.map(q=>q.id)))
    setIndex(0)
  }, [filter])

  function shuffle(arr){
    const a = arr.slice()
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1))
      [a[i],a[j]]=[a[j],a[i]]
    }
    return a
  }

  function markAnswer(id, correct){
    setProgress(prev=>{
      const np = {...prev, [id]: {correct: correct, updated: Date.now()}}
      return np
    })
    setIndex(i=>Math.min(i+1, shuffled.length-1))
  }

  function exportBackup(){
    const blob = new Blob([JSON.stringify({progress, questions:questions}, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'backup_progress.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(e){
    const f = e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=> {
      try {
        const obj = JSON.parse(reader.result)
        if(obj.progress) setProgress(obj.progress)
        alert('Import hotov')
      } catch {
        alert('Chyba při importu')
      }
    }
    reader.readAsText(f)
  }

  return (
    <div className="app">
      <header>
        <h1>Procvičování otázek — Didakťák</h1>
      </header>
      <section className="controls">
        <label>Filtr: 
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            {categories.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Režim:
          <select value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="study">Studijní</option>
            <option value="test">Test (bez ukládání)</option>
            <option value="repeat">Opakování chyb</option>
          </select>
        </label>
        <button onClick={exportBackup}>Export zálohy</button>
        <input type="file" onChange={importBackup} />
      </section>

      <main>
        <p>Otázek v kolekci: {filtered.length}</p>
        {shuffled.length>0 && (
          <QuestionView 
            q={questions.find(x=>x.id===shuffled[index])} 
            onAnswer={markAnswer}
            progress={progress}
          />
        )}
      </main>

      <footer>
        <small>Ukládáno lokálně v prohlížeči.</small>
      </footer>
    </div>
  )
}

function QuestionView({q, onAnswer, progress}){
  if(!q) return <div>Hotovo.</div>
  const p = progress[q.id]
  return (
    <div className="question">
      <h2>Otázka #{q.id} — {q.category}</h2>
      <p>{q.text}</p>
      <div className="answers">
        <button onClick={()=>onAnswer(q.id, true)}>Správně</button>
        <button onClick={()=>onAnswer(q.id, false)}>Špatně</button>
      </div>
      {p && <div className="status">Poslední: {p.correct ? 'správně' : 'špatně'} — {new Date(p.updated).toLocaleString()}</div>}
    </div>
  )
}
