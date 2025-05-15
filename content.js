// content.js
// 仅在B站视频页生效，负责采集视频信息和插入侧边栏按钮

(function InitContentScript() {
  // 检查是否为B站视频页
  if (!/bilibili.com\/video\//.test(window.location.href)) return;

  // 获取B站视频标题，适配新版和旧版页面结构
  function GetBilibiliTitle() {
    // 依次尝试多种选择器
    const selectors = [
      '.video-title',
      'h1[data-v-1b2c6b56]',
      '.tit',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 0) {
        return el.textContent.trim();
      }
    }
    // 兜底用页面标题
    return document.title.replace('_哔哩哔哩_bilibili', '').trim();
  }

  // 获取B站音频流地址，适配新版和旧版页面结构
  function GetBilibiliAudioUrl() {
    try {
      // 兼容不同页面结构
      const playinfo = window.__playinfo__ || (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.playinfo);
      if (playinfo && playinfo.data && playinfo.data.dash && playinfo.data.dash.audio) {
        // 优先用baseUrl，没有就用base_url
        const audio = playinfo.data.dash.audio[0];
        return audio.baseUrl || audio.base_url || '';
      }
      // 有些老视频用flv格式
      if (playinfo && playinfo.data && playinfo.data.audio) {
        return playinfo.data.audio[0].baseUrl || playinfo.data.audio[0].base_url || '';
      }
    } catch (e) {
      console.warn('获取音频流失败', e);
    }
    return '';
  }

  // 获取视频标题、封面、视频ID、音频流地址
  function GetBilibiliVideoInfo() {
    const title = GetBilibiliTitle();
    const cover = document.querySelector('meta[property="og:image"]')?.content || '';
    const videoId = window.location.pathname.split('/').find(s => s.startsWith('BV')) || '';
    const audioUrl = GetBilibiliAudioUrl();
    // 日志输出
    console.log('[AI总结插件] 视频信息:', { title, cover, videoId, audioUrl });
    return { title, cover, videoId, audioUrl };
  }

  // 插入侧边栏按钮
  function InsertSidebarButton() {
    if (document.getElementById('ai-summary-sidebar-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'ai-summary-sidebar-btn';
    btn.innerText = 'AI总结';
    btn.style.position = 'fixed';
    btn.style.top = '200px';
    btn.style.right = '0';
    btn.style.zIndex = '9999';
    btn.style.background = '#00a1d6';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px 0 0 4px';
    btn.style.padding = '10px 16px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    btn.onclick = ToggleSidebar;
    document.body.appendChild(btn);
  }

  // 切换侧边栏显示/隐藏
  function ToggleSidebar() {
    let sidebar = document.getElementById('ai-summary-sidebar');
    if (sidebar) {
      sidebar.remove();
      return;
    }
    sidebar = document.createElement('div');
    sidebar.id = 'ai-summary-sidebar';
    sidebar.style.position = 'fixed';
    sidebar.style.top = '0';
    sidebar.style.right = '0';
    sidebar.style.width = '400px';
    sidebar.style.height = '100vh';
    sidebar.style.zIndex = '10000';
    sidebar.style.background = '#fff';
    sidebar.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    sidebar.style.borderLeft = '1px solid #eee';
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '关闭';
    closeBtn.style.alignSelf = 'flex-end';
    closeBtn.style.margin = '10px';
    closeBtn.onclick = () => sidebar.remove();
    sidebar.appendChild(closeBtn);

    // 插入iframe加载sidebar.html
    const iframe = document.createElement('iframe');
    iframe.src = 'chrome-extension://' + chrome.runtime.id + '/sidebar.html';
    iframe.style.flex = '1';
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    sidebar.appendChild(iframe);

    document.body.appendChild(sidebar);
  }

  // 初始化
  InsertSidebarButton();

  // 可选：监听路由变化，自动重新插入按钮
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(InsertSidebarButton, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // 导出视频信息供侧边栏调用
  window.GetBilibiliVideoInfo = GetBilibiliVideoInfo;

  // 监听侧边栏跳转请求，实现B站播放器时间跳转
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'JumpToTime') {
      const timeStr = event.data.time;
      // 解析时间字符串（如00:00、02:15等）为秒
      const parts = timeStr.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      // 获取B站播放器
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = seconds;
        video.play();
      }
    }
  });

  // 优先获取音频流，获取不到则降级为视频流，并输出到控制台
  function GetBilibiliMediaUrl() {
    const playinfo = window.__playinfo__;
    if (playinfo && playinfo.data && playinfo.data.dash) {
      // 优先音频流
      if (playinfo.data.dash.audio && playinfo.data.dash.audio[0]) {
        return {
          type: 'audio',
          url: playinfo.data.dash.audio[0].baseUrl || playinfo.data.dash.audio[0].base_url || ''
        };
      }
      // 降级为视频流
      if (playinfo.data.dash.video && playinfo.data.dash.video[0]) {
        return {
          type: 'video',
          url: playinfo.data.dash.video[0].baseUrl || playinfo.data.dash.video[0].base_url || ''
        };
      }
    }
    return { type: '', url: '' };
  }

  // 延迟5秒后获取音频或视频流地址并输出到控制台
  setTimeout(() => {
    try {
      const media = GetBilibiliMediaUrl();
      if (media.url) {
        console.log(`[AI总结插件] 延迟5秒后获取到的${media.type === 'audio' ? '音频' : '视频'}流地址:`, media.url);
      } else {
        console.log('[AI总结插件] 延迟5秒后依然未获取到音频或视频流');
      }
    } catch (e) {
      console.warn('[AI总结插件] 延迟5秒获取音视频流出错:', e);
    }
  }, 5000);

  // [AI总结插件] content.js 已注入，开始调试
  console.log('[AI总结插件] content.js 已注入');

  // 延迟5秒后，优先获取音频流，获取不到则降级为视频流，并输出到控制台
  setTimeout(() => {
    try {
      const playinfo = window.__playinfo__;
      if (playinfo && playinfo.data && playinfo.data.dash) {
        // 优先音频流
        if (playinfo.data.dash.audio && playinfo.data.dash.audio[0]) {
          const audioUrl = playinfo.data.dash.audio[0].baseUrl || playinfo.data.dash.audio[0].base_url || '';
          console.log('[AI总结插件] 5秒后获取到的音频流地址:', audioUrl);
          return;
        }
        // 降级为视频流
        if (playinfo.data.dash.video && playinfo.data.dash.video[0]) {
          const videoUrl = playinfo.data.dash.video[0].baseUrl || playinfo.data.dash.video[0].base_url || '';
          console.log('[AI总结插件] 5秒后未获取到音频流，降级为视频流地址:', videoUrl);
          return;
        }
      }
      console.log('[AI总结插件] 5秒后依然未获取到音频或视频流');
    } catch (e) {
      console.warn('[AI总结插件] 5秒后获取音视频流出错:', e);
    }
  }, 5000);

  // 立即输出视频标题、封面、视频ID，便于调试
  try {
    // 标题
    let title = '';
    const selectors = [
      '.video-title',
      'h1[data-v-1b2c6b56]',
      '.tit',
      'h1'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 0) {
        title = el.textContent.trim();
        break;
      }
    }
    if (!title) {
      title = document.title.replace('_哔哩哔哩_bilibili', '').trim();
    }
    // 封面
    const cover = document.querySelector('meta[property="og:image"]')?.content || '';
    // 视频ID
    const videoId = window.location.pathname.split('/').find(s => s.startsWith('BV')) || '';
    console.log('[AI总结插件] 视频基础信息:', { title, cover, videoId });
  } catch (e) {
    console.warn('[AI总结插件] 获取视频基础信息出错:', e);
  }

  // 监听来自iframe的消息，返回视频信息
  window.addEventListener('message', function(event) {
    // 只判断消息类型，不判断event.source
    if (!event.data || event.data.type !== 'GetVideoInfo') return;
    // 直接在content.js内部采集视频信息
    let info = { title: '', cover: '', videoId: '', audioUrl: '' };
    try {
      const title = GetBilibiliTitle();
      const cover = document.querySelector('meta[property="og:image"]')?.content || '';
      const videoId = window.location.pathname.split('/').find(s => s.startsWith('BV')) || '';
      const audioUrl = GetBilibiliAudioUrl();
      info = { title, cover, videoId, audioUrl };
    } catch (e) {}
    // 发送回iframe（sidebar.html），用event.source.postMessage
    event.source.postMessage({ type: 'VideoInfo', info }, event.origin);
  });
})(); 