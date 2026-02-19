---
name: issue
description: >
  GitHub 이슈를 빠르게 생성하는 스킬. /issue 뒤에 설명을 붙이거나 /issue 만 입력하면 트리거.
  문제 상황이나 기능 추가 요청을 받아 타입(feat/fix/chore/refactor/docs)·라벨·본문 초안을
  작성하고 사용자 확인 후 gh issue create 를 실행한다.
  대상 레포: GoBeromsu/jocoding-music
---

# /issue

## 레포 정보

- **GitHub 레포**: `GoBeromsu/jocoding-music`
- **로컬 경로**: `/Users/beomsu/Documents/GitHub/Hackerthon/jocoding`

## 라벨 체계

| 카테고리 | 사용 가능한 값 |
|---|---|
| 타입 | `feat` `fix` `chore` `refactor` `docs` |
| 우선순위 | `priority: high` `priority: medium` `priority: low` |
| 상태 | `status: in progress` `status: blocked` |
| 영역 | `area: electron` `area: ui` `area: ai-agent` `area: ipc` `area: library` |

이슈마다 **타입 1개 + 우선순위 1개 + 영역 1개 이상** 을 부착한다.

## 워크플로우

### 1. 입력 수신

- `/issue <설명>` → 설명을 바로 분석
- `/issue` (설명 없음) → "어떤 이슈인가요?" 질문 후 답변으로 분석

### 2. 타입 결정 → 템플릿 로드

설명을 분석해 타입을 결정하고 해당 템플릿을 참조한다:

- `feat` → `references/template-feat.md`
- `fix` → `references/template-fix.md`
- `chore` → `references/template-chore.md`
- `refactor` → `references/template-refactor.md`
- `docs` → `references/template-docs.md`

### 3. 초안 출력

아래 형식으로 이슈 초안을 보여준다:

```
**타이틀**: feat: URL 임포트 진행률 표시 추가

**라벨**: feat, priority: high, area: ui

**본문**:
## 배경
...

## 요구사항
- ...

## 완료 조건
- [ ] ...

---
등록할까요? (OK / 수정 사항 전달)
```

### 4. 확인 후 실행

사용자가 OK 하면 아래 명령을 실행:

```bash
gh issue create \
  --repo GoBeromsu/jocoding-music \
  --title "<타이틀>" \
  --body "<본문>" \
  --label "<라벨1>,<라벨2>,<라벨3>"
```

수정 요청이 오면 해당 부분만 수정 후 재확인.

### 5. 완료 출력

이슈 URL과 함께 브랜치 이름 제안:

```
✅ #12 등록 완료: https://github.com/GoBeromsu/jocoding-music/issues/12
브랜치: feat/12-url-import-progress
```
