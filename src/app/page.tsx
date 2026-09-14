'use client'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister())
      })
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
      }
    }
    window.location.replace('/login')
  }, [])
  return <p style={{color:'white', padding: '20px'}}>Limpando e redirecionando...</p>
}
