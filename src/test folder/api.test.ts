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
import { getAvailablePackages, getInstalledPackages, installPackage, uninstallPackage } from '../app/api/package'
import {
  cancelRun, getRunLogsStreamUrl, removePlugin, uploadPlugin,
} from '../app/api/plugin'
import {
  addResource, deleteResource, getResources, getResourceSchema, updateResource,
} from '../app/api/resources'
import { getSystemKpis, type SystemKpisResponse } from '../app/api/system'
import { getTestPlans, getTestPlanEditorModel, composeTestPlan, createTestPlan, runTestPlan, importRemoteTestPlan, uploadTapPlan, getStepSchema } from '../app/api/testplans'
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

})
