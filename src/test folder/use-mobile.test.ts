import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIsMobile } from '../app/components/ui/use-mobile'

const MOBILE_BREAKPOINT = 768

function setInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

function mockMatchMedia() {
  const listeners: Array<() => void> = []

  const mql = {
    matches: false,
    media: '',
    onchange: null,
    addEventListener: vi.fn((event: string, cb: () => void) => {
      if (event === 'change') listeners.push(cb)
    }),
    removeEventListener: vi.fn((event: string, cb: () => void) => {
      const index = listeners.indexOf(cb)
      if (index !== -1) listeners.splice(index, 1)
    }),
    dispatchEvent: vi.fn(),
  }

  window.matchMedia = vi.fn().mockReturnValue(mql)

  return {
    triggerChange: () => {
      act(() => {
        listeners.forEach((cb) => cb())
      })
    },
    getListenerCount: () => listeners.length,
    mql,
  }
}

describe('useIsMobile', () => {
  let originalInnerWidth: number
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    setInnerWidth(originalInnerWidth)
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('returns false when the window is wider than the mobile breakpoint', () => {
    setInnerWidth(1024)
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('returns true when the window is narrower than the mobile breakpoint', () => {
    setInnerWidth(500)
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns false at exactly the breakpoint width (768px is not mobile)', () => {
    setInnerWidth(MOBILE_BREAKPOINT)
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('returns true one pixel below the breakpoint (767px is mobile)', () => {
    setInnerWidth(MOBILE_BREAKPOINT - 1)
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('calls matchMedia with the correct breakpoint query', () => {
    setInnerWidth(1024)
    mockMatchMedia()

    renderHook(() => useIsMobile())

    expect(window.matchMedia).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    )
  })

  it('registers a change listener on the media query list', () => {
    setInnerWidth(1024)
    const { mql } = mockMatchMedia()

    renderHook(() => useIsMobile())

    expect(mql.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })

  it('updates when the window resizes below the breakpoint and a change event fires', () => {
    setInnerWidth(1024)
    const { triggerChange } = mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    setInnerWidth(500)
    triggerChange()

    expect(result.current).toBe(true)
  })

  it('updates when the window resizes above the breakpoint and a change event fires', () => {
    setInnerWidth(500)
    const { triggerChange } = mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    setInnerWidth(1024)
    triggerChange()

    expect(result.current).toBe(false)
  })

  it('removes the change listener on unmount', () => {
    setInnerWidth(1024)
    const { mql } = mockMatchMedia()

    const { unmount } = renderHook(() => useIsMobile())
    const registeredHandler = mql.addEventListener.mock.calls[0][1]

    unmount()

    expect(mql.removeEventListener).toHaveBeenCalledWith('change', registeredHandler)
  })

  it('coerces the initial undefined state to a boolean (false) before the effect runs synchronously in tests', () => {
    setInnerWidth(1024)
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())

    // The hook starts as `undefined` internally but always returns `!!isMobile`,
    // so even before any resize/change event, the return type is a real boolean.
    expect(typeof result.current).toBe('boolean')
  })
})