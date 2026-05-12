import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@types/domain.types'
import { supabase } from '@services/supabase'
import { authService } from '@services/auth.service'

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
}

interface AuthActions {
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  setProfile: (profile: Profile) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      isLoading: false,
      isInitialized: false,

      initialize: async () => {
        set({ isLoading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          set({ session })

          if (session?.user) {
            const profile = await authService.getProfile(session.user.id)
            set({ profile })
          }

          // Listener para mudanças de sessão
          supabase.auth.onAuthStateChange((_event, session) => {
            set({ session })
            if (!session) set({ profile: null })
          })
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true })
        try {
          const { session, user } = await authService.signIn(email, password)
          set({ session })
          if (user) {
            try {
              const profile = await authService.getProfile(user.id)
              set({ profile })
            } catch {
              // perfil ainda não criado, não bloqueia o login
            }
          }
        } finally {
          set({ isLoading: false })
        }
      },

      signUp: async (email, password, fullName) => {
        set({ isLoading: true })
        try {
          const { session, user } = await authService.signUp(email, password, fullName)
          set({ session })
          if (user) {
            try {
              const profile = await authService.getProfile(user.id)
              set({ profile })
            } catch {
              // profile pode ainda não existir logo após signup
            }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        try {
          await authService.signOut()
          set({ session: null, profile: null })
        } finally {
          set({ isLoading: false })
        }
      },

      setProfile: (profile) => set({ profile }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persistir apenas dados não sensíveis
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
