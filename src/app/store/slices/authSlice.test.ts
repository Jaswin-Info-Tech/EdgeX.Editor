import { describe, expect, it, beforeEach, vi } from 'vitest'

import authReducer, { setLogin, logout } from './authSlice'

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns the initial state', () => {
    const state = authReducer(undefined, { type: '' })

    expect(state).toEqual({
      user: null,
      token: null,
    })
  })

  it('sets the user and token on login', () => {
    const state = authReducer(
      undefined,
      setLogin({
        user: {
          id: 1,
          name: 'Kavya',
        },
        token: 'test-token',
      })
    )

    expect(state.user).toEqual({
      id: 1,
      name: 'Kavya',
    })
    expect(state.token).toBe('test-token')
  })

  it('clears the user and token on logout', () => {
    const initialState = {
      user: {
        id: 1,
        name: 'Kavya',
      },
      token: 'test-token',
    }

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    const state = authReducer(initialState, logout())

    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(removeItemSpy).toHaveBeenCalledWith('token')
  })

  it('does not change state for an unknown action', () => {
    const initialState = {
      user: {
        id: 1,
        name: 'Kavya',
      },
      token: 'test-token',
    }

    const state = authReducer(initialState, {
      type: 'unknown/action',
    })

    expect(state).toEqual(initialState)
  })

  it('creates the correct setLogin action', () => {
    const action = setLogin({
      user: {
        id: 1,
        name: 'Kavya',
      },
      token: 'test-token',
    })

    expect(action.type).toBe('auth/setLogin')
    expect(action.payload).toEqual({
      user: {
        id: 1,
        name: 'Kavya',
      },
      token: 'test-token',
    })
  })

  it('creates the correct logout action', () => {
    const action = logout()

    expect(action.type).toBe('auth/logout')
  })
})