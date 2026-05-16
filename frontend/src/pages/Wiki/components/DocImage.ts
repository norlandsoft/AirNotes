// 递归查找所有图片节点
export const findImageNodes = (node: any): any[] => {
  let images: any[] = [];

  // 节点为null或undefined时直接返回
  if (node === null || node === undefined) {
    return images;
  }

  // 检查当前节点是否为图片
  if (typeof node === 'object' && node.type === 'image') {
    images.push(node);
  }

  // 处理对象类型
  if (typeof node === 'object' && !Array.isArray(node)) {
    // 遍历对象的所有属性
    Object.keys(node).forEach((key) => {
      if (typeof node[key] === 'object' && node[key] !== null) {
        images = images.concat(findImageNodes(node[key]));
      }
    });
  }

  // 处理数组类型
  if (Array.isArray(node)) {
    node.forEach((item) => {
      images = images.concat(findImageNodes(item));
    });
  }

  return images;
};

// 根据 blobUrl 返回可直接访问的图片 URL
// /rest/file/download/{id} 已加入白名单，可直接作为 img src；旧格式需通过 /rest/storage/file 代理
export async function createBlobUrl(blobUrl: string) {
  if (blobUrl && blobUrl.includes('/rest/file/')) {
    return blobUrl;
  }
  const token = sessionStorage.getItem('air-machine-token');
  const url = `/rest/storage/file?blobUrl=${encodeURIComponent(blobUrl)}&repoGroup=wiki`;
  const response = await fetch(url, token ? {headers: {Authorization: `Bearer ${token}`}} : {});
  if (!response.ok) {
    return emptyBlobUrl();
  }
  const content = await response.blob();
  if (content.size === 0) {
    return emptyBlobUrl();
  }
  return URL.createObjectURL(content);
}

// 返回一个空的blob url, 用于显示图片未找到
export async function emptyBlobUrl() {
  // 创建canvas元素
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;

  // 获取2d上下文
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 添加边框
  ctx.strokeStyle = '#DDDDDD';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 设置水印文字样式
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // 半透明黑色
  ctx.font = '11px Consolas'; // 使用等宽字体

  // 保存当前状态
  ctx.save();

  // 旋转画布
  ctx.rotate(Math.PI / -5);

  // 计算旋转后需要的位移来覆盖整个画布
  const text = '图片未找到';
  const textWidth = ctx.measureText(text).width;
  const xOffset = textWidth + 32; // 文字间距
  const yOffset = 32; // 行间距

  // 计算起始位置，确保从画布边缘开始
  const startX = -300;
  const startY = -300;
  const endX = 400;
  const endY = 400;

  // 绘制重复的文字，每一行错开半个文字宽度
  for (let y = startY; y < endY; y += yOffset) {
    const rowOffset = ((y - startY) / yOffset) % 2 * (textWidth / 2); // 根据行号计算错开距离
    for (let x = startX; x < endX; x += xOffset) {
      ctx.fillText(text, x + rowOffset, y);
    }
  }

  // 恢复画布状态
  ctx.restore();

  // 转换为base64
  return canvas.toDataURL('image/png');
}
