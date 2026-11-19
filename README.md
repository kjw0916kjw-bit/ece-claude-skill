# ece-claude-skill

유아교육(Early Childhood Education)을 위한 Claude Code 스킬입니다.

한국 유아교육 현장(유치원·어린이집)의 관점과 용어에 맞춰 Claude가 놀이계획안, 관찰기록, 가정통신문, 부모상담 기록 등을 작성하고, 누리과정·표준보육과정·발달·이론 관련 질문에 답할 수 있도록 돕습니다.

## 설치

```bash
git clone https://github.com/kjw0916kjw-bit/ece-claude-skill.git
cp -r ece-claude-skill/skills/early-childhood-education ~/.claude/skills/
```

Windows (PowerShell):
```powershell
Copy-Item -Recurse ece-claude-skill\skills\early-childhood-education $env:USERPROFILE\.claude\skills\
```

설치 후 Claude Code에서 유아교육 관련 요청을 하면 스킬이 자동으로 로드됩니다.

## 라이선스

MIT
