import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import type { LoadStatus, SaveResult } from '../lib/storage'
import type { SafetyPlan } from '../model/plan'
import { planReducer, type PlanAction } from '../model/planReducer'
import { planSchema, settingsSchema } from '../model/schemas'
import type { Settings } from '../model/settings'

export interface AppStore {
  plan: SafetyPlan
  /** Applies a change to the plan and saves it. Returns whether the save worked. */
  dispatch: (action: PlanAction) => SaveResult
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => SaveResult
  /** The most recent plan save problem, if any. */
  saveProblem: 'quota' | 'unavailable' | null
  loadStatus: LoadStatus
  /** Erases the plan, photos, PIN, and settings from this device. */
  eraseAllData: () => void
}

const AppStoreContext = createContext<AppStore | null>(null)

export function AppStoreProvider({ children, storage }: { children: ReactNode; storage?: Storage | null }) {
  const [plan, setPlan, { clear: clearPlan, lastSave, loadStatus: planLoadStatus }] = usePersistentState(
    planSchema,
    storage,
  )
  const [settings, setSettings, { clear: clearSettings, loadStatus: settingsLoadStatus }] = usePersistentState(
    settingsSchema,
    storage,
  )

  const dispatch = useCallback((action: PlanAction) => setPlan((current) => planReducer(current, action)), [setPlan])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => setSettings((current) => ({ ...current, ...patch })),
    [setSettings],
  )

  const eraseAllData = useCallback(() => {
    clearPlan()
    // Keep showing the current language so the screen doesn't suddenly switch languages,
    // but nothing is written back to storage.
    clearSettings({ ...settingsSchema.createDefault(), language: settings.language })
  }, [clearPlan, clearSettings, settings.language])

  // Surface the more serious of the two load results.
  const loadStatus = planLoadStatus === 'loaded' || planLoadStatus === 'empty' ? settingsLoadStatus : planLoadStatus

  const value = useMemo<AppStore>(
    () => ({
      plan,
      dispatch,
      settings,
      updateSettings,
      saveProblem: lastSave.ok ? null : lastSave.reason,
      loadStatus,
      eraseAllData,
    }),
    [plan, dispatch, settings, updateSettings, lastSave, loadStatus, eraseAllData],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStore {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return store
}
