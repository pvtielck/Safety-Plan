import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Route } from '../hooks/useHashRoute'
import type { SafetyPlan } from '../model/plan'
import { PLAN_STORAGE_KEY } from '../model/schemas'
import { MemoryStorage, readStored, renderWithStore } from '../test/utils'
import { BuilderScreen } from './BuilderScreen'

// jsdom has no canvas, so stand in for on-device compression with a fixed-size JPEG.
const fakeJpeg = vi.hoisted(() => ({ size: 100 }))
vi.mock('../lib/image', () => ({
  compressImage: vi.fn<() => Promise<string>>(async () => `data:image/jpeg;base64,${'A'.repeat(fakeJpeg.size)}`),
}))

const storedPlan = (storage: Storage) => readStored<SafetyPlan>(storage, PLAN_STORAGE_KEY)!

function renderStep(step: number, plan?: Partial<SafetyPlan>) {
  const navigate = vi.fn<(route: Route) => void>()
  const result = renderWithStore(<BuilderScreen step={step} navigate={navigate} />, { plan })
  return { ...result, navigate }
}

describe('BuilderScreen', () => {
  it('shows the section explanation, prompt question, and progress', () => {
    renderStep(1)
    expect(screen.getByRole('heading', { level: 1, name: 'My warning signs' })).toBeInTheDocument()
    expect(screen.getByText(/What do you notice in yourself/)).toBeInTheDocument()
    // Phones get numbered circles and wide screens a named sidebar; CSS shows one at a time.
    expect(screen.getAllByText('Step 1 of 7')).toHaveLength(2)
    for (const link of screen.getAllByRole('link', { name: /Step 1: My warning signs/ })) {
      expect(link).toHaveAttribute('aria-current', 'step')
    }
  })

  it('adds an entry with Enter and saves it right away', async () => {
    const user = userEvent.setup()
    const { storage } = renderStep(1)

    await user.type(screen.getByLabelText('Add a warning sign'), 'I stop answering my phone{Enter}')

    expect(screen.getByText('I stop answering my phone')).toBeInTheDocument()
    expect(storedPlan(storage).warningSigns.map((i) => i.text)).toEqual(['I stop answering my phone'])
    expect(screen.getByLabelText('Add a warning sign')).toHaveValue('')
    expect(screen.getByText('Saved on this device')).toBeInTheDocument()
  })

  it('copies an idea into the field so it can be reworded first', async () => {
    const user = userEvent.setup()
    const { storage } = renderStep(2)

    await user.click(screen.getByRole('button', { name: 'Use this idea: Go for a walk outside' }))

    const field = screen.getByLabelText('Add something I can do')
    expect(field).toHaveValue('Go for a walk outside')
    expect(field).toHaveFocus()
    expect(storedPlan(storage)).toBeNull() // nothing is added until the person chooses to
  })

  it('edits, reorders, deletes, and undoes', async () => {
    const user = userEvent.setup()
    const { storage } = renderStep(1, {
      warningSigns: [
        { id: 'a', text: 'Can’t sleep' },
        { id: 'b', text: 'Skipping meals' },
      ],
    })

    // Edit
    await user.click(screen.getByRole('button', { name: 'Edit: Can’t sleep' }))
    const editor = screen.getByLabelText('Your words')
    await user.clear(editor)
    await user.type(editor, 'Can’t sleep for days')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(storedPlan(storage).warningSigns[0]!.text).toBe('Can’t sleep for days')
    expect(screen.getByRole('button', { name: 'Edit: Can’t sleep for days' })).toHaveFocus()

    // Reorder: focus follows the moved item
    await user.click(screen.getByRole('button', { name: 'Move up: Skipping meals' }))
    expect(storedPlan(storage).warningSigns.map((i) => i.id)).toEqual(['b', 'a'])
    expect(screen.getByRole('button', { name: 'Move down: Skipping meals' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Move up: Skipping meals' })).toBeDisabled()
    expect(screen.getByText('Moved “Skipping meals” to number 1 of 2.')).toBeInTheDocument()

    // Delete, then undo puts it back in the same place
    await user.click(screen.getByRole('button', { name: 'Delete: Skipping meals' }))
    expect(storedPlan(storage).warningSigns.map((i) => i.id)).toEqual(['a'])
    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(undo).toHaveFocus()
    await user.click(undo)
    expect(storedPlan(storage).warningSigns.map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('autosaves text that was typed but not added when moving to another step', async () => {
    const user = userEvent.setup()
    const { storage, unmount } = renderStep(1)

    await user.type(screen.getByLabelText('Add a warning sign'), 'Half-finished thought')
    unmount()

    expect(storedPlan(storage).warningSigns.map((i) => i.text)).toEqual(['Half-finished thought'])
  })

  it('requires a name for contacts and shows tap-to-call details', async () => {
    const user = userEvent.setup()
    const { storage } = renderStep(4)

    await user.type(screen.getByLabelText(/Phone number/), '323-555-0100')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Please add a name.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()

    await user.type(screen.getByLabelText('Name'), 'Aunt Rosa')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(storedPlan(storage).helpers).toEqual([
      expect.objectContaining({ name: 'Aunt Rosa', phone: '323-555-0100', detail: '' }),
    ])
  })

  it('always shows the crisis lines in step 5', () => {
    renderStep(5)
    expect(screen.getByRole('heading', { name: /Always included: crisis lines/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Call 988' })).toHaveAttribute('href', 'tel:988')
  })

  it('adds a photo with a caption that doubles as alt text', async () => {
    const user = userEvent.setup()
    fakeJpeg.size = 100
    const { storage, container } = renderStep(7)

    await user.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, new File(['x'], 'luna.png', { type: 'image/png' }))
    expect(await screen.findByRole('img', { name: 'A photo that matters to me' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit: A photo that matters to me' }))
    await user.type(screen.getByLabelText('Describe this photo'), 'Luna at the beach')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('img', { name: 'Luna at the beach' })).toBeInTheDocument()
    expect(storedPlan(storage).photos[0]!.caption).toBe('Luna at the beach')
  })

  it('does not keep a photo that does not fit in device storage', async () => {
    const user = userEvent.setup()
    fakeJpeg.size = 5_000
    const navigate = vi.fn<(route: Route) => void>()
    const { storage, container } = renderWithStore(<BuilderScreen step={7} navigate={navigate} />, {
      storage: new MemoryStorage(2_000),
    })

    await user.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, new File(['x'], 'big.png', { type: 'image/png' }))

    expect(await screen.findByText("There isn't enough space on this device for that photo.")).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'A photo that matters to me' })).not.toBeInTheDocument()
    expect(readStored<SafetyPlan>(storage, 'msp:plan')?.photos ?? []).toEqual([])
  })

  it('navigates with Back and Next, and finishes on the plan', async () => {
    const user = userEvent.setup()
    const { navigate, unmount } = renderStep(3)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(navigate).toHaveBeenLastCalledWith({ name: 'build', step: 4 })
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(navigate).toHaveBeenLastCalledWith({ name: 'build', step: 2 })
    unmount()

    const last = renderStep(7)
    await user.click(screen.getByRole('button', { name: 'See my plan' }))
    expect(last.navigate).toHaveBeenLastCalledWith({ name: 'plan' })
  })
})
