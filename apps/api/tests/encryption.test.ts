import { randomBytes } from "node:crypto";

import { assert, describe, it } from "@effect/vitest";

import { decryptText, encryptText } from "@/libs/encryption";

describe("encryption at rest", () => {
  it("round-trips text with a 32-byte key", () => {
    const key = randomBytes(32);
    const encrypted = encryptText("Jane Doe — Backend Engineer", key);

    assert.isTrue(encrypted.startsWith("enc:v1:"));
    assert.notStrictEqual(encrypted, "Jane Doe — Backend Engineer");
    assert.strictEqual(decryptText(encrypted, key), "Jane Doe — Backend Engineer");
  });

  it("leaves plaintext values readable", () => {
    assert.strictEqual(decryptText("plain text"), "plain text");
  });

  it("does not decrypt with the wrong key", () => {
    const encrypted = encryptText("secret", randomBytes(32));

    assert.throws(() => decryptText(encrypted, randomBytes(32)));
  });

  it("rejects a key that is not 32 bytes", () => {
    assert.throws(() => encryptText("secret", Buffer.alloc(16)));
  });
});
