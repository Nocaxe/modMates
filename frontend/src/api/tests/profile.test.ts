import { expect, it, vi } from "vitest";
import { getProfile } from "../profile";

it('calls the correct endpoint with the bearer token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user_id: 'test', email: 'test@example.com'}),
    }))

    const result = await getProfile('test-token')

    expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/profile'),
        { headers: { Authorization: 'Bearer test-token' } }
    )
    expect(result).toEqual({ user_id: 'test', email: 'test@example.com' })
})

it('throws error when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(getProfile('test-token')).rejects.toThrow('Failed to get profile')
})