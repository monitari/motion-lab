# Motion Lab

마우스로 만지고, 끌고, 던지고, 터뜨려 보는 **인터랙티브 웹 애니메이션 95종**.
라이브러리·빌드 도구 없이 순수 HTML · CSS · JavaScript · WebGL만으로 만들었습니다.

| 카테고리 | 개수 | 예시 |
| --- | --- | --- |
| Holo Cards | 8 | 레인보우 / 코스모스 / 골드 / 프리즘 홀로 카드, 카드 팬, 떼어내는 스티커, 스와이프 덱, 조커 핸드(카드 태우기) |
| Glass | 8 | 리퀴드 글래스 렌즈(SVG 굴절+색수차), 프로스트 UI, 독, 글래스 컨트롤, 유리 깨기, 골유리, 김 서린 창문, 분산 프리즘 |
| Material Studies | 2 | 수채화 번짐, 실로 풀리는 포스터 |
| Typography | 20 | 파티클 텍스트, 스크램블, 글리치, 가변 폰트, 스플릿 플랩, 고무 글자, 네온, 마키, ASCII 도넛, 타자 낙하, 원통 문장, 등고선 글자, CMY 인쇄, 한글 자모 분해, 커서를 피하는 문단, 타자기, 한글 단어 시계, 경로 위의 문장, 녹는 글자, 물결 문단 |
| Generative | 15 | 플로우 필드, 하이퍼스페이스, 불꽃놀이, 벚나무 프랙탈, 점 지구본, 블랙홀, 플라즈마 볼, 만다라, 반응확산, 로렌츠, 점균 … |
| Physics | 14 | 보이드, 찢어지는 천, 모래, 물결, 절차적 도마뱀, 레이저 하프, 젤리, 볼풀, 이중 진자, 유체, 자기장, 궤도, 전구 줄, 클라드니 무늬 |
| Shader | 10 | 성운, 메타볼, 리퀴드 크롬, 줄리아 집합, 만화경, 네온 터널, 보로노이, 용암 램프, 중력 렌즈, 실크 그라디언트 |
| Interaction | 15 | 자석 버튼, X-ray 스포트라이트, 리본, 컨페티, 3D 캐러셀, 큐브, 패럴랙스, 구이, 눈알, 뽁뽁이, 정렬 목록, 좋아요 … |
| Web Platform | 3 | View Transitions, Scroll-driven Animations, @property |

## 실행

새 작품은 `#/watercolor-bloom`, `#/unwoven-poster`, `#/chladni-plate`로 바로 열 수 있습니다.

`js/demos/materials.js`의 세 작품은 아래 레퍼런스에서 시각적 아이디어를 얻어 Canvas 2D로 새로 구현했습니다. 포스터 이미지와 종이 질감도 코드로 그리며, 외부 이미지·라이브러리를 추가하지 않습니다.

- [Payton Turnage — 생성형 수채화](https://paytonturnage.com/writing/water-color/): 불규칙한 반투명 안료층. 여기서는 캐시한 안료 도장을 확장해 번짐을 표현하며, 실제 유체 시뮬레이션은 아닙니다.
- [Clément Grellier — Unwoven](https://tympanus.net/Development/Unwoven/): 이미지와 실의 연결. 자체 포스터를 잘게 나누고 스프링으로 변형합니다.
- [Cimatica](https://www.cimatica.org/en): 소리와 클라드니 무늬. 코사인 정상파의 영점으로 입자를 이동시키는 시각적 근사이며, 실제 판의 고유진동수나 마이크 분석을 계산하지 않습니다.

빌드가 필요 없습니다. `index.html`을 브라우저로 열면 바로 동작합니다.
(로컬 서버를 쓰고 싶다면 `npx serve .` 또는 `python -m http.server`)

## 탐색과 공유

- 분류 버튼과 검색어를 함께 적용합니다. 각 분류의 숫자는 현재 검색어에 맞는 작품 수이며, 결과가 없으면 무작위 열기가 비활성화됩니다.
- `처음이라면`에서 입문용 작품 6개를 볼 수 있습니다. `조건 초기화`는 분류와 검색을 모두 해제합니다.
- 목록에서 작품을 연 뒤 브라우저 뒤로가기를 누르면 목록 위치로 돌아갑니다. 앞으로가기는 마지막으로 보던 작품을 다시 엽니다.
- 뷰어의 `링크 복사`로 작품 주소를 복사합니다. 로컬 파일로 열었다면 로컬 경로가 복사되므로, 다른 사람에게 공유할 때는 배포된 사이트를 이용하세요.
- 터치 기기는 기본적으로 자동 재생이 꺼져 있으며, 작품을 탭하면 크게 열립니다. 사용자가 바꾼 재생 설정은 유지됩니다.
- `코드` 패널은 구현을 읽기 위한 발췌입니다. 공용 Lab 기능과 데모별 헬퍼까지 포함한 독립 실행 예제는 아닙니다.

## 탐색 회귀 검사

Node.js 22 이상과 Chrome 또는 Edge가 설치된 Windows에서 `node tests/browser-smoke.cjs`를 실행합니다. 별도 npm 패키지는 필요 없습니다. 다른 설치 경로는 `CHROME_PATH` 환경 변수로 지정할 수 있습니다.

분류·검색 조합, 빈 결과, 추천 작품, 뒤로가기·앞으로가기, 직접 링크, 모바일 탭 조작과 대화상자 상태를 검사합니다. 데스크톱과 모바일 캡처는 출력되는 임시 폴더에 저장합니다.

`node tests/browser-smoke.cjs --new-works`는 새 작품 3개의 마우스·터치 조작, 값 조절, 수명 종료 정리를 추가 검사합니다. `--write-thumbs`까지 붙이면 실제 렌더링에서 `thumbs/`의 새 작품 WebP 3개를 다시 생성합니다.

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소에 push
2. 저장소 **Settings → Pages → Build and deployment**
3. Source: `Deploy from a branch`, Branch: `main` / `/ (root)` 선택 후 Save
4. 잠시 후 `https://<username>.github.io/<repo>/` 에서 확인

`.nojekyll` 파일이 포함되어 있어 Jekyll 처리 없이 그대로 서빙됩니다.

## 구조

```
index.html          레이아웃 (히어로, 툴바, 뷰어)
css/style.css       사이트 스타일
js/core.js          데모 등록, Scope(생명주기), 캔버스/포인터/셰이더 헬퍼, 노이즈
js/notes.js         설명문, 조작법, 분류 소개 (문구는 여기서만 고침)
js/app.js           목록 생성, 미리보기 관리, 히어로, 뷰어(소스 보기, 재시작, 전체 화면), 검색, 테마
js/demos/*.js       카테고리별 데모 (type-studies.js, type-lab.js는 타이포그래피 묶음)
```

- 미리보기는 `IntersectionObserver`로 **화면에 보일 때만** 실행되고, 벗어나면 완전히 정리됩니다.
- 필터 줄의 `자동 재생 켬 / 끔`으로 마우스를 올린 것만 재생하게 바꿀 수 있습니다 (저사양 기기용).
- 뷰어 단축키: `←/→` 이동, `R` 재시작, `T` 값 조절, `S` 소스, `F` 전체 화면, `Esc` 닫기.
- 일부 데모는 `s.params()`로 값을 노출하고, 뷰어의 `값 조절` 패널에서 실시간으로 바꿀 수 있습니다.
- 라이트/다크 테마는 시스템 설정을 따르고, 오른쪽 위 버튼으로 바꿀 수 있습니다.
- 사용자가 가만히 있으면 각 데모는 가상 커서(ghost)로 스스로 움직입니다.
- 물리 시뮬레이션은 `s.fixed()` 고정 스텝으로 돌아서 60Hz, 144Hz 모니터에서 같은 속도로 움직입니다.
- `thumbs/`의 정지 이미지는 미리보기가 켜지기 전과 자동 재생을 끈 상태에서 보입니다. 데모를 고치면 다시 캡처하세요.
- 오른쪽 클릭이 필요한 동작은 `s.modes()` 버튼으로도 고를 수 있어 터치에서도 쓸 수 있습니다.
- 폰에서는 화면을 만지지 않을 때 **기울기**가 가상 커서가 됩니다 (iOS는 상단 Tilt 버튼으로 권한 허용).
- 데모 사이 이동, 테마 전환, 히어로 교체는 View Transitions API로 전환됩니다 (미지원 브라우저는 일반 애니메이션).
- 링크 공유: `index.html#/liquid-lens` 처럼 해시로 특정 데모를 바로 열 수 있습니다.

## 데모 추가하기

`js/demos/` 아래 아무 파일에 다음처럼 등록하고, `js/notes.js`에 설명과 조작법을 한 줄 추가하면 목록에 나타납니다.

```js
Lab.register({
  id: 'my-demo',            // URL 해시로도 쓰임
  cat: 'ui',                // cards | glass | text | canvas | physics | shader | ui
  title: 'My Demo',
  tags: ['canvas', 'mouse'],
  css: `.my{...}`,          // 선택. cq 단위(cqmin 등)를 쓰면 썸네일/전체화면 모두 비율이 맞음
  mount(el, s) {
    const c = s.canvas();           // DPR 대응 캔버스 (자동 리사이즈)
    const p = s.pointer();          // {x, y, down, idle ...}
    const P = s.params({ speed: [1, 0, 5, 0.1, '속도'] }); // Tweak 패널에 슬라이더로 나옴
    s.raf((dt, t) => { /* 매 프레임 */ });
    // s.on / s.timeout / s.interval 로 등록한 것은 언마운트 시 자동 정리
  },
});
```

```js
// js/notes.js
'my-demo': ['한두 문장 설명', 'Move:하는 일|Click:하는 일'],
```

## 참고한 레퍼런스

- [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css) — 홀로 카드 레이어/블렌드 기법
- [shuding/liquid-glass](https://github.com/shuding/liquid-glass), [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) — SVG 변위맵 굴절
- Shadertoy, The Coding Train, CodePen 커뮤니티의 고전적인 기법들 (도메인 워핑, 버렛 천, 보이드, 줄리아 등)

모든 코드와 카드 일러스트(SVG 크리처)는 직접 작성한 오리지널입니다.
