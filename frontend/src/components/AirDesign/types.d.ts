declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export {ReactComponent}
  const src: string
  export default src
}

declare module '*.less' {
  const classes: { [key: string]: string }
  export default classes
}
