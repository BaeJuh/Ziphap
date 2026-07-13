"use client";

import { useActionState, useEffect, useState } from "react";
import { createHangout, setAttendance } from "@/app/actions/hangout";

export type Hangout = {
  id: string;
  timeText: string;
  note: string;
  creatorName: string;
  attendees: string[]; // 참가자(GOING) 이름
  notGoingCount: number; // "안함" 응답 수 (이름은 비노출 — 압박 최소화)
  myStatus: "GOING" | "NOT_GOING" | null; // null = 무반응
};

// 참가자 아바타 스택 (목업 .avs/.av): 첫 글자 원, 최대 4 + "+N"
function Avatars({ names }: { names: string[] }) {
  if (names.length === 0) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-line text-[10px] font-bold text-muted">
        0
      </span>
    );
  }
  return (
    <>
      {names.slice(0, 4).map((n, i) => (
        <span
          key={i}
          className={
            "flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-accent text-[10px] font-bold text-white " +
            (i > 0 ? "-ml-[7px]" : "")
          }
        >
          {n.slice(0, 1)}
        </span>
      ))}
      {names.length > 4 && (
        <span className="-ml-[7px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-line text-[10px] font-bold text-muted">
          +{names.length - 4}
        </span>
      )}
    </>
  );
}
export type Day = {
  iso: string;
  day: number;
  isToday: boolean;
  weekday: number; // 0=월 … 5=토, 6=일
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function weekdayColor(weekday: number) {
  return weekday === 5 ? "text-sat" : weekday === 6 ? "text-sun" : "text-muted";
}

function label(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export default function GroupCalendar({
  groupId,
  days,
  hangoutsByDate,
  todayIso,
}: {
  groupId: string;
  days: Day[];
  hangoutsByDate: Record<string, Hangout[]>;
  todayIso: string;
}) {
  const [selIso, setSelIso] = useState(todayIso);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panelBig, setPanelBig] = useState(false);
  const [state, formAction, pending] = useActionState(createHangout, null);

  // 생성 성공 시 시트 닫기
  useEffect(() => {
    if (state?.ok) setSheetOpen(false);
  }, [state]);

  const selList = hangoutsByDate[selIso] ?? [];

  return (
    <>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`pb-1 pl-1.5 text-[11px] font-semibold ${weekdayColor(i)}`}
          >
            {w}
          </div>
        ))}
        {days.map((d) => {
          const list = hangoutsByDate[d.iso] ?? [];
          const selected = d.iso === selIso;
          return (
            <button
              key={d.iso}
              onClick={() => setSelIso(d.iso)}
              className={
                "flex min-h-[72px] flex-col gap-0.5 rounded-md border-2 p-1.5 text-left transition-colors " +
                (selected
                  ? "border-accent bg-accent/10 "
                  : "border-transparent bg-card hover:border-line ") +
                (d.isToday ? "outline outline-2 -outline-offset-2 outline-accent2" : "")
              }
            >
              <span
                className={
                  "text-xs font-semibold " +
                  (d.isToday ? "text-accent2" : weekdayColor(d.weekday))
                }
              >
                {d.day}
              </span>
              {list.length > 0 && (
                <div className="mt-auto flex items-center">
                  {list.slice(0, 2).map((h, i) => (
                    <span
                      key={h.id}
                      className={
                        "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ring-2 ring-card " +
                        (h.myStatus === "GOING"
                          ? "bg-accent2 text-[#06241a] "
                          : "bg-accent text-white ") +
                        (i > 0 ? "-ml-1.5" : "")
                      }
                    >
                      {h.creatorName.slice(0, 1)}
                    </span>
                  ))}
                  {list.length > 2 && (
                    <span className="-ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-chip text-[8px] font-bold text-muted ring-2 ring-card">
                      +{list.length - 2}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 확장형 바텀시트 (목업 .panel): 손잡이 탭으로 확장/축소 */}
      <div
        className={
          "fixed bottom-0 left-1/2 z-[6] flex w-full max-w-[430px] -translate-x-1/2 flex-col rounded-t-2xl border-t border-line bg-card2 shadow-[0_-8px_24px_rgba(0,0,0,.18)] transition-[height] duration-300 " +
          (panelBig ? "h-[85vh]" : "h-[38vh]")
        }
      >
        <button
          onClick={() => setPanelBig((v) => !v)}
          aria-label="패널 확장/축소"
          className="flex shrink-0 justify-center py-2.5"
        >
          <span className="h-1 w-9 rounded-full bg-line" />
        </button>
        <div className="flex shrink-0 items-baseline justify-between px-4 pb-3">
          <span className="text-[15px] font-bold">{label(selIso)}</span>
          {selList.length > 0 && (
            <span className="text-xs text-muted">{selList.length}개 집합</span>
          )}
        </div>
        {selList.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted">
            아직 이 날 뜬 집합이 없어요.
          </p>
        ) : (
          <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-24">
            {selList.map((h) => (
              <li
                key={h.id}
                className="mb-2.5 rounded-lg border border-line bg-card px-3.5 py-3"
              >
                <div className="text-[15px] font-bold">{h.timeText}</div>
                {h.note && <div className="mt-0.5 text-[13px] text-muted">{h.note}</div>}
                <div className="mt-2 text-[11px] text-muted">{h.creatorName} 띄움</div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    <Avatars names={h.attendees} />
                  </div>
                  <span className="text-xs text-muted">
                    {h.attendees.length}명 참가
                    {h.notGoingCount > 0 && ` · 안함 ${h.notGoingCount}`}
                  </span>
                  {/* 같은 버튼 다시 누르면 해제(무반응 복귀) — setAttendance */}
                  <form action={setAttendance} className="ml-auto flex gap-1.5">
                    <input type="hidden" name="hangoutId" value={h.id} />
                    <button
                      type="submit"
                      name="status"
                      value="GOING"
                      className={
                        "rounded-md px-3 py-2 text-[13px] font-bold " +
                        (h.myStatus === "GOING"
                          ? "bg-accent2 text-[#06241a]"
                          : "border border-line bg-chip text-txt")
                      }
                    >
                      {h.myStatus === "GOING" ? "참가중 ✓" : "참가"}
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="NOT_GOING"
                      className={
                        "rounded-md px-3 py-2 text-[13px] font-bold " +
                        (h.myStatus === "NOT_GOING"
                          ? "bg-line text-txt"
                          : "border border-line bg-chip text-muted")
                      }
                    >
                      {h.myStatus === "NOT_GOING" ? "안함 ✓" : "안함"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <div className="pointer-events-none fixed bottom-[22px] left-1/2 z-10 w-[min(398px,calc(100%-32px))] -translate-x-1/2">
        <button
          onClick={() => setSheetOpen(true)}
          className="pointer-events-auto w-full rounded-lg bg-accent py-[15px] text-[15px] font-extrabold text-white shadow-[0_8px_24px_rgba(255,92,92,.35)]"
        >
          + 집합 띄우기
        </button>
      </div>

      {/* 생성 시트 */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-20 animate-[fade-in_0.2s_ease] bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 animate-[slide-up_0.25s_ease] rounded-t-2xl bg-card2 px-[18px] pb-7 pt-5">
            <h3 className="mb-3.5 text-base font-bold">{label(selIso)} 집합 띄우기</h3>
            <form action={formAction} className="flex flex-col gap-3">
              <input type="hidden" name="groupId" value={groupId} />
              <input type="hidden" name="date" value={selIso} />
              <div>
                <label className="mb-1.5 block text-xs text-muted">언제 (자유롭게)</label>
                <input
                  name="timeText"
                  required
                  maxLength={50}
                  autoFocus
                  placeholder="예: 금요일 퇴근 후 7시쯤"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-txt placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">한 줄</label>
                <input
                  name="note"
                  maxLength={100}
                  placeholder="예: 한잔 ㄱ? 적당히 마실 사람"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-txt placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="mt-1.5 w-full rounded-lg bg-accent py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60"
              >
                {pending ? "띄우는 중…" : "띄우기"}
              </button>
              {state && !state.ok && (
                <p className="text-[13px] font-semibold text-accent">
                  띄우기에 실패했어요. 다시 시도해 주세요.
                </p>
              )}
            </form>
          </div>
        </>
      )}
    </>
  );
}
