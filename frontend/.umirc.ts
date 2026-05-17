import {defineConfig} from "umi";
import path from 'path';

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
    }
  },
  codeSplitting: {
    jsStrategy: 'granularChunks',
  },
  hash: true,
  esbuildMinifyIIFE: true,
  base: "/"
});
