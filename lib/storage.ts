/**
 * localStorage 키 및 타입 정의
 * MVP: 서버 업로드 없이 브라우저에서만 DataURL 저장
 */

export const STORAGE_KEYS = {
  GENDER: "momuscle_gender",
  PHOTO_FRONT_UPPER: "momuscle_photos_frontUpper",
  PHOTO_BACK_UPPER: "momuscle_photos_backUpper",
  PHOTO_LOWER_BODY: "momuscle_photos_lowerBody",
  SURVEY: "momuscle_survey",
} as const;

export type Gender = "male" | "female";

export type Goal = "bulkup" | "diet" | "balance";
export type Experience = "0_6" | "6_24" | "2y";
export type Frequency = "1_2" | "3_4" | "5plus";
export type WeakPart = "shoulder" | "back" | "chest" | "arm" | "leg" | "core";
export type Style = "machine" | "freeweight" | "mixed";
export type ResultPreference = "volume" | "definition" | "silhouette";

export interface SurveyData {
  goal: Goal;
  experience: Experience;
  frequency: Frequency;
  weakParts: WeakPart[];
  style: Style;
  resultPreference: ResultPreference;
  /** 체중 가이드용 (선택) */
  heightCm?: number;
  weightKg?: number;
}

export interface StoredData {
  gender: Gender | null;
  photoFrontUpper: string | null;
  photoBackUpper: string | null;
  photoLowerBody: string | null;
  survey: SurveyData | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getGender(): Gender | null {
  if (!isBrowser()) return null;
  const v = localStorage.getItem(STORAGE_KEYS.GENDER);
  if (v === "male" || v === "female") return v;
  return null;
}

export function setGender(gender: Gender): void {
  if (isBrowser()) localStorage.setItem(STORAGE_KEYS.GENDER, gender);
}

export function getPhotoFrontUpper(): string | null {
  return isBrowser() ? localStorage.getItem(STORAGE_KEYS.PHOTO_FRONT_UPPER) : null;
}

export function setPhotoFrontUpper(dataUrl: string): void {
  if (isBrowser()) localStorage.setItem(STORAGE_KEYS.PHOTO_FRONT_UPPER, dataUrl);
}

export function getPhotoBackUpper(): string | null {
  return isBrowser() ? localStorage.getItem(STORAGE_KEYS.PHOTO_BACK_UPPER) : null;
}

export function setPhotoBackUpper(dataUrl: string): void {
  if (isBrowser()) localStorage.setItem(STORAGE_KEYS.PHOTO_BACK_UPPER, dataUrl);
}

export function getPhotoLowerBody(): string | null {
  return isBrowser() ? localStorage.getItem(STORAGE_KEYS.PHOTO_LOWER_BODY) : null;
}

export function setPhotoLowerBody(dataUrl: string): void {
  if (isBrowser()) localStorage.setItem(STORAGE_KEYS.PHOTO_LOWER_BODY, dataUrl);
}

export function getSurvey(): SurveyData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SURVEY);
    if (!raw) return null;
    return JSON.parse(raw) as SurveyData;
  } catch {
    return null;
  }
}

export function setSurvey(data: SurveyData): void {
  if (isBrowser()) localStorage.setItem(STORAGE_KEYS.SURVEY, JSON.stringify(data));
}

export function getAllStored(): StoredData {
  return {
    gender: getGender(),
    photoFrontUpper: getPhotoFrontUpper(),
    photoBackUpper: getPhotoBackUpper(),
    photoLowerBody: getPhotoLowerBody(),
    survey: getSurvey(),
  };
}

/** result 페이지 진입 가능 여부: 성별 + 3장 사진 + 설문 모두 있어야 함 */
export function canAccessResult(): boolean {
  const g = getGender();
  const f = getPhotoFrontUpper();
  const b = getPhotoBackUpper();
  const l = getPhotoLowerBody();
  const s = getSurvey();
  return !!(g && f && b && l && s);
}

/** 로컬 데이터 전체 초기화 (다시 분석하기) */
export function clearAllStorage(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
