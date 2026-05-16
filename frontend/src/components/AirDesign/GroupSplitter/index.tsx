import React from 'react'
import styles from './index.less'

interface GroupSplitterProps {
  title: string
  height?: number
  paddingTop?: number
}

const GroupSplitter: React.FC<GroupSplitterProps> = (props) => {
  const {title, height = 32, paddingTop = 0} = props

  return (
      <div className={styles.airGroupSplitterContainer} style={{height, marginTop: paddingTop}}>
        <span className={styles.airGroupSplitterLeftHr}/>
        <span className={styles.airGroupSplitterTitle}>{title}</span>
      </div>
  )
}

export default GroupSplitter
