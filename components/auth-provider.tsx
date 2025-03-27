"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AuthProvider as FirebaseAuthProvider } from "@/lib/auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
}

