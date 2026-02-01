/**
 * ruleEngine: 성별 + 설문 + 업로드 여부를 입력받아 결과 반환
 * MVP에서는 사진 내용은 분석하지 않음. 상체 정면/등/하체 3장 업로드 여부만 진행 조건으로 사용.
 * (나중에 AI 분석 붙일 확장 포인트: 여기서 이미지 URL/파일을 받아 체형 타입·포인트 보정 가능)
 */

import type { Gender, Goal, SurveyData } from "./storage";

/** BMI 목표 범위 (성별·목표별) */
const BMI_RANGES: Record<Gender, Record<Goal, { min: number; max: number }>> = {
  male: {
    diet: { min: 20.5, max: 24.0 },
    balance: { min: 21.5, max: 25.5 },
    bulkup: { min: 23.0, max: 28.0 },
  },
  female: {
    diet: { min: 19.0, max: 22.0 },
    balance: { min: 19.5, max: 23.0 },
    bulkup: { min: 20.5, max: 24.0 },
  },
};

/** 목표별 권장 변화 속도 (kg/주, 문자열) */
const CHANGE_RATE_TEXT: Record<Gender, Record<Goal, string>> = {
  male: {
    diet: "-0.25~-0.75",
    balance: "±0~0.25",
    bulkup: "+0.25~+0.5",
  },
  female: {
    diet: "-0.2~-0.5",
    balance: "±0~0.2",
    bulkup: "+0.1~+0.3",
  },
};

const BMI_DISCLAIMER =
  "이 수치는 의학적 진단이 아닌 참고 범위이며, 체지방률/근육량/건강상태에 따라 달라질 수 있어요.";

export interface BmiGuidance {
  /** 목표 체중 하한 (kg) */
  targetWeightMinKg: number;
  /** 목표 체중 상한 (kg) */
  targetWeightMaxKg: number;
  /** 현재 BMI */
  currentBmi: number;
  /** 현재 대비 설명 (예: "목표 범위보다 2.3kg 많음", "목표 범위 내") */
  currentVsTargetText: string;
  /** 목표별 권장 변화 속도 (kg/주) */
  changeRateText: string;
  disclaimer: string;
}

/**
 * 체중 가이드: 성별·목표·키·체중으로 목표 BMI 범위, 현재 BMI, 현재 대비(kg), 권장 변화 속도 반환
 */
export function getBmiGuidance(
  gender: Gender,
  goal: Goal,
  heightCm: number,
  weightKg: number
): BmiGuidance {
  const range = BMI_RANGES[gender][goal];
  const heightM = heightCm / 100;
  const targetWeightMinKg = range.min * heightM * heightM;
  const targetWeightMaxKg = range.max * heightM * heightM;
  const currentBmi = weightKg / (heightM * heightM);
  let currentVsTargetText: string;
  if (weightKg < targetWeightMinKg) {
    const diff = targetWeightMinKg - weightKg;
    currentVsTargetText = `목표 범위보다 ${diff.toFixed(1)} kg 적음`;
  } else if (weightKg > targetWeightMaxKg) {
    const diff = weightKg - targetWeightMaxKg;
    currentVsTargetText = `목표 범위보다 ${diff.toFixed(1)} kg 많음`;
  } else {
    currentVsTargetText = "목표 범위 내";
  }
  const changeRateText = CHANGE_RATE_TEXT[gender][goal];
  return {
    targetWeightMinKg,
    targetWeightMaxKg,
    currentBmi,
    currentVsTargetText,
    changeRateText,
    disclaimer: BMI_DISCLAIMER,
  };
}

export type BodyTypeKey =
  | "frame"
  | "volume"
  | "line"
  | "lowerStrong"
  | "balance";

export interface BodyTypeResult {
  key: BodyTypeKey;
  title: string;
  description: string;
}

export interface TopPoint {
  part: string;
  point: string;
}

export interface ExerciseRecommend {
  part: string;
  exercises: string[];
  reason: string;
}

export interface EightWeekSummary {
  title: string;
  bullets: string[];
}

export interface RuleEngineResult {
  bodyType: BodyTypeResult;
  top2Points: TopPoint[];
  exerciseRecommendations: ExerciseRecommend[];
  eightWeekSummary: EightWeekSummary;
  /** 키·체중 입력 시에만 존재 */
  bmiGuidance: BmiGuidance | null;
}

/** 설문/성별 기반으로 체형 타입 결정 (MVP: 규칙 기반, 사진 미분석) */
function resolveBodyType(gender: Gender, survey: SurveyData): BodyTypeResult {
  const { goal, resultPreference, weakParts, experience } = survey;
  // 규칙: 목표+선호결과+약점 조합으로 타입 매핑
  if (resultPreference === "silhouette" && (weakParts.includes("shoulder") || weakParts.includes("back"))) {
    return gender === "male"
      ? { key: "frame", title: "프레임형", description: "어깨·등 프레임을 키우면 실루엣 변화가 빠른 타입입니다." }
      : { key: "frame", title: "프레임형", description: "어깨·등 라인을 살리면 실루엣이 빨리 달라지는 타입입니다." };
  }
  if (goal === "bulkup" && (resultPreference === "volume" || experience === "2y")) {
    return gender === "male"
      ? { key: "volume", title: "볼륨형", description: "근육이 비교적 잘 붙는 편이라, 볼륨·중량 기반 루트에 적합합니다." }
      : { key: "volume", title: "볼륨형", description: "근육이 잘 붙는 편이라, 볼륨·중량 중심 루트에 잘 맞습니다." };
  }
  const preferDefinition = survey.resultPreference === "definition";
  if (preferDefinition) {
    return gender === "male"
      ? { key: "line", title: "라인형", description: "선명도·비율이 강점이라, 과도한 벌크보다 밸런스·분리도 루트가 맞습니다." }
      : { key: "line", title: "라인형", description: "선명도·비율이 강점이라, 밸런스·분리도 중심 루트가 잘 맞습니다." };
  }
  if (weakParts.includes("leg") === false && (weakParts.includes("core") || weakParts.length <= 2)) {
    return gender === "male"
      ? { key: "lowerStrong", title: "하체강점형", description: "하체·코어가 강점이라, 상체 프레임을 보완하면 완성도가 올라갑니다." }
      : { key: "lowerStrong", title: "하체강점형", description: "하체·코어가 강점이라, 상체 라인을 보완하면 밸런스가 좋아집니다." };
  }
  return gender === "male"
    ? { key: "balance", title: "밸런스형", description: "전체적으로 고르게 성장하는 타입이라, 꾸준한 루틴에 강합니다." }
    : { key: "balance", title: "밸런스형", description: "전체적으로 고르게 잘 맞는 타입이라, 꾸준한 루틴에 잘 반응합니다." };
}

/** TOP2 "지금 키우면 폼이 제일 빨리 달라지는 포인트" (성별·선호 반영) */
function resolveTop2Points(gender: Gender, survey: SurveyData): TopPoint[] {
  const { resultPreference, weakParts } = survey;
  const malePoints: TopPoint[] = [
    { part: "어깨", point: "측면 델트 비율을 올리면 상체가 넓어 보입니다." },
    { part: "등", point: "광배·견갑 라인을 키우면 실루엣이 확 바뀝니다." },
    { part: "가슴", point: "상부 가슴 비율을 올리면 볼륨감이 살아납니다." },
    { part: "팔", point: "삼두·이두 밸런스를 맞추면 팔 라인이 정리됩니다." },
    { part: "하체", point: "대퇴사두·햄스트링 밸런스가 비율을 결정합니다." },
    { part: "코어", point: "복부 단련으로 허리 라인이 잡힙니다." },
  ];
  const femalePoints: TopPoint[] = [
    { part: "어깨", point: "측면 델트를 살리면 상체 라인이 예뻐집니다." },
    { part: "등", point: "광배·견갑 라인으로 등 라인이 정리됩니다." },
    { part: "둔근·하체", point: "둔근·햄스트링 비율이 하체 실루엣을 만듭니다." },
    { part: "코어", point: "코어 안정화로 허리·배 라인이 정리됩니다." },
    { part: "가슴", point: "상부 가슴 비율로 볼륨감을 살릴 수 있습니다." },
    { part: "팔", point: "삼두·어깨 라인으로 팔이 길어 보입니다." },
  ];
  const pool = gender === "male" ? malePoints : femalePoints;
  const order = gender === "male"
    ? ["shoulder", "back", "chest", "arm", "leg", "core"] as const
    : ["leg", "back", "shoulder", "core", "chest", "arm"] as const;
  const weakOrder = weakParts.length > 0
    ? [...weakParts].sort((a, b) => order.indexOf(a) - order.indexOf(b))
    : [order[0], order[1]];
  const indices = new Set<number>();
  for (const w of weakOrder) {
    const i = order.indexOf(w);
    if (i >= 0 && i < pool.length) indices.add(i);
  }
  const fallback = [0, 1];
  const arr = Array.from(indices);
  const idx1 = arr.length >= 1 ? arr[0] : fallback[0];
  const idx2 = arr.length >= 2 ? arr[1] : fallback[1];
  return [pool[idx1], pool[idx2]];
}

/** 부위별 추천 운동 3개 + 이유 (성별 분기) */
function resolveExerciseRecommendations(gender: Gender, survey: SurveyData): ExerciseRecommend[] {
  const base: ExerciseRecommend[] = gender === "male"
    ? [
        { part: "어깨", exercises: ["오버헤드 프레스", "레터럴 레이즈", "페이스 풀"], reason: "상체 폭과 균형을 잡아줍니다." },
        { part: "등", exercises: ["랫풀다운", "바벨 로우", "풀업"], reason: "광배·견갑 라인을 키워 실루엣을 만듭니다." },
        { part: "가슴", exercises: ["벤치 프레스", "인클라인 덤벨 프레스", "케이블 플라이"], reason: "가슴 두께와 상부 비율을 올립니다." },
        { part: "팔", exercises: ["트라이셉스 푸시다운", "바벨 컬", "해머 컬"], reason: "팔 굵기와 라인을 정리합니다." },
        { part: "하체", exercises: ["스쿼트", "루마니안 데드리프트", "레그 프레스"], reason: "하체 비율과 코어 안정성을 키웁니다." },
        { part: "코어", exercises: ["플랭크", "데드 버그", "팔레오프 프레스"], reason: "자세와 허리 안정에 도움이 됩니다." },
      ]
    : [
        { part: "하체·둔근", exercises: ["힙 스러스트", "스쿼트", "루마니안 데드리프트"], reason: "둔근·햄스트링 비율로 하체 실루엣을 만듭니다." },
        { part: "어깨", exercises: ["레터럴 레이즈", "오버헤드 프레스", "리어 델트 플라이"], reason: "상체 라인을 살려 비율을 잡아줍니다." },
        { part: "등", exercises: ["랫풀다운", "케이블 로우", "풀업"], reason: "등 라인과 자세에 좋습니다." },
        { part: "코어", exercises: ["데드 버그", "플랭크", "버드독"], reason: "코어 안정과 허리 보호에 도움이 됩니다." },
        { part: "가슴", exercises: ["푸시업", "덤벨 프레스", "케이블 플라이"], reason: "가슴 비율과 상부 라인에 도움이 됩니다." },
        { part: "팔", exercises: ["트라이셉스 익스텐션", "덤벨 컬", "레저 컬"], reason: "팔 라인을 정리해 줍니다." },
      ];
  return base;
}

/** 8주 루트 요약 (주 3~4회, 성별 톤 차이) */
function resolveEightWeekSummary(gender: Gender, survey: SurveyData): EightWeekSummary {
  const { frequency, goal } = survey;
  const title = "8주 루트 요약 (주 3~4회 기준)";
  const maleBullets = [
    "1~2주: 큰 근군(등·가슴·하체) 위주로 부위 익히기",
    "3~4주: 분할 루틴 정착, 중량 점진 상승",
    "5~6주: 약점 부위 1세트 추가, 볼륨 유지",
    "7~8주: 강도·세트 조절로 피드백 정리",
  ];
  const femaleBullets = [
    "1~2주: 하체·둔근·코어 중심으로 동작 익히기",
    "3~4주: 상체(어깨·등) 비율 추가, 루틴 고정",
    "5~6주: 약점 부위 보강, 반복 횟수·세트 조절",
    "7~8주: 라인·비율 맞춰 마무리",
  ];
  const bullets = gender === "male" ? maleBullets : femaleBullets;
  return { title, bullets };
}

export interface RuleEngineInput {
  gender: Gender;
  survey: SurveyData;
  /** MVP에서는 사용하지 않음. 나중에 AI 분석 결과(체형 타입 보정 등) 연동 시 사용 */
  hasPhotos: boolean;
}

export function runRuleEngine(input: RuleEngineInput): RuleEngineResult {
  const { gender, survey, hasPhotos } = input;
  const heightCm = survey.heightCm;
  const weightKg = survey.weightKg;
  const bmiGuidance =
    typeof heightCm === "number" &&
    typeof weightKg === "number" &&
    heightCm > 0 &&
    weightKg > 0
      ? getBmiGuidance(gender, survey.goal, heightCm, weightKg)
      : null;
  // MVP: hasPhotos는 진행 가능 여부만 검사했으므로 여기선 참고만. 추후 이미지 분석 결과로 bodyType/top2 보정 가능
  return {
    bodyType: resolveBodyType(gender, survey),
    top2Points: resolveTop2Points(gender, survey),
    exerciseRecommendations: resolveExerciseRecommendations(gender, survey),
    eightWeekSummary: resolveEightWeekSummary(gender, survey),
    bmiGuidance,
  };
}
