import { ExtractCvRequestSchema, FILE_LIMITS } from "@ai-interview/shared";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";

import { isPdf } from "@/modules/cv/validation";

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

describe("ExtractCvRequestSchema", () => {
  it("accepts a PDF file and an optional model", () => {
    const file = new File([bytes(0x25, 0x50, 0x44, 0x46, 0x2d)], "cv.pdf", {
      type: "application/pdf",
    });

    const body = Schema.decodeUnknownSync(ExtractCvRequestSchema)({
      file,
      model: "gemini-3.6-flash",
    });

    assert.strictEqual(body.file.name, "cv.pdf");
    assert.strictEqual(body.model, "gemini-3.6-flash");
  });

  it("rejects an empty file", () => {
    assert.throws(() =>
      Schema.decodeUnknownSync(ExtractCvRequestSchema)({
        file: new File([], "empty.pdf"),
      }),
    );
  });

  it("rejects a file over the size limit", () => {
    assert.throws(() =>
      Schema.decodeUnknownSync(ExtractCvRequestSchema)({
        file: new File([new Uint8Array(FILE_LIMITS.cvBytes + 1)], "big.pdf"),
      }),
    );
  });
});
