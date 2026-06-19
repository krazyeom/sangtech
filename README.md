# Sang Tech (상테크 - 백화점 상품권 시세 비교)

[🇰🇷 한국어 (Korean)](#한국어-korean) | [🇬🇧 English](#english)

---

<a id="한국어-korean"></a>

## 🇰🇷 한국어 (Korean)

**Sang Tech**는 상테크(상품권 재테크) 유저들을 위해 주요 백화점 상품권(신세계, 롯데, 현대)의 매입 시세를 여러 상품권 매입소(명동 우대빵, 우천상품권, 맥스솔루션 등 10여 곳)로부터 실시간으로 스크래핑하여 한눈에 비교하고 분석해주는 서비스입니다.

### 👥 사용자 가이드 (For Users)

#### 주요 기능
- **실시간 시세 비교**: 각 백화점 상품권별 최고가 매입소를 실시간으로 찾아 추천해 드립니다.
- **시세 변동 차트**: 지난 30일간의 상품권 최고가 매입 시세 추이를 한눈에 볼 수 있는 인터랙티브 차트(범례 클릭 시 상품권별 on/off 지원)를 제공합니다.
- **상테크 계산기**: 매입가에 따른 실질 할인율, 수수료, 마일리지(항공사) 환산 효율을 손쉽게 계산할 수 있습니다.
- **자동화 트래킹**: 매일 주기적으로 시세를 수집하고, 방문자 통계를 집계하여 제공합니다.

---

### 💻 개발자 가이드 (For Developers)

이 프로젝트는 최신 웹 기술과 자동화된 크롤링 봇을 결합하여 만들어졌습니다. 일부 웹사이트에서 이미지로 제공하는 시세표는 Tesseract.js와 Sharp 라이브러리를 통해 OCR 기술을 적용하여 텍스트로 추출합니다.

#### 🛠 기술 스택 (Tech Stack)
- **프레임워크**: Next.js 14 (App Router), React
- **언어**: TypeScript
- **데이터베이스**: Supabase (PostgreSQL)
- **데이터 시각화**: Chart.js (react-chartjs-2)
- **크롤링 및 이미지 인식**: axios, cheerio, Tesseract.js, Sharp

#### 🚀 시작하기 (Getting Started)

1. **저장소 클론 및 패키지 설치**
   ```bash
   git clone https://github.com/krazyeom/sangse.git
   cd sangse
   npm install
   ```

2. **환경 변수 설정**
   루트 디렉토리에 `.env.local` 파일을 생성하고 아래 변수를 입력하세요. (Supabase 프로젝트 정보 필요)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **로컬 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000`으로 접속하여 확인하세요.

#### 📂 주요 디렉토리 구조
- `src/app/`: Next.js 라우트 기반 페이지 및 API 라우트 (`/api/cron/crawl` 등)
- `src/lib/crawlers/`: 각 상품권 샵(명동, 강남 등)별 맞춤형 스크래퍼/크롤러 (OCR 스크립트 포함)
- `src/components/`: 재사용 가능한 UI 컴포넌트

---

<br/>

<a id="english"></a>

## 🇬🇧 English

**Sang Tech** is a real-time tracking and comparison platform for department store gift cards in South Korea (Shinsegae, Lotte, Hyundai). It automatically scrapes purchasing prices from over 10 different exchange shops and provides insights to users engaging in "Sang-tech" (Gift Card Arbitrage/Mileage generation).

### 👥 For Users

#### Key Features
- **Real-time Price Comparison**: Discover which exchange shop currently offers the highest buying price for your specific gift cards.
- **Price Trend Chart**: Interactive 30-day historical chart to analyze price fluctuations (toggle individual gift cards via the legend).
- **Sang-tech Calculator**: Calculate the effective discount rate, net loss (fees), and airline mileage conversion efficiency based on the current market price.
- **Automated Tracking**: The platform continuously gathers daily pricing data and visitor statistics in the background.

---

### 💻 For Developers

This project leverages modern web frameworks and background scraping bots. For sites that upload their daily prices as images instead of text, we utilize OCR technology via Tesseract.js and Sharp to crop and read the numbers accurately.

#### 🛠 Tech Stack
- **Framework**: Next.js 14 (App Router), React
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Data Visualization**: Chart.js (react-chartjs-2)
- **Web Scraping & OCR**: axios, cheerio, Tesseract.js, Sharp

#### 🚀 Getting Started

1. **Clone the repository and install dependencies**
   ```bash
   git clone https://github.com/krazyeom/sangse.git
   cd sangse
   npm install
   ```

2. **Setup Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` with your browser to see the result.

#### 📂 Core Directory Structure
- `src/app/`: Next.js App Router pages and API routes (e.g., `/api/cron/crawl` for cron jobs).
- `src/lib/crawlers/`: Customized scrapers for various gift card exchange shops (including OCR implementations).
- `src/components/`: Reusable UI components.
