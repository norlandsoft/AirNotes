/**
 * 控制台警告屏蔽
 *
 * 过滤第三方组件库（semi-ui、rc-* 等）产生的已知废弃 API 警告，
 * 避免控制台被无关信息淹没，便于定位真正的问题。
 *
 * @author ChaiMingXu, 2026/05/27
 */

// 保存原始的 console 方法
const realConsoleError = console.error;
const realConsoleWarn = console.warn;

// 需要屏蔽的警告消息列表
const suppressedMessages = [
    'Warning: findDOMNode is deprecated',
    'findDOMNode is deprecated',
    'Support for defaultProps will be removed from function components',
    'Warning: An update (setState, replaceState, or forceUpdate) was scheduled from inside an update function',
    'Warning: Instance created by `useForm` is not connected to any Form element. Forget to pass `form` prop?',
    'Warning: [antd: notification] Static function can not consume context like dynamic theme',
    'Warning: [antd: Card] `bodyStyle` is deprecated',
    'Warning: Received `false` for a non-boolean attribute'
];

// 检查消息是否应该被屏蔽
function shouldSuppress(message) {
    if (!message) return false;
    const messageStr = typeof message === 'string' ? message : String(message);
    return suppressedMessages.some(suppressed => messageStr.includes(suppressed));
}

// 拦截 console.error
console.error = function (...args) {
    if (shouldSuppress(args[0])) {
        return;
    }
    realConsoleError.apply(console, args);
};

// 拦截 console.warn
console.warn = function (...args) {
    if (shouldSuppress(args[0])) {
        return;
    }
    realConsoleWarn.apply(console, args);
};
