# team-agent

Claude Code용 게임 엔진 전문 멀티 에이전트 오케스트레이션 스킬 모음.

작업을 분석하여 전문 역할 에이전트(UI, 게임플레이, 셰이더, 애니메이션 등)에게 자동 라우팅하고, 병렬 실행 후 검증합니다.

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
