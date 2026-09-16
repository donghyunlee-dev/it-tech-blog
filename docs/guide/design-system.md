# Design System Inspired SFOOD

> **2026-09-15 갱신 — `@sfood/ui` 채택 완료**: 2026-09-14에는 `@sfood/ui@0.1.2`가 React 19에서 즉시 크래시하고 `CommentThread`도 미배포 상태라 적용이 불가했으나, 담당팀이 `0.1.3`으로 원인(React 미externalize)을 수정하고 `CommentThread`/`ColorTag`/`Highlight`/`MultiSelect`를 실제로 배포했다. 이 저장소는 React를 18.3.1로 낮추고 `@sfood/ui@0.1.3` + Tailwind를 도입해 실제 화면(댓글 게이트 흐름의 Card/Button/Input/CommentThread, 검색의 CommandPalette)에 반영했다 — 상세는 [design-system-adoption.md](design-system-adoption.md), [docs/tasks/viewer-editorial-ui/result.md](../tasks/viewer-editorial-ui/result.md) 참고. **브랜드 컬러는 이 문서의 `#e4002B`가 아니라 `@sfood/ui`의 공식 토큰 `--color-brand`(`#d65050`)가 기준**이다 — 아래 본문의 `#e4002B` 관련 서술은 과거 자체 토큰 시절 기록으로, 코드에서는 이미 `--color-brand`를 참조하도록 교체되었다(하드코딩 금지). 폰트도 `--font-sans`(Pretendard Variable 우선) 토큰을 따른다. 다만 라운드 스케일(8/14/20/32px)·3-layer 그림자 등 이 문서가 정의한 레이아웃 리듬은 에디토리얼 매거진 디자인 전용으로 별도 승인된 값이라 `@sfood/ui`의 자체 스케일로 대체하지 않고 그대로 유지한다.

## 1. Visual Theme & Atmosphere

에쓰푸드의 디자인은 잘 정리된 컨설팅 페이퍼를 보듯이, 간결하고, 핵심 메세지 중심이며, 시각화(도표, 표, 차트)를 적절히 사용하여 한 눈에 잘 읽히도록 한다. 디자인은 순백색(#ffffff)를 기반으로 하며, 상징 색깔인 에쓰푸드 레드(**#e4002B**)를 핵심 브랜드 포인트 컬러로 사용한다. 

타이포그래피는 **맑은고딕**, **pretendard** 서체를 사용한다. 폰트 굵기는 일반적으로 500(dedium)을, 강조에는 600(semibold)를, 주요 헤드라인 및 타이틀엔 700(Bold)를 사용한다. 헤드라인 및 타이틀에는 -0.18px ~ -0.44px 정도의 미세한 음수 자간(letter-spacing)이 적용되어, 더 아늑하고 친밀한 읽기 경험을 만들고 제한된 영역안에 더 많은 텍스트를 넣을 수 있도록 한다.

줄 간격은 1.3~1.5배를 주어 줄간 간격이 적당히 떨어지도록 하여 적절한 가독성을 제공하고, 도형 안에 텍스트를 배치할 경우 크기에 따라 적절한 Margin을 주어 외곽 테두리와 텍스트가 너무 붙어 있지 않도록 한다.

워드나 파워포인트에서 표를 사용할 옅은 테두리를 두르며, 차트 사용시 축과 범례의 텍스트 크기가 본문 보다 작도록 설정한다. 차트는 정확한 비율율 보여줄 수 있도록 하며, 항상 데이터 레이블을 표시한다.

보고서는 인쇄물로 출력할 경우를 상정하여 이에 적합한 디자인 요소를 활용한다. 즉, 워드나 엑셀 등에선 텍스트 효과나 그림자 효과 등을 지양하고, 파워포인트에선 텍스트 효과는 지양하되, 도형 블럭, 카드 등의 배치 시에는 아주 옅은 그림자 효과를 주어 해당 영역이 눈에 띄도록 한다. 다만 이 경우에도 그림자는 요소를 과하게 띄우지 않으면서도, 따뜻하고 부드러운 입체감을 만들어내는데 중점을 두고 8px~32px 수준의 넉넉한 border-rauius을 주도록 한다.

파워포인트 작업 시 우측 하단에 항상 페이지 번호를 표시하되, 첫장과 마지막 장에는 번호를 표시하지 않는다. 첫장에는 항상 작성자(또는 팀)과 작성일이 작게 들어갈 수 있도록 배치한다.

**Key Characteristics:**
- Pure white canvas with Sfood Red (`#e4002B) as brand accent
- Three-layer card shadows: border ring + soft blur + stronger blur
- Generous border-radius: 8px buttons, 14px badges, 20px cards, 32px large elements
- Near-black text (`#54585A`) — warm, not cold

## 2. Color Palette & Roles

### Primary Brand
- **Rausch Red** (`#e4002B`): `--palette-bg-primary-core`, primary, brand accent, Core and Highlight Sentence/text
- **Deep red** (`#e00b41`): `--palette-bg-tertiary-core`, pressed/dark variant of brand red
- **Error Red** (`#888888`): `--palette-text-primary-error`, sub text on light

### Text Scale
- **Near Black** (`#54585A`): `--palette-text-primary`, primary text — warm, not cold
- **Focused Gray** (`#3f3f3f`): `--palette-text-focused`, focused state text
- **Secondary Gray** (`#6a6a6a`): Secondary text, descriptions
- **Disabled** (`rgba(0,0,0,0.24)`): `--palette-text-material-disabled`, disabled state
- **Link Disabled** (`#929292`): `--palette-text-link-disabled`, disabled links


### Surface & Shadows
- **Pure White** (`#ffffff`): Page background, card surfaces
- **Card Shadow** (`rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px`): Three-layer warm lift

## 3. Typography Rules

### Font Family
- **Primary**: `맑은고딕`, fallbacks: `pretendard, Circular, -apple-system, system-ui, Roboto, Helvetica Neue`
- **OpenType Features**: `"salt"` (stylistic alternates) on specific caption elements

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Section Heading | 맑은고딕 | 28px (1.75rem) | 700 | 1.43 | normal | Primary headings |
| Card Heading | 맑은고딕 | 22px (1.38rem) | 600 | 1.18 (tight) | -0.44px | Category/card titles |
| Card Heading Medium | 맑은고딕 | 22px (1.38rem) | 500 | 1.18 (tight) | -0.44px | Lighter variant |
| Sub-heading | 맑은고딕 | 21px (1.31rem) | 700 | 1.43 | normal | Bold sub-headings |
| Feature Title | 맑은고딕 | 20px (1.25rem) | 600 | 1.20 (tight) | -0.18px | Feature headings |
| UI Medium | 맑은고딕 | 16px (1.00rem) | 500 | 1.25 (tight) | normal | Nav, emphasized text |
| UI Semibold | 맑은고딕 | 16px (1.00rem) | 600 | 1.25 (tight) | normal | Strong emphasis |
| Button | 맑은고딕 | 16px (1.00rem) | 500 | 1.25 (tight) | normal | Button labels |
| Body / Link | 맑은고딕 | 14px (0.88rem) | 400 | 1.43 | normal | Standard body |
| Body Medium | 맑은고딕 | 14px (0.88rem) | 500 | 1.29 (tight) | normal | Medium body |
| Caption Salt | 맑은고딕 | 14px (0.88rem) | 600 | 1.43 | normal | `"salt"` feature |
| Small | 맑은고딕 | 13px (0.81rem) | 400 | 1.23 (tight) | normal | Descriptions |
| Tag | 맑은고딕 | 12px (0.75rem) | 400–700 | 1.33 | normal | Tags, prices |
| Badge | 맑은고딕 | 11px (0.69rem) | 600 | 1.18 (tight) | normal | `"salt"` feature |
| Micro Uppercase | 맑은고딕 | 8px (0.50rem) | 700 | 1.25 (tight) | 0.32px | `text-transform: uppercase` |

### Principles
- **Warm weight range**: 500–700 dominate. No weight 300 or 400 for headings — Sfood's type is always at least medium weight, creating a warm, confident voice.
- **Negative tracking on headings**: -0.18px to -0.44px letter-spacing on display creates intimate, cozy headings rather than cold, compressed ones.
- **"salt" OpenType feature**: Stylistic alternates on specific UI elements (badges, captions) create subtle glyph variations that add visual interest.

## 4. Component Stylings

### Buttons

**Primary Dark**
- Background: `#222222` (near-black, not pure black)
- Text: `#ffffff`
- Padding: 0px 24px
- Radius: 8px
- Hover: transitions to error/brand accent via `var(--accent-bg-error)`
- Focus: `0 0 0 2px var(--palette-grey1000)` ring + scale(0.92)

**Circular Nav**
- Background: `#f2f2f2`
- Text: `#222222`
- Radius: 50% (circle)
- Hover: shadow `rgba(0,0,0,0.08) 0px 4px 12px` + translateX(50%)
- Active: 4px white border ring + focus shadow
- Focus: scale(0.92) shrink animation

### Cards & Containers
- Background: `#ffffff`
- Radius: 14px (badges), 20px (cards/buttons), 32px (large)
- Shadow: `rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px` (three-layer)
- Listing cards: full-width photography on top, details below
- Carousel controls: circular 50% buttons

### Image Treatment
- Listing photography fills card top with generous height
- Image carousel with dot indicators
- Heart/wishlist icon overlay on images
- 8px–14px radius on contained images

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 2px, 3px, 4px, 6px, 8px, 10px, 11px, 12px, 15px, 16px, 22px, 24px, 32px

### Grid & Container
- Full-width header with centered search
- Category pill bar: horizontal scrollable row
- Listing grid: responsive multi-column (3–5 columns on desktop)
- Full-width footer with link columns

### Border Radius Scale
- Subtle (4px): Small links
- Standard (8px): Buttons, tabs, search elements
- Badge (14px): Status badges, labels
- Card (20px): Feature cards, large buttons
- Large (32px): Large containers, hero elements
- Circle (50%): Nav controls, avatars, icons

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, text blocks |
| Card (Level 1) | `rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px` | Listing cards, search bar |

**Shadow Philosophy**: sfood's three-layer shadow system creates a warm, natural lift. Layer 1 (`0px 0px 0px 1px` at 0.02 opacity) is an ultra-subtle border. Layer 2 (`0px 2px 6px` at 0.04) provides soft ambient shadow. Layer 3 (`0px 4px 8px` at 0.1) adds the primary lift. This graduated approach creates shadows that feel like natural light rather than CSS effects.

## 7. Do's and Don'ts

### Do
- Use `#000000` (pure black) for text
- Apply sfood Red (`#e4002B`) only for brand moments
- Use 맑은고딕 at weight 500–700 — the warm weight range is intentional
- Apply the three-layer card shadow for all elevated surfaces
- Use generous border-radius: 8px for buttons, 20px for cards, 50% for controls
- Use photography as the primary visual content — listings are image-first
- Apply negative letter-spacing (-0.18px to -0.44px) on headings for intimacy

### Don't
- Don't apply sfood Red to backgrounds or large surfaces — it's an accent only
- Don't use thin font weights (300, 400) for headings — 500 minimum
- Don't use heavy shadows (>0.1 opacity as primary layer) — keep them warm and graduated
- Don't use sharp corners (0–4px) on cards — the generous rounding (20px+) is core
- Don't introduce additional brand colors beyond the Rausch/Luxe/Plus system

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: Pure White (`#ffffff`)
- Text: Pure Black (`#000000`)
- Brand accent: sfood Red (`#e4002B`)
- Secondary text: `#54585A`
- Disabled: `rgba(0,0,0,0.24)`
- Card border: `rgba(0,0,0,0.02) 0px 0px 0px 1px`
- Card shadow: full three-layer stack
- Button surface: `#f2f2f2`

### Example Component Prompts
- "Create a listing card: white background, 20px radius. Three-layer shadow: rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px. Photo area on top (16:10 ratio), details below: 16px 맑은고딕 weight 600 title, 14px weight 400 description in #54585A."
- "Build category pill bar: horizontal scrollable row. Each pill: 14px Cereal VF weight 600, #222222 text, bottom border on active. Circular prev/next arrows (#f2f2f2 bg, 50% radius)."

### Iteration Guide
1. Start with white — the photography provides all the color
2. sfood Red (#e4002B) is the stress accent
3. Pure black (#000000) for text
4. Three-layer shadows create natural, warm lift — always use all three layers
5. Generous radius: 8px buttons, 20px cards, 50% controls
6. Cereal VF at 500–700 weight — no thin weights for any heading
