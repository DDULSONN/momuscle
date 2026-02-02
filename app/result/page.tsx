"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getGender,
  getSurvey,
  canAccessResult,
  clearAllStorage,
} from "@/lib/storage";
import { runRuleEngine, type RuleEngineResult } from "@/lib/ruleEngine";
import {
  getPhotoFrontUpper,
  getPhotoBackUpper,
  getPhotoLowerBody,
  type SurveyData,
} from "@/lib/storage";

const GENDER_LABEL = { male: "남자", female: "여자" } as const;
const GOAL_LABEL = { bulkup: "벌크업", diet: "다이어트", balance: "균형" } as const;
const FREQ_LABEL = { "1_2": "1~2회", "3_4": "3~4회", "5plus": "5회+" } as const;

type AnalyzeResponse = {
  visualSummary: {
    upperFront: string;
    upperBack: string;
    lowerBody: string;
  };
  estimatedFocusPoints: {
    area: string;
    why: string;
  }[];
  styleDirection: {
    typeHint: "프레임형" | "볼륨형" | "라인형" | "하체강점형" | "밸런스형";
    note: string;
  };
  safetyNote: string;
};

const mapGoalForApi = (goal: SurveyData["goal"]): "bulk" | "cut" | "balance" => {
  if (goal === "bulkup") return "bulk";
  if (goal === "diet") return "cut";
  return "balance";
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<RuleEngineResult | null>(null);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [goal, setGoal] = useState<string>("");
  const [freq, setFreq] = useState<string>("");
  const [ready, setReady] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AnalyzeResponse | null>(null);

  useEffect(() => {
    if (!canAccessResult()) {
      router.replace("/");
      return;
    }
    const g = getGender();
    const s = getSurvey();
    if (!g || !s) {
      router.replace("/");
      return;
    }
    setGender(g);
    setGoal(GOAL_LABEL[s.goal]);
    setFreq(FREQ_LABEL[s.frequency]);
    const res = runRuleEngine({
      gender: g,
      survey: s,
      hasPhotos: true,
    });
    setResult(res);
    setReady(true);

    // OpenAI 비전 API 호출
    const fetchAi = async () => {
      // 키/체중이 없는 경우에는 AI 분석은 스킵
      if (!s.heightCm || !s.weightKg) {
        return;
      }

      const frontUpper = getPhotoFrontUpper();
      const backUpper = getPhotoBackUpper();
      const lower = getPhotoLowerBody();

      if (!frontUpper || !backUpper || !lower) {
        return;
      }

      setAiLoading(true);
      setAiError(null);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gender: g,
            heightCm: s.heightCm,
            weightKg: s.weightKg,
            goal: mapGoalForApi(s.goal),
            frontUpper,
            backUpper,
            lower,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          const msg =
            errBody?.error ?? `AI 분석 요청에 실패했습니다. (status: ${res.status})`;
          throw new Error(msg);
        }

        const data = (await res.json()) as AnalyzeResponse;
        setAiResult(data);
      } catch (error: any) {
        console.error("Failed to call /api/analyze:", error);
        setAiError(error?.message ?? "알 수 없는 오류가 발생했습니다.");
      } finally {
        setAiLoading(false);
      }
    };

    fetchAi();
  }, [router]);

  const handleReset = useCallback(() => {
    clearAllStorage();
    router.replace("/");
  }, [router]);

  if (!ready || !result) return <div className="min-h-screen flex items-center justify-center text-slate-500">로딩 중...</div>;

  return (
    <main className="min-h-screen pb-24 pt-6 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">결과</h1>
          <p className="text-slate-600 mt-1 text-sm">
            {gender && GENDER_LABEL[gender]} · {goal} · 주 {freq}
          </p>
        </div>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-2 text-sm text-slate-500">체형 타입</h2>
          <h3 className="text-lg font-bold text-primary mb-1">{result.bodyType.title}</h3>
          <p className="text-slate-600 text-sm">{result.bodyType.description}</p>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">
            {gender === "male" ? "체중 가이드 (헬스 기준)" : "체중 가이드 (건강 기준)"}
          </h2>
          {result.bmiGuidance ? (
            <>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500">목표 체중 범위</dt>
                  <dd className="font-medium text-slate-800">
                    {result.bmiGuidance.targetWeightMinKg.toFixed(1)} ~ {result.bmiGuidance.targetWeightMaxKg.toFixed(1)} kg
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">현재 BMI</dt>
                  <dd className="font-medium text-slate-800">{result.bmiGuidance.currentBmi.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">현재 대비</dt>
                  <dd className="font-medium text-slate-800">{result.bmiGuidance.currentVsTargetText}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">권장 변화 속도 (kg/주)</dt>
                  <dd className="font-medium text-slate-800">{result.bmiGuidance.changeRateText}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">{result.bmiGuidance.disclaimer}</p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">키와 체중을 입력하면 체중 가이드를 볼 수 있어요.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">지금 키우면 폼이 제일 빨리 달라지는 포인트 TOP2</h2>
          <ul className="space-y-3">
            {result.top2Points.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-medium text-primary shrink-0">{p.part}</span>
                <span className="text-slate-600 text-sm">{p.point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">부위별 추천 운동</h2>
          <ul className="space-y-4">
            {result.exerciseRecommendations.map((rec, i) => (
              <li key={i}>
                <h3 className="font-medium text-slate-800 mb-1">{rec.part}</h3>
                <p className="text-slate-600 text-sm mb-1">{rec.exercises.join(" · ")}</p>
                <p className="text-xs text-slate-500">{rec.reason}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">{result.eightWeekSummary.title}</h2>
          <ul className="space-y-2">
            {result.eightWeekSummary.bullets.map((b, i) => (
              <li key={i} className="text-slate-600 text-sm list-disc list-inside">{b}</li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">AI 시각 분석</h2>
          {!gender && <p className="text-sm text-slate-500">성별 정보가 없어 분석을 진행할 수 없습니다.</p>}
          {gender && !aiLoading && !aiResult && !aiError && (
            <p className="text-sm text-slate-500">
              키·체중을 입력하면 AI가 사진을 기반으로 시각 분석을 제공합니다.
            </p>
          )}
          {aiLoading && (
            <p className="text-sm text-slate-500">AI가 사진을 분석 중입니다...</p>
          )}
          {aiError && (
            <p className="text-sm text-red-500 text-sm">
              {aiError}
            </p>
          )}
          {aiResult && (
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">시각적 요약</h3>
                <p><span className="font-medium">상체 정면:</span> {aiResult.visualSummary.upperFront}</p>
                <p><span className="font-medium">상체 후면:</span> {aiResult.visualSummary.upperBack}</p>
                <p><span className="font-medium">하체:</span> {aiResult.visualSummary.lowerBody}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">집중 포인트</h3>
                <ul className="list-disc list-inside space-y-1">
                  {aiResult.estimatedFocusPoints.map((p, i) => (
                    <li key={i}>
                      <span className="font-medium">{p.area}:</span> {p.why}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">스타일 방향</h3>
                <p className="font-medium">{aiResult.styleDirection.typeHint}</p>
                <p>{aiResult.styleDirection.note}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">주의 사항</h3>
                <p>{aiResult.safetyNote}</p>
              </div>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={handleReset}
          className="block w-full py-4 rounded-2xl font-semibold text-center bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
        >
          다시 분석하기
        </button>
      </div>
    </main>
  );
}
