const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const textEncoder = new TextEncoder();

function readUint16(view, offset) {
  return view.getUint16(offset, true);
}

function readUint32(view, offset) {
  return view.getUint32(offset, true);
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("This browser does not support zip import yet.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function decodeUtf8(bytes) {
  return new TextDecoder("utf-8").decode(bytes);
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
}

function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
}

const CRC32_TABLE = buildCrc32Table();

function computeCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function normalizeZipEntryData(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (typeof data === "string") return textEncoder.encode(data);
  throw new Error("Unsupported zip entry data type.");
}

function findEndOfCentralDirectory(view) {
  const minOffset = Math.max(0, view.byteLength - 0xffff - 22);
  for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
    if (readUint32(view, offset) === EOCD_SIGNATURE) return offset;
  }
  return -1;
}

export async function readZipArchive(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  if (eocdOffset < 0) throw new Error("Invalid zip file.");

  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);
  const files = new Map();
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (readUint32(view, cursor) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid zip central directory.");
    }
    const compressionMethod = readUint16(view, cursor + 10);
    const compressedSize = readUint32(view, cursor + 20);
    const fileNameLength = readUint16(view, cursor + 28);
    const extraLength = readUint16(view, cursor + 30);
    const commentLength = readUint16(view, cursor + 32);
    const localHeaderOffset = readUint32(view, cursor + 42);
    const fileNameBytes = bytes.slice(cursor + 46, cursor + 46 + fileNameLength);
    const fileName = decodeUtf8(fileNameBytes);

    cursor += 46 + fileNameLength + extraLength + commentLength;
    if (!fileName || fileName.endsWith("/")) continue;

    if (readUint32(view, localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error(`Invalid local file header for ${fileName}.`);
    }
    const localNameLength = readUint16(view, localHeaderOffset + 26);
    const localExtraLength = readUint16(view, localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedBytes = bytes.slice(dataStart, dataStart + compressedSize);

    let uncompressedBytes;
    if (compressionMethod === 0) {
      uncompressedBytes = compressedBytes;
    } else if (compressionMethod === 8) {
      uncompressedBytes = await inflateRaw(compressedBytes);
    } else {
      throw new Error(`Unsupported zip compression method ${compressionMethod} for ${fileName}.`);
    }

    files.set(fileName, uncompressedBytes);
  }

  return files;
}

export function getZipEntryText(files, path) {
  const bytes = files.get(path);
  if (!bytes) return null;
  return decodeUtf8(bytes);
}

export function getZipEntryBlob(files, path, type = "application/octet-stream") {
  const bytes = files.get(path);
  if (!bytes) return null;
  return new Blob([bytes], { type });
}

export async function createZipArchive(entries) {
  const normalizedEntries = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = String(entry?.name || "").replace(/^\/+/, "");
    if (!name) throw new Error("Zip entry name is required.");
    const nameBytes = textEncoder.encode(name);
    const dataBytes = await normalizeZipEntryData(entry.data);
    const crc32 = computeCrc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, LOCAL_FILE_HEADER_SIGNATURE);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, crc32);
    writeUint32(localView, 18, dataBytes.length);
    writeUint32(localView, 22, dataBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    normalizedEntries.push({
      nameBytes,
      dataBytes,
      crc32,
      localOffset,
      localHeader,
    });
    localOffset += localHeader.length + dataBytes.length;
  }

  const parts = [];
  for (const entry of normalizedEntries) {
    parts.push(entry.localHeader, entry.dataBytes);
  }

  const centralDirectoryParts = [];
  let centralDirectorySize = 0;
  for (const entry of normalizedEntries) {
    const directoryHeader = new Uint8Array(46 + entry.nameBytes.length);
    const directoryView = new DataView(directoryHeader.buffer);
    writeUint32(directoryView, 0, CENTRAL_DIRECTORY_SIGNATURE);
    writeUint16(directoryView, 4, 20);
    writeUint16(directoryView, 6, 20);
    writeUint16(directoryView, 8, 0);
    writeUint16(directoryView, 10, 0);
    writeUint16(directoryView, 12, 0);
    writeUint16(directoryView, 14, 0);
    writeUint32(directoryView, 16, entry.crc32);
    writeUint32(directoryView, 20, entry.dataBytes.length);
    writeUint32(directoryView, 24, entry.dataBytes.length);
    writeUint16(directoryView, 28, entry.nameBytes.length);
    writeUint16(directoryView, 30, 0);
    writeUint16(directoryView, 32, 0);
    writeUint16(directoryView, 34, 0);
    writeUint16(directoryView, 36, 0);
    writeUint32(directoryView, 38, 0);
    writeUint32(directoryView, 42, entry.localOffset);
    directoryHeader.set(entry.nameBytes, 46);
    centralDirectoryParts.push(directoryHeader);
    centralDirectorySize += directoryHeader.length;
  }
  parts.push(...centralDirectoryParts);

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  writeUint32(eocdView, 0, EOCD_SIGNATURE);
  writeUint16(eocdView, 4, 0);
  writeUint16(eocdView, 6, 0);
  writeUint16(eocdView, 8, normalizedEntries.length);
  writeUint16(eocdView, 10, normalizedEntries.length);
  writeUint32(eocdView, 12, centralDirectorySize);
  writeUint32(eocdView, 16, localOffset);
  writeUint16(eocdView, 20, 0);
  parts.push(eocd);

  return new Blob(parts, { type: "application/zip" });
}
