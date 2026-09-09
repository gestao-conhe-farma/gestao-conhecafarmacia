'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const TemaContext = createContext({ tema: 'claro', alternarTema: () => {} })

export function TemaProvider({ children }) {
  const [tema, setTema] = useState('claro')

  useEffect(() => {
    const guardado = localStorage.getItem('theme')
    const escuro =
      guardado === 'dark' ||
      (!guardado && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (escuro) {
      document.documentElement.classList.add('dark')
      setTema('escuro')
    }
  }, [])

  function alternarTema() {
    const novo = tema === 'escuro' ? 'claro' : 'escuro'
    document.documentElement.classList.toggle('dark', novo === 'escuro')
    localStorage.setItem('theme', novo === 'escuro' ? 'dark' : 'light')
    setTema(novo)
  }

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  return useContext(TemaContext)
}
