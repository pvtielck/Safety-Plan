import { dialable, smsHref, telHref } from './phone'

describe('phone links', () => {
  it('strips formatting but keeps a leading plus', () => {
    expect(dialable('(323) 555-0100')).toBe('3235550100')
    expect(dialable('+52 55 1234 5678')).toBe('+525512345678')
    expect(dialable('988')).toBe('988')
  })

  it('returns nothing for text that is not a phone number', () => {
    expect(dialable('call me')).toBe('')
    expect(telHref('12')).toBeNull()
    expect(smsHref('')).toBeNull()
  })

  it('builds tel: and sms: links, with an optional pre-filled message', () => {
    expect(telHref('1-800-854-7771')).toBe('tel:18008547771')
    expect(smsHref('988')).toBe('sms:988')
    expect(smsHref('741741', 'HOME')).toBe('sms:741741?&body=HOME')
    expect(smsHref('741741', 'hola amigo')).toBe('sms:741741?&body=hola%20amigo')
  })
})
