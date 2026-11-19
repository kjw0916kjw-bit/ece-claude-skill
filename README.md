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

**에이전트 6명**
| 에이전트 | 역할 |
|---|---|
| `play-planner` | 놀이계획 담당 교사 |
| `observation-analyst` | 관찰기록 분석가 |
| `parent-communicator` | 학부모 소통 담당 |
| `curriculum-reviewer` | 누리과정·놀이중심 검토자 (읽기 전용) |
| `safety-health-advisor` | 안전·건강·아동보호 자문 |
| `interview-coach` | 면접 코치 |

**명령어 8개**
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

## 설치

Claude Code에서:
```
/plugin marketplace add kjw0916kjw-bit/ece-claude-skill
/plugin install ece@ece-claude-skill
/reload-plugins
```

## 나에게 맞게 학습시키기

`/ece:learn`으로 알려준 규칙과 피드백은 `~/.claude/ece/user-notes.md`에 저장되고, 모든 스킬과 에이전트가 이 내용을 우선 적용합니다. (플러그인을 업데이트해도 지워지지 않습니다.)

예시:
```
/ece:learn 나는 만 3세 담임이고 어린이집에서 일해
/ece:learn 계획안에 "활동"이라는 말 대신 "놀이"라고 써줘
```

## 주의

- 내용은 일반적인 유아교육 지식을 바탕으로 작성했으며, 고시 원문과의 대조 검증은 진행 중입니다.
- 정책·평가·지원금 등 바뀌는 내용에는 `[확인 필요]` 표시가 있으니 최신 공문을 확인하세요.
- 유아 실명·사진 등 개인정보는 가명·이니셜로 바꿔 사용하세요.

## 라이선스

MIT
