import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import i18n, { initI18n } from '../i18n'

initI18n('en')

// jsdom doesn't implement modal dialogs yet. This mimics the parts the app relies on.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

beforeEach(async () => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  await i18n.changeLanguage('en')
})

afterEach(() => {
  cleanup()
})
