import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../constants/editor', () => ({
  STATUS_COLOR: {
    pending: 'text-gray-400',
    running: 'text-yellow-500',
    passed: 'text-emerald-500',
    failed: 'text-red-500',
    error: 'text-red-600',
    skipped: 'text-muted-foreground',
  },
  TYPE_STRIPE: {
    sequence: '#3b82f6',
    rf: '#8b5cf6',
  },
}))

import {
  StatusIcon,
  TypeIcon,
  StatusPill,
  PanelHeader,
  ToolBtn,
  Toggle,
} from '../app/components/editor/atoms'

describe('StatusIcon', () => {
  it('renders a pulsing Activity icon for "running" status', () => {
    const { container } = render(<StatusIcon status="running" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('animate-pulse')
  })

  it('renders CheckCircle2 for "passed" status without animate-pulse', () => {
    const { container } = render(<StatusIcon status="passed" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).not.toHaveClass('animate-pulse')
  })

  it('renders XCircle for "failed" status', () => {
    const { container } = render(<StatusIcon status="failed" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders AlertTriangle for "error" status', () => {
    const { container } = render(<StatusIcon status="error" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders Minus for "skipped" status', () => {
    const { container } = render(<StatusIcon status="skipped" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('falls back to a dimmed Clock icon for "pending" (default) status', () => {
    const { container } = render(<StatusIcon status="pending" />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('opacity-30')
  })

  it('applies the default size of 13 when no size prop is given', () => {
    const { container } = render(<StatusIcon status="passed" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '13')
    expect(svg).toHaveAttribute('height', '13')
  })

  it('applies a custom size when provided', () => {
    const { container } = render(<StatusIcon status="passed" size={24} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '24')
    expect(svg).toHaveAttribute('height', '24')
  })

  it('always includes the shrink-0 class regardless of status', () => {
    const { container } = render(<StatusIcon status="running" />)

    expect(container.querySelector('svg')).toHaveClass('shrink-0')
  })
})

describe('TypeIcon', () => {
  it('renders Layers for "sequence" type', () => {
    const { container } = render(<TypeIcon type="sequence" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('is case-insensitive and trims whitespace when matching type', () => {
    const { container: a } = render(<TypeIcon type="  Sequence  " />)
    const { container: b } = render(<TypeIcon type="sequence" />)

    // both should render the same icon (Layers), verified by identical inner svg path structure
    expect(a.querySelector('svg')?.innerHTML).toBe(b.querySelector('svg')?.innerHTML)
  })

  it('falls back to a Clock icon for an unrecognized type', () => {
    const { container } = render(<TypeIcon type="totally-unknown-type" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('falls back to a Clock icon when type is an empty string', () => {
    const { container } = render(<TypeIcon type="" />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies the mapped color from TYPE_STRIPE via inline style', () => {
    const { container } = render(<TypeIcon type="sequence" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ color: '#3b82f6' })
  })

  it('falls back to the default gray color for an unmapped type', () => {
    const { container } = render(<TypeIcon type="unmapped-type" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ color: '#64748b' })
  })

  it('applies a custom size when provided', () => {
    const { container } = render(<TypeIcon type="rf" size={30} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveAttribute('height', '30')
  })

  it('renders the same icon for "hw" and "dut" (both map to Cpu)', () => {
    const { container: hw } = render(<TypeIcon type="hw" />)
    const { container: dut } = render(<TypeIcon type="dut" />)

    expect(hw.querySelector('svg')?.innerHTML).toBe(dut.querySelector('svg')?.innerHTML)
  })

  it('renders the same icon for "sequence" and "all" (both map to Layers)', () => {
    const { container: seq } = render(<TypeIcon type="sequence" />)
    const { container: all } = render(<TypeIcon type="all" />)

    expect(seq.querySelector('svg')?.innerHTML).toBe(all.querySelector('svg')?.innerHTML)
  })
})

describe('StatusPill', () => {
  it('renders the status text in uppercase styling', () => {
    render(<StatusPill status="passed" />)

    expect(screen.getByText('passed')).toBeInTheDocument()
  })

  it('applies the passed-specific classes', () => {
    render(<StatusPill status="passed" />)

    expect(screen.getByText('passed')).toHaveClass('bg-emerald-500/20', 'text-emerald-500')
  })

  it('applies the failed-specific classes', () => {
    render(<StatusPill status="failed" />)

    expect(screen.getByText('failed')).toHaveClass('bg-red-500/20', 'text-red-500')
  })

  it('applies the same classes to pending and skipped (both muted)', () => {
    render(<StatusPill status="pending" />)
    const pending = screen.getByText('pending')

    render(<StatusPill status="skipped" />)
    const skipped = screen.getByText('skipped')

    expect(pending.className).toBe(skipped.className)
  })

  it('renders as a span element', () => {
    render(<StatusPill status="running" />)

    expect(screen.getByText('running').tagName.toLowerCase()).toBe('span')
  })
})

describe('PanelHeader', () => {
  it('renders the icon and label', () => {
    render(<PanelHeader icon={<span data-testid="icon">*</span>} label="Test Results" />)

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('Test Results')).toBeInTheDocument()
  })

  it('does not render the trailing children wrapper when no children are passed', () => {
    const { container } = render(
      <PanelHeader icon={<span>*</span>} label="No Children" />,
    )

    expect(container.querySelector('.ml-auto')).not.toBeInTheDocument()
  })

  it('renders children in a trailing wrapper when provided', () => {
    render(
      <PanelHeader icon={<span>*</span>} label="With Children">
        <button>Action</button>
      </PanelHeader>,
    )

    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Action').closest('.ml-auto')).toBeInTheDocument()
  })

  it('renders the label in uppercase tracking-widest styling', () => {
    render(<PanelHeader icon={<span>*</span>} label="styled label" />)

    expect(screen.getByText('styled label')).toHaveClass('uppercase', 'tracking-widest')
  })
})

describe('ToolBtn', () => {
  it('renders its children and title', () => {
    render(<ToolBtn title="Run test">Run</ToolBtn>)

    const button = screen.getByRole('button', { name: 'Run' })
    expect(button).toHaveAttribute('title', 'Run test')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<ToolBtn onClick={handleClick}>Click me</ToolBtn>)

    await user.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<ToolBtn disabled>Disabled</ToolBtn>)

    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <ToolBtn disabled onClick={handleClick}>
        Disabled
      </ToolBtn>,
    )

    await user.click(screen.getByText('Disabled'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies the "run" variant styling', () => {
    render(<ToolBtn variant="run">Run</ToolBtn>)

    expect(screen.getByText('Run')).toHaveClass('bg-emerald-500/15', 'text-emerald-500')
  })

  it('applies the "danger" variant styling', () => {
    render(<ToolBtn variant="danger">Delete</ToolBtn>)

    expect(screen.getByText('Delete')).toHaveClass('text-red-500')
  })

  it('applies active styling when active is true and variant is default (ghost)', () => {
    render(<ToolBtn active>Active</ToolBtn>)

    expect(screen.getByText('Active')).toHaveClass('bg-primary/10', 'text-primary')
  })

  it('applies default ghost styling when neither active nor a special variant is set', () => {
    render(<ToolBtn>Default</ToolBtn>)

    expect(screen.getByText('Default')).toHaveClass('text-muted-foreground')
  })
})

describe('Toggle', () => {
  it('renders in the off position when value is false', () => {
    render(<Toggle value={false} onChange={() => { }} />)

    expect(screen.getByRole('button')).toHaveClass('bg-muted', 'border-border')
  })

  it('renders in the on position when value is true', () => {
    render(<Toggle value={true} onChange={() => { }} />)

    expect(screen.getByRole('button')).toHaveClass('bg-primary', 'border-primary')
  })

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Toggle value={false} onChange={handleChange} />)

    await user.click(screen.getByRole('button'))

    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('positions the knob on the left when off', () => {
    const { container } = render(<Toggle value={false} onChange={() => { }} />)

    const knob = container.querySelector('span')
    expect(knob).toHaveClass('left-0.5')
  })

  it('positions the knob on the right when on', () => {
    const { container } = render(<Toggle value={true} onChange={() => { }} />)

    const knob = container.querySelector('span')
    expect(knob).toHaveClass('left-[19px]')
  })
})