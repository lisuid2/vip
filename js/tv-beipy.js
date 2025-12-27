// 提前定义播放函数，使其在页面加载初期可用
function play() {
  // 获取所需元素（动态检查元素是否存在）
  const urlElement = document.getElementById("url");
  const jkSelect = document.getElementById("jk");
  const playBox = document.getElementById("playbox");
  const titElement = document.getElementById("tittext");
  const playTip = document.getElementById("play-tip");

  // 检查元素是否加载完成
  if (!urlElement || !jkSelect || !playBox) {
    // 如果元素未加载，延迟50ms重试
    setTimeout(play, 50);
    return;
  }

  // 获取并验证URL
  const url = urlElement.value.trim();
  if (!url) {
    alert("请输入视频链接");
    return;
  }

  // 隐藏提示区域
  if (playTip) {
    playTip.classList.add("hidden");
  }

  // 设置播放地址（自动编码URL）
  const selectedApi = jkSelect.options[jkSelect.selectedIndex].value;
  playBox.src = `${selectedApi}${encodeURIComponent(url)}`;

  // AJAX获取标题（添加元素存在性检查）
  if (titElement) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "data/title.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        titElement.textContent = xhr.responseText;
      }
    };
    
    xhr.onerror = function() {
      titElement.textContent = "标题获取失败";
    };
    
    xhr.send(`titurl=${encodeURIComponent(url)}`);
  }
}

// 处理自动填充数据
function handleAutoFill() {
  // 检查是否有自动填充数据
  if (window.autoFillData) {
    const { url, jkValue } = window.autoFillData;
    
    // 设置URL和接口
    const urlElement = document.getElementById("url");
    const jkSelect = document.getElementById("jk");
    const playTip = document.getElementById("play-tip");
    
    if (urlElement && jkSelect) {
      urlElement.value = url;
      
      // 设置接口
      const jkOptions = Array.from(jkSelect.options);
      const matchingOption = jkOptions.find(opt => opt.value === jkValue);
      if (matchingOption) {
        jkSelect.value = jkValue;
      }
      
      // 隐藏提示区域（如果有自动填充数据）
      if (playTip) {
        playTip.classList.add("hidden");
      }
      
      // 自动播放
      play();
    }
  }
}

// DOM加载完成后处理自动填充
document.addEventListener("DOMContentLoaded", function() {
  // 检查 iframe 的初始 src 是否为空或无效
  const playBox = document.getElementById("playbox");
  const playTip = document.getElementById("play-tip");
  
  if (playBox) {
    const currentSrc = playBox.src;
    // 检查 src 是否为空、只包含接口地址而没有实际URL，或者包含默认的占位符
    if (!currentSrc || 
        currentSrc.endsWith('url=') || 
        currentSrc.endsWith('jx=') ||
        currentSrc.includes('about:blank') ||
        currentSrc === '') {
      // 如果 src 为空或无效，清空 iframe src 避免自动加载
      playBox.src = 'about:blank';
      
      // 显示提示区域
      if (playTip) {
        playTip.classList.remove("hidden");
      }
    }
  }
  
  // 处理自动填充数据
  handleAutoFill();
});