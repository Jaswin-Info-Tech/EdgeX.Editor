import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Splitter, useDragResize } from '../app/components/editor/resizable'

function TestHook({
  dir,
  onDelta,
}: {
  dir: 'h' | 'v'
  onDelta: (d: number) => void
}) {
  const drag = useDragResize(dir, onDelta)

  return (
    <div
      data-testid="drag-target"
      onMouseDown={drag}
    >
      Drag
    </div>
  )
}

describe('useDragResize', () => {
  it('calls onDelta for horizontal dragging', () => {
    const handleDelta = vi.fn()

    render(<TestHook dir="h" onDelta={handleDelta} />)

    fireEvent.mouseDown(screen.getByTestId('drag-target'), {
      clientX: 100,
    })

    fireEvent.mouseMove(document, {
      clientX: 130,
    })

    expect(handleDelta).toHaveBeenCalledWith(30)
  })

  it('calls onDelta for vertical dragging', () => {
    const handleDelta = vi.fn()

    render(<TestHook dir="v" onDelta={handleDelta} />)

    fireEvent.mouseDown(screen.getByTestId('drag-target'), {
      clientY: 50,
    })

    fireEvent.mouseMove(document, {
      clientY: 90,
    })

    expect(handleDelta).toHaveBeenCalledWith(40)
  })

  it('stops listening after mouseup', () => {
    const handleDelta = vi.fn()

    render(<TestHook dir="h" onDelta={handleDelta} />)

    fireEvent.mouseDown(screen.getByTestId('drag-target'), {
      clientX: 100,
    })

    fireEvent.mouseUp(document)

    fireEvent.mouseMove(document, {
      clientX: 150,
    })

    expect(handleDelta).not.toHaveBeenCalled()
  })
})

describe('Splitter', () => {
  it('renders horizontal splitter', () => {
    render(
      <Splitter
        dir="h"
        onMouseDown={vi.fn()}
      />
    )

    expect(document.querySelector('.cursor-col-resize')).toBeInTheDocument()
  })

  it('renders vertical splitter', () => {
    render(
      <Splitter
        dir="v"
        onMouseDown={vi.fn()}
      />
    )

    expect(document.querySelector('.cursor-row-resize')).toBeInTheDocument()
  })

  it('calls onMouseDown', async () => {
    const user = userEvent.setup()
    const handleMouseDown = vi.fn()

    render(
      <Splitter
        dir="h"
        onMouseDown={handleMouseDown}
      />
    )

    await user.pointer([
      {
        target: document.querySelector('.cursor-col-resize')!,
        keys: '[MouseLeft]',
      },
    ])

    expect(handleMouseDown).toHaveBeenCalledTimes(1)
  })

  it('renders action button', () => {
    render(
      <Splitter
        dir="h"
        onMouseDown={vi.fn()}
        actionButton={<button>Action</button>}
      />
    )

    expect(
      screen.getByRole('button', {
        name: 'Action',
      })
    ).toBeInTheDocument()
  })

  it('does not call splitter onMouseDown when action button is pressed', () => {
    const handleMouseDown = vi.fn()

    render(
      <Splitter
        dir="h"
        onMouseDown={handleMouseDown}
        actionButton={<button>Action</button>}
      />
    )

    fireEvent.mouseDown(screen.getByRole('button'))

    expect(handleMouseDown).not.toHaveBeenCalled()
  })

  it('changes to hot state while dragging', () => {
    render(
      <Splitter
        dir="h"
        onMouseDown={vi.fn()}
      />
    )

    const splitter = document.querySelector('.cursor-col-resize')!

    fireEvent.mouseDown(splitter)

    expect(splitter.className).toContain('bg-primary/60')
  })

  it('returns to normal state after mouseup', () => {
    render(
      <Splitter
        dir="h"
        onMouseDown={vi.fn()}
      />
    )

    const splitter = document.querySelector('.cursor-col-resize')!

    fireEvent.mouseDown(splitter)
    fireEvent.mouseUp(document)

    expect(splitter.className).toContain('bg-border')
  })

  it('renders three grip lines', () => {
    const { container } = render(
      <Splitter
        dir="h"
        onMouseDown={vi.fn()}
      />
    )

    expect(container.querySelectorAll('.bg-foreground\\/20')).toHaveLength(3)
  })
})