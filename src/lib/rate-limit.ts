import { RateLimitError } from "@/lib/errors";

interface FixedWindowState {
  count: number;
  windowStartedAt: number;
}

const windowsByKey = new Map<string, FixedWindowState>();

/**
 * 서버 프로세스 메모리 기반 고정 윈도우 카운터. 자체 DB를 두지 않는 아키텍처 결정(architecture.md)에
 * 맞춰 별도 저장소 없이 처리한다 — 서버리스 인스턴스가 여러 개면 인스턴스별로 독립적으로 카운트되므로
 * 완벽한 차단은 아니지만, "기본적인" 빈도 제한(architecture.md 보안 섹션)이라는 요구 수준은 충족한다.
 */
export function assertWithinRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): void {
  const now = Date.now();
  const state = windowsByKey.get(key);

  if (!state || now - state.windowStartedAt >= windowMs) {
    windowsByKey.set(key, { count: 1, windowStartedAt: now });
    return;
  }

  if (state.count >= limit) {
    const retryAfterSeconds = Math.ceil(
      (state.windowStartedAt + windowMs - now) / 1000
    );
    throw new RateLimitError(retryAfterSeconds);
  }

  state.count += 1;
}
