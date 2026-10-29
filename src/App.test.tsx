import { screen, waitFor } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { hashPin } from './lib/pin'
import { quickExit } from './lib/quickExit'
import { ALL_STORAGE_KEYS, PLAN_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './model/schemas'
import { MemoryStorage, readStored, seedStorage } from './test/utils'

vi.mock('./lib/quickExit', () => ({ quickExit: vi.fn<() => void>() }))

const plan = {
  warningSigns: [{ id: 'w1', text: 'I stop sleeping' }],
  helpers: [{ id: 'h1', name: 'Aunt Rosa', phone: '(323) 555-0100', detail: '' }],
}

function renderApp({ hash = '', ...seed }: Parameters<typeof seedStorage>[1] & { hash?: string } = {}) {
  window.history.replaceState(null, '', `/${hash}`)
  const storage = new MemoryStorage()
  seedStorage(storage, seed)
  render(<App storage={storage} />)
  return storage
}

describe('App', () => {
  it('shows the welcome screen on first visit, with the privacy notice', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'My Safety Plan' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your data stays on this device' })).toBeInTheDocument()
    expect(screen.getByText(/does not replace professional care/)).toBeInTheDocument()
  })

  it('opens returning visitors on their plan, with tap-to-call', () => {
    renderApp({ plan, settings: { welcomeSeen: true } })
    expect(screen.getByText('I stop sleeping')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Call Aunt Rosa' })).toHaveAttribute('href', 'tel:3235550100')
    expect(screen.getByRole('link', { name: 'Text Aunt Rosa' })).toHaveAttribute('href', 'sms:3235550100')
  })

  it.each(['#/welcome', '#/build/3', '#/plan', '#/settings'])('has the "Need help now?" button on %s', async (hash) => {
    const user = userEvent.setup()
    renderApp({ hash, plan })
    await user.click(screen.getByRole('button', { name: 'Need help now?' }))
    expect(screen.getByRole('dialog', { name: "You don't have to face this alone" })).toBeInTheDocument()
  })

  it('clears the screen and leaves on Quick exit', async () => {
    const user = userEvent.setup()
    renderApp({ plan, settings: { welcomeSeen: true } })

    await user.click(screen.getByRole('button', { name: /^Quick exit/ }))

    expect(quickExit).toHaveBeenCalled()
    expect(screen.queryByText('I stop sleeping')).not.toBeInTheDocument()
    expect(document.body.textContent).toBe('')
  })

  it('switches the whole interface to Spanish', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('radio', { name: 'Español' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Mi plan de seguridad' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '¿Necesitas ayuda ahora?' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })

  describe('with a PIN', () => {
    it('hides the plan until the right PIN is entered, but never hides crisis help', async () => {
      const user = userEvent.setup()
      const pin = await hashPin('4826', 1_000)
      renderApp({ plan, settings: { welcomeSeen: true, pin } })

      expect(screen.getByRole('heading', { name: 'Enter your PIN' })).toBeInTheDocument()
      expect(screen.queryByText('I stop sleeping')).not.toBeInTheDocument()
      expect(screen.queryByRole('navigation', { name: 'Main menu' })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Need help now?' }))
      expect(screen.getByRole('link', { name: 'Call 988' })).toBeInTheDocument()
      // The "open my plan" shortcut must not bypass the lock.
      expect(screen.queryByRole('button', { name: 'Open my safety plan' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Close' }))

      await user.type(screen.getByLabelText('4-digit PIN'), '1111')
      expect(await screen.findByText("That PIN didn't work. Try again.")).toBeInTheDocument()

      await user.type(screen.getByLabelText('4-digit PIN'), '4826')
      expect(await screen.findByText('I stop sleeping')).toBeInTheDocument()
    })

    it('lets someone who forgot their PIN start over, after confirming', async () => {
      const user = userEvent.setup()
      const pin = await hashPin('4826', 1_000)
      window.history.replaceState(null, '', '/')
      const storage = new MemoryStorage()
      seedStorage(storage, { plan, settings: { welcomeSeen: true, pin } })
      render(<App storage={storage} />)

      await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }))
      await user.click(screen.getByRole('button', { name: 'Erase data and start over' }))

      await waitFor(() => expect(screen.getByRole('button', { name: 'Start my plan' })).toBeInTheDocument())
      for (const key of ALL_STORAGE_KEYS) expect(storage.getItem(key)).toBeNull()
    })
  })

  describe('settings', () => {
    it('only deletes data after confirmation', async () => {
      const user = userEvent.setup()
      const storage = renderApp({ hash: '#/settings', plan, settings: { welcomeSeen: true } })

      await user.click(screen.getByRole('button', { name: 'Delete all data' }))
      expect(screen.getByRole('dialog', { name: 'Delete everything?' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(readStored(storage, PLAN_STORAGE_KEY)).not.toBeNull()

      await user.click(screen.getByRole('button', { name: 'Delete all data' }))
      await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }))

      expect(storage.getItem(PLAN_STORAGE_KEY)).toBeNull()
      expect(storage.getItem(SETTINGS_STORAGE_KEY)).toBeNull()
      expect(screen.getByText('All data was deleted from this device.')).toBeInTheDocument()
    })

    it('explains that the PIN is not encryption, and stores only a hash', async () => {
      const user = userEvent.setup()
      const storage = renderApp({ hash: '#/settings', settings: { welcomeSeen: true } })
      expect(screen.getByText(/A PIN is not encryption/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Set a PIN' }))
      await user.type(screen.getByLabelText('New 4-digit PIN'), '2468')
      await user.type(screen.getByLabelText('Type the PIN again'), '1357')
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(screen.getByRole('alert')).toHaveTextContent("The PINs don't match.")

      await user.clear(screen.getByLabelText('Type the PIN again'))
      await user.type(screen.getByLabelText('Type the PIN again'), '2468')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      await screen.findByText('PIN lock is on.')
      const raw = storage.getItem(SETTINGS_STORAGE_KEY)!
      expect(raw).not.toContain('2468')
      expect(JSON.parse(raw).data.pin).toEqual(expect.objectContaining({ hash: expect.any(String), salt: expect.any(String) }))
    })
  })
})
