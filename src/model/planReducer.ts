import {
  createEmptyPlan,
  createId,
  type ContactItem,
  type ContactSectionKey,
  type ListItem,
  type ListKey,
  type PhotoItem,
  type SafetyPlan,
  type TextSectionKey,
} from './plan'

export type ContactFields = Omit<ContactItem, 'id'>

/**
 * Every change to the plan goes through this reducer. It is pure: ids are created by the
 * action creators below, so the reducer is easy to test and replay.
 */
export type PlanAction =
  | { type: 'addText'; section: TextSectionKey; item: { id: string; text: string } }
  | { type: 'updateText'; section: TextSectionKey; id: string; text: string }
  | { type: 'addContact'; section: ContactSectionKey; item: ContactItem }
  | { type: 'updateContact'; section: ContactSectionKey; id: string; fields: ContactFields }
  | { type: 'addPhoto'; item: PhotoItem }
  | { type: 'updatePhotoCaption'; id: string; caption: string }
  | { type: 'remove'; list: ListKey; id: string }
  /** Puts a removed item back where it was (used by "Undo"). */
  | { type: 'restore'; list: ListKey; item: ListItem<ListKey>; index: number }
  | { type: 'move'; list: ListKey; id: string; offset: -1 | 1 }
  | { type: 'reset' }

export function planReducer(plan: SafetyPlan, action: PlanAction): SafetyPlan {
  switch (action.type) {
    case 'addText': {
      const text = action.item.text.trim()
      if (!text) return plan
      return { ...plan, [action.section]: [...plan[action.section], { id: action.item.id, text }] }
    }
    case 'updateText': {
      const text = action.text.trim()
      if (!text) return plan
      return {
        ...plan,
        [action.section]: plan[action.section].map((item) => (item.id === action.id ? { ...item, text } : item)),
      }
    }
    case 'addContact': {
      const item = { ...trimContact(action.item), id: action.item.id }
      if (!item.name) return plan
      return { ...plan, [action.section]: [...plan[action.section], item] }
    }
    case 'updateContact': {
      const fields = trimContact(action.fields)
      if (!fields.name) return plan
      return {
        ...plan,
        [action.section]: plan[action.section].map((item) => (item.id === action.id ? { ...item, ...fields } : item)),
      }
    }
    case 'addPhoto':
      return { ...plan, photos: [...plan.photos, { ...action.item, caption: action.item.caption.trim() }] }
    case 'updatePhotoCaption':
      return {
        ...plan,
        photos: plan.photos.map((p) => (p.id === action.id ? { ...p, caption: action.caption.trim() } : p)),
      }
    case 'remove': {
      const list = plan[action.list] as ListItem<ListKey>[]
      if (!list.some((item) => item.id === action.id)) return plan
      return { ...plan, [action.list]: list.filter((item) => item.id !== action.id) }
    }
    case 'restore': {
      const list = plan[action.list] as ListItem<ListKey>[]
      if (list.some((item) => item.id === action.item.id)) return plan
      const index = Math.max(0, Math.min(action.index, list.length))
      return { ...plan, [action.list]: [...list.slice(0, index), action.item, ...list.slice(index)] }
    }
    case 'move': {
      const list = plan[action.list] as ListItem<ListKey>[]
      const from = list.findIndex((item) => item.id === action.id)
      const to = from + action.offset
      if (from === -1 || to < 0 || to >= list.length) return plan
      const next = [...list]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return { ...plan, [action.list]: next }
    }
    case 'reset':
      return createEmptyPlan()
  }
}

function trimContact(fields: ContactFields): ContactFields {
  return { name: fields.name.trim(), phone: fields.phone.trim(), detail: fields.detail.trim() }
}

/* Action creators: these are the only place new ids are minted. */

type ActionOf<T extends PlanAction['type']> = Extract<PlanAction, { type: T }>

export const planActions = {
  addText: (section: TextSectionKey, text: string): ActionOf<'addText'> => ({
    type: 'addText',
    section,
    item: { id: createId(), text },
  }),
  addContact: (section: ContactSectionKey, fields: ContactFields): ActionOf<'addContact'> => ({
    type: 'addContact',
    section,
    item: { id: createId(), ...fields },
  }),
  addPhoto: (dataUrl: string, caption: string): ActionOf<'addPhoto'> => ({
    type: 'addPhoto',
    item: { id: createId(), dataUrl, caption },
  }),
}
