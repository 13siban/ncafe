# URL 슬러그(Slug) 전환 계획서

본 문서는 ncafe 프로젝트의 모든 ID 기반 URL을 슬러그(slug) 기반으로 전환하여 SEO 최적화 및 사용자 친화적인 주소 체계를 구축하기 위한 계획을 담고 있습니다.

## 1. 목표
- 숫자 ID 기반의 불투명한 URL을 의미 있는 단어 조합(슬러그)으로 교체
- 검색 엔진 최적화(SEO) 및 링크 공유 시 가독성 개선
- 사용자 경험 향상

## 2. 전환 대상 및 방식

| 구분 | 현재 URL 구조 | 전환 후 URL 구조 (ID + Text) | 활용 데이터 |
| :--- | :--- | :--- | :--- |
| **메뉴 상세 페이지** | `/menus/[id]` | `/menus/[id]-[engName]` | `menus.eng_name` |
| **관리자 메뉴 관리** | `/admin/menus/[id]` | `/admin/menus/[id]-[engName]` | `menus.eng_name` |
| **관리자 카테고리 관리** | `/admin/categories/[id]` | `/admin/categories/[id]-[name]` | `categories.name` |

## 3. 단계별 실행 계획

### Phase 1: 데이터 검증 및 백엔드 준비 (DB 변경 없음)
1. **데이터 정합성 확인**
   - 기존 `menus`의 `eng_name`이 비어있는 경우(null) 처리 방안 마련 (기본값 설정 등)
   - 영문 이름 내 공백이나 특수문자를 하이픈(`-`)으로 변환하는 유틸리티 로직 확인
2. **API 응답 데이터 확인**
   - 메뉴 및 카테고리 목록/상세 API에서 `engName`과 `name`이 정상적으로 반환되는지 점검

### Phase 2: 백엔드 API 서버 (선택 사항)
1. **슬러그 생성 유틸리티 (Optional)**
   - API 응답 시 프런트엔드의 편의를 위해 `slug` 필드를 가상으로 만들어 전달할 수 있음 (예: "123-americano")
   - 하지만 프런트엔드에서 조합하여 사용하는 방식이 가장 간편함

### Phase 3: 프런트엔드 라우팅 및 처리 로직 변경
1. **Next.js 라우팅 폴더 이름 변경**
   - `frontend/app/menus/[id]` -> `frontend/app/menus/[slug]`
   - `frontend/app/admin/menus/[id]` -> `frontend/app/admin/menus/[slug]`
2. **데이터 파싱 로직 구현**
   - `[slug]` 파라미터에서 ID만 추출하는 함수 구현
   - 예: `"123-americano".split('-')[0]`를 통해 `123` 획득 후 기존 ID 기반 API 호출
3. **컴포넌트 내 링크 수정**
   - `<Link href={`/menus/${menu.id}-${menu.engName}`}>` 형태로 이동 경로 일괄 수정
   - `engName` 내 공백을 `-`로 변환하는 헬퍼 함수 활용

### Phase 4: 테스트 및 최적화
1. **SEO 유효성 검사**
   - 소스코드 보기에서 URL 내 키워드(메뉴명)가 정상적으로 포함되는지 확인
2. **하위 호환성 유지**
   - 기존의 `/menus/123` (숫자만 있는 주소)으로 접속 시에도 ID 추출 로직이 정상 작동하므로 이전 링크들이 깨지지 않음

## 4. 기대 효과
- **SEO 최적화**: 검색 엔진이 URL의 키워드를 인식하여 검색 결과 노출 확률 증대
- **보안 강화**: 연속적인 ID 값을 숨김으로써 전체 데이터 규모 노출 방지
- **편의성**: 사용자가 URL만 보고도 어떤 메뉴인지 직관적으로 이해 가능
