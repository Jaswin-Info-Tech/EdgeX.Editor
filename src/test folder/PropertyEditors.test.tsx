import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
    TextEditor,
    NumberEditor,
    IntegerEditor,
    CheckboxEditor,
    SelectEditor,
} from '../app/components/editor/PropertyEditors'

vi.mock('../app/components/editor/atoms', () => ({
    Toggle: ({ value, onChange }: any) => (
        <button onClick={onChange}>
            {value ? 'ON' : 'OFF'}
        </button>
    ),
}))

describe('PropertyEditors', () => {
    it('renders TextEditor label', () => {
        render(
            <TextEditor
                prop={{ name: 'Name' }}
                value=""
                onChange={vi.fn()}
            />
        )

        expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('calls TextEditor onChange', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()

        render(
            <TextEditor
                prop={{ name: 'Name' }}
                value=""
                onChange={handleChange}
            />
        )

        await user.type(screen.getByRole('textbox'), 'John')

        expect(handleChange).toHaveBeenCalled()
    })

    it('renders NumberEditor', () => {
        render(
            <NumberEditor
                prop={{ name: 'Age' }}
                value={20}
                onChange={vi.fn()}
            />
        )

        expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    })

    it('calls NumberEditor onChange', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()

        render(
            <NumberEditor
                prop={{ name: 'Age' }}
                value={10}
                onChange={handleChange}
            />
        )

        const input = screen.getByDisplayValue('10')

        await user.clear(input)
        await user.type(input, '25')

        expect(handleChange).toHaveBeenCalled()
    })

    it('renders IntegerEditor', () => {
        render(
            <IntegerEditor
                prop={{ name: 'Count' }}
                value={5}
                onChange={vi.fn()}
            />
        )

        expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    it('renders CheckboxEditor', () => {
        render(
            <CheckboxEditor
                prop={{ name: 'Enabled' }}
                value={false}
                onChange={vi.fn()}
            />
        )

        expect(screen.getByText('Enabled')).toBeInTheDocument()
        expect(screen.getByRole('button')).toHaveTextContent('OFF')
    })

    it('calls CheckboxEditor onChange', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()

        render(
            <CheckboxEditor
                prop={{ name: 'Enabled' }}
                value={false}
                onChange={handleChange}
            />
        )

        await user.click(screen.getByRole('button'))

        expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('renders SelectEditor options', () => {
        render(
            <SelectEditor
                prop={{
                    name: 'Mode',
                    options: ['Auto', 'Manual'],
                }}
                value=""
                onChange={vi.fn()}
            />
        )

        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.getByText('Auto')).toBeInTheDocument()
        expect(screen.getByText('Manual')).toBeInTheDocument()
    })

    it('calls SelectEditor onChange', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()

        render(
            <SelectEditor
                prop={{
                    name: 'Mode',
                    options: ['Auto', 'Manual'],
                }}
                value=""
                onChange={handleChange}
            />
        )

        await user.selectOptions(
            screen.getByRole('combobox'),
            'Manual'
        )

        expect(handleChange).toHaveBeenCalledWith('Manual')
    })
})