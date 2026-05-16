import {error} from 'air-design';

const codeMessage = {
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

// 封装请求头
function requestHeader() {
  const token = sessionStorage.getItem("air-machine-token");
  const userId = sessionStorage.getItem("air-machine-user");
  return {
    'Authorization': 'Bearer ' + token,
    'Connection': 'keep-alive',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-User-Id': userId || '',
  };
}

// 判断是否为JSON格式字符串
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
 * 使用 fetch API 的 ReadableStream 手动解析 SSE 流，确保保留所有空格
 * 完全保留markdown格式中的空格，包括行首、行尾和行内的所有空格
 *
 * 内置空闲超时检测：如果在指定时间内没有收到任何数据（包括心跳），自动中断请求并回调超时标记
 * 后端心跳保活间隔为25秒，默认120秒超时可容忍多次心跳丢失
 *
 * @param url 请求地址
 * @param params 请求参数
 * @param callback 数据回调函数，接收数据片段（包括 <|ERR|> 和 <|TIMEOUT|> 标记）
 * @param idleTimeout 空闲超时时间（毫秒），默认120秒。超过此时间未收到任何数据则触发超时
 *
 * @author ChaiMingXu
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

        // 解析消息块
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
 * 解析SSE消息块
 * 处理多个data:行（用单个\n分隔），并将data:后的空格作为内容的一部分
 *
 * @param messageBlock 消息块（可能包含多个data:行）
 * @param callback 数据回调函数
 */
function parseMessageBlock(messageBlock: string, callback: (data: string) => void) {
  // 按行分割，处理所有data:行
  const lines = messageBlock.split('\n');
  const contentParts: string[] = [];

  for (const line of lines) {
    // 查找data:前缀
    const dataPrefixIndex = line.indexOf('data:');
    if (dataPrefixIndex !== -1) {
      // 提取data:后面的所有内容（包括空格）
      // 注意：data:后的空格是报文内容的一部分，不应该跳过
      const content = line.substring(dataPrefixIndex + 5);
      if (content !== null && content !== undefined) {
        contentParts.push(content);
      }
    }
  }

  // 如果有多个data:行，将它们的内容用\n连接（SSE标准）
  // 如果只有一个data:行，直接使用其内容
  if (contentParts.length > 0) {
    const dataContent = contentParts.join('\n');
    if (dataContent !== null && dataContent !== undefined) {
      callback(dataContent);
    }
  }
}

export async function POST(url: string | URL | Request, params: any) {
  return new Promise(
      (resolve, reject) => {
        fetch(url, {
          method: 'POST',
          headers: requestHeader(),
          mode: 'cors',
          cache: "no-cache",
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
              // token失效，清除所有sessionStorage并跳转到登录页
              sessionStorage.clear();

              // 触发登出事件
              window.dispatchEvent(new CustomEvent('auth-state-changed', {
                detail: {authenticated: false},
              }));

              if (url != '/rest/user/session/current' && url != '/rest/platform/user/login' && url != '/admin/user/login') {
                error({
                  title: '登录已失效',
                  message: '您的登录已过期，请重新登录。',
                  onClose: () => {
                    // 跳转到登录页
                    window.location.href = '/';
                  }
                });
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
              if (url != '/rest/user/current') {
                error({
                  title: 'HTTP-500',
                  message: '服务器内部错误'
                });
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
              // 判断返回数据raw是否为空
              if (res.headers.get('Content-Length') === '0') {
                return resolve({
                  success: false,
                  message: '服务端无法处理当前请求, 请检查服务是否正常运行，或联系平台管理员查看系统日志。'
                });
              }

              // 判断返回数据是否为JSON格式
              if (res.headers.get('Content-Type')?.indexOf('application/json') !== -1) {
                // 另一种写法：return resolve(res.json());
                return res.json().then(resolve);
              } else if (res.headers.get('Content-Type')?.indexOf('application/octet-stream') !== -1) {
                // 处理文件下载
                return res.blob().then(blob => {
                  // const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
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
                  // 删除标签
                  document.body.removeChild(temp_a_tag_for_download);
                  return resolve({success: true, message: '文件下载成功'});
                }).catch(reject);
              } else {
                // 非json格式, 返回blob
                return resolve(res.blob());
              }
            default:
              error({
                title: `HTTP ${res.status}`,
                message: codeMessage[res.status]
              });
          }
        }).catch(err => {
          error({
            title: '网络错误',
            message: err.message
          });
          return resolve({
            success: false,
            code: 'NETWORK_ERROR',
            message: err.message || '网络连接失败'
          });
        });
      }
  );
}

/**
 * GET 请求，用于调用返回 JSON 的接口（如 AirTeams GET /config）
 */
export async function GET(url: string | URL | Request) {
  return new Promise<any>((resolve, reject) => {
    fetch(url, {
      method: 'GET',
      headers: requestHeader(),
      mode: 'cors',
      cache: 'no-cache',
    })
        .then((res) => {
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
              detail: {authenticated: false},
            }));
          }
          resolve({
            success: false,
            message: codeMessage[res.status as keyof typeof codeMessage] || `HTTP ${res.status}`,
          });
        })
        .catch((err) => reject(err));
  });
}

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
      // 尝试 URL 解码
      return decodeURIComponent(filename);
    } catch (e) {
      // 如果 URL 解码失败，可能是因为文件名已经是 UTF-8 编码的字符串
      try {
        // 尝试将 ISO-8859-1 编码的字符串转换为 UTF-8
        return decodeURIComponent(escape(filename));
      } catch (e2) {
        console.error('解码文件名失败', e2);
        // 如果所有尝试都失败，返回原始文件名
        return filename;
      }
    }
  }

  return filename;
}
