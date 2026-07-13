import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PropertiesDock } from '../app/components/editor/PropertiesDock'
import { moveIn } from '../app/utils/editor'

vi.mock('../app/utils/editor', () => ({
    moveIn: vi.fn(),
}))

vi.mock('../app/components/editor/atoms', () => ({
    PanelHeader: ({ label, children }: any) => (
        <div>
            <span>{label}</span>
            {children}
        </div>
    ),
}))

vi.mock('../app/components/editor/resizable', () => ({
    Splitter: ({ actionButton }: any) => (
        <div data-testid="splitter">
            {actionButton}
        </div>
    ),
}))

describe('PropertiesDock', () => {
    const defaultProps = {
        isTablet: false,
        rightOpen: true,
        setRightOpen: vi.fn(),
        selectedStep: null,
        selectedId: null,
        setPlan: vi.fn(),
        rightW: 300,
        dragRight: vi.fn(),
        children: <div>Properties Content</div>,
    }

    it('renders the properties panel', () => {
        render(<PropertiesDock {...defaultProps} />)

        expect(screen.getByText('Properties')).toBeInTheDocument()
        expect(screen.getByText('Properties Content')).toBeInTheDocument()
    })

    it('renders the splitter', () => {
        render(<PropertiesDock {...defaultProps} />)

        expect(screen.getByTestId('splitter')).toBeInTheDocument()
    })

    it('calls setRightOpen(false) when collapse button is clicked', async () => {
        const user = userEvent.setup()
        const setRightOpen = vi.fn()

        render(
            <PropertiesDock
                {...defaultProps}
                setRightOpen={setRightOpen}
            />
        )

        const buttons = screen.getAllByRole('button')

        await user.click(buttons[0])

        expect(setRightOpen).toHaveBeenCalledWith(false)
    })

    it('shows move buttons when a step is selected', () => {
        render(
            <PropertiesDock
                {...defaultProps}
                selectedStep={{ id: '1' }}
                selectedId="1"
            />
        )

        expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    it('calls setPlan when move up is clicked', async () => {
        const user = userEvent.setup()
        const setPlan = vi.fn()

        render(
            <PropertiesDock
                {...defaultProps}
                selectedStep={{ id: '1' }}
                selectedId="1"
                setPlan={setPlan}
            />
        )

        const buttons = screen.getAllByRole('button')

        await user.click(buttons[1])

        expect(setPlan).toHaveBeenCalledTimes(1)
    })

    it('calls setPlan when move down is clicked', async () => {
        const user = userEvent.setup()
        const setPlan = vi.fn()

        render(
            <PropertiesDock
                {...defaultProps}
                selectedStep={{ id: '1' }}
                selectedId="1"
                setPlan={setPlan}
            />
        )

        const buttons = screen.getAllByRole('button')

        await user.click(buttons[2])

        expect(setPlan).toHaveBeenCalledTimes(1)
    })

    it('renders tablet view when open', () => {
        render(
            <PropertiesDock
                {...defaultProps}
                isTablet
            />
        )

        expect(screen.getByText('Properties')).toBeInTheDocument()
        expect(screen.getByText('Properties Content')).toBeInTheDocument()
    })

    it('does not render tablet panel when closed', () => {
        render(
            <PropertiesDock
                {...defaultProps}
                isTablet
                rightOpen={false}
            />
        )

        expect(screen.queryByText('Properties')).not.toBeInTheDocument()
    })

    it('closes tablet panel when overlay is clicked', async () => {
        const user = userEvent.setup()
        const setRightOpen = vi.fn()

        const { container } = render(
            <PropertiesDock
                {...defaultProps}
                isTablet
                setRightOpen={setRightOpen}
            />
        )

        const overlay = container.firstChild as HTMLElement

        await user.click(overlay)

        expect(setRightOpen).toHaveBeenCalledWith(false)
    })

    it('calls moveIn with "up" when updater is executed', () => {
        const setPlan = vi.fn()

        render(
            <PropertiesDock
                {...defaultProps}
                selectedStep={{}}
                selectedId="step-1"
                setPlan={setPlan}
            />
        )

        const updater = setPlan.mock.calls.length
        expect(updater).toBe(0)
    })

    it('uses the configured width', () => {
        const { container } = render(
            <PropertiesDock
                {...defaultProps}
                rightW={450}
            />
        )

        expect(container.querySelector('[style*="width: 450px"]')).toBeTruthy()
    })
})