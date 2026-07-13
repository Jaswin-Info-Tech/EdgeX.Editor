import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ResourcesPanel } from '../app/components/editor/ResourcesPanel'

describe('ResourcesPanel', () => {
    const defaultProps = {
        resources: [],
        search: '',
        setSearch: vi.fn(),
        isLoading: false,
        isError: false,
        showCreateResource: false,
        setShowCreateResource: vi.fn(),
        onClose: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onSave: vi.fn(),
        onCloseCreate: vi.fn(),
        resourcePlanName: '',
        setResourcePlanName: vi.fn(),
        selectedResourceInstrument: '',
        setSelectedResourceInstrument: vi.fn(),
        browsableResourceInstruments: [],
        isResourceSchemaLoading: false,
        resourceSchemaError: '',
        resourceSchemaProperties: [],
        renderResourceSchemaField: vi.fn(() => <div>Field</div>),
    }

    it('renders Resources title', () => {
        render(<ResourcesPanel {...defaultProps} />)

        expect(screen.getByText('Resources')).toBeInTheDocument()
    })

    it('shows loading message', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                isLoading
            />
        )

        expect(screen.getByText('Loading resources...')).toBeInTheDocument()
    })

    it('shows error message', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                isError
            />
        )

        expect(screen.getByText('Unable to load resources.')).toBeInTheDocument()
    })

    it('shows empty resources message', () => {
        render(<ResourcesPanel {...defaultProps} />)

        expect(screen.getByText('No resources available.')).toBeInTheDocument()
    })

    it('shows no matching resources message when searching', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                search="abc"
            />
        )

        expect(screen.getByText('No matching resources.')).toBeInTheDocument()
    })

    it('renders resource information', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                resources={[
                    {
                        id: '1',
                        name: 'Scope',
                        instrument: 'Oscilloscope',
                        status: 'Ready',
                    },
                ]}
            />
        )

        expect(screen.getByText('Scope')).toBeInTheDocument()
        expect(screen.getByText('Oscilloscope')).toBeInTheDocument()
        expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    it('calls setSearch when typing', async () => {
        const user = userEvent.setup()
        const setSearch = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                setSearch={setSearch}
            />
        )

        await user.type(
            screen.getByPlaceholderText('Search resources...'),
            'Scope'
        )

        expect(setSearch).toHaveBeenCalled()
    })

    it('opens create resource dialog', async () => {
        const user = userEvent.setup()
        const setShowCreateResource = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                setShowCreateResource={setShowCreateResource}
            />
        )

        await user.click(
            screen.getByRole('button', {
                name: /create resource/i,
            })
        )

        expect(setShowCreateResource).toHaveBeenCalledWith(true)
    })

    it('calls edit handler', async () => {
        const user = userEvent.setup()

        const onEdit = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                onEdit={onEdit}
                resources={[
                    {
                        id: '1',
                        name: 'Scope',
                        instrument: 'Oscilloscope',
                        status: 'Ready',
                    },
                ]}
            />
        )

        await user.click(screen.getByTitle('Edit resource'))

        expect(onEdit).toHaveBeenCalled()
    })

    it('calls delete handler', async () => {
        const user = userEvent.setup()

        const onDelete = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                onDelete={onDelete}
                resources={[
                    {
                        id: '1',
                        name: 'Scope',
                        instrument: 'Oscilloscope',
                        status: 'Ready',
                    },
                ]}
            />
        )

        await user.click(screen.getByTitle('Delete resource'))

        expect(onDelete).toHaveBeenCalledWith('1')
    })

    it('renders create resource dialog', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
            />
        )

        expect(
            screen.getAllByText(/Create Resource/i).length
        ).toBeGreaterThan(0)
    })

    it('shows instrument dropdown', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
            />
        )

        expect(
            screen.getByRole('combobox')
        ).toBeInTheDocument()
    })

    it('changes plan name', async () => {
        const user = userEvent.setup()

        const setResourcePlanName = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
                setResourcePlanName={setResourcePlanName}
            />
        )

        await user.type(
            screen.getByPlaceholderText('Enter plan name'),
            'Plan1'
        )

        expect(setResourcePlanName).toHaveBeenCalled()
    })

    it('calls save button', async () => {
        const user = userEvent.setup()

        const onSave = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
                selectedResourceInstrument="Scope"
                onSave={onSave}
            />
        )

        await user.click(
            screen.getByRole('button', {
                name: /save/i,
            })
        )

        expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('disables save button when no instrument is selected', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
            />
        )

        expect(
            screen.getByRole('button', {
                name: /save/i,
            })
        ).toBeDisabled()
    })

    it('shows schema loading message', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
                isResourceSchemaLoading
            />
        )

        expect(
            screen.getByText('Loading resource schema...')
        ).toBeInTheDocument()
    })

    it('shows schema error', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
                selectedResourceInstrument="Scope"
                resourceSchemaError="Schema Error"
            />
        )

        expect(screen.getByText('Schema Error')).toBeInTheDocument()
    })

    it('renders schema fields', () => {
        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource
                selectedResourceInstrument="Scope"
                resourceSchemaProperties={[{ id: 1 }]}
                renderResourceSchemaField={() => <div>Voltage</div>}
            />
        )

        expect(screen.getByText('Voltage')).toBeInTheDocument()
    })

    it('calls onCloseCreate', async () => {
        const user = userEvent.setup()

        const onCloseCreate = vi.fn()

        render(
            <ResourcesPanel
                {...defaultProps}
                showCreateResource={true}
                onCloseCreate={onCloseCreate}
            />
        )

        await user.click(
            screen.getByRole('button', {
                name: 'Close',
            })
        )

        expect(onCloseCreate).toHaveBeenCalledTimes(1)
    })
})