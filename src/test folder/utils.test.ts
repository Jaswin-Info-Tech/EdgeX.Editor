import { describe, expect, it } from 'vitest'

import { cn } from '../app/components/ui/utils'

describe('cn', () => {
    it('joins multiple string class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('returns an empty string when given no arguments', () => {
        expect(cn()).toBe('')
    })

    it('ignores falsy values (undefined, null, false, empty string)', () => {
        expect(cn('foo', undefined, null, false, '', 'bar')).toBe('foo bar')
    })

    it('supports conditional object syntax', () => {
        expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })

    it('supports array syntax', () => {
        expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('supports nested arrays and objects mixed together', () => {
        expect(
            cn('base', ['foo', { bar: true, baz: false }], undefined, 'qux'),
        ).toBe('base foo bar qux')
    })

    it('merges conflicting Tailwind utility classes, keeping the last one', () => {
        expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('merges conflicting classes across multiple arguments in order', () => {
        expect(cn('text-sm', 'font-bold', 'text-lg')).toBe('font-bold text-lg')
    })

    it('does not merge non-conflicting classes', () => {
        expect(cn('flex', 'items-center', 'justify-between')).toBe(
            'flex items-center justify-between',
        )
    })

    it('resolves conflicts from conditional object syntax the same as plain strings', () => {
        expect(cn('p-2', { 'p-4': true })).toBe('p-4')
    })

    it('keeps the last conflicting class even when earlier ones come from a truthy condition', () => {
        expect(cn({ 'bg-red-500': true }, 'bg-blue-500')).toBe('bg-blue-500')
    })

    it('handles a real-world className merge pattern (default + override className prop)', () => {
        const defaultClasses = 'rounded-md border px-3 py-1 text-sm'
        const overrideClassName = 'py-2 text-base'

        expect(cn(defaultClasses, overrideClassName)).toBe(
            'rounded-md border px-3 py-2 text-base',
        )
    })

    it('preserves non-Tailwind custom classes without merging them', () => {
        expect(cn('my-custom-class', 'another-custom-class')).toBe(
            'my-custom-class another-custom-class',
        )
    })

    it('deduplicates identical classes via tailwind-merge conflict resolution', () => {
        expect(cn('flex', 'flex')).toBe('flex')
    })
})