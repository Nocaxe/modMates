import { expect, it, vi } from "vitest";
import { getProfile, updateProfile } from "../profile";

it('calls the correct endpoint with the bearer token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user_id: 'test', email: 'test@example.com', display_name: null }),
    }))

    const result = await getProfile('test-token')

    expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/profile'),
        { headers: { Authorization: 'Bearer test-token' } }
    )
    expect(result).toEqual({ user_id: 'test', email: 'test@example.com', display_name: null })
})

it('throws error when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(getProfile('test-token')).rejects.toThrow('Failed to get profile')
})

it('updateProfile sends PUT with display_name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user_id: 'test', email: 'test@example.com', display_name: 'Alice' }),
    }))

    const result = await updateProfile('test-token', 'Alice')

    expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/profile'),
        expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
            body: JSON.stringify({ display_name: 'Alice' }),
        })
    )
    expect(result).toEqual({ user_id: 'test', email: 'test@example.com', display_name: 'Alice' })
})

it('updateProfile throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(updateProfile('test-token', 'Alice')).rejects.toThrow('Failed to update profile')
})
