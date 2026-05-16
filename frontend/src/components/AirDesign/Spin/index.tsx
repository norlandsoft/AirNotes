/**
 * Spin 加载动画组件
 * 使用三个圆点弹跳动画显示加载状态，可附带文字标签
 * 模仿 ant-design Spin 组件设计，提供 loading 和 label 两个属性
 * Created by ChaiMingXu 2026/05/02
 */

import styles from './index.less'

interface SpinProps {
  /** 是否显示加载状态，默认 true */
  loading?: boolean
  /** 加载提示文字，为空时仅显示动画 */
  label?: string
}

const Spin = ({loading = true, label}: SpinProps) => {
  if (!loading) {
    return null
  }

  return (
      <div className={styles['air-spin']}>
        <div className={styles['air-spin-dots']}>
          <span className={styles['air-spin-dot']}/>
          <span className={styles['air-spin-dot']}/>
          <span className={styles['air-spin-dot']}/>
        </div>
        {label && <div className={styles['air-spin-label']}>{label}</div>}
      </div>
  )
}

export default Spin
