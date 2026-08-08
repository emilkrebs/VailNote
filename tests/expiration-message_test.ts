import { assertEquals } from '$std/assert/assert_equals.ts';
import { formatExpiration, formatExpirationMessage } from '../lib/types.ts';

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

Deno.test('formatExpiration - human-readable values map to the right duration', () => {
    const now = Date.now();
    const tenMinutes = formatExpiration('10 minutes').getTime() - now;
    const oneHour = formatExpiration('1 hour').getTime() - now;
    const threeDays = formatExpiration('3 days').getTime() - now;
    const ninetyDays = formatExpiration('90 days').getTime() - now;
    const oneHundredEightyDays = formatExpiration('180 days').getTime() - now;

    assertEquals(Math.round(tenMinutes / 1000), 10 * 60);
    assertEquals(Math.round(oneHour / 1000), 60 * 60);
    assertEquals(Math.round(threeDays / 1000), 3 * 86_400);
    assertEquals(Math.round(ninetyDays / 1000), 90 * 86_400);
    assertEquals(Math.round(oneHundredEightyDays / 1000), 180 * 86_400);
});

Deno.test('formatExpiration - short codes still resolve (CLI compatibility)', () => {
    const now = Date.now();
    assertEquals(
        Math.round((formatExpiration('10m').getTime() - now) / 1000),
        Math.round((formatExpiration('10 minutes').getTime() - now) / 1000),
    );
    assertEquals(
        Math.round((formatExpiration('30d').getTime() - now) / 1000),
        Math.round((formatExpiration('30 days').getTime() - now) / 1000),
    );
    assertEquals(
        Math.round((formatExpiration('180d').getTime() - now) / 1000),
        Math.round((formatExpiration('180 days').getTime() - now) / 1000),
    );
});
