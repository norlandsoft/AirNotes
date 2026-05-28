/**
 * AirNotes 用户 Model
 *
 * 基于 air-auth SDK 的统一用户模型。
 * 需要展开写为完整扁平对象，因为 UmiJS dva 插件对模型做静态分析。
 *
 * @author ChaiMingXu, 2026/05/28
 */
import '../auth.config';
import {UserModel} from 'air-auth';

const model = {
  namespace: 'user',
  ...UserModel,
};

export default model;
