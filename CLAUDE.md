# AirNotes

独立运行的 Wiki 知识库服务，由 norlandsoft 开发。支持富文本编辑、白板绘图、思维导图三种文档格式。

## Tech Stack

### Backend
- **Language:** Java 21
- **Framework:** Spring Boot 4.1.0-M4 (milestone)
- **Build:** Maven, multi-module
- **Database:** PostgreSQL (JDBC + MyBatis + DBCP2)
- **Logging:** Log4j2 (Logback excluded)
- **Utilities:** Hutool (NanoId), Lombok

### Frontend
- **Framework:** React 18 + UmiJS Max 4 + DVA
- **UI:** Ant Design 5, Semi UI, custom AirDesign components
- **Rich Text:** Tiptap 3.x (with table, image, code block extensions)
- **Whiteboard:** Excalidraw 0.18.x
- **Mind Map:** XYFlow (React Flow) 12.x

## Project Structure

```
AirNotes/
├── pom.xml                          # Parent POM — dependency management
├── platform/                        # Backend module (jar)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/norlandsoft/air/
│       │   ├── notes/               # Startup class (AirNotes.java)
│       │   ├── wiki/                # Wiki module
│       │   │   ├── controller/      # REST controllers (docs, space)
│       │   │   ├── service/         # Service interfaces + impl
│       │   │   ├── mapper/          # MyBatis mappers (+ XML)
│       │   │   └── model/
│       │   │       ├── entity/      # WikiSpace, WikiDocument, WikiMindNode
│       │   │       └── vo/          # SpaceVO, DocDetailVO, DocMenuVO, MindNodeVO
│       │   ├── commons/             # ActionResponse (unified API response)
│       │   └── utils/               # IDGenerator, TemplateUtils, CryptoUtils
│       └── resources/
│           ├── application.yml      # Spring config + PostgreSQL datasource
│           ├── db/schema_wiki.sql   # Database schema (4 tables)
│           └── tpl/wiki/            # Document templates (document.json, sketch.json, mind_map.json)
├── frontend/                        # Frontend (React + UmiJS)
│   ├── .umirc.ts                    # UmiJS config (routes, proxy)
│   ├── package.json
│   └── src/
│       ├── layouts/                 # WikiLayout, Error404
│       ├── models/global.ts         # DVA global state (frameSize)
│       ├── pages/Wiki/              # Wiki pages + components
│       ├── components/
│       │   ├── AirDesign/           # Custom UI component library
│       │   ├── RichEditor/          # Tiptap rich text editor
│       │   └── MindPanel/           # XYFlow mind map component
│       └── utils/HttpRequest.ts     # HTTP client
└── CLAUDE.md
```

## Database

PostgreSQL database `air_notes` with 4 tables:

| Table | Purpose |
|---|---|
| `wiki_space` | Document workspaces |
| `wiki_space_recent` | Recent space visits per user |
| `wiki_doc_content` | Documents with tree structure (supports doc/board/mind formats) |
| `wiki_mind_content` | Mind map nodes |

Schema file: `platform/src/main/resources/db/schema_wiki.sql` — run manually against PostgreSQL.

## Build & Run

```bash
# Backend (port 8000)
cd platform && mvn spring-boot:run

# Frontend (port 9000, proxies /rest to backend)
cd frontend && npm install && npm start
```

## API Endpoints

All endpoints are POST, return `ActionResponse<T>`:

- `/rest/wiki/space/*` — Space CRUD + recent visits
- `/rest/wiki/docs/*` — Document CRUD + menu tree + breadcrumb
- `/rest/wiki/mind/*` — Mind map node management

## Key Conventions

- MyBatis mapper XML files are colocated with Java mapper interfaces under `src/main/java` (not `src/main/resources`).
- Document root ID convention: `000000`.
- Document formats: `doc` (rich text), `board` (Excalidraw whiteboard), `mind` (XYFlow mind map).
- IDs generated via `IDGenerator.shortID()` (12-char NanoId).
- Template files use `{{PLACEHOLDER}}` syntax for variable substitution.
