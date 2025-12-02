// src/strokeData.ts
// ------------------------------------------------------------
// Các tiện ích cho kiểm tra/ tải dữ liệu nét chữ Hán (Kanji)
// dùng cho HanziWriter. Thiết kế để dùng được ngay trong
// getNextQuizType (validate có Kanji) và UI (HanziWriter).
// ------------------------------------------------------------

import HanziWriter from 'hanzi-writer';

// ------------------------------------------------------------------
// 1) Regex bắt toàn bộ chữ Hán (mọi extension) một cách CHẮC CHẮN
//    - Ưu tiên Unicode Property Escapes: \p{Script=Han}
//    - Fallback khi môi trường không hỗ trợ: liệt kê toàn dải mã
// ------------------------------------------------------------------

// Kiểm tra môi trường có hỗ trợ \p{…} hay không
const HAS_UNICODE_PROPS: boolean = (() => {
  try {
    return /\p{Script=Han}/u.test('漢');
  } catch {
    return false;
  }
})();

// Fallback bao phủ rộng (BMP + Supplementary), Unicode 15+
const KANJI_FALLBACK_RE =
  /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3005\u3007\u3021-\u3029\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}\u{2CEB0}-\u{2EBEF}\u{30000}-\u{3134F}\u{31350}-\u{323AF}\u{2F800}-\u{2FA1F}]/u;

// Regex dùng thực tế
const HAN_RE: RegExp = HAS_UNICODE_PROPS ? /\p{Script=Han}/u : KANJI_FALLBACK_RE;

// Helpers xuất ra ngoài
export const isHanChar = (ch: string): boolean => HAN_RE.test(ch);
export const containsHan = (s: string | null | undefined): boolean =>
  ((s ?? '').normalize('NFKC').match(HAN_RE) ?? null) !== null;

// ------------------------------------------------------------------
// 2) Loader dữ liệu nét - dùng một nguồn duy nhất
//    Nguồn: hanzi-writer-data từ jsdelivr CDN
// ------------------------------------------------------------------

// Cache để tránh load lại
const dataCache = new Map<string, unknown>();
const loadingPromises = new Map<string, Promise<unknown>>();

// Loader chính: thử nhiều nguồn với cache
export function cnCharDataLoader(
  ch: string,
  onComplete: (data: unknown) => void,
  onError: (err: unknown) => void
): void {
  // Kiểm tra cache trước
  if (dataCache.has(ch)) {
    onComplete(dataCache.get(ch)!);
    return;
  }

  // Nếu đang load rồi thì đợi
  if (loadingPromises.has(ch)) {
    loadingPromises.get(ch)!
      .then((data) => onComplete(data))
      .catch((err) => onError(err));
    return;
  }

  // Chỉ dùng một nguồn duy nhất
  const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encodeURIComponent(ch)}.json`;

  const promise = new Promise<unknown>((resolve, reject) => {
    // Timeout sau 5s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(url, {
      signal: controller.signal,
    })
      .then((r) => {
        clearTimeout(timeoutId);
        if (!r.ok) {
          reject(new Error(`No stroke data for ${ch} (HTTP ${r.status})`));
          return;
        }
        return r.json();
      })
      .then((data) => {
        clearTimeout(timeoutId);
        if (data != null) {
          // Cache lại
          dataCache.set(ch, data);
          loadingPromises.delete(ch);
          resolve(data);
        } else {
          reject(new Error(`No stroke data for ${ch}`));
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        loadingPromises.delete(ch);
        // Nếu là lỗi 404, đây là expected behavior (ký tự không có trong dataset)
        if (err instanceof Error && err.message.includes('404')) {
          reject(new Error(`Character ${ch} not found in stroke dataset (404)`));
        } else {
          reject(err);
        }
      });
  });
  loadingPromises.set(ch, promise);

  promise
    .then((data) => onComplete(data))
    .catch((err) => {
      loadingPromises.delete(ch);
      // Chỉ log warning nếu không phải 404 (404 là expected cho một số ký tự)
      const is404 = err instanceof Error && (err.message.includes('404') || err.message.includes('not found'));
      if (!is404) {
        console.warn(`⚠️ Không tải được data cho ${ch}:`, err?.message ?? err);
      }
      onError(err);
    });
}

// Loader cũ (giữ lại để tương thích)
export function cnCharDataLoaderLegacy(
  ch: string,
  onComplete: (data: unknown) => void,
  onError: (err: unknown) => void
): void {
  const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${encodeURIComponent(
    ch
  )}.json`;

  fetch(url)
    .then((r) => {
      if (!r.ok) {
        onError(new Error(`No stroke data for ${ch} (HTTP ${r.status})`));
        return null;
      }
      return r.json();
    })
    .then((data) => {
      if (data != null) onComplete(data);
    })
    .catch((err) => {
      console.warn('⚠️ Không có dataset cho:', ch, err?.message ?? err);
      onError(err);
    });
}

// ------------------------------------------------------------------
// 3) Tải an toàn 1 ký tự → boolean (KHÔNG bao giờ reject)
//    - Mặc định dùng cnCharDataLoader
// ------------------------------------------------------------------
const strokeCache = new Map<string, boolean>(); // cache nhẹ nhàng

export function clearStrokeCache() {
  strokeCache.clear();
  dataCache.clear();
  loadingPromises.clear();
}

export async function safeLoadCharData(
  ch: string,
  loader: typeof cnCharDataLoader = cnCharDataLoader
): Promise<boolean> {
  if (!ch) return false;
  if (strokeCache.has(ch)) return strokeCache.get(ch)!;

  try {
    await HanziWriter.loadCharacterData(ch, { charDataLoader: loader as any });
    strokeCache.set(ch, true);
    return true;
  } catch (err) {
    // Cache kết quả false để tránh thử lại nhiều lần
    strokeCache.set(ch, false);
    // Không log ở đây vì đã log trong cnCharDataLoader
    return false;
  }
}

// ------------------------------------------------------------------
// 4) Kiểm tra 1 "từ" có vẽ nét được không (dành cho chọn quiz)
//    - TRUE khi trong từ có ÍT NHẤT 1 ký tự Hán và
//      TẤT CẢ các ký tự Hán đó đều có dataset trên CDN
//    - Ký tự không phải Hán (hiragana/katakana/latin) được bỏ qua
// ------------------------------------------------------------------
export async function canStrokeWordCN(
  word: string | null | undefined,
  loader: typeof cnCharDataLoader = cnCharDataLoader
): Promise<boolean> {
  const text = (word ?? '').normalize('NFKC').trim();
  if (!text) return false;

  const chars = Array.from(text);
  const hanUnique = Array.from(new Set(chars.filter(isHanChar)));

  if (hanUnique.length === 0) return false; // không có Kanji → không vào stroke

  const results = await Promise.all(hanUnique.map((ch) => safeLoadCharData(ch, loader)));
  return results.every(Boolean);
}

// ------------------------------------------------------------------
// 5) Tiện ích chẩn đoán: ký tự Hán nào thiếu dataset (để log UI)
// ------------------------------------------------------------------
export async function findMissingStrokeChars(
  word: string | null | undefined,
  loader: typeof cnCharDataLoader = cnCharDataLoader
): Promise<string[]> {
  const text = (word ?? '').normalize('NFKC').trim();
  if (!text) return [];

  const hanUnique = Array.from(new Set(Array.from(text).filter(isHanChar)));
  const results = await Promise.all(
    hanUnique.map(async (ch) => ({ ch, ok: await safeLoadCharData(ch, loader) }))
  );
  return results.filter((r) => !r.ok).map((r) => r.ch);
}
