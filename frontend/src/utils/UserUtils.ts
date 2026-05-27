/**
 * 用户信息统一处理工具
 *
 * 提供头像编号与完整 URL 之间的转换函数，确保所有组件使用一致的头像处理逻辑。
 * 后端 avatar 字段统一为短编号形式（如 "u01"、"admin"），前端通过本工具组装完整 URL。
 *
 * Created by ChaiMingXu, on 2026/05/27
 */

/** 默认头像编号 */
const DEFAULT_AVATAR_ID = 'u01';

/**
 * 根据头像编号组装完整的头像 URL
 *
 * @param avatarId 头像编号（短编号如 "u01"、"admin"，或完整路径如 "/icons/avatar/u01.svg"）
 * @returns 完整的头像 URL
 */
export function getAvatarUrl(avatarId?: string): string {
  if (!avatarId) {
    return `/icons/avatar/${DEFAULT_AVATAR_ID}.svg`;
  }
  if (avatarId.startsWith('/')) {
    return avatarId;
  }
  return `/icons/avatar/${avatarId}.svg`;
}
