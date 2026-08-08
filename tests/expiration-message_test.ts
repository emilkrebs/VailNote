import { assertEquals } from '$std/assert/assert_equals.ts';
import { formatExpirationMessage } from '../lib/types.ts';

Deno.test('formatExpirationMessage - multi-day intervals show the largest unit only', () => {
    const now = Date.now();
    const message = formatExpirationMessage(
        new Date(now + (3 * 86_400 + 2 * 3_600 + 5 * 60 + 30) * 1000),
    );
    assertEquals(message, '3 days');
});

Deno.test('formatExpirationMessage - single day shows singular form', () => {
    const now = Date.now();
    const message = formatExpirationMessage(
        new Date(now + (86_400 + 3_600) * 1000),
    );
    assertEquals(message, '1 day');
});

Deno.test('formatExpirationMessage - hour intervals show hours only', () => {
    const now = Date.now();
    const message = formatExpirationMessage(
        new Date(now + (2 * 3_600 + 13 * 60) * 1000),
    );
    assertEquals(message, '2 hours');
});

Deno.test('formatExpirationMessage - minute intervals show minutes only', () => {
    const now = Date.now();
    const message = formatExpirationMessage(
        new Date(now + (13 * 60 + 45) * 1000),
    );
    assertEquals(message, '13 minutes');
});

Deno.test('formatExpirationMessage - sub-minute intervals show seconds only', () => {
    const now = Date.now();
    const message = formatExpirationMessage(new Date(now + 45_000));
    assertEquals(message, '45 seconds');
});

Deno.test('formatExpirationMessage - expired notes are labeled', () => {
    assertEquals(formatExpirationMessage(new Date(Date.now() - 5_000)), 'Expired');
});
