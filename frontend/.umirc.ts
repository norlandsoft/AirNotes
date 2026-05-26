import {defineConfig} from "umi";

export default defineConfig({
  dva: {},
  mfsu: false,
  title: 'AirNotes Wiki',
  links: [
    {id: 'theme', rel: 'stylesheet', type: 'text/css'},
    {rel: 'shortcut icon', href: '/favicon.svg'}
  ],
  routes: [
    {
      path: "/",
      component: "@/layouts/WikiLayout"
    },
    {
      path: "*",
      component: "@/layouts/Error404"
    }
  ],
  proxy: {
    "/rest": {
      target: "http://localhost:6600",
      changeOrigin: true,
      pathRewrite: {"^": ""},
      'onProxyRes': function (proxyRes: any) {
        proxyRes.headers['Content-Encoding'] = 'chunked';
      }
    },
    "/api": {
      target: "http://localhost:6600",
      changeOrigin: true,
      'onProxyRes': function (proxyRes: any) {
        proxyRes.headers['Content-Encoding'] = 'chunked';
      }
    },
    "/admin": {
      target: "http://localhost:6600",
      changeOrigin: true,
      pathRewrite: {"^": ""}
    },
    "/initialAdminPassword": {
      target: "http://localhost:6600",
      changeOrigin: true,
      pathRewrite: {"^": ""}
    }
  },
  codeSplitting: {
    jsStrategy: 'granularChunks',
  },
  hash: true,
  esbuildMinifyIIFE: true,
  base: "/",
  // 兼容 air-design (.mjs) 中的 ESM 导入路径（不带扩展名）
  chainWebpack(config) {
    config.resolve.extensions.merge(['.mjs']);
    config.module.rule('mjs-strict').test(/\.mjs$/).resolve.set('fullySpecified', false);
  },
});
