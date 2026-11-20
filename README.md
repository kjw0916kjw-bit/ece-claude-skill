# ece-claude-skill

유아교육(Early Childhood Education)을 위한 Claude Code 플러그인입니다.

한국 유아교육 현장(유치원·어린이집)의 관점과 용어에 맞춰, 2019 개정 누리과정·제4차 표준보육과정을 기반으로 놀이계획안, 관찰기록, 가정통신문·알림장, 부모상담, 문서 검토, 교사 면접 준비를 돕습니다.

## 구성

**스킬 5개** — 상황에 맞게 자동으로 로드됩니다
| 스킬 | 내용 |
|---|---|
| `early-childhood-education` | 기초 지식: 누리과정, 표준보육과정, 발달, 이론, 관찰·평가, 양식, 정책·안전 |
| `play-planning` | 놀이중심 주간·일일 계획, 놀이 흐름도, 놀이 지원 |
| `observation-records` | 메모 → 일화기록, 사실/해석 분리, 종합 의견 |
| `parent-communication` | 가정통신문, 알림장, 부모상담, 사고 안내 |
| `teacher-career` | 채용 면접, 임용 준비, 자기소개서 |

**에이전트 7명**
| 에이전트 | 역할 |
|---|---|
| `play-planner` | 놀이계획 담당 교사 |
| `infant-toddler-teacher` | 영아반(만 0~2세) 전담 교사: 일과, 적응, 기본생활, 물기·분리불안 대응, 영아 관찰, 영아반 부모 소통 |
| `observation-analyst` | 관찰기록 분석가 |
| `parent-communicator` | 학부모 소통 담당 |
| `curriculum-reviewer` | 누리과정·놀이중심 검토자 (읽기 전용) |
| `safety-health-advisor` | 안전·건강·아동보호 자문 |
| `interview-coach` | 면접 코치 |

**명령어 9개**
| 명령어 | 하는 일 |
|---|---|
| `/ece:play-plan [만 O세] [주간/일일] [놀이 관심]` | 놀이계획안 작성 |
| `/ece:observe <관찰 메모>` | 일화기록 정리 |
| `/ece:notice <주제·세부 내용>` | 가정통신문 작성 |
| `/ece:daily-note <유아> <오늘의 일화>` | 알림장 작성 |
| `/ece:parent-meeting <준비/기록> <내용>` | 부모상담 준비·기록 |
| `/ece:review <파일 또는 글>` | 문서 검토 (교육과정·소통·안전) |
| `/ece:mock-interview [기관] [신입/경력] [질문 수]` | 모의면접 |
| `/ece:learn <기억할 내용>` | 내 규칙·피드백 저장 |
| `/ece:notes [show / export / import <파일> / tidy]` | 노트 보기, 내보내기, 다른 노트와 합치기, 정리 |

**예시 8개** — 스킬이 결과물을 쓰기 전에 형식과 수준을 맞추는 기준 (모두 가상 사례)
| 위치 | 예시 |
|---|---|
| `skills/play-planning/examples/` | 만 4세 주간 계획·실행 기록, 만 1세 영아반 일과 |
| `skills/observation-records/examples/` | 메모 → 일화기록 변환, 만 5세 학기말 종합 의견 |
| `skills/parent-communication/examples/` | 현장체험학습 가정통신문, 물림 사고 안내, 알림장 3종 |
| `skills/teacher-career/examples/` | 면접 모범 답변 5개 |

**훅 2개**
| 훅 | 하는 일 |
|---|---|
| `SessionStart` → `scripts/load-user-notes.js` | 세션을 시작할 때 `~/.claude/ece/user-notes.md`를 자동으로 불러옵니다. 노트가 없거나 빈 양식이면 아무것도 하지 않습니다. |
| `PostToolUse` (Write·Edit) → `scripts/privacy-warning.js` | Claude가 문서(.md .txt .html .csv)를 저장하면 **휴대전화 번호, 주민·외국인등록번호, 카드 번호**가 들어 있는지 검사해서 경고합니다. 번호는 일부를 가려서 보여 주고(예: `010-****-5678`), 저장을 막지는 않습니다. `010-0000-0000` 같은 양식용 번호는 건너뜁니다. 끄려면 환경 변수 `ECE_PRIVACY_WARNING=0`을 설정합니다. |

> 개인정보 경고 훅은 Claude가 Write·Edit 도구로 저장한 텍스트 문서만 검사합니다. 워드(.docx)처럼 스크립트로 만든 파일이나 유아 실명은 검사하지 못하니, 이름은 이니셜·가명으로 쓰는 습관을 함께 지켜 주세요.

## 웹 앱 (설치 없이 바로 쓰기)

Claude Code가 없어도 브라우저에서 바로 쓸 수 있는 도구입니다. GitHub Pages로 공개됩니다.

| 앱 | 주소 | 하는 일 |
|---|---|---|
| 보육교사 상황면접 연습실 | https://kjw0916kjw-bit.github.io/ece-claude-skill/interview/ | 채용 면접 상황 질문 15문항(유아 지도·발달 5 / 학부모 소통·동료 관계 6 / 안전·건강·아동보호 4), 원장 꼬리 질문 30개, 1분 타이머, 질문 듣기·말로 답하기, 핵심 포인트 체크리스트와 모범 답안 |

- **앱으로 설치**: 휴대폰 크롬·삼성 인터넷은 메뉴의 "홈 화면에 추가" 또는 "앱 설치", 아이폰 사파리는 공유 → "홈 화면에 추가", PC 크롬·엣지는 주소창 오른쪽 설치 아이콘을 누르세요. 한 번 연 뒤에는 인터넷이 끊겨도 열립니다.
- **개인정보**: 답변은 그 기기 안에서만 쓰이고 어디에도 저장되거나 전송되지 않습니다. 질문 듣기·말로 답하기는 브라우저의 음성 기능을 쓰며, 지원하지 않는 브라우저에서는 버튼이 보이지 않습니다.
- **AI 피드백**: 웹 버전은 체크리스트와 모범 답안으로 스스로 점검합니다. 같은 앱을 claude.ai 아티팩트로 열면 답변마다 Claude 피드백과 원장 꼬리 질문 피드백도 받을 수 있습니다.
- **소스**: `docs/interview/` (`index.html` 하나에 문항·화면·동작이 모두 들어 있습니다. 앱 파일을 바꾸면 `sw.js`의 `VERSION`을 올려야 설치한 앱에도 반영됩니다.)

## 설치

Claude Code에서:
```
/plugin marketplace add kjw0916kjw-bit/ece-claude-skill
/plugin install ece@ece-claude-skill
/reload-plugins
```

## 나에게 맞게 학습시키기

`/ece:learn`으로 알려준 규칙과 피드백은 `~/.claude/ece/user-notes.md`에 저장됩니다. 세션을 시작할 때 훅이 이 파일을 자동으로 불러오기 때문에, 어떤 대화에서든 유아교육 작업을 할 때 이 내용이 우선 적용됩니다. (플러그인을 업데이트해도 지워지지 않습니다.)

내 기관의 실제 양식이나 잘 쓴 문서가 있다면 (실명은 지우고) 해당 스킬의 `examples/`에 추가해 보세요. Claude가 그 수준에 맞춰 작성합니다.

예시:
```
/ece:learn 나는 만 3세 담임이고 어린이집에서 일해
/ece:learn 계획안에 "활동"이라는 말 대신 "놀이"라고 써줘
```

노트 관리:
```
/ece:notes                     # 지금 노트 요약 보기
/ece:notes export              # 파일로 내보내기 (개인정보를 확인하고 가리기)
/ece:notes import 동료노트.md  # 동료 선생님 노트와 합치기 (미리 보고 확인 → 백업 → 추가)
/ece:notes tidy                # 중복 합치기, 피드백을 규칙으로 정리
```

## 자동 검사

PR을 올리거나 `main`에 반영될 때마다 GitHub Actions가 검사합니다 (`.github/workflows/validate.yml`). 외부 패키지 없이 Node만 사용합니다.

| 검사 | 내용 |
|---|---|
| 매니페스트 | `plugin.json`·`marketplace.json`·`hooks.json` 형식, 두 파일의 버전 일치, 훅 스크립트 존재 |
| 구성 요소 | 스킬·에이전트·명령어의 `name`·`description`, 파일명과 이름 일치, 이름 중복, SKILL.md가 가리키는 참고·예시 파일 존재, 모든 에이전트의 `입력 다루기 원칙`(프롬프트 인젝션 방어) 섹션 |
| 개인정보 | 로컬 사용자 경로, 이메일, 휴대전화 번호, 주민등록번호, GitHub 토큰, Anthropic API 키 |
| 훅 테스트 | 노트 로드 훅 5개 + 개인정보 경고 훅 8개 (감지·가림, 문서 외 파일 무시, 끄기 설정, 잘못된 입력, 양식 번호 제외) |

로컬에서 실행:
```
node scripts/ci/validate.js
node --test tests/
```

## 변경 이력

| 버전 | PR | 내용 |
|---|---|---|
| — | #14 | 상황면접 연습실 학부모 소통·동료 관계 영역에 3문항 추가: CCTV 열람 요구, 다른 아이 정보 요구, 원장 지시와 내 생각 (꼬리 질문 6개 포함) |
| — | #12 | 웹 앱 추가: 보육교사 상황면접 연습실 (`docs/interview/`, GitHub Pages·PWA 설치 지원). 자동 검사의 개인정보 검사에 `.html`·`.webmanifest` 포함 |
| 0.6.3 | #10 | 사용자 노트 빈 양식 이름 변경: `references/user-notes.md` → `references/user-notes.template.md` (실제 노트 `~/.claude/ece/user-notes.md`와 헷갈리지 않도록) |
| 0.6.2 | #9 | 에이전트 입력 다루기 원칙 보강: 사회공학 시도 방어 추가 |
| 0.6.1 | #8 | 모든 에이전트에 입력 다루기 원칙(프롬프트 인젝션 방어) 섹션 추가 |
| 0.6.0 | #7 | `PostToolUse` 개인정보 경고 훅 추가 (휴대전화·주민등록번호·카드 번호) |
| — | #6 | GitHub Actions 자동 검사 추가 (구조, 개인정보, 훅 테스트) |
| 0.5.0 | #5 | 영아반(만 0~2세) 전담 `infant-toddler-teacher` 에이전트 추가 |
| 0.4.0 | #4 | `/ece:notes` 명령어 추가 (보기, 내보내기, 가져오기, 정리) |
| 0.3.0 | #3 | 예시 결과물 8개와 `SessionStart` 노트 로드 훅 추가 |
| 0.2.0 | #2 | Claude Code 플러그인으로 묶음: 에이전트·명령어 추가, 사용자 노트를 `~/.claude/ece/`로 옮김 |
| — | #1 | `early-childhood-education` 스킬 최초 추가 (플러그인 이전, 버전 없음) |

## 주의

- 내용은 일반적인 유아교육 지식을 바탕으로 작성했으며, 고시 원문과의 대조 검증은 진행 중입니다.
- 정책·평가·지원금 등 바뀌는 내용에는 `[확인 필요]` 표시가 있으니 최신 공문을 확인하세요.
- 유아 실명·사진 등 개인정보는 가명·이니셜로 바꿔 사용하세요.

## 라이선스

MIT
