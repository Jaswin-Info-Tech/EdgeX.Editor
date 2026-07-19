import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

// Adjust this import path to match where your modals actually live
import {
  NewPlanModal,
  SaveDestinationModal,
  AddStepModal,
  PluginManager,
  ContextMenu,
} from '../app/components/editor/modals'

import type { LibraryItem, Plugin } from '../app/types/editor'

// ─── Test fixtures ─────────────────────────────────────────────────────────

const libraryItems: LibraryItem[] = [
  { id: 'step-1', name: 'Power On DUT', description: 'Applies power to the device under test', type: 'action' } as LibraryItem,
  { id: 'step-2', name: 'Read Voltage', description: 'Reads voltage from the instrument', type: 'measurement' } as LibraryItem,
]

const installedPlugin: Plugin = {
  id: 'plugin-1',
  name: 'Voltage Utils',
  description: 'Utility steps for voltage measurement',
  author: 'Jane Doe',
  version: '1.2.0',
  packageName: 'voltage-utils',
  isInstalled: true,
  steps: [{ id: 's1', name: 'Read Voltage', description: '', category: 'measurement' }],
} as Plugin

const availablePlugin: Plugin = {
  id: 'plugin-2',
  name: 'Thermal Pack',
  description: 'Thermal control steps',
  author: 'John Smith',
  version: '0.9.0',
  packageName: 'thermal-pack',
  isInstalled: false,
  steps: [],
} as Plugin

// ─── NewPlanModal ──────────────────────────────────────────────────────────

describe('NewPlanModal', () => {
  it('renders the modal title', () => {
    render(<NewPlanModal onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByText('New Test Plan')).toBeInTheDocument()
  })

  it('disables Create Plan until a name is entered', async () => {
    const user = userEvent.setup()
    render(<NewPlanModal onClose={vi.fn()} onCreate={vi.fn()} />)

    const createButton = screen.getByRole('button', { name: /create plan/i })
    expect(createButton).toBeDisabled()

    await user.type(screen.getByPlaceholderText(/RF Board Validation/i), 'My Plan')

    expect(createButton).toBeEnabled()
  })

  it('shows a validation error if Create Plan is clicked with no name', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<NewPlanModal onClose={vi.fn()} onCreate={onCreate} />)

    // Button is disabled while name is empty, so directly assert the
    // error path via the field once text is entered then cleared.
    const nameInput = screen.getByPlaceholderText(/RF Board Validation/i)
    await user.type(nameInput, 'x')
    await user.clear(nameInput)

    expect(await screen.findByText(/plan name is required/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onCreate with the entered metadata', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<NewPlanModal onClose={vi.fn()} onCreate={onCreate} />)

    await user.type(screen.getByPlaceholderText(/RF Board Validation/i), 'RF Test Plan')
    await user.type(screen.getByPlaceholderText(/what does this plan verify/i), 'Board bring-up')
    await user.type(screen.getByPlaceholderText(/Engineer name/i), 'Alex')

    await user.click(screen.getByRole('button', { name: /create plan/i }))

    expect(onCreate).toHaveBeenCalledTimes(1)
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RF Test Plan',
        description: 'Board bring-up',
        author: 'Alex',
        version: '1.0.0',
      }),
    )
  })

  it('calls onClose when the close (X) button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NewPlanModal onClose={onClose} onCreate={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '' })) // X icon button has no accessible name
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop, but not when clicking inside the dialog', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NewPlanModal onClose={onClose} onCreate={vi.fn()} />)

    await user.click(screen.getByText('New Test Plan'))
    expect(onClose).not.toHaveBeenCalled()

    // eslint-disable-next-line testing-library/no-node-access
    const backdrop = screen.getByText('New Test Plan').closest('.fixed') as HTMLElement
    await user.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

// ─── SaveDestinationModal ──────────────────────────────────────────────────

describe('SaveDestinationModal', () => {
  it('shows the default path as a placeholder', () => {
    render(
      <SaveDestinationModal defaultPath="/plans/default.json" onCancel={vi.fn()} onSave={vi.fn()} />,
    )

    expect(screen.getByPlaceholderText('/plans/default.json')).toBeInTheDocument()
  })

  it('calls onSave with the typed destination path', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <SaveDestinationModal defaultPath="/plans/default.json" onCancel={vi.fn()} onSave={onSave} />,
    )

    await user.type(screen.getByPlaceholderText('/plans/default.json'), '/plans/custom.json')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSave).toHaveBeenCalledWith('/plans/custom.json')
  })

  it('calls onSave with an empty string when left blank', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <SaveDestinationModal defaultPath="/plans/default.json" onCancel={vi.fn()} onSave={onSave} />,
    )

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSave).toHaveBeenCalledWith('')
  })

  it('calls onCancel when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <SaveDestinationModal defaultPath="/plans/default.json" onCancel={onCancel} onSave={vi.fn()} />,
    )

    await user.click(screen.getByRole('button', { name: '' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ─── AddStepModal ──────────────────────────────────────────────────────────

describe('AddStepModal', () => {
  it('lists all library items by default', () => {
    render(<AddStepModal library={libraryItems} onAdd={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText('Power On DUT')).toBeInTheDocument()
    expect(screen.getByText('Read Voltage')).toBeInTheDocument()
    expect(screen.getByText('2 steps · click to add')).toBeInTheDocument()
  })

  it('filters items as the user types in the search box', async () => {
    const user = userEvent.setup()
    render(<AddStepModal library={libraryItems} onAdd={vi.fn()} onClose={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('Search steps...'), 'voltage')

    expect(screen.queryByText('Power On DUT')).not.toBeInTheDocument()
    expect(screen.getByText('Read Voltage')).toBeInTheDocument()
  })

  it('shows an empty state when no steps match the search', async () => {
    const user = userEvent.setup()
    render(<AddStepModal library={libraryItems} onAdd={vi.fn()} onClose={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('Search steps...'), 'nonexistent-step')

    expect(screen.getByText('No matching steps')).toBeInTheDocument()
  })

  it('calls onAdd with the selected item and then onClose', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(<AddStepModal library={libraryItems} onAdd={onAdd} onClose={onClose} />)

    await user.click(screen.getByText('Power On DUT'))

    expect(onAdd).toHaveBeenCalledWith(libraryItems[0])
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

// ─── PluginManager ─────────────────────────────────────────────────────────

describe('PluginManager', () => {
  const baseProps = {
    plugins: [availablePlugin],
    installedPlugins: [installedPlugin],
    onInstall: vi.fn().mockResolvedValue(undefined),
    onUninstall: vi.fn().mockResolvedValue(undefined),
    onUninstallPackage: vi.fn().mockResolvedValue(undefined),
    onUpload: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
    installedSearch: '',
    setInstalledSearch: vi.fn(),
    browseSearch: '',
    setBrowseSearch: vi.fn(),
  }

  it('shows the Installed tab by default with correct counts', () => {
    render(<PluginManager {...baseProps} />)

    expect(screen.getByRole('button', { name: /installed \(1\/1\)/i })).toBeInTheDocument()
    expect(screen.getByText('Voltage Utils')).toBeInTheDocument()
  })

  it('switches to the Available tab and lists uninstalled plugins', async () => {
    const user = userEvent.setup()
    render(<PluginManager {...baseProps} />)

    await user.click(screen.getByRole('button', { name: /available \(1\/1\)/i }))

    expect(screen.getByText('Thermal Pack')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^install$/i })).toBeInTheDocument()
  })

  it('calls onInstall with the plugin id when Install is clicked', async () => {
    const user = userEvent.setup()
    const onInstall = vi.fn().mockResolvedValue(undefined)
    render(<PluginManager {...baseProps} onInstall={onInstall} />)

    await user.click(screen.getByRole('button', { name: /available \(1\/1\)/i }))
    await user.click(screen.getByRole('button', { name: /^install$/i }))

    expect(onInstall).toHaveBeenCalledWith('plugin-2')
  })

  it('calls onUninstall with the plugin id when Remove is clicked on an installed plugin', async () => {
    const user = userEvent.setup()
    const onUninstall = vi.fn().mockResolvedValue(undefined)
    render(<PluginManager {...baseProps} onUninstall={onUninstall} />)

    await user.click(screen.getByRole('button', { name: /remove/i }))

    expect(onUninstall).toHaveBeenCalledWith('plugin-1')
  })

  it('shows a loading state for the Installed tab', () => {
    render(<PluginManager {...baseProps} isInstalledLoading />)

    expect(screen.getByText(/loading installed plugins/i)).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PluginManager {...baseProps} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('lets the user select and upload a file on the Upload tab', async () => {
    const user = userEvent.setup()
    const onUpload = vi.fn().mockResolvedValue(undefined)
    render(<PluginManager {...baseProps} onUpload={onUpload} />)

    await user.click(screen.getByRole('button', { name: /^upload$/i }))

    const file = new File(['dummy'], 'plugin.zip', { type: 'application/zip' })
    // eslint-disable-next-line testing-library/no-node-access
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByRole('button', { name: /upload package/i }))

    expect(onUpload).toHaveBeenCalledWith(file)
  })
})

// ─── ContextMenu ───────────────────────────────────────────────────────────

describe('ContextMenu', () => {
  const menu = { x: 100, y: 100, stepId: 'step-1' }

  it('renders the expected action items', () => {
    render(<ContextMenu menu={menu} onAction={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText('Add Step After')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onAction with the action name and stepId, then onClose', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onClose = vi.fn()
    render(<ContextMenu menu={menu} onAction={onAction} onClose={onClose} />)

    await user.click(screen.getByText('Duplicate'))

    expect(onAction).toHaveBeenCalledWith('duplicate', 'step-1')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking outside the menu', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ContextMenu menu={menu} onAction={vi.fn()} onClose={onClose} />)

    // eslint-disable-next-line testing-library/no-node-access
    const overlay = screen.getByText('Delete').closest('.fixed') as HTMLElement
    await user.click(overlay)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
 