import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '../i18n'
import { renderWithStore } from '../test/utils'
import { CrisisPanel } from './CrisisPanel'

describe('CrisisPanel', () => {
  it('lists every crisis line with tap-to-call and tap-to-text links', () => {
    renderWithStore(<CrisisPanel open onClose={() => {}} />)
    const panel = screen.getByRole('dialog', { name: "You don't have to face this alone" })

    expect(within(panel).getByRole('link', { name: 'Call 988' })).toHaveAttribute('href', 'tel:988')
    expect(within(panel).getByRole('link', { name: 'Text 988' })).toHaveAttribute('href', 'sms:988')
    expect(within(panel).getByRole('link', { name: 'Text HOME to 741741' })).toHaveAttribute(
      'href',
      'sms:741741?&body=HOME',
    )
    expect(within(panel).getByRole('link', { name: 'Call 1-800-854-7771' })).toHaveAttribute('href', 'tel:18008547771')
    expect(within(panel).getByRole('link', { name: 'Call 911' })).toHaveAttribute('href', 'tel:911')
  })

  it('starts keyboard focus on the first call button, not the close button', () => {
    renderWithStore(<CrisisPanel open onClose={() => {}} />)
    expect(screen.getByRole('link', { name: 'Call 988' })).toHaveFocus()
  })

  it('reserves red emergency styling for 911', () => {
    renderWithStore(<CrisisPanel open onClose={() => {}} />)
    const emergencyLinks = screen.getAllByRole('link').filter((link) => link.className.includes('btn-emergency'))
    expect(emergencyLinks.map((link) => link.textContent)).toEqual(['Call 911'])
  })

  it('uses the Spanish texting keywords in Spanish', async () => {
    await i18n.changeLanguage('es')
    renderWithStore(<CrisisPanel open onClose={() => {}} />, { settings: { language: 'es' } })

    expect(screen.getByRole('link', { name: 'Enviar AYUDA al 741741' })).toHaveAttribute('href', 'sms:741741?&body=AYUDA')
    expect(screen.getByRole('link', { name: 'Enviar AYUDA al 988' })).toHaveAttribute('href', 'sms:988?&body=AYUDA')
  })

  it('offers a shortcut to the person’s own plan when available', async () => {
    const user = userEvent.setup()
    const onOpenPlan = vi.fn<() => void>()
    renderWithStore(<CrisisPanel open onClose={() => {}} onOpenPlan={onOpenPlan} />)

    await user.click(screen.getByRole('button', { name: 'Open my safety plan' }))
    expect(onOpenPlan).toHaveBeenCalled()
  })

  it('closes with the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn<() => void>()
    renderWithStore(<CrisisPanel open onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
