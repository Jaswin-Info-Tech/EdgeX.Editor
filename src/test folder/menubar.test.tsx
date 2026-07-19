import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '../app/components/ui/menubar'

// Radix's Menubar (like its other menu-based primitives) relies on
// pointer capture, scrollIntoView, and matchMedia APIs that jsdom
// doesn't implement. Without these, opening/interacting with menus
// throws or silently stalls.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() { }
      unobserve() { }
      disconnect() { }
    },
  )

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
})

function BasicMenubar({ onSelect }: { onSelect?: () => void } = {}) {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onSelect={onSelect}>
            New Tab
            <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>Print</MenubarItem>
          <MenubarSeparator />
          <MenubarLabel>Recent</MenubarLabel>
          <MenubarItem>report.docx</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Cut</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

describe('Menubar', () => {
  it('renders all top-level triggers', () => {
    render(<BasicMenubar />)

    expect(screen.getByText('File')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('has the menubar data-slot attribute', () => {
    render(<BasicMenubar />)

    expect(document.querySelector('[data-slot="menubar"]')).toBeInTheDocument()
  })

  it('does not show menu content before the trigger is clicked', () => {
    render(<BasicMenubar />)

    expect(screen.queryByText('New Tab')).not.toBeInTheDocument()
  })

  it('opens the menu content when its trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    await user.click(screen.getByText('File'))

    expect(await screen.findByText('New Tab')).toBeInTheDocument()
    expect(screen.getByText('report.docx')).toBeInTheDocument()
  })

  it('sets data-state to open on the trigger when opened', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    const trigger = screen.getByText('File')
    await user.click(trigger)

    expect(trigger).toHaveAttribute('data-state', 'open')
  })

  it('calls onSelect when a menu item is chosen', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<BasicMenubar onSelect={handleSelect} />)

    await user.click(screen.getByText('File'))
    await user.click(await screen.findByText('New Tab'))

    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('does not trigger onSelect for a disabled item', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled onSelect={handleSelect}>
              Print
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    await user.click(screen.getByText('File'))
    const printItem = await screen.findByText('Print')
    expect(printItem.closest('[data-slot="menubar-item"]')).toHaveAttribute(
      'data-disabled',
      '',
    )

    await user.click(printItem)
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('renders a shortcut with the shortcut data-slot', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    await user.click(screen.getByText('File'))

    const shortcut = await screen.findByText('⌘T')
    expect(shortcut).toHaveAttribute('data-slot', 'menubar-shortcut')
  })

  it('renders a menubar label', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    await user.click(screen.getByText('File'))

    const label = await screen.findByText('Recent')
    expect(label).toHaveAttribute('data-slot', 'menubar-label')
  })

  it('switches to a sibling menu on hover after one is open', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    await user.click(screen.getByText('File'))
    expect(await screen.findByText('New Tab')).toBeInTheDocument()

    await user.hover(screen.getByText('Edit'))

    expect(await screen.findByText('Cut')).toBeInTheDocument()
    expect(screen.queryByText('New Tab')).not.toBeInTheDocument()
  })
})

describe('MenubarCheckboxItem', () => {
  it('renders and reflects the checked state', async () => {
    const user = userEvent.setup()
    const handleCheckedChange = vi.fn()

    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              checked={false}
              onCheckedChange={handleCheckedChange}
            >
              Show Toolbar
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    await user.click(screen.getByText('View'))

    const item = await screen.findByText(
      'Show Toolbar',
      {},
      { timeout: 3000 },
    )

    const checkboxItem = item.closest('[role="menuitemcheckbox"]')
    expect(checkboxItem).toHaveAttribute('aria-checked', 'false')

    await user.click(item)
    expect(handleCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe('MenubarRadioGroup / MenubarRadioItem', () => {
  it('selects a radio item and reports the change', async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()

    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Zoom</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value="100" onValueChange={handleValueChange}>
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="150">150%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    await user.click(screen.getByText('Zoom'))
    const option150 = await screen.findByText('150%')

    await user.click(option150)

    expect(handleValueChange).toHaveBeenCalledWith('150')
  })

  it('marks the active radio item as checked', async () => {
    const user = userEvent.setup()

    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Zoom</MenubarTrigger>
          <MenubarContent>
            <MenubarRadioGroup value="100">
              <MenubarRadioItem value="100">100%</MenubarRadioItem>
              <MenubarRadioItem value="150">150%</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    await user.click(screen.getByText('Zoom'))

    const active = (await screen.findByText('100%')).closest(
      '[role="menuitemradio"]',
    )
    const inactive = screen.getByText('150%').closest('[role="menuitemradio"]')

    expect(active).toHaveAttribute('aria-checked', 'true')
    expect(inactive).toHaveAttribute('aria-checked', 'false')
  })
})

describe('MenubarSub', () => {
  it('opens a submenu when its trigger is interacted with', async () => {
    const user = userEvent.setup()

    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    )

    await user.click(screen.getByText('File'))
    const subTrigger = await screen.findByText('Share')

    await user.click(subTrigger)

    expect(await screen.findByText('Email')).toBeInTheDocument()
  })
})

describe('MenubarSeparator', () => {
  it('renders with the separator data-slot', async () => {
    const user = userEvent.setup()
    render(<BasicMenubar />)

    await user.click(screen.getByText('File'))

    expect(
      document.querySelector('[data-slot="menubar-separator"]'),
    ).toBeInTheDocument()
  })
})