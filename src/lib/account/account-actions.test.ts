import { describe, expect, it } from 'vitest'
import { isDeleteConfirmed } from './confirm'
import { deleteAccount, resetProgress } from './account'

describe('isDeleteConfirmed', () => {
  it('confirms only when the input is exactly DELETE', () => {
    expect(isDeleteConfirmed('DELETE')).toBe(true)
    expect(isDeleteConfirmed('delete')).toBe(false)
    expect(isDeleteConfirmed('Delete')).toBe(false)
    expect(isDeleteConfirmed(' DELETE ')).toBe(false)
    expect(isDeleteConfirmed('')).toBe(false)
  })
})

describe('account actions when Supabase is unconfigured or signed out', () => {
  it('resetProgress returns ok: false', async () => {
    const res = await resetProgress()
    expect(res).toEqual({ ok: false })
  })

  it('deleteAccount returns ok: false', async () => {
    const res = await deleteAccount()
    expect(res).toEqual({ ok: false })
  })
})
