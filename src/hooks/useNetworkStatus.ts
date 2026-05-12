import { useEffect, useState } from 'react'
import * as Network from 'expo-network'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const state = await Network.getNetworkStateAsync()
      if (!cancelled) setIsOnline(state.isConnected ?? true)
    }

    check()

    const interval = setInterval(check, 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return isOnline
}
