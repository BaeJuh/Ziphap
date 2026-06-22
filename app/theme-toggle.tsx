"use client";

import { useEffect, useState } from "react";

// night(다크 기본) ↔ clean(라이트) 토글. data-theme를 html에 세팅 + localStorage 저장.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"night" | "clean">("night");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "clean" ? "clean" : "night");
  }, []);

  function toggle() {
    const next = theme === "night" ? "clean" : "night";
    setTheme(next);
    if (next === "clean") document.documentElement.dataset.theme = "clean";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // 비공개 모드 등 localStorage 막힌 경우 무시
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="테마 전환"
      className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-card text-sm"
    >
      {theme === "night" ? "🌙" : "☀️"}
    </button>
  );
}
