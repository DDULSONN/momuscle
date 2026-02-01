"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getGender,
  setGender,
  getPhotoFrontUpper,
  setPhotoFrontUpper,
  getPhotoBackUpper,
  setPhotoBackUpper,
  getPhotoLowerBody,
  setPhotoLowerBody,
  type Gender,
} from "@/lib/storage";

type PhotoSlotKey = "frontUpper" | "backUpper" | "lowerBody";

const PHOTO_SLOTS = [
  {
    key: "frontUpper" as const,
    label: "상체 정면",
    storageGet: getPhotoFrontUpper,
    storageSet: setPhotoFrontUpper,
    guide: "얼굴 제외, 밝은 조명, 같은 거리·각도, 타이트한 옷 권장, 배경 단순. 팔은 자연스럽게.",
  },
  {
    key: "backUpper" as const,
    label: "상체 등(후면)",
    storageGet: getPhotoBackUpper,
    storageSet: setPhotoBackUpper,
    guide: "견갑·광배 라인이 보이도록 찍어주세요. 얼굴 제외, 밝은 조명, 단순한 배경.",
  },
  {
    key: "lowerBody" as const,
    label: "하체",
    storageGet: getPhotoLowerBody,
    storageSet: setPhotoLowerBody,
    guide: "밝은 조명, 같은 거리·각도, 타이트한 옷 권장, 배경 단순.",
  },
] as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [gender, setGenderState] = useState<Gender | null>(null);
  const [photos, setPhotos] = useState<Record<PhotoSlotKey, string>>({
    frontUpper: "",
    backUpper: "",
    lowerBody: "",
  });
  const inputRefs = useRef<Record<PhotoSlotKey, HTMLInputElement | null>>({
    frontUpper: null,
    backUpper: null,
    lowerBody: null,
  });

  const loadStored = useCallback(() => {
    setGenderState(getGender());
    setPhotos({
      frontUpper: getPhotoFrontUpper() || "",
      backUpper: getPhotoBackUpper() || "",
      lowerBody: getPhotoLowerBody() || "",
    });
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const handleGender = (g: Gender) => {
    setGender(g);
    setGenderState(g);
  };

  const handleFile = useCallback(async (slotKey: PhotoSlotKey, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    if (slotKey === "frontUpper") setPhotoFrontUpper(dataUrl);
    else if (slotKey === "backUpper") setPhotoBackUpper(dataUrl);
    else setPhotoLowerBody(dataUrl);
    setPhotos((prev) => ({ ...prev, [slotKey]: dataUrl }));
  }, []);

  const handleFileChange = useCallback((slotKey: PhotoSlotKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(slotKey, f);
    e.currentTarget.value = "";
  }, [handleFile]);

  const triggerFileInput = useCallback((slotKey: PhotoSlotKey) => {
    inputRefs.current[slotKey]?.click();
  }, []);

  const canGoNext = gender && photos.frontUpper && photos.backUpper && photos.lowerBody;

  return (
    <main className="min-h-screen pb-24 pt-6 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">모두의 근육</h1>
          <p className="text-slate-600 mt-1 text-sm">
            시각적 피드백 기반으로 체형·운동 포인트를 안내해 드립니다.
          </p>
          <div className="mt-3 p-3 rounded-card bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800">
            ⚠️ 본 결과는 의학적·전문가 판정이 아니며, 시각적 피드백 기반 참고용입니다.
          </div>
        </div>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-3">성별 선택 (필수)</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleGender("male")}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                gender === "male"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              남자
            </button>
            <button
              type="button"
              onClick={() => handleGender("female")}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                gender === "female"
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              여자
            </button>
          </div>
        </section>

        {PHOTO_SLOTS.map((slot) => {
          const slotKey = slot.key;
          const inputId = slotKey === "lowerBody" ? "photo-lower" : `photo-${slotKey}`;
          return (
          <section
            key={slotKey}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
          >
            <h2 className="font-semibold text-slate-800 mb-1">{slot.label} (필수)</h2>
            <p className="text-xs text-slate-500 mb-3">{slot.guide}</p>
            <input
              id={inputId}
              ref={(el) => { inputRefs.current[slotKey] = el; }}
              name={slotKey === "lowerBody" ? "lower" : slotKey}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(slotKey, e)}
            />
            <button
              type="button"
              onClick={() => triggerFileInput(slotKey)}
              className="inline-block py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 cursor-pointer"
            >
              사진 선택
            </button>
            {photos[slotKey] && (
              <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] max-h-48 bg-slate-100">
                <img
                  src={photos[slotKey]}
                  alt={slot.label}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </section>
          );
        })}

        <div className="pt-2">
          <Link
            href={canGoNext ? "/survey" : "#"}
            className={`block w-full py-4 rounded-2xl font-semibold text-center transition ${
              canGoNext
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            다음
          </Link>
        </div>
      </div>
    </main>
  );
}
