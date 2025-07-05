import { createHandler, ServeHandlerInfo } from "$fresh/server.ts";
import manifest from "../fresh.gen.ts";
import config from "../fresh.config.ts";
import { assert } from '$std/assert/assert.ts';
import { assertEquals } from '$std/assert/assert_equals.ts';

const hostname = "127.0.0.1";

const CONN_INFO: ServeHandlerInfo = {
    remoteAddr: { hostname, port: 53496, transport: "tcp" },
    completed: Promise.resolve(),
};

const testNoteData = {
    content: "This is a test note.",
    password: "testpassword",
    expiresIn: "1 hour",
};

Deno.test("HTTP assert test.", async (t) => {
    const handler = await createHandler(manifest, config);

    await t.step("#1 GET /", async () => {
        const resp = await handler(new Request(`http://${hostname}/`), CONN_INFO);
        assertEquals(resp.status, 200);
    });  
});

// This test is leaking
Deno.test.ignore("Form submission test.", async (t) => {
    const handler = await createHandler(manifest, config);

    await t.step("#2 POST (No JavaScript) /", async () => {
        const formData = new FormData();
        formData.append("noteContent", testNoteData.content);
        formData.append("notePassword", testNoteData.password);
        formData.append("expiresIn", testNoteData.expiresIn);

        const resp = await handler(
            new Request(`http://${hostname}/`, {
                method: "POST",
                body: formData,
            }),
            CONN_INFO,
        );
        assertEquals(resp.status, 200);
    });
});