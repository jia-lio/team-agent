# team-agent

[Claude Code](https://claude.ai/claude-code)용 게임 엔진 전문 멀티 에이전트 오케스트레이션 스킬 모음.

## What is team-agent?

하나의 작업 지시로 여러 전문 에이전트가 협업하는 Claude Code 스킬입니다.

**기존 방식**: "인벤토리 시스템 만들어" → 한 에이전트가 UI, 로직, 애니메이션, 리소스 관리까지 전부 처리

**team-agent**: 같은 요청 → Architect가 작업 분해 → UI 전문가 + 게임플레이 전문가 + 리소스 관리자가 **병렬 실행** → 자동 검증 → 사용자 승인

```
사용자: /unity-team-agent "인벤토리 시스템 구현하고 UI 만들어"

┌─ Architect (opus) ─── 작업 분해 ───┐
│                                      │
├─→ unity-gameplay  : 인벤토리 로직    │ ← 병렬 실행
├─→ unity-ui-designer: 인벤토리 UI     │
├─→ unity-resource  : 아이템 데이터    │
│                                      │
└─→ VERIFY → APPROVE ─────────────────┘
```

### 핵심 특징

- **자동 역할 매칭** — 작업 내용에서 키워드 분석 → 적합한 전문 에이전트 자동 할당
- **병렬 실행** — 독립적인 작업은 동시에 실행 (최대 5개 에이전트)
- **파일 소유권** — 에이전트별 담당 파일 분리, 충돌 방지
- **동적 역할 생성** — 기존 역할에 없는 전문성이 필요하면 즉석 생성
- **자동 검증** — Unity: 스크립트 리컴파일 + 콘솔 에러 확인 / Cocos: 타입체크
- **승인 워크플로** — 변경사항 리뷰 후 승인/거부/수정 요청

## Supported Engines

| Engine | Skill | Roles |
|--------|-------|-------|
| **Unity** | `/unity-team-agent` | UI, Gameplay, Animation, Shader, Resource, Editor, Network + 범용 7개 |
| **Cocos Creator 2.x/3.x** | `/cocos-team-agent` | Gameplay, UI, Prefab, Animation, Audio, Physics, Resource, Network, Shader, Performance, Platform, Preview, Migrate, Architect, i18n + 범용 2개 |

## Install

### npx (권장)

```bash
# 전체 설치
npx @jia-lio/team-agent install

# Unity 스킬만
npx @jia-lio/team-agent install --unity

# Cocos 스킬만
npx @jia-lio/team-agent install --cocos
```

> GitHub Packages 레지스트리 설정이 필요합니다:
> ```bash
> echo "@jia-lio:registry=https://npm.pkg.github.com" >> ~/.npmrc
> ```

### Manual

`*-team-agent/agent-team.md` 파일을 `~/.claude/commands/`에 복사:

```bash
cp unity-team-agent/agent-team.md ~/.claude/commands/unity-team-agent.md
cp cocos-team-agent/agent-team.md ~/.claude/commands/cocos-team-agent.md
```

## Usage

```bash
# Unity 프로젝트에서
/unity-team-agent "인벤토리 시스템 구현하고 UI 만들어"
/unity-team-agent "셰이더 최적화하고 애니메이션 수정해" --roles unity-shader,unity-animation

# Cocos Creator 프로젝트에서
/cocos-team-agent "로비 UI 리뉴얼하고 로딩 최적화해"
/cocos-team-agent --list-roles
```

## Commands

| Command | Description |
|---------|-------------|
| `/[skill] "작업"` | 작업 분석 → 역할 매칭 → 병렬 실행 → 검증 → 승인 |
| `/[skill] --list-roles` | 사용 가능한 역할 목록 |
| `/[skill] --add-role "id" "name" "agentType"` | 커스텀 역할 추가 |
| `/[skill] --remove-role "id"` | 커스텀 역할 삭제 |
| `/[skill] "작업" --roles role1,role2` | 특정 역할 강제 지정 |

## How It Works

```
1. ANALYZE  — Architect(opus)가 작업 분해, 역할 매칭, 실행 그래프 생성
2. HIRE     — 기존 역할에 없으면 동적 역할 생성
3. EXECUTE  — 실행 그룹별 병렬 에이전트 실행 (최대 5개 동시)
4. VERIFY   — 컴파일/빌드 검증, 충돌 확인, 테스트 실행
5. APPROVE  — 사용자 승인 (승인/거부/수정 요청)
```

## CLI Management

```bash
# 설치 상태 확인
npx @jia-lio/team-agent list

# 스킬 제거
npx @jia-lio/team-agent uninstall

# 강제 덮어쓰기
npx @jia-lio/team-agent install --force
```

## License

MIT
