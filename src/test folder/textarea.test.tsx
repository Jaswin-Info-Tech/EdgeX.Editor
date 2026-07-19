import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Textarea } from '../app/components/ui/textarea'

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Enter description" />)

    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('renders as a textarea tag', () => {
    render(<Textarea placeholder="Tag check" />)

    const textarea = screen.getByPlaceholderText('Tag check')
    expect(textarea.tagName.toLowerCase()).toBe('textarea')
  })

  it('has the textarea data-slot attribute', () => {
    render(<Textarea placeholder="Slot check" />)

    expect(screen.getByPlaceholderText('Slot check')).toHaveAttribute(
      'data-slot',
      'textarea',
    )
  })

  it('accepts and displays typed multi-line text', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Type here" />)

    const textarea = screen.getByPlaceholderText('Type here')
    await user.type(textarea, 'Line one{enter}Line two')

    expect(textarea).toHaveValue('Line one\nLine two')
  })

  it('calls onChange when text is typed', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Textarea placeholder="Change test" onChange={handleChange} />)

    await user.type(screen.getByPlaceholderText('Change test'), 'abc')

    expect(handleChange).toHaveBeenCalledTimes(3)
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Textarea placeholder="Disabled textarea" disabled />)

    expect(screen.getByPlaceholderText('Disabled textarea')).toBeDisabled()
  })

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Disabled typing" disabled />)

    const textarea = screen.getByPlaceholderText('Disabled typing')
    await user.type(textarea, 'should not appear')

    expect(textarea).toHaveValue('')
  })

  it('respects a controlled value prop', () => {
    render(
      <Textarea
        value="controlled value"
        onChange={() => { }}
        placeholder="Controlled"
      />,
    )

    expect(screen.getByPlaceholderText('Controlled')).toHaveValue(
      'controlled value',
    )
  })

  it('merges custom className with default classes', () => {
    render(<Textarea placeholder="Custom class" className="my-custom-class" />)

    expect(screen.getByPlaceholderText('Custom class')).toHaveClass(
      'my-custom-class',
    )
  })

  it('applies aria-invalid attribute when set', () => {
    render(<Textarea placeholder="Invalid textarea" aria-invalid="true" />)

    expect(screen.getByPlaceholderText('Invalid textarea')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('forwards arbitrary props like name, id, and rows', () => {
    render(
      <Textarea
        placeholder="Named textarea"
        name="bio"
        id="bio-field"
        rows={6}
      />,
    )

    const textarea = screen.getByPlaceholderText('Named textarea')
    expect(textarea).toHaveAttribute('name', 'bio')
    expect(textarea).toHaveAttribute('id', 'bio-field')
    expect(textarea).toHaveAttribute('rows', '6')
  })

  it('calls onFocus and onBlur handlers', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    render(
      <Textarea
        placeholder="Focus test"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />,
    )

    const textarea = screen.getByPlaceholderText('Focus test')
    await user.click(textarea)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('renders as readonly when readOnly prop is set', () => {
    render(
      <Textarea
        placeholder="Readonly textarea"
        readOnly
        value="fixed"
        onChange={() => { }}
      />,
    )

    expect(screen.getByPlaceholderText('Readonly textarea')).toHaveAttribute(
      'readonly',
    )
  })

  it('respects maxLength constraint', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Max length test" maxLength={5} />)

    const textarea = screen.getByPlaceholderText('Max length test')
    await user.type(textarea, 'abcdefgh')

    expect(textarea).toHaveValue('abcde')
  })

  it('renders with an initial defaultValue', () => {
    render(<Textarea placeholder="Default value test" defaultValue="hello" />)

    expect(screen.getByPlaceholderText('Default value test')).toHaveValue(
      'hello',
    )
  })
})