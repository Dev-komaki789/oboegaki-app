import { differenceInCalendarDays, parseISO } from "date-fns";

/** 年代・性別を1つにまとめ、見た目の特徴を「、」で分割してバッジの配列にする */
export function toBadges(p: {
  age_group: string | null;
  gender: string | null;
  appearance: string | null;
}) {
  const list: string[] = [];
  const ageGender = [p.age_group, p.gender].filter(Boolean).join(" ");
  if (ageGender) list.push(ageGender);
  if (p.appearance) {
    list.push(
      ...String(p.appearance)
        .split(/[、,，・]/)
        .map((s: string) => s.trim())
        .filter(Boolean),
    );
  }
  return list;
}

/** 「3日前」を作る。今日なら「今日」 */
export function sinceLabel(d: string | null) {
  if (!d) return null;
  const days = differenceInCalendarDays(new Date(), parseISO(d));
  if (days <= 0) return "今日";
  return `${days}日前`;
}
