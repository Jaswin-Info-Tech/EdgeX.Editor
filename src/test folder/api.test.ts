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
  cancelRun, getRunLogsStreamUrl, getStepSchema, removePlugin, uploadPlugin,
} from '../app/api/plugin'
import {
  addResource, deleteResource, extractTypeName, getResources, getResourceSchema, updateResource,
} from '../app/api/resources'
import { getTestPlans, importRemoteTestPlan, uploadTapPlan } from '../app/api/testplans'

const api = vi.mocked(axiosClient)

describe('API adapters', () => {
  beforeEach(() => vi.clearAllMocks())

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

  // Covers query parameters, JSON deletion, multipart upload, and run cancellation endpoints.
  it('sends plugin schema, removal, upload, and run requests correctly', async () => {
    api.get.mockResolvedValue({ data: { schema: true } })
    expect(await getStepSchema('Plugin.Step')).toEqual({ schema: true })
    expect(api.get).toHaveBeenCalledWith('/testplans/steps/schema', { params: { stepTypeName: 'Plugin.Step' } })

    api.delete.mockResolvedValue({ data: 'removed' })
    await removePlugin({ pluginName: 'P' })
    expect(api.delete).toHaveBeenCalledWith('/plugins/remove', expect.objectContaining({ data: { pluginName: 'P' } }))

    api.post.mockResolvedValue({ data: 'ok' })
    const file = new File(['x'], 'plugin.zip')
    await uploadPlugin(file)
    const form = api.post.mock.calls[0][1] as FormData
    expect(form.get('file')).toBe(file)
    await cancelRun('run-1')
    expect(api.post).toHaveBeenLastCalledWith('/runs/run-1/cancel')
  })

  // Ensures stream URLs join the server base and run path with exactly one slash.
  it('builds a stream URL from the configured/default server without a duplicate slash', () => {
    expect(getRunLogsStreamUrl('123')).toBe('http://default.test/runs/123/logs/stream')
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

  // Covers the legacy flat response shape and short-name extraction from qualified types.
  it('supports flat resource arrays and extracts dotted type names', async () => {
    api.get.mockResolvedValue({ data: [{ type: 'A.B.C', properties: null }] })
    expect(await getResources()).toEqual([expect.objectContaining({ id: 'resource-0', instrument: 'C', properties: {} })])
    expect(extractTypeName('Namespace.Widget')).toBe('Widget')
    expect(extractTypeName('')).toBe('')
  })

  // Resource writes and schema queries must preserve names, kinds, and property values.
  it('passes resource mutation and schema payloads unchanged', async () => {
    api.post.mockResolvedValue({ data: 'done' })
    const add = { resourceKind: 'instrument', pluginTypeName: 'Scope', name: 'S1', properties: {} }
    const update = { resourceKind: 'instrument', name: 'S1', newName: 'S2', properties: {} }
    const remove = { resourceKind: 'instrument', name: 'S2' }
    await addResource(add); await updateResource(update); await deleteResource(remove)
    expect(api.post.mock.calls.map(call => call[0])).toEqual([
      'plugins/resources/add', 'plugins/resources/update', 'plugins/resources/delete',
    ])
    api.get.mockResolvedValue({ data: { count: 0 } })
    await getResourceSchema('Scope', 'connection')
    expect(api.get).toHaveBeenCalledWith('plugins/resources/schema', {
      params: { resourceKind: 'connection', pluginTypeName: 'Scope' },
    })
  })

  // Covers optional list filters, multipart plan uploads, and remote import forwarding.
  // Covers optional list filters, multipart plan uploads, and remote imports.
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
})
