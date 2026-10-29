/**
 * The safety plan data model.
 *
 * The structure follows the six steps of the Stanley-Brown Safety Planning Intervention
 * (Stanley & Brown, 2012), plus a "reasons for living" section. All wording shown to the
 * user lives in the translation files, not here.
 */

/** A free-text entry, e.g. one warning sign or one coping strategy. */
export interface TextItem {
  id: string
  text: string
}

/** A person, place, or service, with an optional phone number for tap-to-call. */
export interface ContactItem {
  id: string
  /** A person's name or a place, e.g. "Aunt Rosa" or "Echo Park Lake". */
  name: string
  /** As typed by the user; normalized only when building tel:/sms: links. */
  phone: string
  /** Optional extra detail: relationship, role, address, or best time to call. */
  detail: string
}

/** A photo for "reasons for living", stored on-device as a compressed JPEG data URL. */
export interface PhotoItem {
  id: string
  dataUrl: string
  /** Shown under the photo and used as its alt text for screen readers. */
  caption: string
}

export type TextSectionKey = 'warningSigns' | 'copingStrategies' | 'safeEnvironment' | 'reasonsForLiving'
export type ContactSectionKey = 'distractions' | 'helpers' | 'professionals'
export type SectionKey = TextSectionKey | ContactSectionKey
/** Every list in the plan that supports add / remove / reorder. */
export type ListKey = SectionKey | 'photos'

export type SafetyPlan = { [K in TextSectionKey]: TextItem[] } & {
  [K in ContactSectionKey]: ContactItem[]
} & {
  photos: PhotoItem[]
}

export type ListItem<K extends ListKey> = SafetyPlan[K][number]

interface SectionDefBase {
  /** 1-based step number shown to the user. */
  step: number
  /** Ideas can be copied into the "add" field as a starting point. If false, they are shown as prompts only. */
  ideasUsable: boolean
}

export type SectionDef =
  | (SectionDefBase & { kind: 'text'; key: TextSectionKey; allowsPhotos: boolean })
  | (SectionDefBase & { kind: 'contact'; key: ContactSectionKey; showsCrisisResources: boolean })

/** The guided builder walks through these in order, one per screen. */
export const SECTIONS: readonly SectionDef[] = [
  { step: 1, kind: 'text', key: 'warningSigns', ideasUsable: true, allowsPhotos: false },
  { step: 2, kind: 'text', key: 'copingStrategies', ideasUsable: true, allowsPhotos: false },
  { step: 3, kind: 'contact', key: 'distractions', ideasUsable: true, showsCrisisResources: false },
  { step: 4, kind: 'contact', key: 'helpers', ideasUsable: false, showsCrisisResources: false },
  { step: 5, kind: 'contact', key: 'professionals', ideasUsable: true, showsCrisisResources: true },
  { step: 6, kind: 'text', key: 'safeEnvironment', ideasUsable: true, allowsPhotos: false },
  { step: 7, kind: 'text', key: 'reasonsForLiving', ideasUsable: true, allowsPhotos: true },
]

export const SECTION_KEYS: readonly SectionKey[] = SECTIONS.map((s) => s.key)
export const TEXT_SECTION_KEYS = SECTIONS.filter((s) => s.kind === 'text').map((s) => s.key) as TextSectionKey[]
export const CONTACT_SECTION_KEYS = SECTIONS.filter((s) => s.kind === 'contact').map(
  (s) => s.key,
) as ContactSectionKey[]

export function createEmptyPlan(): SafetyPlan {
  return {
    warningSigns: [],
    copingStrategies: [],
    distractions: [],
    helpers: [],
    professionals: [],
    safeEnvironment: [],
    reasonsForLiving: [],
    photos: [],
  }
}

export function isPlanEmpty(plan: SafetyPlan): boolean {
  return SECTION_KEYS.every((key) => plan[key].length === 0) && plan.photos.length === 0
}

/** How many of the seven sections have at least one entry. */
export function countFilledSections(plan: SafetyPlan): number {
  return SECTIONS.filter(
    (s) => plan[s.key].length > 0 || (s.kind === 'text' && s.allowsPhotos && plan.photos.length > 0),
  ).length
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
