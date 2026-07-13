import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SequenceEditor } from '../app/components/editor/SequenceEditor'

vi.mock('../app/components/editor/SequenceStep', () => ({
  SequenceStep: ({ step }: any) => (
    <div data-testid="sequence-step">{step.name}</div>
  ),
}))

vi.mock('../app/utils/editor', () => ({
  flatAll: vi.fn(() => []),
}))

describe('SequenceEditor', () => {
  const defaultProps = {
    hasPlan: false,
    plan: [],
    planMeta: {},
    stats: {
      total: 0,
      enabled: 0,
      passed: 0,
      failed: 0,
    },
    selectedId: null,
    setSelectedId: vi.fn(),
    dragLibItem: null,
    dropIdx: null,
    setDropIdx: vi.fn(),
    handleSeqDrop: vi.fn(),
    handleAddGroup: vi.fn(),
    setShowNewPlan: vi.fn(),
    setAddStepParentId: vi.fn(),
    setAddStepIdx: vi.fn(),
    setShowAddStep: vi.fn(),
    draggedStepId: null,
    handleStepReorder: vi.fn(),
    sequenceStepProps: {
      expanded: new Set(),
      setDraggedStepId: vi.fn(),
    },
  }

  it('renders Sequence Editor title', () => {
    render(<SequenceEditor {...defaultProps} />)

    expect(screen.getByText('Sequence Editor')).toBeInTheDocument()
  })

  it('shows "No Test Plan Open" when hasPlan is false', () => {
    render(<SequenceEditor {...defaultProps} />)

    expect(screen.getByText('No Test Plan Open')).toBeInTheDocument()
  })

  it('opens new plan dialog when Create New Test Plan is clicked', async () => {
    const user = userEvent.setup()
    const setShowNewPlan = vi.fn()

    render(
      <SequenceEditor
        {...defaultProps}
        setShowNewPlan={setShowNewPlan}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /create new test plan/i })
    )

    expect(setShowNewPlan).toHaveBeenCalledWith(true)
  })

  it('shows "No plan loaded" in footer', () => {
    render(<SequenceEditor {...defaultProps} />)

    expect(screen.getByText('No plan loaded')).toBeInTheDocument()
  })

  it('shows empty plan message when plan has no steps', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[]}
      />
    )

    expect(
      screen.getByText(/Plan is empty/i)
    ).toBeInTheDocument()
  })

  it('renders plan file name', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
        planMeta={{ name: 'Demo' }}
      />
    )

    expect(screen.getByText('Demo.TapPlan')).toBeInTheDocument()
  })

  it('renders sequence steps', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[
          { id: '1', name: 'Step 1' },
          { id: '2', name: 'Step 2' },
        ]}
      />
    )

    expect(screen.getAllByTestId('sequence-step')).toHaveLength(2)
  })

  it('shows Add Test Step button', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
      />
    )

    expect(
      screen.getByRole('button', { name: /add test step/i })
    ).toBeInTheDocument()
  })

  it('opens add step dialog when Add Test Step is clicked', async () => {
    const user = userEvent.setup()

    const setShowAddStep = vi.fn()
    const setAddStepParentId = vi.fn()
    const setAddStepIdx = vi.fn()

    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
        setShowAddStep={setShowAddStep}
        setAddStepParentId={setAddStepParentId}
        setAddStepIdx={setAddStepIdx}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /add test step/i })
    )

    expect(setAddStepParentId).toHaveBeenCalledWith(null)
    expect(setAddStepIdx).toHaveBeenCalledWith(1)
    expect(setShowAddStep).toHaveBeenCalledWith(true)
  })

  it('shows statistics in footer', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
        stats={{
          total: 5,
          enabled: 4,
          passed: 3,
          failed: 1,
        }}
      />
    )

    expect(screen.getByText(/Steps:/)).toBeInTheDocument()
    expect(screen.getByText(/Enabled:/)).toBeInTheDocument()
    expect(screen.getByText(/Pass/)).toBeInTheDocument()
    expect(screen.getByText(/Fail/)).toBeInTheDocument()
  })

  it('shows DUT information when available', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
        planMeta={{
          dutName: 'Oscilloscope',
          dutSerial: '12345',
        }}
      />
    )

    expect(
      screen.getByText(/Oscilloscope/)
    ).toBeInTheDocument()
  })

  it('shows drag hint when dragLibItem exists', () => {
    render(
      <SequenceEditor
        {...defaultProps}
        hasPlan
        plan={[{ id: '1', name: 'Step 1' }]}
        dragLibItem={{ name: 'Delay Step' }}
      />
    )

    expect(
      screen.getByText(/Drop to add: Delay Step/)
    ).toBeInTheDocument()
  })
})