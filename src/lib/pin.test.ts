import { hashPin, isValidPin, verifyPin } from './pin'

// Fewer iterations keep the tests fast; the algorithm is the same.
const ITERATIONS = 1_000

describe('PIN hashing', () => {
  it('accepts exactly four digits', () => {
    expect(isValidPin('0420')).toBe(true)
    for (const bad of ['', '123', '12345', '12a4', ' 1234']) expect(isValidPin(bad)).toBe(false)
  })

  it('never stores the PIN itself', async () => {
    const record = await hashPin('4826', ITERATIONS)
    expect(JSON.stringify(record)).not.toContain('4826')
    expect(record.iterations).toBe(ITERATIONS)
  })

  it('verifies the right PIN and rejects others', async () => {
    const record = await hashPin('4826', ITERATIONS)
    expect(await verifyPin('4826', record)).toBe(true)
    expect(await verifyPin('4827', record)).toBe(false)
    expect(await verifyPin('48261', record)).toBe(false)
  })

  it('uses a random salt, so the same PIN hashes differently each time', async () => {
    const [a, b] = await Promise.all([hashPin('1357', ITERATIONS), hashPin('1357', ITERATIONS)])
    expect(a.salt).not.toBe(b.salt)
    expect(a.hash).not.toBe(b.hash)
  })

  it('refuses to hash an invalid PIN', async () => {
    await expect(hashPin('12')).rejects.toThrow('exactly 4 digits')
  })
})
