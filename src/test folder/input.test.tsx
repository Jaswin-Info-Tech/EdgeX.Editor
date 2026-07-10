import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Input } from '../app/components/ui/input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />)

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with the correct type attribute', () => {
    render(<Input type="email" placeholder="Email" />)

    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')
  })

  it('defaults to no explicit value when type is not provided', () => {
    render(<Input placeholder="Default" />)

    const input = screen.getByPlaceholderText('Default')
    expect(input).toBeInTheDocument()
    expect(input.getAttribute('type')).toBeNull()
  })

  it('has the input data-slot attribute', () => {
    render(<Input placeholder="Slot check" />)

    expect(screen.getByPlaceholderText('Slot check')).toHaveAttribute(
      'data-slot',
      'input',
    )
  })

  it('accepts and displays typed text', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello world')

    expect(input).toHaveValue('Hello world')
  })

  it('calls onChange when text is typed', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Input placeholder="Change test" onChange={handleChange} />)

    await user.type(screen.getByPlaceholderText('Change test'), 'abc')

    expect(handleChange).toHaveBeenCalledTimes(3)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Input placeholder="Disabled input" disabled />)

    expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled()
  })

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Disabled typing" disabled />)

    const input = screen.getByPlaceholderText('Disabled typing')
    await user.type(input, 'should not appear')

    expect(input).toHaveValue('')
  })

  it('respects a controlled value prop', () => {
    render(<Input value="controlled value" onChange={() => { }} placeholder="Controlled" />)

    expect(screen.getByPlaceholderText('Controlled')).toHaveValue('controlled value')
  })

  it('merges custom className with default classes', () => {
    render(<Input placeholder="Custom class" className="my-custom-class" />)

    expect(screen.getByPlaceholderText('Custom class')).toHaveClass('my-custom-class')
  })

  it('applies aria-invalid styling attribute when aria-invalid is true', () => {
    render(<Input placeholder="Invalid input" aria-invalid="true" />)

    expect(screen.getByPlaceholderText('Invalid input')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('forwards arbitrary props like name and id', () => {
    render(<Input placeholder="Named input" name="username" id="username-field" />)

    const input = screen.getByPlaceholderText('Named input')
    expect(input).toHaveAttribute('name', 'username')
    expect(input).toHaveAttribute('id', 'username-field')
  })

  it('calls onFocus and onBlur handlers', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    render(
      <Input
        placeholder="Focus test"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />,
    )

    const input = screen.getByPlaceholderText('Focus test')
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('supports number type and numeric input', async () => {
    const user = userEvent.setup()
    render(<Input type="number" placeholder="Age" />)

    const input = screen.getByPlaceholderText('Age')
    await user.type(input, '42')

    expect(input).toHaveValue(42)
  })

  it('renders as readonly when readOnly prop is set', () => {
    render(<Input placeholder="Readonly input" readOnly value="fixed" onChange={() => { }} />)

    expect(screen.getByPlaceholderText('Readonly input')).toHaveAttribute('readonly')
  })
})