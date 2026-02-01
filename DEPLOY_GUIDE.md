# Vercel 배포 가이드 (초보자용) — 모두의 근육 PWA

GitHub → Vercel 연동으로 **push할 때마다 자동 재배포**되는 방식입니다.

---

## 1. GitHub를 통한 배포 흐름 (한 줄 요약)

**로컬에서 코드 수정 → git add & commit → git push(origin main) → Vercel이 자동으로 빌드·배포**

- 처음 한 번: GitHub 저장소 생성 + Vercel에서 해당 repo 연결
- 이후: 코드 바꾼 뒤 `git push`만 하면 새 URL에 자동 반영

---

## 2. Cursor(또는 터미널)에서 입력할 명령어 (순서대로)

**※ 경로:** 프로젝트 폴더(`momuscle`)에서 실행. Cursor 터미널 또는 PowerShell/CMD.

### 2-1. Git 저장소 만들고 첫 커밋

```bash
cd C:\Users\wnstn\momuscle
```

```bash
git init
```

```bash
git add .
```

```bash
git status
```
→ 변경된 파일 목록이 나오면 정상.

```bash
git commit -m "첫 배포: 모두의 근육 PWA"
```

### 2-2. GitHub remote 연결 (아래 `YOUR_USERNAME` / `YOUR_REPO`만 본인 걸로 바꿈)

**먼저 GitHub 웹에서 새 저장소를 만든 뒤** 아래 실행.

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```
예: `https://github.com/honggil-dong/momuscle.git`

```bash
git remote -v
```
→ `origin` 주소가 보이면 연결된 것.

### 2-3. 첫 push

```bash
git push -u origin main
```
→ GitHub 로그인/토큰 요구되면 입력.

**이후 코드 수정할 때마다:**

```bash
git add .
git commit -m "변경 내용 한 줄 설명"
git push
```

---

## 3. GitHub 웹에서 할 일 (New repository 만들기)

1. **github.com** 접속 → 로그인
2. 오른쪽 상단 **+** 클릭 → **New repository** 선택
3. **Repository name:** `momuscle` (또는 원하는 이름)
4. **Public** 선택
5. **README 체크 해제** (로컬에 이미 코드가 있으므로)
   - "Add a README file" **체크하지 않음**
6. **Create repository** 클릭
7. 생성된 페이지에 나오는 주소 복사  
   예: `https://github.com/YOUR_USERNAME/momuscle.git`  
   → 위 2-2의 `YOUR_USERNAME` / `YOUR_REPO`에 넣어서 `git remote add origin` 사용

---

## 4. Vercel 웹에서 할 일 (프로젝트 연결 & 배포)

1. **vercel.com** 접속 → **Sign Up** 또는 **Log In**
2. **Continue with GitHub** 선택 → GitHub 권한 허용
3. 대시보드에서 **Add New…** 또는 **Add New Project** 클릭
4. **Import Git Repository**에서 방금 push한 **momuscle** (또는 본인 repo 이름) 선택  
   - 안 보이면 **Configure GitHub App** / 권한 설정에서 해당 계정·저장소 허용
5. **Import** 클릭
6. **Configure Project** 화면에서:
   - **Framework Preset:** `Next.js` 로 잡혀 있는지 확인  
     (대부분 자동 감지됨. 안 되면 드롭다운에서 **Next.js** 선택)
   - **Root Directory:** 비워 둠 (기본값)
   - **Build Command:** 비워 두면 `next build` 자동
   - **Output Directory:** 비워 두면 `.next` 기준 자동
7. **Deploy** 클릭
8. 빌드 로그 보면서 완료될 때까지 대기 → **Visit** 또는 배포 URL 클릭

**자동 재배포:** 이후 `git push` 할 때마다 Vercel이 자동으로 다시 빌드·배포합니다.

---

## 5. 배포 전 로컬에서 확인할 것 (최소 5개)

| # | 확인 항목 | 방법 |
|---|-----------|------|
| 1 | **개발 서버 실행** | 터미널에서 `npm run dev` → 브라우저에서 `http://localhost:3000` 열어서 화면 정상 표시 |
| 2 | **빌드 성공** | `npm run build` 실행 → 에러 없이 "Compiled successfully" 등으로 끝나는지 확인 |
| 3 | **`use client` 위치** | 페이지/컴포넌트에서 `useState`, `onClick` 등 쓰는 파일 맨 위에 `"use client";` 있는지 확인 (이미 적용돼 있으면 OK) |
| 4 | **환경 변수** | `.env` 같은 비공개 키를 코드에 직접 넣지 않았는지 확인 (이 프로젝트는 없음) |
| 5 | **필수 파일 존재** | `package.json`, `next.config.js`, `app/layout.tsx`, `app/page.tsx` 등이 있는지 확인 |

---

## 6. 배포 후 확인할 것 (최소 5개)

| # | 확인 항목 | 방법 |
|---|-----------|------|
| 1 | **배포 URL 접속** | Vercel 대시보드의 **Visit** 또는 `https://프로젝트이름.vercel.app` 접속 → 홈/설문/결과 페이지 동작 확인 |
| 2 | **모바일(Android) PWA** | Chrome으로 배포 URL 열기 → 메뉴(⋮) → **홈 화면에 추가** → 아이콘 생성 후 실행해 보기 |
| 3 | **모바일(iOS) PWA** | Safari로 배포 URL 열기 → **공유** 버튼 → **홈 화면에 추가** → 아이콘 생성 후 실행해 보기 |
| 4 | **이미지/사진 업로드** | 홈에서 성별·사진 3장 업로드 → 다음 → 설문 → 결과까지 한 번 진행해 보기 |
| 5 | **Vercel 빌드 로그** | Vercel 대시보드 → 해당 프로젝트 → **Deployments** → 최신 배포 클릭 → **Building** 로그에 빨간 에러 없이 완료됐는지 확인 |

---

## 7. Vercel 배포 실패 시 자주 나오는 것 TOP 5

| # | 에러/상황 예시 | 대응 |
|---|----------------|------|
| 1 | **"Module not found: Can't resolve '@/...'"** | `tsconfig.json`에 `"paths": { "@/*": ["./*"] }` 있는지 확인. Cursor에서 `@/lib/...` import 쓰는 파일이 실제로 `lib/` 아래에 있는지 확인. |
| 2 | **"Build failed" / "Error: Could not find a production build"** | 로컬에서 `npm run build` 실행해 보기. 로컬에서 빌드 실패하면 Vercel에서도 실패함. 나온 에러 메시지 그대로 검색하거나 여기 붙여넣기. |
| 3 | **"window is not defined" / "localStorage is not defined"** | `localStorage`·`window` 쓰는 코드는 **브라우저에서만** 실행되게. 해당 파일 맨 위에 `"use client";` 넣기. 이미 있는데도 나오면, `typeof window !== "undefined"` 체크로 감싸기. |
| 4 | **"404 - Page Not Found"** | `app/` 아래 폴더·파일 이름 확인. `/survey` → `app/survey/page.tsx`, `/result` → `app/result/page.tsx`. 대소문자·오타 확인. |
| 5 | **GitHub repo 연결 안 됨 / Vercel에 repo 안 보임** | Vercel → **Settings** → **Git** → 연결된 GitHub 계정 확인. GitHub **Settings → Applications** 에서 Vercel 권한에 저장소 접근 허용돼 있는지 확인. |

---

## 8. 막혔을 때 AI에게 보내면 좋은 정보

- **에러 메시지 전체** (터미널 또는 Vercel 빌드 로그에서 복사)
- **어디서 막혔는지**  
  예: "`git push` 할 때 비밀번호 요구됨", "Vercel Deploy 로그에서 ~~ 에러"
- **명령어와 출력**  
  예: `git remote -v` 결과, `npm run build` 마지막 20줄 등

위를 그대로 채팅에 붙여넣으면 원인 짚고 다음 단계 안내하기 좋습니다.

---

## 9. 지금 당장 할 일 1~10 (요약)

1. **로컬에서** `cd C:\Users\wnstn\momuscle` 후 `npm run build` 한 번 성공하는지 확인
2. **GitHub**에서 New repository 생성 (README 추가 안 함) → repo 주소 복사
3. **터미널**에서 `git init` → `git add .` → `git commit -m "첫 배포"` → `git branch -M main`
4. **터미널**에서 `git remote add origin https://github.com/본인아이디/저장소이름.git`
5. **터미널**에서 `git push -u origin main` (GitHub 로그인/토큰 입력)
6. **Vercel** 로그인 → Add New Project → 방금 push한 GitHub repo 선택 → Import
7. **Framework: Next.js** 인지 확인 → **Deploy** 클릭
8. 배포 끝나면 **Visit** 로 URL 열어서 홈/설문/결과 동작 확인
9. **휴대폰**에서 같은 URL 열고 Android는 Chrome에서, iOS는 Safari에서 "홈 화면에 추가"로 PWA 확인
10. 앞으로는 **코드 수정 후** `git add .` → `git commit -m "설명"` → `git push` 만 하면 자동 재배포됨
