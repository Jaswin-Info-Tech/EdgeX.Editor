import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from '../app/components/ui/badge'

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>New</Badge>)

    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies the default variant classes', () => {
    render(<Badge>Default</Badge>)

    expect(screen.getByText('Default')).toHaveClass('bg-primary')
  })

  it('applies the secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary</Badge>)

    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary')
  })

  it('applies the destructive variant classes', () => {
    render(<Badge variant="destructive">Destructive</Badge>)

    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive')
  })

  it('applies the outline variant classes', () => {
    render(<Badge variant="outline">Outline</Badge>)

    expect(screen.getByText('Outline')).toHaveClass('text-foreground')
  })

  it('merges custom className with variant classes', () => {
    render(<Badge className="custom-class">Custom</Badge>)

    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })

  it('renders as a child element when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>,
    )

    const link = screen.getByRole('link', { name: 'Link Badge' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('has the correct data-slot attribute', () => {
    render(<Badge>Slot Test</Badge>)

    expect(screen.getByText('Slot Test')).toHaveAttribute('data-slot', 'badge')
  })
})