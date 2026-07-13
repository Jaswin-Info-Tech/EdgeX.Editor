import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ModalsHost } from '../app/components/editor/ModalsHost'

// ---- Mock the modal components so we only test ModalsHost's own logic ----
vi.mock('../app/components/editor/modals', () => ({
    NewPlanModal: ({ onClose, onCreate }: any) => (
        <div>
            <span>new-plan-modal</span>
            <button onClick={onClose}>close-new-plan</button>
            <button onClick={() => onCreate({ name: 'My Plan' })}>create-plan</button>
        </div>
    ),
    AddStepModal: ({ library, onClose, onAdd }: any) => (
        <div>
            <span>add-step-modal</span>
            <span>library-length-{library.length}</span>
            <button onClick={onClose}>close-add-step</button>
            <button onClick={() => onAdd({ id: 'item-1' })}>add-item</button>
        </div>
    ),
    SaveDestinationModal: ({ defaultPath, onCancel, onSave }: any) => (
        <div>
            <span>save-destination-modal</span>
            <span>{defaultPath}</span>
            <button onClick={onCancel}>cancel-save</button>
            <button onClick={() => onSave('/new/path')}>confirm-save</button>
        </div>
    ),
    PluginManager: ({
        plugins,
        installedPlugins,
        onInstall,
        onUninstall,
        onUninstallPackage,
        onUpload,
        onClose,
        installedSearch,
        setInstalledSearch,
        browseSearch,
        setBrowseSearch,
    }: any) => (
        <div>
            <span>plugin-manager</span>
            <span>plugins-{plugins.length}</span>
            <span>installed-{installedPlugins.length}</span>
            <span>installed-search-{installedSearch}</span>
            <span>browse-search-{browseSearch}</span>
            <button onClick={() => onInstall('plugin-1')}>install</button>
            <button onClick={() => onUninstall('plugin-1')}>uninstall</button>
            <button onClick={() => onUninstallPackage('pkg-1')}>uninstall-package</button>
            <button onClick={() => onUpload(new File(['content'], 'plugin.zip'))}>upload</button>
            <button onClick={() => setInstalledSearch('foo')}>set-installed-search</button>
            <button onClick={() => setBrowseSearch('bar')}>set-browse-search</button>
            <button onClick={onClose}>close-plugin-manager</button>
        </div>
    ),
    ContextMenu: ({ menu, onAction, onClose }: any) => (
        <div>
            <span>context-menu-{menu?.label}</span>
            <button onClick={() => onAction('delete', 'step-1')}>context-action</button>
            <button onClick={onClose}>close-context-menu</button>
        </div>
    ),
}))

function buildProps(overrides: Partial<React.ComponentProps<typeof ModalsHost>> = {}) {
    return {
        showNewPlan: false,
        setShowNewPlan: vi.fn(),
        handleCreatePlan: vi.fn(),
        showAddStep: false,
        setShowAddStep: vi.fn(),
        showSaveDestination: false,
        defaultOutputPath: '/default/output',
        handleConfirmSaveDestination: vi.fn(),
        handleCancelSaveDestination: vi.fn(),
        library: [{ id: 'lib-1' }, { id: 'lib-2' }],
        handleAddStep: vi.fn(),
        addStepParentId: null,
        addStepIdx: undefined,
        instruments: [],
        duts: [],
        connections: [],
        showPluginMgr: false,
        setShowPluginMgr: vi.fn(),
        plugins: [{ id: 'plugin-1' }],
        installedPlugins: [{ id: 'plugin-2' }],
        isInstalledLoading: false,
        isAvailableLoading: false,
        handleInstallPlugin: vi.fn(),
        handleUninstallPlugin: vi.fn(),
        handleUninstallPackage: vi.fn(),
        handleUploadPlugin: vi.fn(),
        installedSearch: '',
        setInstalledSearch: vi.fn(),
        browseSearch: '',
        setBrowseSearch: vi.fn(),
        contextMenu: null,
        setContextMenu: vi.fn(),
        handleContextAction: vi.fn(),
        ...overrides,
    }
}

describe('ModalsHost', () => {
    it('renders nothing when all modals are closed', () => {
        render(<ModalsHost {...buildProps()} />)

        expect(screen.queryByText('new-plan-modal')).not.toBeInTheDocument()
        expect(screen.queryByText('add-step-modal')).not.toBeInTheDocument()
        expect(screen.queryByText('save-destination-modal')).not.toBeInTheDocument()
        expect(screen.queryByText('plugin-manager')).not.toBeInTheDocument()
    })

    describe('NewPlanModal', () => {
        it('renders when showNewPlan is true', () => {
            render(<ModalsHost {...buildProps({ showNewPlan: true })} />)

            expect(screen.getByText('new-plan-modal')).toBeInTheDocument()
        })

        it('calls setShowNewPlan(false) when closed', async () => {
            const user = userEvent.setup()
            const setShowNewPlan = vi.fn()
            render(<ModalsHost {...buildProps({ showNewPlan: true, setShowNewPlan })} />)

            await user.click(screen.getByRole('button', { name: 'close-new-plan' }))

            expect(setShowNewPlan).toHaveBeenCalledWith(false)
        })

        it('calls handleCreatePlan with the new plan data', async () => {
            const user = userEvent.setup()
            const handleCreatePlan = vi.fn()
            render(<ModalsHost {...buildProps({ showNewPlan: true, handleCreatePlan })} />)

            await user.click(screen.getByRole('button', { name: 'create-plan' }))

            expect(handleCreatePlan).toHaveBeenCalledTimes(1)
            expect(handleCreatePlan).toHaveBeenCalledWith({ name: 'My Plan' })
        })
    })

    describe('AddStepModal', () => {
        it('renders with the library when showAddStep is true', () => {
            render(<ModalsHost {...buildProps({ showAddStep: true })} />)

            expect(screen.getByText('add-step-modal')).toBeInTheDocument()
            expect(screen.getByText('library-length-2')).toBeInTheDocument()
        })

        it('calls setShowAddStep(false) when closed', async () => {
            const user = userEvent.setup()
            const setShowAddStep = vi.fn()
            render(<ModalsHost {...buildProps({ showAddStep: true, setShowAddStep })} />)

            await user.click(screen.getByRole('button', { name: 'close-add-step' }))

            expect(setShowAddStep).toHaveBeenCalledWith(false)
        })

        it('calls handleAddStep with the item, parentId, and index', async () => {
            const user = userEvent.setup()
            const handleAddStep = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({
                        showAddStep: true,
                        handleAddStep,
                        addStepParentId: 'parent-1',
                        addStepIdx: 3,
                    })}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'add-item' }))

            expect(handleAddStep).toHaveBeenCalledWith({ id: 'item-1' }, 'parent-1', 3)
        })
    })

    describe('SaveDestinationModal', () => {
        it('renders with the default output path', () => {
            render(
                <ModalsHost
                    {...buildProps({ showSaveDestination: true, defaultOutputPath: '/foo/bar' })}
                />,
            )

            expect(screen.getByText('save-destination-modal')).toBeInTheDocument()
            expect(screen.getByText('/foo/bar')).toBeInTheDocument()
        })

        it('calls handleCancelSaveDestination when cancelled', async () => {
            const user = userEvent.setup()
            const handleCancelSaveDestination = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({ showSaveDestination: true, handleCancelSaveDestination })}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'cancel-save' }))

            expect(handleCancelSaveDestination).toHaveBeenCalledTimes(1)
        })

        it('calls handleConfirmSaveDestination with the chosen path', async () => {
            const user = userEvent.setup()
            const handleConfirmSaveDestination = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({ showSaveDestination: true, handleConfirmSaveDestination })}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'confirm-save' }))

            expect(handleConfirmSaveDestination).toHaveBeenCalledWith('/new/path')
        })
    })

    describe('PluginManager', () => {
        it('renders with plugin and installed data when showPluginMgr is true', () => {
            render(<ModalsHost {...buildProps({ showPluginMgr: true })} />)

            expect(screen.getByText('plugin-manager')).toBeInTheDocument()
            expect(screen.getByText('plugins-1')).toBeInTheDocument()
            expect(screen.getByText('installed-1')).toBeInTheDocument()
        })

        it('calls setShowPluginMgr(false) when closed', async () => {
            const user = userEvent.setup()
            const setShowPluginMgr = vi.fn()
            render(<ModalsHost {...buildProps({ showPluginMgr: true, setShowPluginMgr })} />)

            await user.click(screen.getByRole('button', { name: 'close-plugin-manager' }))

            expect(setShowPluginMgr).toHaveBeenCalledWith(false)
        })

        it('calls handleInstallPlugin with the plugin id', async () => {
            const user = userEvent.setup()
            const handleInstallPlugin = vi.fn()
            render(<ModalsHost {...buildProps({ showPluginMgr: true, handleInstallPlugin })} />)

            await user.click(screen.getByRole('button', { name: 'install' }))

            expect(handleInstallPlugin).toHaveBeenCalledWith('plugin-1')
        })

        it('calls handleUninstallPlugin with the plugin id', async () => {
            const user = userEvent.setup()
            const handleUninstallPlugin = vi.fn()
            render(<ModalsHost {...buildProps({ showPluginMgr: true, handleUninstallPlugin })} />)

            await user.click(screen.getByRole('button', { name: 'uninstall' }))

            expect(handleUninstallPlugin).toHaveBeenCalledWith('plugin-1')
        })

        it('calls handleUninstallPackage with the package id', async () => {
            const user = userEvent.setup()
            const handleUninstallPackage = vi.fn()
            render(
                <ModalsHost {...buildProps({ showPluginMgr: true, handleUninstallPackage })} />,
            )

            await user.click(screen.getByRole('button', { name: 'uninstall-package' }))

            expect(handleUninstallPackage).toHaveBeenCalledWith('pkg-1')
        })

        it('calls handleUploadPlugin with the uploaded file', async () => {
            const user = userEvent.setup()
            const handleUploadPlugin = vi.fn()
            render(<ModalsHost {...buildProps({ showPluginMgr: true, handleUploadPlugin })} />)

            await user.click(screen.getByRole('button', { name: 'upload' }))

            expect(handleUploadPlugin).toHaveBeenCalledTimes(1)
            expect(handleUploadPlugin.mock.calls[0][0].name).toBe('plugin.zip')
        })

        it('wires up installedSearch and browseSearch', async () => {
            const user = userEvent.setup()
            const setInstalledSearch = vi.fn()
            const setBrowseSearch = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({
                        showPluginMgr: true,
                        installedSearch: 'abc',
                        browseSearch: 'xyz',
                        setInstalledSearch,
                        setBrowseSearch,
                    })}
                />,
            )

            expect(screen.getByText('installed-search-abc')).toBeInTheDocument()
            expect(screen.getByText('browse-search-xyz')).toBeInTheDocument()

            await user.click(screen.getByRole('button', { name: 'set-installed-search' }))
            expect(setInstalledSearch).toHaveBeenCalledWith('foo')

            await user.click(screen.getByRole('button', { name: 'set-browse-search' }))
            expect(setBrowseSearch).toHaveBeenCalledWith('bar')
        })
    })

    describe('ContextMenu', () => {
        it('does not render when contextMenu is null', () => {
            render(<ModalsHost {...buildProps({ contextMenu: null })} />)

            expect(screen.queryByText(/context-menu-/)).not.toBeInTheDocument()
        })

        it('renders when contextMenu is set', () => {
            render(<ModalsHost {...buildProps({ contextMenu: { label: 'Step Actions' } })} />)

            expect(screen.getByText('context-menu-Step Actions')).toBeInTheDocument()
        })

        it('calls handleContextAction with the action and stepId', async () => {
            const user = userEvent.setup()
            const handleContextAction = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({ contextMenu: { label: 'Step Actions' }, handleContextAction })}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'context-action' }))

            expect(handleContextAction).toHaveBeenCalledWith('delete', 'step-1')
        })

        it('calls setContextMenu(null) when closed', async () => {
            const user = userEvent.setup()
            const setContextMenu = vi.fn()
            render(
                <ModalsHost
                    {...buildProps({ contextMenu: { label: 'Step Actions' }, setContextMenu })}
                />,
            )

            await user.click(screen.getByRole('button', { name: 'close-context-menu' }))

            expect(setContextMenu).toHaveBeenCalledWith(null)
        })
    })

    it('can render multiple modals at once', () => {
        render(
            <ModalsHost
                {...buildProps({ showAddStep: true, contextMenu: { label: 'Menu' } })}
            />,
        )

        expect(screen.getByText('add-step-modal')).toBeInTheDocument()
        expect(screen.getByText('context-menu-Menu')).toBeInTheDocument()
        expect(screen.queryByText('new-plan-modal')).not.toBeInTheDocument()
    })
})