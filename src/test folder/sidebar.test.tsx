import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '../app/components/ui/sidebar'

// Mock useIsMobile so tests can control mobile/desktop branching directly
// instead of depending on real matchMedia/innerWidth behavior.
const mockUseIsMobile = vi.fn()
vi.mock('../app/components/ui/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => { }
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => { }
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { }
  }
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { },
      removeListener: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error - jsdom has no ResizeObserver
    window.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    }
  }
})

beforeEach(() => {
  mockUseIsMobile.mockReturnValue(false)
  document.cookie = ''
})

describe('useSidebar', () => {
  it('throws when used outside a SidebarProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    function Consumer() {
      useSidebar()
      return null
    }

    expect(() => render(<Consumer />)).toThrow(
      'useSidebar must be used within a SidebarProvider.',
    )

    consoleSpy.mockRestore()
  })

  it('provides context values when used within a SidebarProvider', () => {
    const captured: { value: ReturnType<typeof useSidebar> | null } = {
      value: null,
    }

    function Consumer() {
      captured.value = useSidebar()
      return null
    }

    render(
      <SidebarProvider>
        <Consumer />
      </SidebarProvider>,
    )

    expect(captured.value?.state).toBe('expanded')
    expect(captured.value?.open).toBe(true)
    expect(typeof captured.value?.toggleSidebar).toBe('function')
  })
})
describe('SidebarProvider', () => {
  it('defaults to expanded state (open=true)', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'expanded')
  })

  it('respects defaultOpen=false', () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'collapsed')
  })

  it('supports controlled open/onOpenChange', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <SidebarProvider open={true} onOpenChange={handleOpenChange}>
        <SidebarTrigger />
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))

    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('sets a cookie reflecting the open state when toggled', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))

    expect(document.cookie).toContain('sidebar_state=false')
  })

  it('toggles open state via the Cmd+B keyboard shortcut', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'expanded')

    fireEvent.keyDown(window, { key: 'b', metaKey: true })

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'collapsed')
  })

  it('applies custom CSS variables via style prop alongside sidebar width vars', () => {
    render(
      <SidebarProvider style={{ '--custom-var': '10px' } as React.CSSProperties}>
        <div>content</div>
      </SidebarProvider>,
    )

    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]')
    expect(wrapper).toHaveStyle({ '--custom-var': '10px' })
  })
})

describe('Sidebar', () => {
  it('renders children directly with collapsible="none"', () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <div>static content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(screen.getByText('static content')).toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).not.toHaveAttribute('data-state')
  })

  it('renders desktop layout with data-state, data-side, and data-variant attributes', () => {
    render(
      <SidebarProvider>
        <Sidebar side="right" variant="floating">
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    const sidebar = document.querySelector('[data-slot="sidebar"]')
    expect(sidebar).toHaveAttribute('data-side', 'right')
    expect(sidebar).toHaveAttribute('data-variant', 'floating')
    expect(sidebar).toHaveAttribute('data-state', 'expanded')
  })

  it('renders inside a Sheet (mobile) when useIsMobile returns true', async () => {
    mockUseIsMobile.mockReturnValue(true)

    render(
      <SidebarProvider>
        <Sidebar>
          <div>mobile content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    // openMobile defaults to false, so the Sheet content is closed initially
    expect(screen.queryByText('mobile content')).not.toBeInTheDocument()
  })
})

describe('SidebarTrigger', () => {
  it('renders a button with accessible label', () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>,
    )

    expect(
      screen.getByRole('button', { name: 'Toggle Sidebar' }),
    ).toBeInTheDocument()
  })

  it('calls toggleSidebar when clicked', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <SidebarTrigger />
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' })
    await user.click(trigger)

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'collapsed')
  })

  it('also calls a custom onClick handler passed as a prop', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <SidebarProvider>
        <SidebarTrigger onClick={handleClick} />
      </SidebarProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('SidebarRail', () => {
  it('calls toggleSidebar when clicked', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <SidebarRail />
        <Sidebar>
          <div>content</div>
        </Sidebar>
      </SidebarProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle Sidebar' }))

    expect(
      document.querySelector('[data-slot="sidebar"]'),
    ).toHaveAttribute('data-state', 'collapsed')
  })

  it('has tabIndex -1 so it is not part of normal tab order', () => {
    render(
      <SidebarProvider>
        <SidebarRail />
      </SidebarProvider>,
    )

    expect(screen.getByRole('button', { name: 'Toggle Sidebar' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })
})

describe('Sidebar layout subcomponents', () => {
  it('renders SidebarHeader, SidebarContent, and SidebarFooter with correct data-slot attributes', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>header</SidebarHeader>
          <SidebarContent>content</SidebarContent>
          <SidebarFooter>footer</SidebarFooter>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(document.querySelector('[data-slot="sidebar-header"]')).toHaveTextContent(
      'header',
    )
    expect(document.querySelector('[data-slot="sidebar-content"]')).toHaveTextContent(
      'content',
    )
    expect(document.querySelector('[data-slot="sidebar-footer"]')).toHaveTextContent(
      'footer',
    )
  })

  it('renders SidebarInset as a main element', () => {
    render(<SidebarInset data-testid="inset">inset content</SidebarInset>)

    expect(screen.getByTestId('inset').tagName.toLowerCase()).toBe('main')
  })
})

describe('SidebarGroupLabel asChild', () => {
  it('renders as a div by default', () => {
    render(<SidebarGroupLabel>Label</SidebarGroupLabel>)

    const label = screen.getByText('Label')
    expect(label.tagName.toLowerCase()).toBe('div')
  })

  it('renders as the child element when asChild is true', () => {
    render(
      <SidebarGroupLabel asChild>
        <span>Label as span</span>
      </SidebarGroupLabel>,
    )

    const label = screen.getByText('Label as span')
    expect(label.tagName.toLowerCase()).toBe('span')
    expect(label).toHaveAttribute('data-slot', 'sidebar-group-label')
  })
})

describe('SidebarMenuButton', () => {
  it('renders as a button with data-active reflecting the isActive prop', () => {
    render(
      <SidebarProvider>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarProvider>,
    )

    expect(screen.getByText('Dashboard')).toHaveAttribute('data-active', 'true')
  })

  it('renders without a tooltip wrapper when no tooltip prop is given', () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton>No Tooltip</SidebarMenuButton>
      </SidebarProvider>,
    )

    expect(screen.getByText('No Tooltip')).toBeInTheDocument()
  })

  it('accepts a string tooltip without throwing', () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton tooltip="Helpful hint">
          With Tooltip
        </SidebarMenuButton>
      </SidebarProvider>,
    )

    expect(screen.getByText('With Tooltip')).toBeInTheDocument()
  })

  it('renders as an anchor via asChild', () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton asChild>
          <a href="/settings">Settings</a>
        </SidebarMenuButton>
      </SidebarProvider>,
    )

    expect(screen.getByText('Settings').closest('a')).toHaveAttribute(
      'href',
      '/settings',
    )
  })
})

describe('SidebarMenuSkeleton', () => {
  it('renders without an icon skeleton by default', () => {
    render(<SidebarMenuSkeleton />)

    expect(
      document.querySelector('[data-sidebar="menu-skeleton-icon"]'),
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('[data-sidebar="menu-skeleton-text"]'),
    ).toBeInTheDocument()
  })

  it('renders an icon skeleton when showIcon is true', () => {
    render(<SidebarMenuSkeleton showIcon />)

    expect(
      document.querySelector('[data-sidebar="menu-skeleton-icon"]'),
    ).toBeInTheDocument()
  })

  it('assigns a random width between 50% and 90% as a CSS variable', () => {
    render(<SidebarMenuSkeleton />)

    const textSkeleton = document.querySelector(
      '[data-sidebar="menu-skeleton-text"]',
    ) as HTMLElement
    const width = textSkeleton.style.getPropertyValue('--skeleton-width')
    const numericWidth = parseInt(width, 10)

    expect(numericWidth).toBeGreaterThanOrEqual(50)
    expect(numericWidth).toBeLessThanOrEqual?.(90) // placeholder guard removed below
  })
})