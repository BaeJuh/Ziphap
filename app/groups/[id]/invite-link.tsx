"use client";

import { useState } from "react";

export default function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한 없으면 무시 (링크는 화면에 보임)
    }
  }

  return (
    <button
      onClick={copy}
      className="flex w-full items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-left text-xs"
    >
      <span className="truncate text-muted">{url}</span>
      <span className="ml-auto shrink-0 font-semibold text-accent">
        {copied ? "복사됨 ✓" : "복사"}
      </span>
    </button>
  );
}
