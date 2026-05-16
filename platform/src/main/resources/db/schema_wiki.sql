-- =====================================================
-- Wiki 文档空间表
-- =====================================================
DROP TABLE IF EXISTS wiki_space;
CREATE TABLE wiki_space
(
  id           VARCHAR(50)  PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  icon         VARCHAR(100),
  status       VARCHAR(1)   DEFAULT 'A',
  creator_id   VARCHAR(50),
  creator_name VARCHAR(100),
  create_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  update_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wiki_space_name ON wiki_space (name);
CREATE INDEX IF NOT EXISTS idx_wiki_space_status ON wiki_space (status);
CREATE INDEX IF NOT EXISTS idx_wiki_space_creator_id ON wiki_space (creator_id);

COMMENT ON TABLE wiki_space IS 'Wiki文档空间表，存储文档工作空间的基本信息';
COMMENT ON COLUMN wiki_space.id IS '空间ID，主键';
COMMENT ON COLUMN wiki_space.name IS '空间名称';
COMMENT ON COLUMN wiki_space.description IS '空间描述';
COMMENT ON COLUMN wiki_space.icon IS '空间图标';
COMMENT ON COLUMN wiki_space.status IS '状态：A-启用 F-禁用 D-删除';
COMMENT ON COLUMN wiki_space.creator_id IS '创建人ID';
COMMENT ON COLUMN wiki_space.creator_name IS '创建人名称';
COMMENT ON COLUMN wiki_space.create_time IS '创建时间';
COMMENT ON COLUMN wiki_space.update_time IS '更新时间';

-- =====================================================
-- Wiki 最近访问空间表
-- =====================================================
DROP TABLE IF EXISTS wiki_space_recent;
CREATE TABLE wiki_space_recent
(
  user_id    VARCHAR(50) NOT NULL,
  space_id   VARCHAR(50) NOT NULL,
  last_visit TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, space_id)
);

CREATE INDEX IF NOT EXISTS idx_wiki_space_recent_space_id ON wiki_space_recent (space_id);
CREATE INDEX IF NOT EXISTS idx_wiki_space_recent_last_visit ON wiki_space_recent (last_visit);

COMMENT ON TABLE wiki_space_recent IS 'Wiki最近访问空间表，记录用户最近访问的文档空间';
COMMENT ON COLUMN wiki_space_recent.user_id IS '用户ID';
COMMENT ON COLUMN wiki_space_recent.space_id IS '空间ID';
COMMENT ON COLUMN wiki_space_recent.last_visit IS '最后访问时间';

-- =====================================================
-- Wiki 文档内容表
-- =====================================================
DROP TABLE IF EXISTS wiki_doc_content;
CREATE TABLE wiki_doc_content
(
  id           VARCHAR(50)  PRIMARY KEY,
  title        VARCHAR(500),
  icon         VARCHAR(100),
  space        VARCHAR(50),
  parent_id    VARCHAR(50),
  format       VARCHAR(20),
  file_type    VARCHAR(20),
  content      TEXT,
  sort_order   INTEGER      DEFAULT 0,
  status       VARCHAR(1)   DEFAULT 'A',
  creator_id   VARCHAR(50),
  creator_name VARCHAR(100),
  create_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  update_time  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wiki_doc_content_parent_id ON wiki_doc_content (parent_id);
CREATE INDEX IF NOT EXISTS idx_wiki_doc_content_space ON wiki_doc_content (space);
CREATE INDEX IF NOT EXISTS idx_wiki_doc_content_creator_id ON wiki_doc_content (creator_id);
CREATE INDEX IF NOT EXISTS idx_wiki_doc_content_format ON wiki_doc_content (format);

COMMENT ON TABLE wiki_doc_content IS 'Wiki文档内容表，存储文档的实际内容和元数据';
COMMENT ON COLUMN wiki_doc_content.id IS '文档ID，主键';
COMMENT ON COLUMN wiki_doc_content.title IS '文档标题';
COMMENT ON COLUMN wiki_doc_content.icon IS '文档图标';
COMMENT ON COLUMN wiki_doc_content.space IS '所属空间ID';
COMMENT ON COLUMN wiki_doc_content.parent_id IS '父文档ID，根文档为000000';
COMMENT ON COLUMN wiki_doc_content.format IS '文档类型：doc-富文本 board-白板 mind-思维导图';
COMMENT ON COLUMN wiki_doc_content.file_type IS '文件类型';
COMMENT ON COLUMN wiki_doc_content.content IS '文档内容（JSON格式）';
COMMENT ON COLUMN wiki_doc_content.sort_order IS '排序序号';
COMMENT ON COLUMN wiki_doc_content.status IS '状态：A-启用 F-禁用 D-删除';
COMMENT ON COLUMN wiki_doc_content.creator_id IS '创建人ID';
COMMENT ON COLUMN wiki_doc_content.creator_name IS '创建人名称';
COMMENT ON COLUMN wiki_doc_content.create_time IS '创建时间';
COMMENT ON COLUMN wiki_doc_content.update_time IS '更新时间';

-- =====================================================
-- Wiki 思维导图节点表
-- =====================================================
DROP TABLE IF EXISTS wiki_mind_content;
CREATE TABLE wiki_mind_content
(
  id          VARCHAR(50) PRIMARY KEY,
  value       TEXT,
  parent_id   VARCHAR(50),
  document_id VARCHAR(50),
  level       INTEGER    DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wiki_mind_content_document_id ON wiki_mind_content (document_id);
CREATE INDEX IF NOT EXISTS idx_wiki_mind_content_parent_id ON wiki_mind_content (parent_id);

COMMENT ON TABLE wiki_mind_content IS 'Wiki思维导图节点表，存储思维导图的节点数据';
COMMENT ON COLUMN wiki_mind_content.id IS '节点ID，主键';
COMMENT ON COLUMN wiki_mind_content.value IS '节点值（JSON格式）';
COMMENT ON COLUMN wiki_mind_content.parent_id IS '父节点ID';
COMMENT ON COLUMN wiki_mind_content.document_id IS '所属文档ID';
COMMENT ON COLUMN wiki_mind_content.level IS '节点层级';
