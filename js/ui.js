/**
 * UI 模块 - 事件绑定与UI控制
 * 负责UI交互、事件处理、通知提示等
 */

const UI = {
  // 初始化所有事件
  init() {
    this.bindPlayButton();
    this.bindInputEvents();
    this.bindQuickActions();
    this.bindApiCheckButton();
    this.setupMobileOptimizations();
  },

  // 绑定播放按钮
  bindPlayButton() {
    const playBtn = document.querySelector('[onclick="play()"]') || 
                   document.querySelector('button:nth-child(3)');
    if (playBtn) {
      playBtn.onclick = () => {
        const urlInput = document.getElementById('url');
        const apiSelect = document.getElementById('jk');
        if (urlInput && apiSelect) {
          Player.play(urlInput.value.trim(), apiSelect.value);
        }
      };
    }
  },

  // 绑定输入框事件
  bindInputEvents() {
    const urlInput = document.getElementById('url');
    if (urlInput) {
      // 回车快速播放
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const apiSelect = document.getElementById('jk');
          Player.play(urlInput.value.trim(), apiSelect.value);
        }
      });

      // 焦点处理（移动端）
      if (this.isMobile()) {
        urlInput.addEventListener('focus', () => {
          setTimeout(() => {
            window.scrollTo(0, document.activeElement.offsetTop - 100);
          }, 300);
        });
      }
    }
  },

  // 绑定快捷操作按钮
  bindQuickActions() {
    // 清空输入
    const clearBtn = document.querySelector('[onclick="clearInput()"]');
    if (clearBtn) {
      clearBtn.onclick = () => {
        document.getElementById('url').value = '';
        document.getElementById('url').focus();
        this.showNotification("✓ 已清空");
      };
    }

    // 复制链接
    const copyBtn = document.querySelector('[onclick="copyCurrentUrl()"]');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const url = document.getElementById('url').value.trim();
        if (!url) {
          this.showNotification("❌ 没有链接可复制");
          return;
        }
        this.copyToClipboard(url);
      };
    }

    // 分享链接（新功能）
    const shareBtn = document.querySelector('[onclick="shareLink()"]');
    if (shareBtn) {
      shareBtn.onclick = () => Player.copyShareLink();
    }
  },

  // 绑定接口检测按钮
  bindApiCheckButton() {
    const checkBtn = document.querySelector('.check-btn');
    if (checkBtn) {
      checkBtn.onclick = async () => {
        checkBtn.disabled = true;
        const originalText = checkBtn.textContent;
        checkBtn.innerHTML = '<span class="spinner"></span> 检测中...';

        const result = await API.checkAll();
        this.showNotification(`✓ 检测完成: ${result.available}/${result.total} 个接口可用`, 3000);

        checkBtn.disabled = false;
        checkBtn.textContent = originalText;
      };
    }
  },

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        this.showNotification("✓ 链接已复制");
      } else {
        throw new Error('不支持');
      }
    } catch (err) {
      // 备用方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showNotification("✓ 链接已复制");
    }
  },

  // 显示浮动通知
  showNotification(message, duration = 2000) {
    // 移除旧通知
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) oldNotification.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  // 检测是否移动设备
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // 是否iOS
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // 移动端优化
  setupMobileOptimizations() {
    if (!this.isMobile()) return;

    // 防止双击缩放
    document.addEventListener('touchstart', function(event) {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    }, { passive: false });

    // 禁用长按菜单
    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }, false);

    // iOS安全区域适配
    if (this.isIOS()) {
      document.documentElement.style.paddingTop = 'env(safe-area-inset-top)';
      document.documentElement.style.paddingBottom = 'env(safe-area-inset-bottom)';
    }

    // 返回键拦截（防止误退）
    this.setupBackButtonIntercept();

    // 横屏提示
    this.setupOrientationHint();
  },

  // 返回键拦截（防止误退）
  setupBackButtonIntercept() {
    let lastBackPress = 0;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        
        const now = Date.now();
        if (now - lastBackPress < 1000) {
          // 2秒内点击两次才退出
          window.history.back();
        } else {
          lastBackPress = now;
          this.showNotification("再按一次返回键退出", 1000);
        }
      }
    });
  },

  // 横屏提示
  setupOrientationHint() {
    const checkOrientation = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        // 竖屏
      } else {
        // 横屏 - 显示提示
        const playBox = document.querySelector('.player');
        if (playBox && !playBox.dataset.hintShown) {
          this.showNotification("💡 横屏观看效果更佳！", 3000);
          playBox.dataset.hintShown = 'true';
        }
      }
    };

    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
    
    // 初始检查
    setTimeout(checkOrientation, 500);
  },

  // 显示加载动画
  showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'page-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  },

  // 隐藏加载动画
  hideLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.remove();
  }
};

// 提供全局函数（向后兼容）
function play() {
  const urlInput = document.getElementById('url');
  const apiSelect = document.getElementById('jk');
  if (urlInput && apiSelect) {
    Player.play(urlInput.value.trim(), apiSelect.value);
  }
}

function clearInput() {
  document.getElementById('url').value = '';
  document.getElementById('url').focus();
  UI.showNotification("✓ 已清空");
}

function copyCurrentUrl() {
  const url = document.getElementById('url').value.trim();
  if (!url) {
    UI.showNotification("❌ 没有链接可复制");
    return;
  }
  UI.copyToClipboard(url);
}

function checkAllApis() {
  const checkBtn = document.querySelector('.check-btn');
  if (checkBtn) checkBtn.click();
}

function shareLink() {
  Player.copyShareLink();
}
