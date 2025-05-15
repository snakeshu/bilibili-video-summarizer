// background.js
// Service Worker脚本，负责与讯飞星火API通信、消息转发和日志记录

// 监听内容脚本或侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SummarizeVideo') {
    // 调用讯飞星火API进行总结
    SummarizeByXunfei(message.audioUrl, message.segments)
      .then(summary => {
        sendResponse({ success: true, summary });
      })
      .catch(error => {
        console.error('讯飞星火总结失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    // 必须返回true以支持异步响应
    return true;
  }
});

/**
 * 调用讯飞星火API进行视频音频总结
 * @param {string} audioUrl - 视频音频的URL
 * @param {Array} segments - 需要总结的时间段数组
 * @returns {Promise<string>} 总结内容
 */
async function SummarizeByXunfei(audioUrl, segments) {
  // TODO: 这里需要集成讯飞星火API，需用户提供API Key
  // 示例伪代码，实际需根据讯飞API文档实现
  // 1. 上传音频到讯飞API
  // 2. 获取转写文本
  // 3. 调用大模型生成总结
  // 4. 返回结构化总结
  throw new Error('请在此处集成讯飞星火API');
} 