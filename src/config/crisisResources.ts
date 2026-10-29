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
    fr: 'le comté de Los Angeles, en Californie (États-Unis)',
    ko: '미국 캘리포니아주 로스앤젤레스 카운티',
    'zh-Hans': '美国加利福尼亚州洛杉矶县',
  },
  lastReviewed: '2026-10-29',
  resources: [
    {
      // https://988lifeline.org — Spanish: call and press 2, or text AYUDA to 988.
      // Other languages: phone interpreters in 240+ languages; callers say the language they need.
      // Text and chat are English and Spanish only.
      // https://988lifeline.org/faq/calling-the-988-lifeline/faq-is-the-988-lifeline-available-in-other-languages-for-non-english-speakers/
      // Korean and Chinese names follow SAMHSA's translated 988 fact sheets (December 2024).
      id: '988',
      name: {
        en: '988 Suicide & Crisis Lifeline',
        es: '988 Línea de Prevención del Suicidio y Crisis',
        fr: "988 Suicide & Crisis Lifeline (ligne d'aide en cas de crise)",
        ko: '988 자살 및 위기 라이프라인',
        'zh-Hans': '988 自杀与危机生命热线',
      },
      description: {
        en: 'Call or text 988 to talk with a trained crisis counselor. Free, private, and open 24/7.',
        es: 'Llama o envía un texto al 988 para hablar con una persona capacitada para ayudar en crisis. Es gratis, privado y está abierto las 24 horas. Para español, marca 2 o envía la palabra AYUDA.',
        fr: "Appelle le 988 pour parler avec une personne formée pour aider en cas de crise. C'est gratuit, confidentiel et ouvert 24 h/24. On te répondra en anglais, mais tu peux dire « French » pour obtenir un service d'interprétation. Les SMS sont seulement en anglais et en espagnol.",
        ko: '988에 전화하면 훈련받은 위기 상담사와 이야기할 수 있어요. 무료이고 비밀이 보장되며, 24시간 운영해요. 상담은 영어로 진행되지만, 전화를 받으면 “Korean”이라고 말해 통역을 요청할 수 있어요. 문자 상담은 영어와 스페인어로만 가능해요.',
        'zh-Hans': '拨打 988，与受过训练的危机辅导员交谈。免费、保密，24 小时开放。接听人员讲英语，你可以用英语说 “Mandarin” 或 “Cantonese” 来要求口译服务。短信服务只提供英语和西班牙语。',
      },
      actions: [
        { kind: 'call', number: '988', display: '988' },
        { kind: 'text', number: '988', display: '988', body: { es: 'AYUDA' } },
      ],
    },
    {
      // https://www.crisistextline.org — English keyword HOME; Spanish page says AYUDA.
      // English and Spanish only, so other languages are told that and use the English keyword.
      id: 'crisis-text-line',
      name: {
        en: 'Crisis Text Line',
        es: 'Crisis Text Line (línea de crisis por texto)',
        fr: 'Crisis Text Line (ligne de crise par SMS)',
        ko: 'Crisis Text Line (문자 위기 상담)',
        'zh-Hans': 'Crisis Text Line（危机短信热线）',
      },
      description: {
        en: 'Text with a trained volunteer, any time. Free and private.',
        es: 'Escríbele por texto a una persona voluntaria capacitada, a cualquier hora. Es gratis y privado.',
        fr: "Échange par SMS avec une personne bénévole formée, à toute heure. C'est gratuit et confidentiel. Le service est en anglais et en espagnol seulement.",
        ko: '훈련받은 자원봉사자와 언제든 문자로 이야기할 수 있어요. 무료이고 비밀이 보장돼요. 영어와 스페인어로만 이용할 수 있어요.',
        'zh-Hans': '随时通过短信与受过训练的志愿者交流。免费、保密。只提供英语和西班牙语服务。',
      },
      actions: [
        {
          kind: 'text',
          number: '741741',
          display: '741741',
          body: { en: 'HOME', es: 'AYUDA', fr: 'HOME', ko: 'HOME', 'zh-Hans': 'HOME' },
        },
      ],
    },
    {
      // https://dmh.lacounty.gov — 24/7 Help Line, many languages, TTY via 711 relay.
      // The phone menu has options for every county threshold language, including Korean,
      // Mandarin, and Cantonese. https://dmh.lacounty.gov/blog/2024/08/welcome-l-a-county-help-line-for-mental-health-and-substance-use-services/
      id: 'la-dmh',
      name: {
        en: 'LA County Department of Mental Health 24/7 Help Line',
        es: 'Línea de Ayuda 24/7 del Departamento de Salud Mental del Condado de Los Ángeles',
        fr: "Ligne d'aide 24 h/24 du Département de la santé mentale du comté de Los Angeles",
        ko: 'LA 카운티 정신건강국 24시간 도움 전화',
        'zh-Hans': '洛杉矶县心理健康局 24 小时求助热线',
      },
      description: {
        en: 'Support, crisis help, and referrals for people in Los Angeles County. Help is available in many languages.',
        es: 'Apoyo, ayuda en crisis y referencias para personas en el Condado de Los Ángeles. Hay ayuda en muchos idiomas, incluido el español.',
        fr: "Soutien, aide en cas de crise et orientation vers des services pour les personnes du comté de Los Angeles. De l'aide est offerte dans de nombreuses langues.",
        ko: '로스앤젤레스 카운티 주민을 위한 지원, 위기 도움, 서비스 연결을 제공해요. 전화 안내에서 한국어를 선택할 수 있어요.',
        'zh-Hans': '为洛杉矶县居民提供支持、危机帮助和转介服务。电话语音菜单中可以选择普通话或粤语。',
      },
      actions: [{ kind: 'call', number: '18008547771', display: '1-800-854-7771' }],
    },
    {
      // LAPD: tell the 911 operator your preferred language to be connected to an interpreter.
      // https://lapdonlinestrgeacc.blob.core.usgovcloudapi.net/lapdonlinemedia/2021/12/911-Use-and-Abuse.pdf
      id: 'emergency',
      emergency: true,
      name: {
        en: 'Emergency: 911',
        es: 'Emergencias: 911',
        fr: 'Urgences : 911',
        ko: '응급 상황: 911',
        'zh-Hans': '紧急情况：911',
      },
      description: {
        en: 'If you are in danger right now or someone is hurt, call 911.',
        es: 'Si estás en peligro ahora mismo o alguien está herido, llama al 911.',
        fr: "Si tu es en danger en ce moment ou si quelqu'un est blessé, appelle le 911. Dis « French » pour demander un service d'interprétation.",
        ko: '지금 위험하거나 누군가 다쳤다면 911에 전화하세요. 전화를 받으면 “Korean”이라고 말해 통역을 요청할 수 있어요.',
        'zh-Hans': '如果你现在有危险，或有人受伤，请拨打 911。接通后用英语说 “Mandarin” 或 “Cantonese”，即可要求口译服务。',
      },
      actions: [{ kind: 'call', number: '911', display: '911' }],
    },
  ],
}
