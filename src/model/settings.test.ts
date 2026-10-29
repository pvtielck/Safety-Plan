import { detectLanguage } from './settings'

describe('detectLanguage', () => {
  it.each([
    ['es-MX', 'es'],
    ['fr-CA', 'fr'],
    ['ko-KR', 'ko'],
    ['zh-CN', 'zh-Hans'],
    ['zh-TW', 'zh-Hans'],
    ['en-US', 'en'],
    ['de-DE', 'en'],
    ['', 'en'],
  ])('picks the right language for "%s"', (deviceLanguage, expected) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([deviceLanguage])
    expect(detectLanguage()).toBe(expected)
  })
})
