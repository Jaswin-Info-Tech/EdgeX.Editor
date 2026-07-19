import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../app/components/ui/card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Card content</Card>)

    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<Card>Content</Card>)

    expect(screen.getByText('Content')).toHaveAttribute('data-slot', 'card')
  })

  it('merges custom className with default classes', () => {
    render(<Card className="custom-card">Content</Card>)

    const card = screen.getByText('Content')
    expect(card).toHaveClass('custom-card')
    expect(card).toHaveClass('rounded-xl')
  })

  it('forwards additional props to the underlying div', () => {
    render(<Card data-testid="my-card">Content</Card>)

    expect(screen.getByTestId('my-card')).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('renders its children', () => {
    render(<CardHeader>Header content</CardHeader>)

    expect(screen.getByText('Header content')).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<CardHeader>Header</CardHeader>)

    expect(screen.getByText('Header')).toHaveAttribute('data-slot', 'card-header')
  })

  it('merges custom className with default classes', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>)

    expect(screen.getByText('Header')).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('renders its children', () => {
    render(<CardTitle>My Title</CardTitle>)

    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders as an h4 element', () => {
    render(<CardTitle>My Title</CardTitle>)

    expect(screen.getByRole('heading', { level: 4, name: 'My Title' })).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<CardTitle>My Title</CardTitle>)

    expect(screen.getByText('My Title')).toHaveAttribute('data-slot', 'card-title')
  })

  it('merges custom className with default classes', () => {
    render(<CardTitle className="custom-title">My Title</CardTitle>)

    const title = screen.getByText('My Title')
    expect(title).toHaveClass('custom-title')
    expect(title).toHaveClass('leading-none')
  })
})

describe('CardDescription', () => {
  it('renders its children', () => {
    render(<CardDescription>Desc text</CardDescription>)

    expect(screen.getByText('Desc text')).toBeInTheDocument()
  })

  it('renders as a paragraph element', () => {
    const { container } = render(<CardDescription>Desc text</CardDescription>)

    expect(container.querySelector('p')).toHaveTextContent('Desc text')
  })

  it('has the correct data-slot attribute', () => {
    render(<CardDescription>Desc text</CardDescription>)

    expect(screen.getByText('Desc text')).toHaveAttribute(
      'data-slot',
      'card-description',
    )
  })

  it('merges custom className with default classes', () => {
    render(<CardDescription className="custom-desc">Desc text</CardDescription>)

    const desc = screen.getByText('Desc text')
    expect(desc).toHaveClass('custom-desc')
    expect(desc).toHaveClass('text-muted-foreground')
  })
})

describe('CardAction', () => {
  it('renders its children', () => {
    render(
      <CardAction>
        <button type="button">Action</button>
      </CardAction>,
    )

    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<CardAction>Action content</CardAction>)

    expect(screen.getByText('Action content')).toHaveAttribute(
      'data-slot',
      'card-action',
    )
  })

  it('merges custom className with default classes', () => {
    render(<CardAction className="custom-action">Action content</CardAction>)

    expect(screen.getByText('Action content')).toHaveClass('custom-action')
  })
})

describe('CardContent', () => {
  it('renders its children', () => {
    render(<CardContent>Body content</CardContent>)

    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<CardContent>Body content</CardContent>)

    expect(screen.getByText('Body content')).toHaveAttribute(
      'data-slot',
      'card-content',
    )
  })

  it('merges custom className with default classes', () => {
    render(<CardContent className="custom-content">Body content</CardContent>)

    expect(screen.getByText('Body content')).toHaveClass('custom-content')
  })
})

describe('CardFooter', () => {
  it('renders its children', () => {
    render(<CardFooter>Footer content</CardFooter>)

    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('has the correct data-slot attribute', () => {
    render(<CardFooter>Footer content</CardFooter>)

    expect(screen.getByText('Footer content')).toHaveAttribute(
      'data-slot',
      'card-footer',
    )
  })

  it('merges custom className with default classes', () => {
    render(<CardFooter className="custom-footer">Footer content</CardFooter>)

    expect(screen.getByText('Footer content')).toHaveClass('custom-footer')
  })
})

describe('Card composition', () => {
  it('renders a fully composed card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>
            <button type="button">Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    )

    expect(screen.getByRole('heading', { level: 4, name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })
})