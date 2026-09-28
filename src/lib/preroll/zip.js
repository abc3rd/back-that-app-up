// Store-only (no compression) ZIP builder — bundles files into a .zip that
// every OS opens natively. Audio clips are already encoded WAV, so storing
// them uncompressed keeps the build instant with no external dependency.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const u16 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
const u32 = (n) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);

function concat(parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

async function toBytes(data) {
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return data;
}

// files: [{ name: string, data: Blob | ArrayBuffer | Uint8Array }]
export async function buildZip(files) {
  const enc = new TextEncoder();
  const localChunks = [];
  const centralRecords = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = enc.encode(file.name);
    const data = await toBytes(file.data);
    const crc = crc32(data);
    const size = data.length;

    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0),
      u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0),
      nameBytes,
      data,
    ]);
    localChunks.push(local);

    centralRecords.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
      u32(0), u32(crc), u32(size), u32(size),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset),
      nameBytes,
    ]));

    offset += local.length;
  }

  const centralBytes = concat(centralRecords);
  const eocd = concat([
    u32(0x06054b50), u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(centralBytes.length), u32(offset), u16(0),
  ]);

  return new Blob([concat([...localChunks, centralBytes, eocd])], { type: 'application/zip' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}