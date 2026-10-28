import { assert, describe, it } from "@effect/vitest";

import { isPdf } from "@/modules/cv/service";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("isPdf", () => {
  it("accepts a file that starts with the PDF signature", () => {
    assert.isTrue(isPdf(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e)));
  });

  it("rejects other content", () => {
    assert.isFalse(isPdf(bytes(0x50, 0x4b, 0x03, 0x04)));
    assert.isFalse(isPdf(new Uint8Array()));
  });
});
