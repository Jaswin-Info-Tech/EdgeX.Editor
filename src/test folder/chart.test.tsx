import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from '../app/components/ui/chart'

// Recharts' ResponsiveContainer needs real layout measurements (via
// ResizeObserver) to render its children, which jsdom doesn't provide.
// Replace it with a simple pass-through for these tests.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  }
})

const config = {
  desktop: { label: 'Desktop', color: '#2563eb' },
  mobile: { label: 'Mobile', color: '#60a5fa' },
} satisfies ChartConfig

describe('ChartContainer', () => {
  it('renders its children', () => {
    render(
      <ChartContainer config={config}>
        <div data-testid="chart-child">chart contents</div>
      </ChartContainer>,
    )

    expect(screen.getByTestId('chart-child')).toBeInTheDocument()
  })

  it('sets a data-chart attribute derived from the id prop', () => {
    const { container } = render(
      <ChartContainer id="revenue" config={config}>
        <div>chart contents</div>
      </ChartContainer>,
    )

    expect(container.querySelector('[data-slot="chart"]')).toHaveAttribute(
      'data-chart',
      'chart-revenue',
    )
  })

  it('injects CSS variables for each color in the config', () => {
    const { container } = render(
      <ChartContainer id="revenue" config={config}>
        <div>chart contents</div>
      </ChartContainer>,
    )

    const style = container.querySelector('style')
    expect(style?.innerHTML).toContain('--color-desktop: #2563eb')
    expect(style?.innerHTML).toContain('--color-mobile: #60a5fa')
  })
})

describe('ChartTooltipContent', () => {
  const payload = [
    {
      dataKey: 'desktop',
      name: 'desktop',
      value: 1234,
      color: '#2563eb',
      payload: {},
    },
  ]

  it('renders nothing when inactive', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>,
    )

    expect(container.querySelector('[class*="rounded-lg"]')).not.toBeInTheDocument()
  })

  it('renders the configured label for each payload item when active', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} label="desktop" />
      </ChartContainer>,
    )

    // With indicator="dot" (the default) and a single payload item, the
    // resolved label "Desktop" appears twice: once as the tooltip heading
    // and once as the per-item name next to the value.
    const labelMatches = screen.getAllByText('Desktop')
    expect(labelMatches).toHaveLength(2)
    expect(labelMatches[0]).toHaveClass('font-medium')
    expect(labelMatches[1]).toHaveClass('text-muted-foreground')

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('hides the label when hideLabel is set', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active hideLabel payload={payload} label="desktop" />
      </ChartContainer>,
    )

    // The heading is gone; only the per-item name (not styled with
    // font-medium) remains.
    expect(screen.queryByText('Desktop', { selector: '.font-medium' })).not.toBeInTheDocument()
    expect(screen.getByText('Desktop', { selector: '.text-muted-foreground' })).toBeInTheDocument()
  })

  it('renders a heading plus one row per payload item when there are multiple items', () => {
    const multiPayload = [
      { dataKey: 'desktop', name: 'desktop', value: 1234, color: '#2563eb', payload: {} },
      { dataKey: 'mobile', name: 'mobile', value: 567, color: '#60a5fa', payload: {} },
    ]

    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={multiPayload} label="desktop" />
      </ChartContainer>,
    )

    // "Desktop" appears twice: once as the top heading (font-medium) and
    // once as the desktop row's own item-name span (text-muted-foreground).
    // "Mobile" appears once, as the mobile row's item-name span.
    const desktopMatches = screen.getAllByText('Desktop')
    expect(desktopMatches).toHaveLength(2)
    expect(desktopMatches[0]).toHaveClass('font-medium')
    expect(desktopMatches[1]).toHaveClass('text-muted-foreground')

    expect(screen.getByText('Mobile')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('567')).toBeInTheDocument()
  })
})

describe('ChartLegendContent', () => {
  it('renders no legend row when there is no payload', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>,
    )

    // ChartContainer's own wrapper markup always renders, so assert on the
    // legend's specific layout class rather than the container's first child.
    expect(document.querySelector('.justify-center.gap-4')).not.toBeInTheDocument()
  })

  it('renders a legend entry with the configured label for each payload item', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent
          payload={[
            { value: 'desktop', dataKey: 'desktop', color: '#2563eb' },
            { value: 'mobile', dataKey: 'mobile', color: '#60a5fa' },
          ]}
        />
      </ChartContainer>,
    )

    expect(screen.getByText('Desktop')).toBeInTheDocument()
    expect(screen.getByText('Mobile')).toBeInTheDocument()
  })
})
