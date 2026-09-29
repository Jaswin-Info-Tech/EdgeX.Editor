import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

// ─── Adjust these import paths to match your real folder structure ────────
import { PropertiesPanel } from '../app/components/editor/PropertiesPanel'

// ─── Mocks ─────────────────────────────────────────────────────────────────
// All mock paths below are written relative to THIS test file, but Vitest
// resolves them to the same absolute module the component imports via its
// own relative paths, so they only need to point at the same files.

const mockDispatch = vi.fn()

// Mutable fake redux state — reset before every test, overridden per test.
let mockState: any

const resetMockState = () => {
  mockState = {
    properties: {
      resolvedTypeNames: {},
      cache: {},
      errorsByTypeName: {},
    },
  }
}
resetMockState()

vi.mock('../app/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(mockState),
}))

vi.mock('../app/store/slices/propertiesSlice', () => ({
  fetchStepSchema: vi.fn((typeName: string) => ({ type: 'properties/fetchStepSchema', payload: typeName })),
  lockResolvedTypeName: vi.fn((payload: any) => ({ type: 'properties/lockResolvedTypeName', payload })),
}))

vi.mock('../app/constants/editor', () => ({
  TYPE_STRIPE: { action: '#111111', measurement: '#222222' },
}))

vi.mock('../app/utils/editor', () => ({
  flatAll: (arr: any[]) => arr,
  formatFreq: (v: number) => String(v),
  updateIn: (tree: any[], id: string, updater: (step: any) => any) =>
    tree.map((step: any) => (step.id === id ? updater(step) : step)),
}))

vi.mock('../app/components/editor/atoms', () => ({
  StatusPill: ({ status }: any) => <span data-testid="status-pill">{status}</span>,
  Toggle: ({ value, onChange }: any) => (
    <button role="switch" aria-checked={value} onClick={onChange}>
      {value ? 'on' : 'off'}
    </button>
  ),
  TypeIcon: () => <svg data-testid="type-icon" />,
}))

const getSchemaRecords = vi.fn()
const renderEditor = vi.fn((prop: any, values: Record<string, any>, setValues: any, _ctx?: any) => (
  <div key={prop.name} data-testid={`schema-field-${prop.name}`}>
    <label htmlFor={prop.name}>{prop.displayName || prop.name}</label>
    <input
      id={prop.name}
      aria-label={prop.displayName || prop.name}
      value={
        prop.editorType === 'object' && values[prop.name] && typeof values[prop.name] === 'object'
          ? JSON.stringify(values[prop.name])
          : values[prop.name] ?? ''
      }
      onChange={(e) => {
        let value: any = e.target.value
        if (prop.editorType === 'object') {
          try { value = JSON.parse(value) } catch { /* keep text while editing invalid JSON */ }
        }
        setValues((prev: any) => ({ ...prev, [prop.name]: value }))
      }}
    />
  </div>
))

vi.mock('../app/components/editor/PropertyEditors', () => ({
  getSchemaRecords: (schemaResponse: any) => getSchemaRecords(schemaResponse),
  normalizeEditorType: (type: string) => type,
  renderEditor: (prop: any, values: any, setValues: any, ctx: any) =>
    renderEditor(prop, values, setValues, ctx),
  toBackendRecordOption: (step: any) => step,
  inputCls: 'input-cls',
}))

// ─── Fixtures ────────────────────────────────────────────────────────────

const baseStep = {
  id: 'step-1',
  name: 'Read Voltage',
  type: 'measurement',
  status: 'pending',
  description: 'Reads voltage from the DMM',
  breakpoint: false,
  properties: [
    { key: 'Prop A || Prop A', label: 'Prop A', type: 'string', value: 'hello', group: 'General' },
  ],
}

const baseProps = {
  selectedId: 'step-1',
  plan: [baseStep],
  instruments: [],
  resources: [],
  testSteps: [],
  setPlan: vi.fn(),
  setSelectedId: vi.fn(),
  setAddStepParentId: vi.fn(),
  setShowAddStep: vi.fn(),
  updateProperty: vi.fn(),
}

beforeEach(() => {
  resetMockState()
  vi.clearAllMocks()
  getSchemaRecords.mockReturnValue([]) // no schema properties by default
})

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('PropertiesPanel — empty state', () => {
  it('shows a placeholder when no step is selected', () => {
    render(<PropertiesPanel {...baseProps} selectedStep={null} />)

    expect(screen.getByText('Select a step to inspect')).toBeInTheDocument()
  })
})

describe('PropertiesPanel — step header', () => {
  it('renders the step name, status, and type badge', () => {
    render(<PropertiesPanel {...baseProps} selectedStep={baseStep} />)

    expect(screen.getByText('Read Voltage')).toBeInTheDocument()
    expect(screen.getByTestId('status-pill')).toHaveTextContent('pending')
    expect(screen.getByText('MEASUREMENT')).toBeInTheDocument()
    expect(screen.getByText(/Reads voltage from the DMM/)).toBeInTheDocument()
  })
})

describe('PropertiesPanel — breakpoint toggle', () => {
  it('calls setPlan with an updater that flips the breakpoint flag', () => {
    const setPlan = vi.fn()
    render(<PropertiesPanel {...baseProps} selectedStep={baseStep} setPlan={setPlan} />)

    fireEvent.click(screen.getByRole('switch', { name: 'off' }))

    expect(setPlan).toHaveBeenCalledTimes(1)
    const updaterFn = setPlan.mock.calls[0][0]
    const result = updaterFn([baseStep])
    expect(result[0].breakpoint).toBe(true)
  })
})

describe('PropertiesPanel — plain properties', () => {
  it('renders a text property and commits the new value on blur', async () => {
    const user = userEvent.setup()
    const updateProperty = vi.fn()
    render(<PropertiesPanel {...baseProps} selectedStep={baseStep} updateProperty={updateProperty} />)

    const input = screen.getByDisplayValue('hello')
    await user.clear(input)
    await user.type(input, 'world')
    await user.tab() // triggers blur

    expect(updateProperty).toHaveBeenCalledWith('step-1', 'Prop A || Prop A', 'world')
  })

  it('commits the value on Enter key without needing an explicit blur event', async () => {
    const user = userEvent.setup()
    const updateProperty = vi.fn()
    render(<PropertiesPanel {...baseProps} selectedStep={baseStep} updateProperty={updateProperty} />)

    const input = screen.getByDisplayValue('hello')
    await user.type(input, '{Enter}')

    expect(updateProperty).toHaveBeenCalled()
  })

  it('toggles a boolean property and calls updateProperty with the flipped value', () => {
    const updateProperty = vi.fn()
    const boolStep = {
      ...baseStep,
      properties: [
        { key: 'Enabled || Enabled', label: 'Enabled', type: 'boolean', value: false, group: 'General' },
      ],
    }
    render(<PropertiesPanel {...baseProps} selectedStep={boolStep} updateProperty={updateProperty} />)

    // First switch on the page is the breakpoint toggle, second is this property.
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[1])

    expect(updateProperty).toHaveBeenCalledWith('step-1', 'Enabled || Enabled', 'true')
  })

  it('renders a read-only property without a live control and never calls updateProperty', () => {
    const updateProperty = vi.fn()
    const readOnlyStep = {
      ...baseStep,
      properties: [
        {
          key: 'Locked || Locked',
          label: 'Locked',
          type: 'boolean',
          value: true,
          group: 'General',
          isEditable: false,
        },
      ],
    }
    render(<PropertiesPanel {...baseProps} selectedStep={readOnlyStep} updateProperty={updateProperty} />)

    expect(screen.getByText('read only')).toBeInTheDocument()
    // Only the breakpoint toggle should be a real switch; the read-only
    // boolean renders as a static (non-interactive) span, not a button.
    expect(screen.getAllByRole('switch')).toHaveLength(1)
    expect(updateProperty).not.toHaveBeenCalled()
  })

  it('renders an enum property as a select and commits changes', async () => {
    const user = userEvent.setup()
    const updateProperty = vi.fn()
    const enumStep = {
      ...baseStep,
      properties: [
        {
          key: 'Mode || Mode',
          label: 'Mode',
          type: 'enum',
          value: 'A',
          group: 'General',
          options: ['A', 'B', 'C'],
        },
      ],
    }
    render(<PropertiesPanel {...baseProps} selectedStep={enumStep} updateProperty={updateProperty} />)

    await user.selectOptions(screen.getByRole('combobox'), 'B')

    expect(updateProperty).toHaveBeenCalledWith('step-1', 'Mode || Mode', 'B')
  })
})

describe('PropertiesPanel — schema properties', () => {
  const schemaStep = {
    ...baseStep,
    stepTypeName: 'Vendor.Steps.ReadVoltage',
    properties: [],
  }

  const schemaProps = [
    { name: 'Voltage', displayName: 'Voltage', editorType: 'number' },
    { name: 'Range', displayName: 'Range', editorType: 'select' },
  ]

  it('dispatches fetchStepSchema for the resolved step type', () => {
    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'properties/fetchStepSchema', payload: 'Vendor.Steps.ReadVoltage' }),
    )
  })

  it('renders the schema fields returned by the schema cache', () => {
    getSchemaRecords.mockReturnValue([{ properties: schemaProps }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    expect(screen.getByTestId('schema-field-Voltage')).toBeInTheDocument()
    expect(screen.getByTestId('schema-field-Range')).toBeInTheDocument()
    expect(screen.getByText('2/2 fields')).toBeInTheDocument()
  })

  it('filters schema fields with the search box', async () => {
    const user = userEvent.setup()
    getSchemaRecords.mockReturnValue([{ properties: schemaProps }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    await user.type(screen.getByPlaceholderText('Filter schema fields...'), 'volt')

    expect(screen.getByTestId('schema-field-Voltage')).toBeInTheDocument()
    expect(screen.queryByTestId('schema-field-Range')).not.toBeInTheDocument()
    expect(screen.getByText('1/2 fields')).toBeInTheDocument()
  })

  it('collapses schema fields and shows a placeholder message', async () => {
    const user = userEvent.setup()
    getSchemaRecords.mockReturnValue([{ properties: schemaProps }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    await user.click(screen.getByTitle('Collapse schema fields'))

    expect(screen.getByText('Schema fields are collapsed.')).toBeInTheDocument()
    expect(screen.queryByTestId('schema-field-Voltage')).not.toBeInTheDocument()
  })

  it('disables Save Properties until a schema field is edited, then enables it', async () => {
    const user = userEvent.setup()
    getSchemaRecords.mockReturnValue([{ properties: schemaProps }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    const saveButton = screen.getByRole('button', { name: /save properties/i })
    expect(saveButton).toBeDisabled()
    expect(screen.getByText('All changes saved')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Voltage'), '5')

    expect(saveButton).toBeEnabled()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('calls setPlan with updated schema properties when Save Properties is clicked', async () => {
    const user = userEvent.setup()
    const setPlan = vi.fn()
    getSchemaRecords.mockReturnValue([{ properties: schemaProps }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} setPlan={setPlan} />)

    await user.type(screen.getByLabelText('Voltage'), '5')
    await user.click(screen.getByRole('button', { name: /save properties/i }))

    expect(setPlan).toHaveBeenCalled()
    const updaterFn = setPlan.mock.calls[setPlan.mock.calls.length - 1][0]
    const result = updaterFn([schemaStep])
    const savedProps = result[0].properties
    expect(savedProps.find((p: any) => p.label === 'Voltage')?.value).toBe(5)
  })


  it('saves OpenTap.Enabled string properties as Value/IsEnabled objects when type is supplied in schema.type', async () => {
    const user = userEvent.setup()
    const setPlan = vi.fn()
    const regexStep = {
      ...schemaStep,
      properties: [{
        key: 'RegularExpressionPattern || RegularExpressionPattern',
        label: 'RegularExpressionPattern',
        backendName: 'RegularExpressionPattern',
        value: '(.*) (disabled)',
      }],
    }
    getSchemaRecords.mockReturnValue([{
      properties: [{
        name: 'RegularExpressionPattern',
        displayName: 'Regular Expression',
        type: 'OpenTap.Enabled`1[[System.String, System.Private.CoreLib]]',
        editorType: 'object',
      }],
    }])

    render(<PropertiesPanel {...baseProps} selectedStep={regexStep} setPlan={setPlan} />)

    const input = screen.getByLabelText('Regular Expression')
    expect(input).toHaveValue(JSON.stringify({ Value: '.*', IsEnabled: false }))
    await user.clear(input)
    fireEvent.change(input, {
      target: {
        value: JSON.stringify({ Value: '^\\s*1\\s*$', IsEnabled: true }),
      },
    })
    await user.click(screen.getByRole('button', { name: /save properties/i }))

    const updaterFn = setPlan.mock.calls[setPlan.mock.calls.length - 1][0]
    const result = updaterFn([regexStep])
    const saved = result[0].properties.find(
      (property: any) => property.backendName === 'RegularExpressionPattern',
    )
    expect(saved.value).toEqual({
      Value: '^\\s*1\\s*$',
      IsEnabled: true,
    })
  })


  it('saves the Enabled schema property to the step enabled flag', async () => {
    const user = userEvent.setup()
    const setPlan = vi.fn()
    getSchemaRecords.mockReturnValue([{
      properties: [{ name: 'Enabled', displayName: 'Enabled', editorType: 'checkbox' }],
    }])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} setPlan={setPlan} />)

    await user.clear(screen.getByLabelText('Enabled'))
    await user.click(screen.getByRole('button', { name: /save properties/i }))

    const updaterFn = setPlan.mock.calls[setPlan.mock.calls.length - 1][0]
    const result = updaterFn([schemaStep])
    expect(result[0].enabled).toBe(false)
  })

  it('shows a schema-load error and keeps Save Properties disabled', () => {
    mockState.properties.errorsByTypeName = { 'Vendor.Steps.ReadVoltage': 'network timeout' }
    getSchemaRecords.mockReturnValue([])

    render(<PropertiesPanel {...baseProps} selectedStep={schemaStep} />)

    expect(screen.getByText(/Unable to load schema: network timeout/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save properties/i })).toBeDisabled()
    expect(screen.getByText('Schema must be loaded to save schema properties.')).toBeInTheDocument()
  })
})

describe('PropertiesPanel — instrument compatibility warnings', () => {
  const restStep = {
    ...baseStep,
    name: 'RestApiCall',
    stepTypeName: 'Vendor.Steps.RestApiCall',
    properties: [],
  }

  const instrumentSchema = [
    { name: 'Instrument', displayName: 'Instrument', editorType: 'instrument-selector' },
  ]

  it('warns when no compatible instruments exist in resources', () => {
    getSchemaRecords.mockReturnValue([{ properties: instrumentSchema }])

    render(<PropertiesPanel {...baseProps} selectedStep={restStep} resources={[]} />)

    expect(
      screen.getByText(/No compatible REST instruments found in resources\./i),
    ).toBeInTheDocument()
  })

  it('flags a selected instrument whose family does not match the step', () => {
    getSchemaRecords.mockReturnValue([{ properties: instrumentSchema }])

    const resources = [{ name: 'SCPI-Meter-1', type: 'ScpiInstrument' }]

    render(<PropertiesPanel {...baseProps} selectedStep={restStep} resources={resources} />)

    // Simulate the user having already selected the mismatched instrument
    // by editing the mocked schema field directly.
    fireEvent.change(screen.getByLabelText('Instrument'), { target: { value: 'SCPI-Meter-1' } })

    expect(screen.getByText(/Instrument-family mismatch detected/i)).toBeInTheDocument()
    expect(screen.getByText(/Instrument: SCPI-Meter-1 \(SCPI\)/)).toBeInTheDocument()
  })
})
