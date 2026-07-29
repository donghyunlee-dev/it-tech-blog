# 개요

사내 직원 전체가 MS 계정으로 로그인하여 문서를 작성하고, 게시된 문서를 Tech Blog에서 열람할 수 있는 서비스를 구축한다.

서비스는 문서를 작성하고 게시하는 **Editor**, 게시된 문서를 보여주는 **Viewer**, Viewer에 연결하여 사용하는 **Comment**로 구성한다. Editor와 Comment에서 생성한 데이터는 Confluence API를 통해 저장하고 조회한다.
# 서비스 구성

- **Editor**: 문서 작성, 수정, 관리, 게시를 담당한다.
- **Viewer**: Editor에서 게시된 문서를 조회하여 서비스 목적에 맞게 보여준다.
- **Comment**: Viewer에 연결하여 사용하는 별도 댓글 서비스이다.
- **Confluence**: Editor와 Comment에서 생성한 데이터를 보관하고 API로 제공한다.

# 공통 원칙

- Editor와 Comment는 사내 직원 전체가 MS Login을 통해 이용한다.
- Confluence API는 프로젝트 담당자의 단일 Confluence 계정으로 연결한다.
- Confluence에 표시되는 작성 계정과 실제 작성자는 서로 다를 수 있다.
- 서비스에서는 MS Login 사용자를 실제 작성자 또는 댓글 작성자로 인식한다.
- IT팀은 Confluence와 Editor 양쪽에서 문서를 작성하거나 수정할 수 있다.
- 문서 게시 기능은 Editor에서만 제공하며, Viewer에 공개할 문서는 반드시 Editor를 거쳐 게시한다.
- Editor와 Comment의 인증 적용 기준은 MS Login 연계 기획·설계를 참고한다.

# Editor

Confluence 계정이 없는 사내 직원도 문서를 작성하고 관리할 수 있도록 MS 계정 기반의 문서 작성 도구를 제공한다.

사용자가 로그인하면 메일 계정을 기준으로 Confluence Space 안의 개인 폴더를 확인한다. 개인 폴더가 있으면 기존 문서와 연결하고, 없으면 폴더를 생성한 뒤 Editor에 접속한다.

Editor는 Markdown, 블록 단위 편집, 이미지 등록 등 Confluence 문서로 변환하여 저장할 수 있는 편집 기능을 제공한다. 작성한 문서는 왼쪽 탐색기에서 폴더와 페이지 구조로 조회할 수 있도록 구성한다.

문서 작성과 수정뿐 아니라 게시 여부와 노출할 Viewer를 설정하는 기능도 Editor에 포함한다. Confluence에서 직접 작성하거나 수정한 문서도 Viewer에 게시하려면 Editor에서 게시 상태를 설정해야 한다.

Editor는 게시할 때 공개 주소에 사용할 경로와 검색·공유에 필요한 원본 정보를 Confluence의 content properties에 저장한다. 검색엔진과 외부 서비스에 전달할 형식은 Viewer가 이 정보를 바탕으로 생성한다.

# Viewer

Viewer는 Editor에서 게시된 문서만 조회하여 보여주는 공개 서비스이다. Tech Blog는 첫 번째 Viewer이며, Editor에서 지정한 게시 위치에 따라 문서를 구성한다.

Editor와 Viewer를 분리하여 동일한 Confluence 문서를 다른 형태의 Viewer에서도 활용할 수 있도록 한다. 문서는 Editor에서 작성하고 게시 위치를 설정하며, 각 Viewer는 자신에게 게시된 문서만 조회한다.

Viewer의 중요한 기능은 Confluence 컴포넌트 컨버터 기능이다. confluence에서 인식되는 컴포넌트를 웹 뷰에서 적절하게 CSS를 매칭하여 깔끔하게 사용자에게 보이도록 처리해야 한다.

## SEO 준비

Viewer는 게시된 문서마다 변하지 않는 고유 URL을 제공하고, 검색엔진이 문서 본문을 읽을 수 있도록 HTML로 제공한다.

게시된 문서를 검색엔진이 발견할 수 있도록 sitemap.xml과 RSS를 생성하고, robots.txt로 검색 허용 범위를 전달한다. 동일 문서의 대표 주소는 canonical URL로 지정하며, 문서 주소가 변경되거나 삭제되면 기존 주소를 적절한 페이지로 연결한다.

Confluence의 문서와 content properties를 바탕으로 검색 결과와 외부 공유에 필요한 메타데이터를 생성하고, 게시글의 성격을 검색엔진이 이해할 수 있도록 구조화 데이터를 제공한다.

게시글 사이의 관련 글과 내부 링크를 제공하여 검색엔진과 방문자가 연결된 문서를 계속 탐색할 수 있도록 한다.

회사 홈페이지와 B2C·B2B 서비스 등 관련 사이트로 이동할 수 있는 연관 사이트 링크를 제공한다.

# Comment

Comment는 Viewer에 연결하여 사용할 수 있는 별도 서비스로 구성한다. 사내 직원은 MS Login을 통해 댓글을 작성하며, 댓글은 Confluence API를 통해 저장하고 조회한다.

Confluence에는 단일 계정으로 댓글이 기록되므로, 서비스에서는 MS Login 사용자를 실제 댓글 작성자로 구분하여 표시한다. 

댓글은 외부 사용자도 작성할 수 있어야 한다. 외부 사용자는 사용자명, 이메일을 작성하고, 누락없는 상태에서 댓글을 입력하여 최소한의 정보 수집으로 MS Login과 동일하게 계정 정보를 받을 수 있어야 한다. 

Confluence에 댓글에도 나의 계정으로 생성이 되기 때문에 로그인 계정 정보와 댓글 내용을 구조화 해서 저장해야 한다. 

예시 : 이름 | 이메일 | 댓글 

반대로 Comment에 노출이 될 때는 댓글 정보가 파싱되어 계정 정보 + 댓글을 노출해야 한다.

## 대댓글 구성

일반 댓글과 대댓글은 Confluence에서 생성된 Comment ID로 식별하고, 대댓글은 답변 대상 댓글의 Comment ID를 parentCommentId로 지정하여 관계를 구성한다.

대댓글의 단계를 고정하지 않고 parentCommentId 관계를 재귀적으로 따라가 전체 댓글 계층을 구성한다. 대댓글에 다시 작성된 답글도 같은 방식으로 하위 댓글로 연결한다.

## 댓글 조회

기본적으로 Comment ID와 parentCommentId 관계를 반복하여 조회하고 댓글 계층을 구성한다.

댓글 수나 계층이 증가하여 조회 속도에 문제가 발생하면, 전체 댓글을 한 번에 조회한 뒤 Comment ID와 parentCommentId를 기준으로 계층을 구성하는 등 API 호출과 반복 조회를 최소화할 수 있는 최적의 조회 방법을 적용한다.

조회 방식이 변경되더라도 사용자에게 표시되는 댓글 계층과 답글 관계는 동일하게 유지한다.

MS Login 연계 기획·설계
