"use client";

import { useEffect, useState } from "react";

// 파괴적 액션 공용 인라인 2단계 확인: 탭 → "정말 X?" → 한 번 더 탭 시 제출, 3초 후 자동 복귀.
// 인스턴스마다 상태를 가지므로 목록에서 항목별로 독립 동작.
export default function ConfirmSubmit({
  action,
  hidden,
  label,
  confirmLabel,
  triggerClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  label: string;
  confirmLabel: string;
  triggerClassName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  return confirming ? (
    <form action={action} className="contents">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="animate-[fade-in_0.15s_ease] text-[11px] font-bold text-accent"
      >
        {confirmLabel}
      </button>
    </form>
  ) : (
    <button onClick={() => setConfirming(true)} className={triggerClassName}>
      {label}
    </button>
  );
}
