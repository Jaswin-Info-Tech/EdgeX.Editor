import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ToggleGroup, ToggleGroupItem } from '../app/components/ui/toggle-group'

describe('ToggleGroup', () => {
  it('renders all toggle items', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('Left')).toBeInTheDocument()
    expect(screen.getByText('Center')).toBeInTheDocument()
    expect(screen.getByText('Right')).toBeInTheDocument()
  })

  it('has the toggle-group data-slot attribute', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(document.querySelector('[data-slot="toggle-group"]')).toBeInTheDocument()
  })

  it('defaults data-variant and data-size to undefined when not provided', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    const group = document.querySelector('[data-slot="toggle-group"]')
    expect(group).not.toHaveAttribute('data-variant', 'outline')
  })

  it('applies variant and size to the group element', () => {
    render(
      <ToggleGroup type="single" variant="outline" size="lg">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    const group = document.querySelector('[data-slot="toggle-group"]')
    expect(group).toHaveAttribute('data-variant', 'outline')
    expect(group).toHaveAttribute('data-size', 'lg')
  })

  it('merges custom className with default classes', () => {
    render(
      <ToggleGroup type="single" className="my-custom-group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(document.querySelector('[data-slot="toggle-group"]')).toHaveClass(
      'my-custom-group',
    )
  })
})

describe('ToggleGroupItem', () => {
  it('has the toggle-group-item data-slot attribute', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('A')).toHaveAttribute('data-slot', 'toggle-group-item')
  })

  it('inherits variant and size from the parent ToggleGroup via context', () => {
    render(
      <ToggleGroup type="single" variant="outline" size="sm">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    const item = screen.getByText('A')
    expect(item).toHaveAttribute('data-variant', 'outline')
    expect(item).toHaveAttribute('data-size', 'sm')
  })

  it('falls back to its own variant/size prop when the group provides none', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="solo" variant="outline" size="lg">
          Solo
        </ToggleGroupItem>
      </ToggleGroup>,
    )

    const item = screen.getByText('Solo')
    expect(item).toHaveAttribute('data-variant', 'outline')
    expect(item).toHaveAttribute('data-size', 'lg')
  })

  it('renders as a button element', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('A').tagName.toLowerCase()).toBe('button')
  })

  it('merges custom className with variant classes', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" className="my-custom-item">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('A')).toHaveClass('my-custom-item')
  })
})

describe('ToggleGroup selection behavior (type="single")', () => {
  it('selects an item when clicked and marks it on', async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    )

    const left = screen.getByText('Left')
    await user.click(left)

    expect(left).toHaveAttribute('data-state', 'on')
  })

  it('deselects the previous item when a new one is selected', async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    )

    const left = screen.getByText('Left')
    const right = screen.getByText('Right')

    await user.click(left)
    expect(left).toHaveAttribute('data-state', 'on')

    await user.click(right)
    expect(right).toHaveAttribute('data-state', 'on')
    expect(left).toHaveAttribute('data-state', 'off')
  })

  it('calls onValueChange with the selected value', async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()
    render(
      <ToggleGroup type="single" onValueChange={handleValueChange}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    )

    await user.click(screen.getByText('Right'))

    expect(handleValueChange).toHaveBeenCalledWith('right')
  })

  it('respects a controlled value prop', () => {
    render(
      <ToggleGroup type="single" value="right">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('Right')).toHaveAttribute('data-state', 'on')
    expect(screen.getByText('Left')).toHaveAttribute('data-state', 'off')
  })
})

describe('ToggleGroup selection behavior (type="multiple")', () => {
  it('allows multiple items to be selected simultaneously', async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="multiple">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    )

    const bold = screen.getByText('Bold')
    const italic = screen.getByText('Italic')

    await user.click(bold)
    await user.click(italic)

    expect(bold).toHaveAttribute('data-state', 'on')
    expect(italic).toHaveAttribute('data-state', 'on')
  })

  it('calls onValueChange with an array of selected values', async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()
    render(
      <ToggleGroup type="multiple" onValueChange={handleValueChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    )

    await user.click(screen.getByText('Bold'))
    expect(handleValueChange).toHaveBeenLastCalledWith(['bold'])

    await user.click(screen.getByText('Italic'))
    expect(handleValueChange).toHaveBeenLastCalledWith(['bold', 'italic'])
  })

  it('toggles an item off when clicked again', async () => {
    const user = userEvent.setup()
    render(
      <ToggleGroup type="multiple">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    )

    const bold = screen.getByText('Bold')
    await user.click(bold)
    expect(bold).toHaveAttribute('data-state', 'on')

    await user.click(bold)
    expect(bold).toHaveAttribute('data-state', 'off')
  })
})

describe('ToggleGroup disabled state', () => {
  it('disables the entire group when disabled prop is set on ToggleGroup', () => {
    render(
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByText('A')).toBeDisabled()
    expect(screen.getByText('B')).toBeDisabled()
  })

  it('disables a single item when disabled prop is set on ToggleGroupItem', async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()
    render(
      <ToggleGroup type="single" onValueChange={handleValueChange}>
        <ToggleGroupItem value="a" disabled>
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>,
    )

    const itemA = screen.getByText('A')
    expect(itemA).toBeDisabled()

    await user.click(itemA)
    expect(handleValueChange).not.toHaveBeenCalled()
  })
})