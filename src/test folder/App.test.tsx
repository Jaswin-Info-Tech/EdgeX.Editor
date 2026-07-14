import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from '../app/App'
import { useEditorController } from '../app/hooks/useEditorController'

// Mock the hook
vi.mock('../app/hooks/useEditorController', () => ({
    useEditorController: vi.fn(),
}))

// Mock EditorShell
vi.mock('../app/pages/EditorShell', () => ({
    EditorShell: () => <div data-testid="editor-shell">Editor Shell</div>,
}))

// Mock Toaster
vi.mock('sonner', () => ({
    Toaster: () => <div data-testid="toaster">Toaster</div>,
}))

describe('App', () => {
    it('renders the EditorShell component', () => {
        vi.mocked(useEditorController).mockReturnValue({} as any)

        render(<App />)

        expect(screen.getByTestId('editor-shell')).toBeInTheDocument()
    })

    it('renders the Toaster component', () => {
        vi.mocked(useEditorController).mockReturnValue({} as any)

        render(<App />)

        expect(screen.getByTestId('toaster')).toBeInTheDocument()
    })

    it('calls useEditorController when App renders', () => {
        vi.mocked(useEditorController).mockReturnValue({} as any)

        render(<App />)

        expect(useEditorController).toHaveBeenCalled()
    })
    it('renders EditorShell and Toaster together', () => {
        vi.mocked(useEditorController).mockReturnValue({} as any)

        render(<App />)

        expect(screen.getByTestId('editor-shell')).toBeInTheDocument()
        expect(screen.getByTestId('toaster')).toBeInTheDocument()
    })
})