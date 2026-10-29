/** Whether the bytes carry the PDF signature (`%PDF-`). */
export function isPdf(data: Uint8Array): boolean {
  return (
    data.length >= 5 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46 &&
    data[4] === 0x2d
  );
}
