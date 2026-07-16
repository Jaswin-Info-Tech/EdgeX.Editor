import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../app/api/client', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: 'http://default.test/' },
  },
}))
vi.mock('../app/config/serverSettings', () => ({
  getActiveServerProfile: vi.fn(() => null),
}))

import axiosClient from '../app/api/client'
import { postUploadPackages } from '../app/api/PackageUpload'
import { getAvailablePackages, getInstalledPackages, installPackage, uninstallPackage } from '../app/api/package'
import {
  cancelRun, getConnections, getDuts, getInstalledPlugins, getInstruments,
  getResultListeners, getRunLogs, getRunLogsStreamUrl, getRunStatus, getSteps,
  getTraceListeners, pauseRun, removePlugin, resumeRun, uploadPlugin,
} from '../app/api/plugin'
import {
  addResource, deleteResource, extractTypeName, getResources, getResourceSchema, updateResource,
} from '../app/api/resources'
import { getSystemKpis, type SystemKpisResponse } from '../app/api/system'
import {
  composeTestPlan, createTestPlan, getStepSchema, getTestPlans,
  getTestPlanEditorModel, importRemoteTestPlan, runTestPlan, uploadTapPlan,
} from '../app/api/testplans'
import { getUsers } from '../app/api/users'

const api = vi.mocked(axiosClient)

describe('API adapters', () => {
  beforeEach(() => vi.clearAllMocks())

  // Confirms the KPI endpoint, wildcard Accept header, and complete response pass-through.
  it('gets system KPIs with the required request headers', async () => {
    const kpis: SystemKpisResponse = {
      timestampUtc: '2026-07-09T10:00:00Z',
      machineName: 'edge-server',
      osDescription: 'Linux',
      osArchitecture: 'X64',
      processArchitecture: 'X64',
      processorCount: 8,
      uptimeSeconds: 3600,
      cpu: { usagePercent: 24.5 },
      memory: {
        totalBytes: 16_000,
        availableBytes: 6_000,
        usedBytes: 10_000,
        totalMb: 16,
        availableMb: 6,
        usedMb: 10,
      },
      process: {
        id: 123,
        name: 'EdgeX',
        threads: 12,
        workingSetBytes: 1_000,
        workingSetMb: 1,
        privateMemoryBytes: 2_000,
        privateMemoryMb: 2,
        pagedMemoryBytes: 3_000,
        pagedMemoryMb: 3,
        cpuTimeSeconds: 45,
        managedHeapBytes: 400,
        heapSizeBytes: 500,
        fragmentedBytes: 10,
        totalAvailableMemoryBytes: 8_000,
        memoryLoadBytes: 4_000,
      },
    }
    api.get.mockResolvedValueOnce({ data: kpis })

    await expect(getSystemKpis()).resolves.toEqual(kpis)
    expect(api.get).toHaveBeenCalledWith('system/kpis', {
      headers: { accept: '*/*' },
    })
  })

  // A failed KPI request must remain rejected so the calling hook can display an error state.
  it('propagates system KPI request errors', async () => {
    api.get.mockRejectedValueOnce(new Error('KPIs unavailable'))
    await expect(getSystemKpis()).rejects.toThrow('KPIs unavailable')
  })

  // Verifies the users endpoint and that the API payload is returned without transformation.
  it('gets users from the users endpoint', async () => {
    const users = [
      { id: 'user-1', name: 'Ada', role: 'admin' },
      { id: 'user-2', name: 'Linus', role: 'operator' },
    ]
    api.get.mockResolvedValueOnce({ data: users })

    await expect(getUsers()).resolves.toEqual(users)
    expect(api.get).toHaveBeenCalledWith('/users')
  })

  // A users request failure should be exposed to the caller rather than converted to empty data.
  it('propagates users request errors', async () => {
    api.get.mockRejectedValueOnce(new Error('Users unavailable'))
    await expect(getUsers()).rejects.toThrow('Users unavailable')
  })


  // Confirms the "connections" (correct spelling) key is read in addition to the
  // existing "conections" typo alias — both must produce identical output.
  it('reads connections under both the correct key and the legacy typo key', async () => {
    api.get.mockResolvedValueOnce({
      data: { connections: [{ name: 'Conn1', type: 'Vendor.Conn', properties: [] }] },
    })
    const viaCorrectKey = await getResources()
    expect(viaCorrectKey).toEqual([
      expect.objectContaining({ id: 'Conn1', instrument: 'Conn', status: 'Active' }),
    ])

    api.get.mockResolvedValueOnce({
      data: { conections: [{ name: 'Conn2', type: 'Vendor.Conn', properties: [] }] },
    })
    const viaTypoKey = await getResources()
    expect(viaTypoKey).toEqual([
      expect.objectContaining({ id: 'Conn2', instrument: 'Conn', status: 'Active' }),
    ])
  })

  // Result listeners can arrive under three different key spellings from the
  // backend; all three must normalize to the same shape.
  it('reads result listeners under all supported key spellings', async () => {
    for (const key of ['resultListeners', 'resultlisteners', 'result_listeners']) {
      api.get.mockResolvedValueOnce({ data: { [key]: [{ name: 'CSV' }] } })
      const resources = await getResources()
      expect(resources).toEqual([expect.objectContaining({ id: 'CSV', name: 'CSV' })])
    }
  })

  // Trace listeners are a completely untested resource group; confirms all three
  // key spellings are recognized the same way result listeners are.
  it('reads trace listeners under all supported key spellings', async () => {
    for (const key of ['traceListeners', 'tracelisteners', 'trace_listeners']) {
      api.get.mockResolvedValueOnce({ data: { [key]: [{ name: 'Trace1' }] } })
      const resources = await getResources()
      expect(resources).toEqual([expect.objectContaining({ id: 'Trace1', name: 'Trace1' })])
    }
  })

  // DUT mapping has many fallback fields for name/instrument/status; this
  // exercises each fallback individually so a missing field doesn't crash it.
  it('falls back through every DUT name/instrument/status field in priority order', async () => {
    api.get.mockResolvedValueOnce({
      data: { duts: [{ model: 'Pixel-9', type: 'Vendor.Phone', properties: {} }] },
    })
    const [dut] = await getResources()
    expect(dut).toMatchObject({ id: 'dut-0', name: 'Pixel-9', instrument: 'Phone', status: 'Active' })

    api.get.mockResolvedValueOnce({
      data: { duts: [{ properties: { Error: 'timeout' } }] },
    })
    const [errDut] = await getResources()
    expect(errDut).toMatchObject({ status: 'Error' })
  })

  // When the backend sends no recognized resource-group keys, getResources
  // must return an empty array rather than throwing or returning undefined.
  it('returns an empty array when no known resource group keys are present', async () => {
    api.get.mockResolvedValueOnce({ data: {} })
    expect(await getResources()).toEqual([])
  })

  // Covers the "data.resources" wrapper fallback shape, distinct from the flat
  // array shape already tested elsewhere.
  it('supports the data.resources wrapper fallback shape', async () => {
    api.get.mockResolvedValueOnce({
      data: { resources: [{ name: 'Foo', type: 'Vendor.Foo', properties: [] }] },
    })
    const resources = await getResources()
    expect(resources).toEqual([
      expect.objectContaining({ id: 'Foo', name: 'Foo', instrument: 'Foo' }),
    ])
  })

  // If the request itself rejects (network error, 5xx), getResources must
  // propagate the rejection rather than swallowing it into an empty array.
  it('propagates errors from a failed resources request', async () => {
    api.get.mockRejectedValueOnce(new Error('network down'))
    await expect(getResources()).rejects.toThrow('network down')
  })

  // addResource/updateResource/deleteResource must actually return the
  // response payload, not just fire the request (the original test never
  // checked return values, only which URLs were called).
  it('returns response data from resource mutation calls', async () => {
    api.post.mockResolvedValueOnce({ data: 'added' })
    expect(await addResource({ resourceKind: 'instrument', pluginTypeName: 'Scope', name: 'S1', properties: {} }))
      .toBe('added')

    api.post.mockResolvedValueOnce({ data: 'updated' })
    expect(await updateResource({ resourceKind: 'instrument', name: 'S1', newName: 'S2', properties: {} }))
      .toBe('updated')

    api.post.mockResolvedValueOnce({ data: 'deleted' })
    expect(await deleteResource({ resourceKind: 'instrument', name: 'S2' }))
      .toBe('deleted')
  })

  // getResourceSchema defaults resourceKind to 'instrument' when the caller
  // omits it — confirms the default parameter actually takes effect.
  it('defaults resourceKind to "instrument" when not provided', async () => {
    api.get.mockResolvedValueOnce({ data: { count: 3 } })
    const schema = await getResourceSchema('Scope')
    expect(api.get).toHaveBeenCalledWith('plugins/resources/schema', {
      params: { resourceKind: 'instrument', pluginTypeName: 'Scope' },
    })
    expect(schema).toEqual({ count: 3 })
  })

  // Verifies package response normalization and the exact install/uninstall request contracts.
  it('normalizes package lists and sends package mutations', async () => {
    api.get.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { packages: ['a'] } })
    expect(await getInstalledPackages()).toEqual([])
    expect(api.get).toHaveBeenNthCalledWith(1, '/packages/installed')
    expect(await getAvailablePackages('scope')).toEqual(['a'])
    expect(api.get).toHaveBeenLastCalledWith('/packages/available', { params: { search: 'scope' } })

    api.post.mockResolvedValue({ data: { ok: true } })
    await installPackage('a')
    await uninstallPackage('a')
    expect(api.post).toHaveBeenNthCalledWith(1, '/packages/install', ['a'])
    expect(api.post).toHaveBeenNthCalledWith(2, '/packages/uninstall', ['a'])
  })

  // Confirms the installed-packages endpoint path and that a genuine array payload
  // passes through untouched (not just the null-fallback branch).
  it('installed packages returns raw array and correct endpoint', async () => {
    api.get.mockResolvedValueOnce({ data: ['p1', 'p2'] })
    expect(await getInstalledPackages()).toEqual(['p1', 'p2'])
    expect(api.get).toHaveBeenCalledWith('/packages/installed')
  })

  // Exercises the flat-array and malformed/empty payload branches of
  // getAvailablePackages, which the happy-path "packages" wrapper test doesn't reach.
  it('available packages handles flat array and malformed payloads', async () => {
    api.get.mockResolvedValueOnce({ data: ['x'] })
    expect(await getAvailablePackages()).toEqual(['x'])
    expect(api.get).toHaveBeenLastCalledWith('/packages/available', { params: {} })

    api.get.mockResolvedValueOnce({ data: {} })
    expect(await getAvailablePackages()).toEqual([])

    api.get.mockResolvedValueOnce({ data: null })
    expect(await getAvailablePackages()).toEqual([])
  })

  // Confirms heterogeneous backend resource groups become one consistent UI model.
  it('maps grouped resources, aliases, property arrays, errors, and fallback IDs', async () => {
    api.get.mockResolvedValue({
      data: {
        instruments: [{ name: 'Scope', type: 'Vendor.Scope', properties: [{ name: 'Address', value: 'USB' }] }],
        conections: [{ type: 'Vendor.Connection', properties: [{ name: 'Error', value: 'bad' }] }],
        result_listeners: [{ name: 'CSV' }],
        duts: [{ dutName: 'Phone', properties: { Name: 'Device' } }],
      }
    })
    const resources = await getResources()
    expect(resources).toHaveLength(4)
    expect(resources[0]).toMatchObject({ id: 'Scope', instrument: 'Scope', status: 'Active', properties: { Address: 'USB' } })
    expect(resources[1]).toMatchObject({ id: 'connection-0', status: 'Error', error: 'bad' })
    expect(resources[3]).toMatchObject({ id: 'Phone', name: 'Device' })
  })

  // Verifies the search param is omitted entirely (not sent as undefined/empty string)
  // when no search term or an empty string is supplied.
  it('omits search param when not provided or empty', async () => {
    api.get.mockResolvedValue({ data: [] })
    await getAvailablePackages()
    expect(api.get).toHaveBeenLastCalledWith('/packages/available', { params: {} })
    await getAvailablePackages('')
    expect(api.get).toHaveBeenLastCalledWith('/packages/available', { params: {} })
  })

  // Ensures install/uninstall thread the given package name through (rather than a
  // hardcoded value) and that both return the server's response payload.
  it('install/uninstall thread the package name and return response data', async () => {
    api.post.mockResolvedValue({ data: { ok: true } })
    expect(await installPackage('x')).toEqual({ ok: true })
    expect(await uninstallPackage('y')).toEqual({ ok: true })
    expect(api.post).toHaveBeenNthCalledWith(1, '/packages/install', ['x'])
    expect(api.post).toHaveBeenNthCalledWith(2, '/packages/uninstall', ['y'])
  })


  // Covers optional list filters, multipart plan uploads, and remote import forwarding.

  it('handles test-plan query parameters, form data, and remote imports', async () => {
    api.get.mockResolvedValue({ data: [] })
    await getTestPlans()
    expect(api.get).toHaveBeenCalledWith('/testplans', { params: undefined })

    api.post.mockResolvedValue({ data: 'ok' })
    const file = new File(['plan'], 'plan.tap')
    await uploadTapPlan(file, ' plans/demo ')
    const uploadForm = api.post.mock.calls[0][1] as FormData
    expect(uploadForm.get('file')).toBe(file)
    expect(uploadForm.get('destinationPath')).toBe('plans/demo')

    const payload = { sourceType: 'rest' as const, sourceUrl: 'https://example.test/plan' }
    await importRemoteTestPlan(payload)
    expect(api.post).toHaveBeenLastCalledWith('/testplans/import-remote', payload)
  })

  // Confirms a rootPath argument is forwarded as a query param, and that omitting
  // it (or trimming to empty) sends no destinationPath in the multipart upload.
  it('passes rootPath as a query param and skips blank destination paths on upload', async () => {
    api.get.mockResolvedValue({ data: [] })
    await getTestPlans('lab/suite')
    expect(api.get).toHaveBeenCalledWith('/testplans', { params: { rootPath: 'lab/suite' } })

    api.post.mockResolvedValue({ data: 'ok' })
    const file = new File(['plan'], 'plan.tap')
    await uploadTapPlan(file, '   ')
    const uploadForm = api.post.mock.calls[0][1] as FormData
    expect(uploadForm.get('file')).toBe(file)
    expect(uploadForm.get('destinationPath')).toBeNull()

    await uploadTapPlan(file)
    const uploadFormNoPath = api.post.mock.calls[1][1] as FormData
    expect(uploadFormNoPath.get('destinationPath')).toBeNull()
  })

  // Confirms the multipart upload sets the correct Content-Type header, distinct
  // from JSON-body endpoints in this module.
  it('sends the correct multipart Content-Type header for tap plan uploads', async () => {
    api.post.mockResolvedValue({ data: 'ok' })
    const file = new File(['plan'], 'plan.tap')
    await uploadTapPlan(file, 'plans/demo')
    const [, , config] = api.post.mock.calls[0]
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  // Verifies the standalone package uploader builds multipart data, forwards the
  // exact File object, sets the upload header, and returns the backend payload.
  it('uploads and installs a package using multipart form data', async () => {
    const file = new File(['package'], 'driver.zip', { type: 'application/zip' })
    api.post.mockResolvedValueOnce({ data: { installed: true } })

    await expect(postUploadPackages(file)).resolves.toEqual({ installed: true })
    expect(api.post).toHaveBeenCalledWith(
      '/packages/upload-install',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect((api.post.mock.calls[0][1] as FormData).get('file')).toBe(file)
  })

  // Covers plugin discovery endpoints, including populated/empty payload pass-through
  // and the optional search query contract.
  it('gets installed plugins and plugin resource type lists', async () => {
    api.get
      .mockResolvedValueOnce({ data: [{ name: 'Scope' }] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: ['Step'] })
      .mockResolvedValueOnce({ data: ['Instrument'] })
      .mockResolvedValueOnce({ data: ['Dut'] })
      .mockResolvedValueOnce({ data: ['Connection'] })
      .mockResolvedValueOnce({ data: ['Result'] })
      .mockResolvedValueOnce({ data: ['Trace'] })

    await expect(getInstalledPlugins('scope')).resolves.toEqual([{ name: 'Scope' }])
    expect(api.get).toHaveBeenNthCalledWith(1, '/plugins', { params: { search: 'scope' } })
    await expect(getInstalledPlugins('')).resolves.toEqual([])
    expect(api.get).toHaveBeenNthCalledWith(2, '/plugins', { params: {} })
    await expect(getSteps()).resolves.toEqual(['Step'])
    await expect(getInstruments()).resolves.toEqual(['Instrument'])
    await expect(getDuts()).resolves.toEqual(['Dut'])
    await expect(getConnections()).resolves.toEqual(['Connection'])
    await expect(getResultListeners()).resolves.toEqual(['Result'])
    await expect(getTraceListeners()).resolves.toEqual(['Trace'])

    expect(api.get.mock.calls.slice(2).map(([url]) => url)).toEqual([
      '/plugins/test-steps', '/plugins/instruments', '/plugins/duts',
      '/plugins/connections', '/plugins/result-listeners', '/plugins/trace-listeners',
    ])
  })

  // Verifies plugin removal uses DELETE with a JSON body and upload uses multipart data.
  it('removes and uploads plugins with the required request formats', async () => {
    const plugin = { pluginName: 'Scope', packageName: 'Vendor.Scope', assembly: 'Scope.dll' }
    api.delete.mockResolvedValueOnce({ data: { removed: true } })
    await expect(removePlugin(plugin)).resolves.toEqual({ removed: true })
    expect(api.delete).toHaveBeenCalledWith('/plugins/remove', {
      data: plugin,
      headers: { 'Content-Type': 'application/json' },
    })

    const file = new File(['plugin'], 'plugin.zip')
    api.post.mockResolvedValueOnce({ data: { uploaded: true } })
    await expect(uploadPlugin(file)).resolves.toEqual({ uploaded: true })
    expect(api.post).toHaveBeenLastCalledWith(
      '/plugins/upload', expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect((api.post.mock.calls[0][1] as FormData).get('file')).toBe(file)
  })

  // Covers every run endpoint and confirms the run ID is embedded in each URL.
  it('gets run state and logs and controls a run', async () => {
    api.get
      .mockResolvedValueOnce({ data: { status: 'Running' } })
      .mockResolvedValueOnce({ data: ['started'] })
    api.post
      .mockResolvedValueOnce({ data: { status: 'Cancelled' } })
      .mockResolvedValueOnce({ data: { status: 'Paused' } })
      .mockResolvedValueOnce({ data: { status: 'Running' } })

    await expect(getRunStatus('run 1')).resolves.toEqual({ status: 'Running' })
    await expect(getRunLogs('run 1')).resolves.toEqual(['started'])
    await expect(cancelRun('run 1')).resolves.toEqual({ status: 'Cancelled' })
    await expect(pauseRun('run 1')).resolves.toEqual({ status: 'Paused' })
    await expect(resumeRun('run 1')).resolves.toEqual({ status: 'Running' })
    expect(api.get.mock.calls.map(([url]) => url)).toEqual(['/runs/run 1', '/runs/run 1/logs'])
    expect(api.post.mock.calls.map(([url]) => url)).toEqual([
      '/runs/run 1/cancel', '/runs/run 1/pause', '/runs/run 1/resume',
    ])
  })

  // The stream URL uses the configured Axios base URL and removes one trailing slash.
  it('builds a run-log stream URL from the default server base URL', () => {
    expect(getRunLogsStreamUrl('abc')).toBe('http://default.test/runs/abc/logs/stream')
  })

  // Covers editor/schema reads and all JSON test-plan mutations, checking both
  // endpoint selection and exact payload pass-through.
  it('gets test-plan models and schema and sends compose/create/run payloads', async () => {
    const planPayload = { name: 'Smoke', steps: [{ type: 'Delay' }] }
    api.post
      .mockResolvedValueOnce({ data: { path: 'plans/a.tap' } })
      .mockResolvedValueOnce({ data: { composed: true } })
      .mockResolvedValueOnce({ data: { created: true } })
      .mockResolvedValueOnce({ data: { runId: 'r1' } })
    api.get.mockResolvedValueOnce({ data: { properties: [] } })

    await expect(getTestPlanEditorModel('plans/a.tap')).resolves.toEqual({ path: 'plans/a.tap' })
    await expect(getStepSchema('Vendor.Delay')).resolves.toEqual({ properties: [] })
    await expect(composeTestPlan(planPayload)).resolves.toEqual({ composed: true })
    await expect(createTestPlan(planPayload)).resolves.toEqual({ created: true })
    await expect(runTestPlan(planPayload)).resolves.toEqual({ runId: 'r1' })

    expect(api.post.mock.calls).toEqual([
      ['/testplans/editor-model', { path: 'plans/a.tap' }],
      ['/testplans/compose', planPayload],
      ['/testplans/create', planPayload],
      ['/testplans/run', planPayload],
    ])
    expect(api.get).toHaveBeenCalledWith('/testplans/steps/schema', {
      params: { stepTypeName: 'Vendor.Delay' },
    })
  })

  // Checks utility boundary values used by resource normalization.
  it('extracts short type names and handles empty or trailing-dot values', () => {
    expect(extractTypeName('Vendor.Driver.Scope')).toBe('Scope')
    expect(extractTypeName('Scope')).toBe('Scope')
    expect(extractTypeName('')).toBe('')
    expect(extractTypeName('Vendor.')).toBe('Vendor.')
  })

  // Mutation/schema request contracts are checked independently from return values.
  it('sends exact resource mutation payloads and explicit schema kinds', async () => {
    const add = { resourceKind: 'dut', pluginTypeName: 'Phone', name: 'D1', properties: { Port: 1 } }
    const update = { resourceKind: 'dut', name: 'D1', newName: 'D2', properties: { Port: 2 } }
    const remove = { resourceKind: 'dut', name: 'D2' }
    api.post.mockResolvedValue({ data: {} })
    api.get.mockResolvedValueOnce({ data: { resourceKind: 'dut' } })

    await addResource(add)
    await updateResource(update)
    await deleteResource(remove)
    await getResourceSchema('Phone', 'dut')

    expect(api.post.mock.calls).toEqual([
      ['plugins/resources/add', add],
      ['plugins/resources/update', update],
      ['plugins/resources/delete', remove],
    ])
    expect(api.get).toHaveBeenCalledWith('plugins/resources/schema', {
      params: { resourceKind: 'dut', pluginTypeName: 'Phone' },
    })
  })

  // Every adapter intentionally leaves transport failures rejected for hooks/UI
  // to handle; representative GET, POST, DELETE, and multipart calls verify that rule.
  it('propagates transport errors from all request styles', async () => {
    const error = new Error('server unavailable')
    api.get.mockRejectedValue(error)
    api.post.mockRejectedValue(error)
    api.delete.mockRejectedValue(error)

    await expect(getSteps()).rejects.toBe(error)
    await expect(runTestPlan({})).rejects.toBe(error)
    await expect(removePlugin({ pluginName: 'x' })).rejects.toBe(error)
    await expect(postUploadPackages(new File(['x'], 'x.zip'))).rejects.toBe(error)
    await expect(getResourceSchema('x')).rejects.toBe(error)
  })

})