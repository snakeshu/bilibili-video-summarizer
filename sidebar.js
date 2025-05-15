// sidebar.js
// 只保留界面初始化和按钮绑定，不实现任何业务逻辑
// 后续每个小功能单独实现，逐步测试

// 渲染视频信息（标题、封面）
function RenderVideoInfo(info) {
  document.getElementById('video-title').innerText = info.title || '未获取到视频标题';
  document.getElementById('video-cover').src = info.cover || '';
  document.getElementById('video-title-info').innerText = info.title || '';
  document.getElementById('video-id-info').innerText = info.videoId ? ('视频ID: ' + info.videoId) : '';
}

// 请求主页面视频信息
function RequestVideoInfo() {
  window.parent.postMessage({ type: 'GetVideoInfo' }, '*');
}

// 初始化界面和按钮事件
window.onload = function() {
  // 恢复暗黑模式
  if (localStorage.getItem('ai-summary-dark') === '1') {
    document.getElementById('sidebar').classList.add('dark');
  }
  // 请求主页面视频信息
  RequestVideoInfo();
  // 监听主页面返回的视频信息
  window.addEventListener('message', function(event) {
    console.log('[AI总结插件][sidebar] 收到postMessage:', event);
    if (!event.data || event.data.type !== 'VideoInfo') return;
    RenderVideoInfo(event.data.info || {});
  });
  // 绑定按钮事件（仅绑定，不实现功能）
  document.getElementById('darkmode-btn').onclick = function() {
    alert('暗黑模式切换功能待实现');
  };
  document.getElementById('toggle-btn').onclick = function() {
    alert('侧边栏收起/展开功能待实现');
  };
  document.getElementById('start-ocr').onclick = async function() {
    const img = document.getElementById('ocr-image-preview');
    const fileInput = document.getElementById('ocr-image-input');
    const progress = document.getElementById('ocr-progress');
    const resultBox = document.getElementById('ocr-result');
    
    if (!fileInput.files[0] || img.style.display === 'none') {
      alert('请先选择一张图片！');
      return;
    }
    
    progress.innerText = '正在初始化...';
    resultBox.value = '';
    document.getElementById('start-ocr').disabled = true;
    
    try {
      console.log('[AI总结插件][sidebar] 开始OCR识别...');
      
      // 使用最新的Tesseract.js API（v5.x版本）
      progress.innerText = '加载OCR引擎...';
      const worker = await Tesseract.createWorker();
      await worker.loadLanguage('chi_sim+eng');
      await worker.initialize('chi_sim+eng');
      
      console.log('[AI总结插件][sidebar] OCR引擎初始化完成');
      progress.innerText = '正在识别中...';
      
      // 识别图片
      console.log('[AI总结插件][sidebar] 开始识别图片...');
      const result = await worker.recognize(img.src);
      resultBox.value = result.data.text;
      progress.innerText = '识别完成';
      console.log('[AI总结插件][sidebar] OCR识别结果:', result.data.text);
      
      // 启用AI总结按钮
      document.getElementById('ai-summary').disabled = false;
      
      // 完成后释放资源
      await worker.terminate();
    } catch (e) {
      progress.innerText = '识别失败';
      resultBox.value = '';
      alert('OCR识别失败: ' + e.message);
      console.error('[AI总结插件][sidebar] OCR识别出错:', e);
    }
    
    document.getElementById('start-ocr').disabled = false;
  };
  
  document.getElementById('stop-ocr').onclick = function() {
    alert('停止OCR功能待实现');
  };
  
  document.getElementById('ai-summary').onclick = function() {
    const recognizedText = document.getElementById('ocr-result').value.trim();
    if (!recognizedText) {
      alert('请先进行OCR识别获取文本！');
      return;
    }
    
    document.getElementById('ai-summary-result').innerText = '正在生成AI总结...';
    // 这里暂时只是简单显示，后续可以接入真正的AI总结接口
    setTimeout(() => {
      document.getElementById('ai-summary-result').innerText = '这是识别文本的AI总结：\n' + 
        '• ' + recognizedText.split('\n')[0] + '\n' +
        '• 更多内容将在AI接口实现后显示';
    }, 1000);
  };
  
  // 新增：图片上传和预览
  document.getElementById('ocr-image-input').onchange = function(event) {
    const file = event.target.files[0];
    if (!file) {
      console.log('[AI总结插件][sidebar] 未选择图片');
      document.getElementById('ocr-image-preview').style.display = 'none';
      document.getElementById('ai-summary').disabled = true;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('ocr-image-preview').src = e.target.result;
      document.getElementById('ocr-image-preview').style.display = 'block';
      document.getElementById('ocr-progress').innerText = '图片已加载，点击"开始OCR"进行识别';
      console.log('[AI总结插件][sidebar] 图片已预览:', file.name);
    };
    reader.readAsDataURL(file);
  };
  // 其他区域后续逐步实现
}; 