/**
 * 图标数据：构建时自动加载 svg 目录下所有 SVG 文件
 * 使用 require.context 动态导入，无需手动维护
 * Created by ChaiMingXu
 */

// 构建时自动加载 svg 目录下所有 .svg 文件
const svgContext = require.context('./svg', false, /\.svg$/)
const iconData: Record<string, string> = {}

svgContext.keys().forEach((key) => {
  const name = key.replace(/^\.\/(.+)\.svg$/, '$1')
  iconData[name] = svgContext(key)
})

export {iconData}
