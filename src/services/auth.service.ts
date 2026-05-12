import { supabase } from './supabase'

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error

    // Criar profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      })
    }

    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'drivedindo://reset-password' }
    )
    if (error) throw error
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: { full_name?: string; phone?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
