'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para o browser (uploads diretos ao Storage,
 * cerimónias WebAuthn/passkey — biometria no login).
 * Singleton: reutilizado entre renders.
 */
let cliente = null

export function getSupabaseBrowserClient() {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          // Passkeys (impressão digital / Face ID) — API experimental:
          // sem esta flag, auth.passkey.* e registerPasskey/signInWithPasskey lançam erro.
          experimental: { passkey: true },
        },
      }
    )
  }
  return cliente
}
