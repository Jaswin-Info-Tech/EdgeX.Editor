import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Toggle, toggleVariants } from '../app/components/ui/toggle'

describe('Toggle', () => {
  it('renders its content', () => {
    render(<Toggle>Bold</Toggle>)

    expect(screen.getByText('Bold')).toBeInTheDocument()
  })

  it('renders as a button element', () => {
    render(<Toggle>Italic</Toggle>)

    expect(screen.getByText('Italic').tagName.toLowerCase()).toBe('button')
  })

  it('has the toggle data-slot attribute', () => {
    render(<Toggle>Slot check</Toggle>)

    expect(screen.getByText('Slot check')).toHaveAttribute('data-slot', 'toggle')
  })

  it('is unpressed by default', () => {
    render(<Toggle>Underline</Toggle>)

    const toggle = screen.getByText('Underline')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('toggles pressed state when clicked', async () => {
    const user = userEvent.setup()
    render(<Toggle>Bold</Toggle>)

    const toggle = screen.getByText('Bold')
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveAttribute('data-state', 'on')
  })

  it('toggles back to unpressed on a second click', async () => {
    const user = userEvent.setup()
    render(<Toggle>Bold</Toggle>)

    const toggle = screen.getByText('Bold')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('data-state', 'on')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('calls onPressedChange when toggled', async () => {
    const user = userEvent.setup()
    const handlePressedChange = vi.fn()
    render(<Toggle onPressedChange={handlePressedChange}>Bold</Toggle>)

    await user.click(screen.getByText('Bold'))

    expect(handlePressedChange).toHaveBeenCalledWith(true)
  })

  it('respects a controlled pressed prop', () => {
    render(
      <Toggle pressed onPressedChange={() => { }}>
        Controlled
      </Toggle>,
    )

    expect(screen.getByText('Controlled')).toHaveAttribute('data-state', 'on')
  })

  it('does not change state on click when controlled and handler ignores it', async () => {
    const user = userEvent.setup()
    render(
      <Toggle pressed={false} onPressedChange={() => { }}>
        Locked
      </Toggle>,
    )

    const toggle = screen.getByText('Locked')
    await user.click(toggle)

    // stays "off" because the parent never updated the controlled `pressed` prop
    expect(toggle).toHaveAttribute('data-state', 'off')
  })

  it('defaults to pressed via defaultPressed prop', () => {
    render(<Toggle defaultPressed>Starts On</Toggle>)

    expect(screen.getByText('Starts On')).toHaveAttribute('data-state', 'on')
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Toggle disabled>Disabled</Toggle>)

    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup()
    const handlePressedChange = vi.fn()
    render(
      <Toggle disabled onPressedChange={handlePressedChange}>
        Disabled
      </Toggle>,
    )

    await user.click(screen.getByText('Disabled'))

    expect(handlePressedChange).not.toHaveBeenCalled()
  })

  it('merges custom className with default classes', () => {
    render(<Toggle className="my-custom-toggle">Styled</Toggle>)

    expect(screen.getByText('Styled')).toHaveClass('my-custom-toggle')
  })

  it('forwards arbitrary props like aria-label and id', () => {
    render(
      <Toggle aria-label="Toggle bold" id="bold-toggle">
        B
      </Toggle>,
    )

    const toggle = screen.getByRole('button', { name: 'Toggle bold' })
    expect(toggle).toHaveAttribute('id', 'bold-toggle')
  })
})

describe('toggleVariants', () => {
  it('returns default variant and size classes when called with no args', () => {
    const classes = toggleVariants()

    expect(typeof classes).toBe('string')
    expect(classes).toContain('h-9')
  })

  it('returns outline variant classes', () => {
    const classes = toggleVariants({ variant: 'outline' })

    expect(classes).toContain('border')
    expect(classes).toContain('border-input')
  })

  it('returns size-specific classes for sm and lg', () => {
    const small = toggleVariants({ size: 'sm' })
    const large = toggleVariants({ size: 'lg' })

    expect(small).toContain('h-8')
    expect(large).toContain('h-10')
  })
})