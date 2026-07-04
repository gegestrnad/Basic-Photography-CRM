// Helper: serialize Prisma records to API-safe plain objects (convert Date → ISO string)
export function serialize<T extends Record<string, any>>(obj: T): T {
  const out: any = Array.isArray(obj) ? [] : {};
  for (const k in obj) {
    const v = obj[k];
    if (v instanceof Date) (out as any)[k] = v.toISOString();
    else if (v && typeof v === 'object') (out as any)[k] = serialize(v);
    else (out as any)[k] = v;
  }
  return out as T;
}

// Helper: parse a JSON string field safely
export function parseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}
