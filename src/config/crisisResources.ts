import type { Language } from '../model/settings'

/**
 * Crisis resources shown in the "Need help now?" panel, in step 5 of the plan, and in exports.
 *
 * This is the ONLY place hotline information lives. To adapt the app for another region,
 * replace the entries below (and update `lastReviewed`). Every user-facing string here needs
 * a value for each supported language.
 *
 * Phone numbers and texting keywords change. Re-check each entry against the provider's own
 * website before every release.
 */

export type Localized = Record<Language, string>

export interface CrisisAction {
  kind: 'call' | 'text'
  /** Digits used to build the tel:/sms: link. */
  number: string
  /** How the number is written for people to read. */
  display: string
  /** Pre-filled text message, e.g. a keyword. Optional per language. */
  body?: Partial<Localized>
}

export interface CrisisResource {
  id: string
  name: Localized
  description: Localized
  actions: CrisisAction[]
  /** Emergency services get the only red styling in the app. */
  emergency?: boolean
}

export interface CrisisConfig {
  region: Localized
  /** ISO date the entries were last checked against official sources. */
  lastReviewed: string
  resources: CrisisResource[]
}

export const crisisConfig: CrisisConfig = {
  region: {
    en: 'Los Angeles County, California, USA',
    es: 'Condado de Los Ángeles, California, EE. UU.',
  },
  lastReviewed: '2026-10-29',
  resources: [
    {
      // https://988lifeline.org — Spanish: call and press 2, or text AYUDA to 988.
      id: '988',
      name: {
        en: '988 Suicide & Crisis Lifeline',
        es: '988 Línea de Prevención del Suicidio y Crisis',
      },
      description: {
        en: 'Call or text 988 to talk with a trained crisis counselor. Free, private, and open 24/7.',
        es: 'Llama o envía un texto al 988 para hablar con una persona capacitada para ayudar en crisis. Es gratis, privado y está abierto las 24 horas. Para español, marca 2 o envía la palabra AYUDA.',
      },
      actions: [
        { kind: 'call', number: '988', display: '988' },
        { kind: 'text', number: '988', display: '988', body: { es: 'AYUDA' } },
      ],
    },
    {
      // https://www.crisistextline.org — English keyword HOME; Spanish page says AYUDA.
      id: 'crisis-text-line',
      name: {
        en: 'Crisis Text Line',
        es: 'Crisis Text Line (línea de crisis por texto)',
      },
      description: {
        en: 'Text with a trained volunteer, any time. Free and private.',
        es: 'Escríbele por texto a una persona voluntaria capacitada, a cualquier hora. Es gratis y privado.',
      },
      actions: [{ kind: 'text', number: '741741', display: '741741', body: { en: 'HOME', es: 'AYUDA' } }],
    },
    {
      // https://dmh.lacounty.gov — 24/7 Help Line, many languages, TTY via 711 relay.
      id: 'la-dmh',
      name: {
        en: 'LA County Department of Mental Health 24/7 Help Line',
        es: 'Línea de Ayuda 24/7 del Departamento de Salud Mental del Condado de Los Ángeles',
      },
      description: {
        en: 'Support, crisis help, and referrals for people in Los Angeles County. Help is available in many languages.',
        es: 'Apoyo, ayuda en crisis y referencias para personas en el Condado de Los Ángeles. Hay ayuda en muchos idiomas, incluido el español.',
      },
      actions: [{ kind: 'call', number: '18008547771', display: '1-800-854-7771' }],
    },
    {
      id: 'emergency',
      emergency: true,
      name: { en: 'Emergency: 911', es: 'Emergencias: 911' },
      description: {
        en: 'If you are in danger right now or someone is hurt, call 911.',
        es: 'Si estás en peligro ahora mismo o alguien está herido, llama al 911.',
      },
      actions: [{ kind: 'call', number: '911', display: '911' }],
    },
  ],
}
