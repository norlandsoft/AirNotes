/**
 * AirNotes 认证配置
 *
 * 配置 sessionStorage 前缀、应用名称、主题色等参数，
 * 供 air-auth 共享认证库统一使用。
 *
 * @author ChaiMingXu, 2026/05/27
 */
import 'air-auth/dist/air-auth.css';
import { defineAuthConfig } from 'air-auth';

export default defineAuthConfig({
  storagePrefix: 'air-notes',
  appName: 'AirNotes',
  appTagline: 'Wiki Knowledge Base',
  theme: 'amber',
});
