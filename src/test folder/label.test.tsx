import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Label } from '../app/components/ui/label'

describe('Label', () => {
  it('renders its text content', () => {
    render(<Label>Username</Label>)

    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('renders as a label element', () => {
    render(<Label>Email address</Label>)

    const label = screen.getByText('Email address')
    expect(label.tagName.toLowerCase()).toBe('label')
  })

  it('has the label data-slot attribute', () => {
    render(<Label>Slot check</Label>)

    expect(screen.getByText('Slot check')).toHaveAttribute('data-slot', 'label')
  })

  it('merges custom className with default classes', () => {
    render(<Label className="my-custom-class">Styled label</Label>)

    expect(screen.getByText('Styled label')).toHaveClass('my-custom-class')
  })

  it('associates with a form control via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email-input">Email</Label>
        <input id="email-input" />
      </>,
    )

    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'email-input')
  })

  it('focuses the associated input when clicked', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Label htmlFor="name-input">Name</Label>
        <input id="name-input" />
      </>,
    )

    await user.click(screen.getByText('Name'))

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('wraps a nested input and still triggers focus on click', async () => {
    const user = userEvent.setup()
    render(
      <Label>
        Wrapped field
        <input aria-label="wrapped-input" />
      </Label>,
    )

    await user.click(screen.getByText('Wrapped field'))

    expect(screen.getByLabelText('wrapped-input')).toHaveFocus()
  })

  it('forwards arbitrary props such as id and data attributes', () => {
    render(
      <Label id="custom-label" data-testid="custom-label-test">
        Custom props
      </Label>,
    )

    const label = screen.getByTestId('custom-label-test')
    expect(label).toHaveAttribute('id', 'custom-label')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Label onClick={handleClick}>Clickable label</Label>)

    await user.click(screen.getByText('Clickable label'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders children other than plain text, e.g. an icon and text together', () => {
    render(
      <Label>
        <span data-testid="icon">*</span>
        Required field
      </Label>,
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })
})