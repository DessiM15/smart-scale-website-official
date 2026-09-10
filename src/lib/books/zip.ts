/**
 * A zip file, written as it goes.
 *
 * Plain "store" entries, no compression: the contents are JPEGs, which do
 * not shrink, and a handful of small CSVs. Each entry is a local header
 * followed by its bytes, the central directory comes at the end, and the
 * whole thing is a ReadableStream so a year of photos never has to sit in
 * memory at once. No dependency, because the format is forty years old and
 * this needs a tenth of it.
 */

export type ZipEntry = { name: string; data: Buffer; mtime?: Date };

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** MS-DOS time and date, which is what zip headers carry. */
function dosStamp(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getUTCFullYear());
  const time = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const date = ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { time, date };
}

type Central = { name: Buffer; crc: number; size: number; offset: number; time: number; date: number };

function localHeader(name: Buffer, crc: number, size: number, time: number, date: number): Buffer {
  const h = Buffer.alloc(30 + name.length);
  h.writeUInt32LE(0x04034b50, 0);
  h.writeUInt16LE(20, 4); // version needed
  h.writeUInt16LE(0x0800, 6); // flags: names are UTF-8
  h.writeUInt16LE(0, 8); // method: store
  h.writeUInt16LE(time, 10);
  h.writeUInt16LE(date, 12);
  h.writeUInt32LE(crc, 14);
  h.writeUInt32LE(size, 18);
  h.writeUInt32LE(size, 22);
  h.writeUInt16LE(name.length, 26);
  h.writeUInt16LE(0, 28);
  name.copy(h, 30);
  return h;
}

function centralHeader(c: Central): Buffer {
  const h = Buffer.alloc(46 + c.name.length);
  h.writeUInt32LE(0x02014b50, 0);
  h.writeUInt16LE(20, 4); // made by
  h.writeUInt16LE(20, 6); // needed
  h.writeUInt16LE(0x0800, 8);
  h.writeUInt16LE(0, 10);
  h.writeUInt16LE(c.time, 12);
  h.writeUInt16LE(c.date, 14);
  h.writeUInt32LE(c.crc, 16);
  h.writeUInt32LE(c.size, 20);
  h.writeUInt32LE(c.size, 24);
  h.writeUInt16LE(c.name.length, 28);
  h.writeUInt16LE(0, 30); // extra
  h.writeUInt16LE(0, 32); // comment
  h.writeUInt16LE(0, 34); // disk
  h.writeUInt16LE(0, 36); // internal attrs
  h.writeUInt32LE(0, 38); // external attrs
  h.writeUInt32LE(c.offset, 42);
  c.name.copy(h, 46);
  return h;
}

function endRecord(count: number, cdSize: number, cdOffset: number): Buffer {
  const e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0);
  e.writeUInt16LE(0, 4);
  e.writeUInt16LE(0, 6);
  e.writeUInt16LE(count, 8);
  e.writeUInt16LE(count, 10);
  e.writeUInt32LE(cdSize, 12);
  e.writeUInt32LE(cdOffset, 16);
  e.writeUInt16LE(0, 20);
  return e;
}

/**
 * Entries in, zip bytes out, one entry per pull. The source is async so a
 * photo can be fetched and unsealed only when the stream is ready for it.
 * Plain zip, not zip64: fine up to 4 GB and 65,000 files, which is many
 * years of receipts.
 */
export function zipStream(source: AsyncIterable<ZipEntry>): ReadableStream<Uint8Array> {
  const iterator = source[Symbol.asyncIterator]();
  const central: Central[] = [];
  let offset = 0;
  let finished = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (finished) return;
      const next = await iterator.next();
      if (next.done) {
        const cdOffset = offset;
        let cdSize = 0;
        for (const c of central) {
          const h = centralHeader(c);
          controller.enqueue(new Uint8Array(h));
          cdSize += h.length;
        }
        controller.enqueue(new Uint8Array(endRecord(central.length, cdSize, cdOffset)));
        finished = true;
        controller.close();
        return;
      }
      const entry = next.value;
      const name = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
      const { time, date } = dosStamp(entry.mtime ?? new Date());
      const crc = crc32(entry.data);
      const header = localHeader(name, crc, entry.data.length, time, date);
      central.push({ name, crc, size: entry.data.length, offset, time, date });
      controller.enqueue(new Uint8Array(header));
      controller.enqueue(new Uint8Array(entry.data));
      offset += header.length + entry.data.length;
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}
