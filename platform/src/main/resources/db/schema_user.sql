-- =====================================================
-- 系统用户表
-- =====================================================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user
(
  id          VARCHAR(50)  PRIMARY KEY,
  password    VARCHAR(255) NOT NULL,
  salt        VARCHAR(64),
  name        VARCHAR(50),
  avatar      VARCHAR(50) DEFAULT 'u01',
  status      VARCHAR(1)   DEFAULT 'A',
  role        VARCHAR(20) DEFAULT 'user',
  create_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sys_user_status ON sys_user (status);

COMMENT ON TABLE sys_user IS '系统用户表';
COMMENT ON COLUMN sys_user.id IS '用户ID，主键';
COMMENT ON COLUMN sys_user.password IS '密码（SHA256(SHA256(raw) + salt)）';
COMMENT ON COLUMN sys_user.salt IS '密码盐';
COMMENT ON COLUMN sys_user.name IS '用户名称';
COMMENT ON COLUMN sys_user.avatar IS '用户头像';
COMMENT ON COLUMN sys_user.status IS '状态：A-启用 F-禁用 D-删除';
COMMENT ON COLUMN sys_user.role IS '角色：admin/user';
COMMENT ON COLUMN sys_user.create_time IS '创建时间';
COMMENT ON COLUMN sys_user.update_time IS '更新时间';
