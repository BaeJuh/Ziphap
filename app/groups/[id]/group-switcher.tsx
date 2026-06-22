"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// 헤더 그룹 전환 (커스텀 드롭다운 — 네이티브 select는 OS 메뉴가 테마와 안 맞아서 직접 구현).
export default function GroupSwitcher({
  groups,
  current,
}: {
  groups: { id: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentName = groups.find((g) => g.id === current)?.name ?? "";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5"
        aria-label="그룹 전환"
      >
        <span className="max-w-[220px] truncate text-lg font-bold">{currentName}</span>
        <span className="text-[11px] text-muted">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[160px] origin-top-left animate-[pop-in_0.15s_ease] overflow-hidden rounded-lg border border-line bg-card2 py-1 shadow-[0_8px_24px_rgba(0,0,0,.3)]">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setOpen(false);
                if (g.id !== current) router.push(`/groups/${g.id}`);
              }}
              className={
                "block w-full truncate px-3 py-2 text-left text-sm hover:bg-card " +
                (g.id === current ? "font-bold text-accent" : "text-txt")
              }
            >
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
