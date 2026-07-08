import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Click me</Button>)

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Submit</Button>)

    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)

    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })
})
