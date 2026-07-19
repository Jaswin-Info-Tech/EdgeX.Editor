import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '../app/components/ui/navigation-menu'

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

function BasicNavMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="/analytics">Analytics</NavigationMenuLink>
            <NavigationMenuLink href="/dashboards">Dashboards</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

describe('NavigationMenu', () => {
  it('renders the top-level trigger and direct link', () => {
    render(<BasicNavMenu />)

    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
  })

  it('has the navigation-menu data-slot attribute', () => {
    render(<BasicNavMenu />)

    expect(
      document.querySelector('[data-slot="navigation-menu"]'),
    ).toBeInTheDocument()
  })

  it('defaults data-viewport to true', () => {
    render(<BasicNavMenu />)

    expect(document.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'true',
    )
  })

  it('sets data-viewport to false when viewport prop is false', () => {
    render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/home">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    expect(document.querySelector('[data-slot="navigation-menu"]')).toHaveAttribute(
      'data-viewport',
      'false',
    )
  })

  it('does not render the viewport wrapper when viewport is false, even with a menu open', async () => {
    const user = userEvent.setup()
    render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>More</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/x">X</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    await user.click(screen.getByText('More'))
    await screen.findByText('X')

    expect(
      document.querySelector('[data-slot="navigation-menu-viewport"]'),
    ).not.toBeInTheDocument()
  })

  it('renders the viewport wrapper when viewport is true (default) and a menu is open', async () => {
    const user = userEvent.setup()
    render(<BasicNavMenu />)

    await user.click(screen.getByText('Products'))
    await screen.findByText('Analytics')

    expect(
      document.querySelector('[data-slot="navigation-menu-viewport"]'),
    ).toBeInTheDocument()
  })

  it('does not show content before the trigger is activated', () => {
    render(<BasicNavMenu />)

    expect(screen.queryByText('Analytics')).not.toBeInTheDocument()
  })

  it('opens the content when the trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<BasicNavMenu />)

    await user.click(screen.getByText('Products'))

    expect(await screen.findByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Dashboards')).toBeInTheDocument()
  })

  it('sets data-state to open on the trigger when its content is open', async () => {
    const user = userEvent.setup()
    render(<BasicNavMenu />)

    const trigger = screen.getByText('Products')
    await user.click(trigger)

    expect(trigger.closest('[data-slot="navigation-menu-trigger"]')).toHaveAttribute(
      'data-state',
      'open',
    )
  })

  it('closes the content when the trigger is clicked again', async () => {
    const user = userEvent.setup()
    render(<BasicNavMenu />)

    const trigger = screen.getByText('Products')
    await user.click(trigger)
    expect(await screen.findByText('Analytics')).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.queryByText('Analytics')).not.toBeInTheDocument()
  })
})

describe('NavigationMenuTrigger', () => {
  it('has the navigation-menu-trigger data-slot attribute', () => {
    render(<BasicNavMenu />)

    const trigger = screen.getByText('Products')
    expect(trigger.closest('[data-slot="navigation-menu-trigger"]')).toBeInTheDocument()
  })

  it('renders a chevron icon inside the trigger', () => {
    render(<BasicNavMenu />)

    const trigger = screen.getByText('Products').closest('button')
    expect(trigger?.querySelector('svg')).toBeInTheDocument()
  })
})

describe('NavigationMenuLink', () => {
  it('renders as an anchor with the correct href', () => {
    render(<BasicNavMenu />)

    const link = screen.getByText('Pricing')
    expect(link.closest('a')).toHaveAttribute('href', '/pricing')
  })

  it('has the navigation-menu-link data-slot attribute', () => {
    render(<BasicNavMenu />)

    const link = screen.getByText('Pricing')
    expect(link.closest('[data-slot="navigation-menu-link"]')).toBeInTheDocument()
  })

  it('reflects an active state via data-active', () => {
    render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/current" data-active="true">
              Current Page
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    expect(screen.getByText('Current Page').closest('a')).toHaveAttribute(
      'data-active',
      'true',
    )
  })
})

describe('navigationMenuTriggerStyle', () => {
  it('returns a non-empty class string', () => {
    const classes = navigationMenuTriggerStyle()

    expect(typeof classes).toBe('string')
    expect(classes.length).toBeGreaterThan(0)
  })

  it('includes expected base utility classes', () => {
    const classes = navigationMenuTriggerStyle()

    expect(classes).toContain('inline-flex')
    expect(classes).toContain('rounded-md')
  })
})

describe('NavigationMenuContent', () => {
  it('merges custom className with default classes', async () => {
    const user = userEvent.setup()
    render(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>More</NavigationMenuTrigger>
            <NavigationMenuContent className="my-custom-content">
              <NavigationMenuLink href="/x">X</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    )

    await user.click(screen.getByText('More'))
    const content = (await screen.findByText('X')).closest(
      '[data-slot="navigation-menu-content"]',
    )

    expect(content).toHaveClass('my-custom-content')
  })
})