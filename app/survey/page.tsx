"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getGender, getPhotoFrontUpper, getPhotoBackUpper, getPhotoLowerBody, getSurvey, setSurvey, type SurveyData, type Goal, type Experience, type Frequency, type WeakPart, type Style, type ResultPreference } from "@/lib/storage";

const Q1_OPTIONS: { value: Goal; label: string }[] = [
  { value: "bulkup", label: "벌크업" },
  { value: "diet", label: "다이어트" },
  { value: "balance", label: "균형" },
];

const Q2_OPTIONS: { value: Experience; label: string }[] = [
  { value: "0_6", label: "0~6개월" },
  { value: "6_24", label: "6~24개월" },
  { value: "2y", label: "2년+" },
];

const Q3_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "1_2", label: "1~2회" },
  { value: "3_4", label: "3~4회" },
  { value: "5plus", label: "5회+" },
];

const Q4_OPTIONS: { value: WeakPart; label: string }[] = [
  { value: "shoulder", label: "어깨" },
  { value: "back", label: "등" },
  { value: "chest", label: "가슴" },
  { value: "arm", label: "팔" },
  { value: "leg", label: "하체" },
  { value: "core", label: "코어" },
];

const Q5_OPTIONS: { value: Style; label: string }[] = [
  { value: "machine", label: "머신 위주" },
  { value: "freeweight", label: "프리웨이트 위주" },
  { value: "mixed", label: "섞어서" },
];

const Q6_OPTIONS: { value: ResultPreference; label: string }[] = [
  { value: "volume", label: "커 보이기(볼륨)" },
  { value: "definition", label: "선명해 보이기(분리도)" },
  { value: "silhouette", label: "비율 좋아 보이기(실루엣)" },
];

const defaultSurvey: SurveyData = {
  goal: "balance",
  experience: "0_6",
  frequency: "1_2",
  weakParts: [],
  style: "mixed",
  resultPreference: "silhouette",
  heightCm: undefined,
  weightKg: undefined,
};

export default function SurveyPage() {
  const router = useRouter();
  const [survey, setSurveyState] = useState<SurveyData>(defaultSurvey);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const g = getGender();
    const f = getPhotoFrontUpper();
    const b = getPhotoBackUpper();
    const l = getPhotoLowerBody();
    if (!g || !f || !b || !l) {
      router.replace("/");
      return;
    }
    const saved = getSurvey();
    if (saved) setSurveyState(saved);
    setReady(true);
  }, [router]);

  const toggleWeakPart = (p: WeakPart) => {
    setSurveyState((prev) => ({
      ...prev,
      weakParts: prev.weakParts.includes(p)
        ? prev.weakParts.filter((x) => x !== p)
        : [...prev.weakParts, p],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSurvey(survey);
    router.push("/result");
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-slate-500">로딩 중...</div>;

  return (
    <main className="min-h-screen pb-24 pt-6 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">설문</h1>
          <p className="text-slate-600 mt-1 text-sm">답변에 따라 맞춤 결과를 드립니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q1. 목표</h2>
            <div className="flex flex-wrap gap-2">
              {Q1_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSurveyState((s) => ({ ...s, goal: o.value }))}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition ${
                    survey.goal === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q2. 운동 경력</h2>
            <div className="flex flex-wrap gap-2">
              {Q2_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSurveyState((s) => ({ ...s, experience: o.value }))}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition ${
                    survey.experience === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q3. 주 운동 횟수</h2>
            <div className="flex flex-wrap gap-2">
              {Q3_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSurveyState((s) => ({ ...s, frequency: o.value }))}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition ${
                    survey.frequency === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q4. 약점 체감 부위 (복수 선택)</h2>
            <div className="flex flex-wrap gap-2">
              {Q4_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleWeakPart(o.value)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition ${
                    survey.weakParts.includes(o.value) ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q5. 선호 운동 스타일</h2>
            <div className="flex flex-wrap gap-2">
              {Q5_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSurveyState((s) => ({ ...s, style: o.value }))}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition ${
                    survey.style === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">Q6. 선호 결과</h2>
            <div className="flex flex-col gap-2">
              {Q6_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSurveyState((s) => ({ ...s, resultPreference: o.value }))}
                  className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition ${
                    survey.resultPreference === o.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="font-semibold text-slate-800 mb-3">키·체중 (체중 가이드용)</h2>
            <p className="text-slate-500 text-sm mb-3">입력 시 결과에서 목표 체중·BMI 가이드를 볼 수 있어요.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-600">키 (cm)</span>
                <input
                  type="number"
                  min={100}
                  max={250}
                  step={0.1}
                  placeholder="170"
                  value={survey.heightCm ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setSurveyState((s) => ({ ...s, heightCm: v }));
                  }}
                  className="mt-1 w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-600">체중 (kg)</span>
                <input
                  type="number"
                  min={30}
                  max={200}
                  step={0.1}
                  placeholder="65"
                  value={survey.weightKg ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setSurveyState((s) => ({ ...s, weightKg: v }));
                  }}
                  className="mt-1 w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            className="block w-full py-4 rounded-2xl font-semibold text-center bg-primary text-white hover:bg-primary-dark transition"
          >
            결과 보기
          </button>
        </form>
      </div>
    </main>
  );
}
