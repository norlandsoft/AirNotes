/**
 * HTTP 请求工具
 *
 * 基于 fetch API 封装 POST、GET、SSE_POST 三种请求方式，
 * 自动注入 Authorization 头（从 sessionStorage 读取 token），
 * 并统一处理 401 登录失效、500 服务端错误等异常情况。
 *
 * 通过 air-auth SDK 的 storageKey() 函数动态获取存储键前缀，
 * 确保多应用部署时各应用的认证信息互不干扰。
 *
 * @author ChaiMingXu, 2026/05/27
 */
import { storageKey } from 'air-auth';
import { Notice } from 'air-design';

const codeMessage: Record<number, string> = {
  200: '服务器成功返回请求的数据。',
  400: '发出的请求有错误，服务器无法解析参数数据。',
  401: '用户没有权限（令牌、用户名、密码错误），或登录超时。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  415: 'Unsupported Media Type',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '应用服务产生错误，请检查服务日志。',
  501: '无法处理服务请求。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 封装请求头
 *
 * 从 sessionStorage 中读取 token、uid、loginId，
 * 通过 storageKey() 生成带应用前缀的存储键，
 * 保证不同应用间的认证数据相互隔离。
 */
function requestHeader() {
  const token = sessionStorage.getItem(storageKey('token'));
  const uid = sessionStorage.getItem(storageKey('uid'));
  const loginId = sessionStorage.getItem(storageKey('user'));
  return {
    'Authorization': 'Bearer ' + token,
    'Connection': 'keep-alive',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-User-Id': uid || '',
    'X-User-Login-Id': loginId || '',
  };
}

/**
 * 判断是否为 JSON 格式字符串
 */
export function isJSON(str: any) {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      return !!(typeof obj === 'object' && obj);
    } catch (e) {
      return false;
    }
  } else {
    return true;
  }
}

/**
 * POST 方式的 SSE 流式请求
 *
 * 使用 fetch API 的 ReadableStream 手动解析 SSE 流，确保保留所有空格，
 * 完全保留 markdown 格式中的空格，包括行首、行尾和行内的所有空格。
 *
 * 内置空闲超时检测：如果在指定时间内没有收到任何数据（包括心跳），
 * 自动中断请求并回调超时标记。后端心跳保活间隔为 25 秒，
 * 默认 120 秒超时可容忍多次心跳丢失。
 *
 * @param url 请求地址
 * @param params 请求参数
 * @param callback 数据回调函数，接收数据片段（包括 <|ERR|> 和 <|TIMEOUT|> 标记）
 * @param idleTimeout 空闲超时时间（毫秒），默认 120 秒
 */
export async function SSE_POST(
    url: string | URL,
    params: any,
    callback: (data: string) => void,
    idleTimeout: number = 120000
) {
  const controller = new AbortController();
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let timeoutFired = false;

  // 重置空闲超时计时器，每次收到数据时调用
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      timeoutFired = true;
      controller.abort();
      callback('<|TIMEOUT|>');
    }, idleTimeout);
  };

  try {
    resetIdleTimer();

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeader(),
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(params),
      signal: controller.signal
    });

    if (!response.ok) {
      callback('<|ERR|>');
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    if (!reader) {
      callback('<|ERR|>');
      return;
    }

    while (true) {
      const {done, value} = await reader.read();

      // 收到数据（包括心跳字节），重置空闲计时器
      resetIdleTimer();

      if (done) {
        // 处理缓冲区中剩余的数据
        if (buffer.length > 0) {
          parseMessageBlock(buffer, callback);
        }
        break;
      }

      // 解码数据并追加到缓冲区
      const decodedChunk = decoder.decode(value, {stream: true});
      buffer += decodedChunk;

      // SSE 标准格式：每个消息以 data: 开头，以 \n\n 结尾
      let messageEnd;
      while ((messageEnd = buffer.indexOf('\n\n')) !== -1) {
        const messageBlock = buffer.substring(0, messageEnd);
        buffer = buffer.substring(messageEnd + 2);
        parseMessageBlock(messageBlock, callback);
      }
    }
  } catch (error: any) {
    // 超时中断由 idleTimer 回调处理，此处不再重复发送错误
    if (timeoutFired || error?.name === 'AbortError') {
      return;
    }
    console.error('SSE POST 请求失败:', error);
    callback('<|ERR|>');
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
  }
}

/**
 * 解析 SSE 消息块
 *
 * 处理多个 data: 行（用单个 \n 分隔），并将 data: 后的空格作为内容的一部分。
 *
 * @param messageBlock 消息块（可能包含多个 data: 行）
 * @param callback 数据回调函数
 */
function parseMessageBlock(messageBlock: string, callback: (data: string) => void) {
  const lines = messageBlock.split('\n');
  const contentParts: string[] = [];

  for (const line of lines) {
    const dataPrefixIndex = line.indexOf('data:');
    if (dataPrefixIndex !== -1) {
      // 提取 data: 后面的所有内容（包括空格）
      const content = line.substring(dataPrefixIndex + 5);
      if (content !== null && content !== undefined) {
        contentParts.push(content);
      }
    }
  }

  // 如果有多个 data: 行，将它们的内容用 \n 连接（SSE 标准）
  if (contentParts.length > 0) {
    const dataContent = contentParts.join('\n');
    if (dataContent !== null && dataContent !== undefined) {
      callback(dataContent);
    }
  }
}

/**
 * POST 请求
 *
 * 统一处理各种 HTTP 状态码，包括 401 登录失效自动清除认证信息、
 * 文件下载（Content-Disposition 解析）等场景。
 */
export async function POST(url: string | URL | Request, params: any) {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: requestHeader(),
      mode: 'cors',
      cache: 'no-cache',
      body: isJSON(params) ? JSON.stringify(params) : params
    }).then((res) => {
      switch (res.status) {
        case 400:
          return resolve({
            success: false,
            code: 'HTTP-400',
            message: '异常 [HTTP-400], 请求参数错误'
          });
        case 401:
          // token 失效，清除所有 sessionStorage 并触发登出事件
          sessionStorage.clear();
          window.dispatchEvent(new CustomEvent('auth-state-changed', {
            detail: {authenticated: false}
          }));

          if (url != '/api/v1/auth/login' && url != '/api/v1/auth/current'
              && url != '/api/v1/transfer/accept' && url != '/admin/user/login') {
            Notice.error('登录已失效', '您的登录已过期，请重新登录。');
          }
          return resolve({
            success: false,
            code: 'HTTP-401',
            message: '异常 [HTTP-401], 用户未登录或登录已过期'
          });
        case 404:
          return resolve({
            success: false,
            code: 'HTTP-404',
            message: '异常 [HTTP-404], 请求地址不存在'
          });
        case 408:
          return resolve({
            success: false,
            code: 'HTTP-408',
            message: '异常 [HTTP-408], 请求超时'
          });
        case 500:
          if (url != '/api/v1/auth/current') {
            Notice.error('HTTP-500', '服务器内部错误');
          }
          return resolve({
            success: false,
            code: 'HTTP-500',
            message: '异常 [HTTP-500], 服务端无法处理当前请求'
          });
        case 501:
          return resolve({
            success: false,
            code: 'HTTP-501',
            message: '异常 [HTTP-501], 服务端无法处理当前请求'
          });
        case 502:
        case 503:
        case 504:
          return resolve({
            success: false,
            code: `HTTP-${res.status}`,
            message: '无法访问服务, 请检查服务是否正常运行，或联系平台管理员。'
          });
        case 200:
          // 判断返回数据 raw 是否为空
          if (res.headers.get('Content-Length') === '0') {
            return resolve({
              success: false,
              message: '服务端无法处理当前请求, 请检查服务是否正常运行，或联系平台管理员查看系统日志。'
            });
          }

          // 判断返回数据是否为 JSON 格式
          if (res.headers.get('Content-Type')?.indexOf('application/json') !== -1) {
            return res.json().then(resolve);
          } else if (res.headers.get('Content-Type')?.indexOf('application/octet-stream') !== -1) {
            // 处理文件下载
            return res.blob().then(blob => {
              const contentDisposition = res.headers.get('Content-Disposition') || '';
              const filename = decodeFilename(contentDisposition);
              const url = window.URL.createObjectURL(blob);
              const temp_a_tag_for_download = document.createElement('a');
              temp_a_tag_for_download.style.display = 'none';
              temp_a_tag_for_download.href = url;
              temp_a_tag_for_download.download = filename;
              document.body.appendChild(temp_a_tag_for_download);
              temp_a_tag_for_download.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(temp_a_tag_for_download);
              return resolve({success: true, message: '文件下载成功'});
            }).catch(reject);
          } else {
            // 非 JSON 格式，返回 blob
            return resolve(res.blob());
          }
        default:
          Notice.error(`HTTP ${res.status}`, codeMessage[res.status] || `HTTP ${res.status}`);
      }
    }).catch(err => {
      Notice.error('网络错误', err.message);
      return resolve({
        success: false,
        code: 'NETWORK_ERROR',
        message: err.message || '网络连接失败'
      });
    });
  });
}

/**
 * GET 请求，用于调用返回 JSON 的接口
 */
export async function GET(url: string | URL | Request) {
  return new Promise<any>((resolve, reject) => {
    fetch(url, {
      method: 'GET',
      headers: requestHeader(),
      mode: 'cors',
      cache: 'no-cache'
    }).then((res) => {
      if (res.status === 200) {
        const ct = res.headers.get('Content-Type') || '';
        if (ct.indexOf('application/json') !== -1) {
          return res.json().then(resolve);
        }
        return res.text().then((t) => resolve({success: true, data: t}));
      }
      if (res.status === 401) {
        sessionStorage.clear();
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: {authenticated: false}
        }));
      }
      resolve({
        success: false,
        message: codeMessage[res.status] || `HTTP ${res.status}`
      });
    }).catch((err) => reject(err));
  });
}

/**
 * 从 Content-Disposition 头解析文件名
 *
 * 先尝试 RFC 5987 编码的 filename*，再回退到普通 filename。
 */
function decodeFilename(contentDisposition: string): string {
  let filename = 'download';

  // 尝试解析 filename*= 参数（RFC 5987）
  const filenameRegex = /filename\*=(?:utf-8|UTF-8)''([\w%.-]+)/i;
  let matches = filenameRegex.exec(contentDisposition);
  if (matches != null && matches[1]) {
    try {
      return decodeURIComponent(matches[1].replace(/\+/g, '%20'));
    } catch (e) {
      console.error('解码文件名失败', e);
    }
  }

  // 尝试解析普通的 filename= 参数
  const fallbackRegex = /filename="?(.+?)"?(?:;|$)/i;
  matches = fallbackRegex.exec(contentDisposition);
  if (matches != null && matches[1]) {
    filename = matches[1].replace(/['"]/g, '');
    try {
      return decodeURIComponent(filename);
    } catch (e) {
      try {
        return decodeURIComponent(escape(filename));
      } catch (e2) {
        console.error('解码文件名失败', e2);
        return filename;
      }
    }
  }

  return filename;
}
