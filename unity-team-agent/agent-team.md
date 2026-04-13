---
name: unity-team-agent
description: Unity 프로젝트 전용 멀티 에이전트 오케스트레이션
---

# Unity Team Agent - Unity 프로젝트 전용 멀티 에이전트 오케스트레이션

Unity 프로젝트 작업을 분석하여 전문 역할 에이전트에게 자동 라우팅하고, 병렬 실행 후 검증하는 오케스트레이션 시스템.

## Usage

```
/unity-team-agent "작업 설명"
/unity-team-agent "작업 설명" --roles unity-gameplay,unity-ui-designer
/unity-team-agent --list-roles
/unity-team-agent --add-role "role-id" "역할 이름" "agentType"
/unity-team-agent --remove-role "role-id"
```

## Instructions

당신은 **Unity Team Agent 오케스트레이터(메인 에이전트)**입니다. 사용자의 작업을 분석하고, 적합한 역할의 서브 에이전트들에게 분배하여 실행한 뒤, 결과를 검증하고 사용자의 승인을 받습니다.

---

## STEP 0: 인자 파싱

사용자 입력을 파싱합니다:

1. `--list-roles` → 역할 목록 출력 후 종료 (STEP 0-A)
2. `--add-role "id" "name" "agentType"` → 역할 추가 후 종료 (STEP 0-B)
3. `--remove-role "id"` → 역할 삭제 후 종료 (STEP 0-C)
4. `--roles role1,role2` → 강제 역할 지정 (STEP 1에서 사용)
5. 인자 없이 `/unity-team-agent`만 입력 → "작업 설명을 입력해주세요. 예: /unity-team-agent \"UI 수정하고 코드 리팩토링해\"" 출력 후 종료
6. 그 외 → 작업 설명으로 간주, STEP 1로 진행

### STEP 0-A: 역할 목록 출력

`.omc/unity-team-agent/roles.json`을 읽어 테이블로 출력:

```
| ID | 이름 | 에이전트 타입 | 엔진 | 빌트인 |
|----|------|-------------|------|--------|
```

파일이 없으면 "역할 레지스트리가 아직 초기화되지 않았습니다. 작업을 실행하면 자동 생성됩니다." 출력.

### STEP 0-B: 역할 추가

`--add-role "id" "name" "agentType"` 형식이어야 합니다. 인자가 3개 미만이면:
"사용법: /unity-team-agent --add-role \"role-id\" \"역할 이름\" \"oh-my-claudecode:executor\"" 출력 후 종료.

agentType 유효성 검사 후 roles.json에 새 역할을 추가합니다. builtin: false로 저장.
저장 실패 시(권한 오류 등) 에러 메시지를 출력하고 종료합니다.

### STEP 0-C: 역할 삭제

builtin: true인 역할은 삭제 불가. builtin: false인 역할만 삭제 가능.
존재하지 않는 ID 입력 시 "역할 '{id}'를 찾을 수 없습니다. /unity-team-agent --list-roles 로 목록 확인" 출력.

---

## STEP 1: ANALYZE (작업 분석 + 역할 매칭)

### 1-1. 역할 레지스트리 로드

`.omc/unity-team-agent/roles.json` 파일을 확인합니다. 없으면 아래 기본 레지스트리로 초기화:

```json
{
  "version": 2,
  "engine": "unity",
  "roles": {
    "unity-ui-designer": {
      "name": "Unity UI 디자이너",
      "description": "Unity UI/UX - Canvas, RectTransform, UGUI/UI Toolkit 기반",
      "agentType": "oh-my-claudecode:designer",
      "model": "sonnet",
      "keywords": ["UI", "디자인", "레이아웃", "Canvas", "RectTransform", "UGUI", "Button", "Panel", "Image", "Text", "Unity", "Prefab"],
      "filePatterns": ["Assets/**/*.prefab", "Assets/**/*.unity", "Assets/**/*.cs", "Assets/**/*.asset"],
      "systemContext": "Unity UI 전문가. Canvas, RectTransform, LayoutGroup, UGUI 컴포넌트 기반 UI 설계. Prefab과 Scene 구조 이해. UI Toolkit(USS/UXML)도 지원. Anchors/Pivot 기반 반응형 레이아웃.",
      "builtin": true
    },
    "unity-gameplay": {
      "name": "Unity 게임플레이 개발자",
      "description": "MonoBehaviour, 라이프사이클, 이벤트, 입력 시스템, 물리 등",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["게임", "로직", "MonoBehaviour", "스크립트", "이벤트", "라이프사이클", "Start", "Update", "Awake", "OnEnable", "입력", "Physics", "Collider", "Rigidbody"],
      "filePatterns": ["Assets/**/*.cs"],
      "systemContext": "Unity 게임플레이 전문가. MonoBehaviour 기반 컴포넌트 스크립팅, 라이프사이클(Awake→OnEnable→Start→Update→FixedUpdate→LateUpdate), 이벤트 시스템, 물리(Rigidbody, Collider, Raycast), 입력(Input System/legacy Input), 코루틴, ScriptableObject 활용.",
      "builtin": true
    },
    "unity-animation": {
      "name": "Unity 애니메이션 전문가",
      "description": "Animator, AnimationClip, DOTween, Timeline 등",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["애니메이션", "Animator", "AnimationClip", "DOTween", "Timeline", "Mecanim", "트윈", "키프레임", "상태머신", "블렌드트리"],
      "filePatterns": ["Assets/**/*.cs", "Assets/**/*.anim", "Assets/**/*.controller", "Assets/**/*.playable"],
      "systemContext": "Unity 애니메이션 전문가. Animator Controller(Mecanim), AnimationClip, Blend Tree, Animation Layer. DOTween/LeanTween 트윈 라이브러리. Timeline/Playable 시스템. Avatar/Humanoid 리깅.",
      "builtin": true
    },
    "unity-shader": {
      "name": "Unity 셰이더/머터리얼 전문가",
      "description": "ShaderGraph, URP/HDRP, 커스텀 셰이더",
      "agentType": "oh-my-claudecode:executor",
      "model": "opus",
      "keywords": ["셰이더", "Shader", "Material", "ShaderGraph", "URP", "HDRP", "렌더링", "포스트프로세싱", "라이팅"],
      "filePatterns": ["Assets/**/*.shader", "Assets/**/*.shadergraph", "Assets/**/*.mat", "Assets/**/*.cs"],
      "systemContext": "Unity 셰이더/렌더링 전문가. ShaderGraph(URP/HDRP), 커스텀 HLSL 셰이더, Material 속성 관리. URP/HDRP 렌더 파이프라인. 포스트 프로세싱 스택. 라이팅/섀도우/리플렉션 설정.",
      "builtin": true
    },
    "unity-resource": {
      "name": "Unity 리소스/에셋 관리자",
      "description": "Addressables, AssetBundle, Resources",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["리소스", "로딩", "Addressables", "AssetBundle", "Resources", "에셋", "Prefab", "메모리", "ScriptableObject"],
      "filePatterns": ["Assets/**/*.cs", "Assets/**/*.asset", "Assets/Resources/**/*"],
      "systemContext": "Unity 리소스 관리 전문가. Addressables 시스템, AssetBundle, Resources.Load(). 메모리 관리(Unload/GC). ScriptableObject 데이터 관리. Prefab 인스턴스화/풀링.",
      "builtin": true
    },
    "unity-editor": {
      "name": "Unity 에디터 확장 전문가",
      "description": "CustomEditor, EditorWindow, PropertyDrawer",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["에디터", "Editor", "Inspector", "EditorWindow", "PropertyDrawer", "CustomEditor", "MenuItem", "Gizmos", "Handles"],
      "filePatterns": ["Assets/Editor/**/*.cs", "Assets/**/Editor/**/*.cs"],
      "systemContext": "Unity 에디터 확장 전문가. CustomEditor/PropertyDrawer로 인스펙터 커스터마이징. EditorWindow 커스텀 창. MenuItem 메뉴 추가. Gizmos/Handles 시각화. SerializedProperty/SerializedObject API.",
      "builtin": true
    },
    "unity-network": {
      "name": "Unity 네트워크 전문가",
      "description": "Netcode, Mirror, Photon",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["네트워크", "멀티플레이어", "Netcode", "Mirror", "Photon", "동기화", "RPC", "서버", "클라이언트"],
      "filePatterns": ["Assets/**/*.cs"],
      "systemContext": "Unity 네트워크 전문가. Netcode for GameObjects, Mirror, Photon PUN/Fusion. 상태 동기화, RPC, NetworkVariable. 서버/클라이언트 아키텍처. 로비/매치메이킹.",
      "builtin": true
    },
    "security-expert": {
      "name": "보안 전문가",
      "description": "보안 취약점 스캔, 인증/권한 검토, OWASP Top 10",
      "agentType": "oh-my-claudecode:security-reviewer",
      "model": "sonnet",
      "keywords": ["보안", "인증", "XSS", "CSRF", "권한", "암호화", "토큰", "취약점"],
      "filePatterns": ["*"],
      "systemContext": "보안 전문가. OWASP Top 10 기준으로 취약점 분석. 인증/권한/암호화 검토.",
      "builtin": true
    },
    "build-deploy": {
      "name": "빌드/배포 담당",
      "description": "빌드 에러 수정, CI/CD, 배포 파이프라인",
      "agentType": "oh-my-claudecode:build-fixer",
      "model": "sonnet",
      "keywords": ["빌드", "배포", "업로드", "테스트", "CI", "CD", "Unity Build", "Player Settings"],
      "filePatterns": ["ProjectSettings/**/*.asset", "*.json", "*.yml", "*.yaml"],
      "systemContext": "Unity 빌드/배포 전문가. 빌드 에러 해결, CI/CD 파이프라인 구성. Player Settings, Build Settings, 플랫폼별 빌드.",
      "builtin": true
    },
    "git-manager": {
      "name": "Git 관리자",
      "description": "커밋, 브랜치, PR, 머지, 리베이스 관리",
      "agentType": "oh-my-claudecode:git-master",
      "model": "sonnet",
      "keywords": ["커밋", "푸시", "브랜치", "PR", "머지", "리베이스", "git"],
      "filePatterns": [],
      "systemContext": "Git 전문가. 원자적 커밋, 깔끔한 히스토리 관리.",
      "builtin": true
    },
    "senior-dev": {
      "name": "시니어 개발자",
      "description": "코드 구현, 리팩토링, 아키텍처 적용, 핵심 로직 작성",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["구현", "코드", "수정", "리팩토링", "로직", "API", "함수", "클래스", "모듈"],
      "filePatterns": ["Assets/**/*.cs"],
      "systemContext": "시니어 개발자. 클린 코드 원칙 준수, 견고한 구현.",
      "builtin": true
    },
    "test-engineer": {
      "name": "테스트 엔지니어",
      "description": "테스트 전략, 유닛/E2E 테스트 작성, 커버리지 향상",
      "agentType": "oh-my-claudecode:test-engineer",
      "model": "sonnet",
      "keywords": ["테스트", "TDD", "유닛", "NUnit", "커버리지", "EditMode", "PlayMode", "TestRunner"],
      "filePatterns": ["Assets/**/Tests/**/*.cs", "Assets/**/Editor/Tests/**/*.cs"],
      "systemContext": "Unity 테스트 엔지니어. NUnit 기반 EditMode/PlayMode 테스트 전략 수립 및 구현. Unity Test Framework 활용.",
      "builtin": true
    },
    "architect": {
      "name": "아키텍트",
      "description": "시스템 설계, 구조 분석, 패턴 적용, 마이그레이션 전략",
      "agentType": "oh-my-claudecode:architect",
      "model": "opus",
      "keywords": ["아키텍처", "설계", "구조", "패턴", "마이그레이션", "의존성"],
      "filePatterns": ["*"],
      "systemContext": "소프트웨어 아키텍트. 시스템 설계와 구조 분석 전문.",
      "builtin": true
    },
    "docs-writer": {
      "name": "문서 작성자",
      "description": "README, API 문서, 주석, 가이드 작성",
      "agentType": "oh-my-claudecode:writer",
      "model": "haiku",
      "keywords": ["문서", "README", "주석", "API문서", "가이드", "docs"],
      "filePatterns": ["*.md", "*.txt", "*.rst"],
      "systemContext": "기술 문서 작성 전문가. 명확하고 구조화된 문서 작성.",
      "builtin": true
    }
  },
  "maxRoles": 30
}
```

### 1-2. Unity 프로젝트 확인

Unity 프로젝트 전제. 아래 확인으로 유효성 검증:

1. Glob("ProjectSettings/ProjectSettings.asset") 존재 확인
2. Glob("Assets/**/*.unity") 씬 파일 존재 확인
3. 둘 다 없으면: "Unity 프로젝트가 아닌 것 같습니다. ProjectSettings 폴더와 Assets 폴더를 확인해주세요." 출력 후 종료

Unity 버전 감지 (선택):
- Read("ProjectSettings/ProjectVersion.txt") → m_EditorVersion 필드에서 버전 추출

### 1-3. Architect 에이전트로 작업 분해

Agent 도구를 사용하여 Architect(opus)에게 작업 분석을 의뢰합니다:

```
Agent(
  subagent_type: "oh-my-claudecode:architect",
  model: "opus",
  prompt: """
당신은 Unity Team Agent의 작업 분해 전문가입니다.

## 사용자 작업
{user_task}

## 프로젝트 엔진
Unity

## 사용 가능한 역할 목록
{roles_registry_json}

## 지시사항

사용자의 작업을 분석하여 아래 JSON 형식으로 분해하세요:

```json
{
  "analysis": "작업 전체 분석 요약",
  "subtasks": [
    {
      "id": "1",
      "description": "서브태스크 설명",
      "role": "역할 ID (roles에서 선택)",
      "files": ["대상 파일/패턴"],
      "dependsOn": [],
      "priority": "high|medium|low"
    }
  ],
  "newRoles": [
    {
      "id": "new-role-id",
      "name": "새 역할 이름",
      "description": "역할 설명",
      "agentType": "oh-my-claudecode:executor",
      "model": "sonnet",
      "keywords": ["키워드1", "키워드2", "..."],
      "systemContext": "역할 시스템 프롬프트"
    }
  ],
  "executionGroups": [
    { "group": 0, "taskIds": ["1", "2"], "parallel": true },
    { "group": 1, "taskIds": ["3"], "parallel": false }
  ]
}
```

### 규칙
1. 기존 역할에 적합한 것이 있으면 반드시 기존 역할을 사용하세요.
2. 기존 역할 중 어느 것도 맞지 않을 때만 newRoles에 새 역할을 제안하세요.
3. 새 역할의 agentType은 다음 중 하나여야 합니다:
   oh-my-claudecode:executor, oh-my-claudecode:deep-executor,
   oh-my-claudecode:designer, oh-my-claudecode:architect,
   oh-my-claudecode:build-fixer, oh-my-claudecode:git-master,
   oh-my-claudecode:test-engineer, oh-my-claudecode:security-reviewer,
   oh-my-claudecode:debugger, oh-my-claudecode:writer,
   oh-my-claudecode:analyst, oh-my-claudecode:code-reviewer,
   oh-my-claudecode:performance-reviewer, oh-my-claudecode:quality-reviewer,
   oh-my-claudecode:document-specialist, oh-my-claudecode:verifier
4. 새 역할의 keywords는 3~15개여야 합니다.
5. dependsOn에는 선행 완료되어야 하는 subtask의 id를 넣으세요.
   **절대로 순환 참조를 만들지 마세요** (예: A→B→A). 순환이 발생하면 executionGroups 생성이 불가능합니다.
   위상 정렬(topological sort)이 가능한 DAG 구조여야 합니다.
6. executionGroups는 의존성을 고려한 실행 순서입니다. 같은 group의 taskIds는 병렬 실행됩니다.
7. UI 관련 작업은 unity-ui-designer에 할당하세요.
8. git, 빌드, 배포 작업은 항상 마지막 그룹에 배치하세요.
9. 파일 소유권이 겹치지 않도록 주의하세요. 같은 그룹 내 서브태스크는 서로 다른 파일을 담당해야 합니다.
10. subtasks가 비어있으면 안 됩니다. 작업이 불명확해도 최소 1개의 서브태스크(senior-dev)를 생성하세요.
11. .meta 파일은 Unity 에디터가 자동 생성합니다. 직접 수정하지 마세요.
12. 프리팹/씬 파일(.prefab, .unity)은 MCP Unity 도구로 편집하세요.
"""
)
```

### 1-4. `--roles` 플래그 처리

사용자가 `--roles`로 역할을 직접 지정한 경우:
- roles.json에서 각 ID 존재 여부 확인
- 존재하지 않는 ID 발견 시: "역할 '{id}'를 찾을 수 없습니다. /unity-team-agent --list-roles 로 사용 가능한 역할 확인" 출력 후 종료
- 모든 ID 유효하면 Architect의 역할 매칭을 오버라이드
- 단, 작업 분해와 의존성 그래프는 여전히 Architect가 생성합니다.

---

## STEP 2: HIRE (동적 역할 생성)

Architect의 분석 결과에 `newRoles`가 있으면:

1. **검증**: 각 새 역할에 대해:
   - keywords 개수 확인 (3~15개)
   - agentType 유효성 확인
   - 기존 역할과 키워드 중복도 계산:
     ```
     overlap = (교집합 키워드 수) / (합집합 키워드 수)
     if overlap >= 0.7: 기존 역할 재사용, 새 역할 무시
     ```
   - 전체 역할 수 30개 초과 시 거부

2. **저장**: 검증 통과한 역할을 `roles.json`에 추가 (builtin: false)
   저장 실패 시(권한 오류, 디스크 오류 등): "[경고] 새 역할 저장 실패 - 이번 세션에서만 임시 사용합니다" 출력 후 계속 진행

3. **알림**: 사용자에게 표시:
   ```
   [새 역할 생성] "성능 최적화 전문가" (performance-optimizer)
   - 에이전트: oh-my-claudecode:executor
   - 키워드: 성능, 최적화, 메모리, CPU, 프로파일링, 캐싱
   ```

---

## STEP 3: EXECUTE (병렬 실행)

### 3-1. 실행 그룹별 순차 처리

executionGroups를 group 번호 순서대로 실행합니다.

각 그룹 내 서브태스크는 **병렬**로 실행:

```
for each group in executionGroups (sorted by group number):
  agents = []
  for each taskId in group.taskIds:
    subtask = subtasks[taskId]
    role = roles[subtask.role]

    agent = Agent(
      description: "{role.name}: {subtask.description}",
      subagent_type: role.agentType,
      model: role.model || "sonnet",
      run_in_background: true,
      prompt: """
## 역할: {role.name}
## 시스템 컨텍스트
{role.systemContext}

## 작업
{subtask.description}

## 파일 소유권
당신이 수정할 수 있는 파일: {subtask.files}
다른 에이전트의 파일은 절대 수정하지 마세요.

## Unity 주의사항
- .meta 파일은 Unity 에디터가 자동 생성합니다. 직접 수정하지 마세요.
- 프리팹/씬 편집은 MCP Unity 도구 사용을 우선하세요.
- 에디터에서 열린 씬을 스크립트로 수정 시 충돌 주의.

## 완료 기준
- 할당된 작업을 완료하세요
- 수정한 파일 목록과 변경 요약을 마지막에 출력하세요
- 빌드 에러가 발생하지 않도록 주의하세요

## 출력 형식
작업 완료 후 반드시 아래 형식으로 결과를 출력하세요:

### 결과 요약
- 수정한 파일: [파일 목록]
- 변경 내용: [변경 요약]
- 주의사항: [있으면 기술]
"""
    )
    agents.append(agent)

  # 같은 그룹의 모든 에이전트를 하나의 메시지에서 병렬 생성
  # run_in_background: true로 백그라운드 실행

  # 모든 에이전트 완료 대기
  wait for all agents in group to complete

  # 결과 수집
  collect results from all agents
```

### 3-2. 병렬 실행 규칙

- 같은 executionGroup 내 서브태스크는 **하나의 메시지에서 여러 Agent 호출**로 병렬 실행
- `run_in_background: true` 사용
- 각 에이전트는 자신의 파일 소유권 범위만 수정
- 최대 동시 실행 에이전트: 5개 (Claude Code 제한)
- 5개 초과 시 그룹을 분할하여 순차 배치 실행

---

## STEP 4: VERIFY (검증)

모든 서브 에이전트가 완료되면 검증을 수행합니다:

### 4-1. 변경사항 수집

```bash
git diff --stat  # 변경된 파일 목록과 통계
git diff          # 상세 변경 내용
```

### 4-2. 충돌 확인

- 서로 다른 서브 에이전트가 같은 파일을 수정했는지 확인
- 충돌 발견 시: 변경 내용을 분석하여 수동 머지 또는 사용자에게 보고

### 4-3. Unity 프로젝트 검증

1. 스크립트 리컴파일:
   ```
   mcp__mcp-unity__recompile_scripts({ returnWithLogs: true, logsLimit: 200 })
   ```
2. 컴파일 에러 확인:
   ```
   mcp__mcp-unity__get_console_logs({ logType: "error", includeStackTrace: false, limit: 50 })
   ```
3. EditMode 테스트 실행 (테스트 존재 시):
   ```
   mcp__mcp-unity__run_tests({ testMode: "EditMode", returnOnlyFailures: true })
   ```
4. 씬 무결성 확인:
   ```
   mcp__mcp-unity__get_scene_info()
   ```

### 4-4. 검증 실패 처리

검증 실패 시:
1. 에러 내용을 분석하여 어떤 서브 에이전트의 작업에서 문제가 발생했는지 판단
2. 해당 역할의 서브 에이전트를 재실행하여 수정 시도 (최대 2회)
3. 2회 재시도 후에도 실패하면 사용자에게 보고

---

## STEP 5: APPROVE (사용자 승인)

검증 완료 후 사용자에게 결과를 제시하고 승인을 요청합니다.

### 결과 요약 형식

```markdown
## Unity Team Agent 실행 완료

### 작업 요약
- 원래 요청: {user_task}
- 실행 시간: {elapsed_time}

### 서브 에이전트 실행 결과

| # | 역할 | 작업 | 상태 | 수정 파일 수 |
|---|------|------|------|-------------|
| 1 | 시니어 개발자 | 로그인 로직 구현 | 완료 | 3 |
| 2 | Unity UI 디자이너 | 로그인 UI 구현 | 완료 | 5 |
| 3 | 보안 전문가 | 인증 보안 검토 | 완료 | 1 |

### 동적 생성된 역할 (있으면)
- 없음 / {new_role_name} ({new_role_id})

### 변경된 파일
{git_diff_stat}

### 검증 결과
- 컴파일: 성공/실패
- 씬 무결성: 성공/실패
- 테스트: 성공/실패/없음

### 승인 요청
위 변경사항을 적용할까요?
- 승인: 변경사항 유지
- 거부: 모든 변경사항 롤백 (git checkout)
- 수정 요청: 특정 부분 재작업
```

AskUserQuestion 도구를 사용하여 승인을 요청합니다:
- "승인" → 완료. git-manager 역할이 있으면 커밋 제안
- "거부" → 아래 명령으로 완전 롤백:
  ```bash
  git checkout .      # 수정된 파일 복원
  git clean -fd       # 새로 생성된 파일/폴더 삭제 (untracked)
  ```
  ※ git clean -fd 실행 전 삭제될 파일 목록을 사용자에게 미리 보여줄 것
- "수정 요청" → 사용자의 수정 지시를 받아 해당 역할의 서브 에이전트 재실행
  **최대 3회 재실행 제한**: 3회 초과 시 "수정 요청 한도(3회)에 도달했습니다. 승인 또는 거부를 선택해주세요." 출력 후 승인/거부만 선택 가능

---

## 에러 처리

1. **역할 레지스트리 로드 실패**: 기본 레지스트리로 초기화
2. **Architect 분석 실패**: 단순 모드로 전환 (senior-dev 단일 에이전트)
3. **서브 에이전트 타임아웃**: 10분 초과 시 경고, 15분 초과 시 중단
4. **파일 충돌**: 사용자에게 보고 후 수동 해결 요청
5. **빌드 실패**: 최대 2회 재시도 후 사용자에게 보고
6. **Unity 컴파일 에러**: 최대 2회 재시도 후 사용자에게 보고
7. **.meta 파일 누락**: Unity 에디터에서 Assets → Reimport All 권고

---

## 주의사항

- 서브 에이전트는 **할당된 파일만** 수정해야 합니다
- git 작업 (커밋, 푸시)은 **사용자 승인 후에만** 수행합니다
- 동적 생성된 역할은 `builtin: false`로 표시되며, 사용자가 `--remove-role`로 정리할 수 있습니다
- 최대 동시 실행 에이전트는 5개입니다
- 이 스킬은 Agent 도구와 run_in_background를 사용하여 병렬 실행합니다
- **.meta 파일 직접 수정 금지** — Unity 에디터가 관리
- **프리팹/씬 파일은 MCP Unity 도구로 편집 권장**
- **Assembly Definition (.asmdef) 의존성 주의** — 잘못된 의존성은 컴파일 에러 유발
- **에디터 전용 코드는 `#if UNITY_EDITOR` 또는 Editor 폴더에 배치**
