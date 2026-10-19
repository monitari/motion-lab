# Motion Lab

마우스로 만지고, 끌고, 던지고, 터뜨려 보는 **인터랙티브 웹 애니메이션 82종**.
라이브러리·빌드 도구 없이 순수 HTML · CSS · JavaScript · WebGL만으로 만들었습니다.

| 카테고리 | 개수 | 예시 |
| --- | --- | --- |
| Holo Cards | 8 | 레인보우 / 코스모스 / 골드 / 프리즘 홀로 카드, 카드 팬, 떼어내는 스티커, 스와이프 덱, 조커 핸드(카드 태우기) |
| Glass | 8 | 리퀴드 글래스 렌즈(SVG 굴절+색수차), 프로스트 UI, 독, 글래스 컨트롤, 유리 깨기, 골유리, 김 서린 창문, 분산 프리즘 |
| Typography | 10 | 파티클 텍스트, 스크램블, 글리치, 가변 폰트, 스플릿 플랩, 고무 글자, 네온, 마키, ASCII 도넛, 타자 낙하 |
| Generative | 15 | 플로우 필드, 하이퍼스페이스, 불꽃놀이, 벚나무 프랙탈, 점 지구본, 블랙홀, 플라즈마 볼, 만다라, 반응확산, 로렌츠, 점균 … |
| Physics | 13 | 보이드, 찢어지는 천, 모래, 물결, 절차적 도마뱀, 레이저 하프, 젤리, 볼풀, 이중 진자, 유체, 자기장, 궤도, 전구 줄 |
| Shader | 10 | 성운, 메타볼, 리퀴드 크롬, 줄리아 집합, 만화경, 네온 터널, 보로노이, 용암 램프, 중력 렌즈, 실크 그라디언트 |
| Interaction | 15 | 자석 버튼, X-ray 스포트라이트, 리본, 컨페티, 3D 캐러셀, 큐브, 패럴랙스, 구이, 눈알, 뽁뽁이, 정렬 목록, 좋아요 … |
| Web Platform | 3 | View Transitions, Scroll-driven Animations, @property |

## 실행

빌드가 필요 없습니다. `index.html`을 브라우저로 열면 바로 동작합니다.
(로컬 서버를 쓰고 싶다면 `npx serve .` 또는 `python -m http.server`)

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
js/demos/*.js       카테고리별 데모
```

- 미리보기는 `IntersectionObserver`로 **화면에 보일 때만** 실행되고, 벗어나면 완전히 정리됩니다.
- 필터 줄의 `Preview Live / Hover`로 마우스를 올린 것만 재생하게 바꿀 수 있습니다 (저사양 기기용).
- 뷰어 단축키: `←/→` 이동, `R` 재시작, `T` 값 조절, `S` 소스, `F` 전체 화면, `Esc` 닫기.
- 일부 데모는 `s.params()`로 값을 노출하고, 뷰어의 Tweak 패널에서 실시간으로 바꿀 수 있습니다.
- 라이트/다크 테마는 시스템 설정을 따르고, 오른쪽 위 버튼으로 바꿀 수 있습니다.
- 사용자가 가만히 있으면 각 데모는 가상 커서(ghost)로 스스로 움직입니다.
- 물리 시뮬레이션은 `s.fixed()` 고정 스텝으로 돌아서 60Hz, 144Hz 모니터에서 같은 속도로 움직입니다.
- `thumbs/`의 정지 이미지는 미리보기가 켜지기 전과 Hover 모드에서 보입니다. 데모를 고치면 다시 캡처하세요.
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
