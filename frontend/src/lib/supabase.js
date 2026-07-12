import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey || 'placeholder'

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseUrl.includes('YOUR_')) {
  console.warn('Supabase URL or Anon Key is missing or invalid. Check your frontend/.env file.')
}

export const supabase = createClient(finalUrl, finalKey)

export const fetchWithAuth = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const newOptions = { ...options }
  let headers = newOptions.headers || {}

  if (token) {
    if (headers instanceof Headers) {
      headers.set('Authorization', `Bearer ${token}`)
    } else if (Array.isArray(headers)) {
      headers.push(['Authorization', `Bearer ${token}`])
    } else {
      headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }

  newOptions.headers = headers
  return fetch(url, newOptions)
}
