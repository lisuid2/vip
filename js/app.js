/**
 * app.js - 主应用初始化模块
 * 职责：协调所有子模块的初始化，处理全局事件和状态管理
 */

class App {
  constructor() {
    this.initialized = false;
    this.config = {
      autoDetectOnStartup: true,
      autoDetectDelay: 500,
      notificationDuration: 3000,
      maxRetries: 3
    };
  }

  /**
   * 初始化应用
   */
  async init() {
    if (this.initialized) return;

    try {
      // 1. 初始化API模块
      API.init();
      console.log('✓ API模块初始化完成');

      // 2. 初始化UI模块
      UI.init();
      console.log('✓ UI模块初始化完成');

      // 3. 处理URL参数（自动填充和自动播放）
      Player.handleUrlParams();
      console.log('✓ 参数处理完成');

      // 4. 注册全局事件
      this.registerGlobalEvents();

      // 5. 自动检测接口（可选）
      if (this.config.autoDetectOnStartup) {
        setTimeout(() => {
          API.checkAll().then(result => {
            console.log(`✓ 接口检测完成: ${result.available}/${result.total} 可用`);
          });
        }, this.config.autoDetectDelay);
      }

      this.initialized = true;
      console.log('✓ 应用初始化完成');
      
    } catch (error) {
      console.error('应用初始化失败:', error);
      UI.showNotification('⚠️ 应用初始化出错，请刷新页面重试');
    }
  }

  /**
   * 注册全局事件
   */
  registerGlobalEvents() {
    // 处理页面卸载前的保存
    window.addEventListener('beforeunload', (e) => {
      const currentUrl = document.getElementById('url')?.value;
      if (currentUrl && currentUrl.trim()) {
        Storage.set('lastUrl', currentUrl);
      }
    });

    // 处理网络连接变化
    window.addEventListener('online', () => {
      UI.showNotification('✓ 网络已连接');
      console.log('网络恢复');
    });

    window.addEventListener('offline', () => {
      UI.showNotification('⚠️ 网络已断开');
      console.log('网络断开');
    });

    // 处理页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('页面隐藏');
      } else {
        console.log('页面显示');
        // 可以在这里执行恢复操作
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter: 解析播放
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        play();
      }
      
      // Ctrl/Cmd + K: 焦点到输入框
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('url')?.focus();
      }
    });
  }

  /**
   * 销毁应用（清理资源）
   */
  destroy() {
    // 清理事件监听器
    window.removeEventListener('beforeunload', null);
    window.removeEventListener('online', null);
    window.removeEventListener('offline', null);
    this.initialized = false;
    console.log('应用已销毁');
  }

  /**
   * 获取应用状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      apiAvailable: API.checkOne ? true : false,
      playerReady: Player ? true : false,
      uiReady: UI ? true : false
    };
  }
}

/**
 * 创建应用实例
 */
const app = new App();

/**
 * 在DOM加载完成后初始化应用
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  // 如果脚本加载时DOM已准备就绪
  app.init();
}

/**
 * 导出应用实例供外部访问
 */
window.app = app;

/**
 * 提供便捷的全局函数（向后兼容）
 */
window.play = () => {
  const url = document.getElementById('url')?.value?.trim();
  if (!url) {
    UI.showNotification('⚠️ 请输入视频链接');
    return;
  }
  const apiUrl = API.getCurrent().url;
  Player.play(url, apiUrl);
};

window.clearInput = () => {
  document.getElementById('url').value = '';
  document.getElementById('playbox').src = 'about:blank';
  UI.showNotification('✓ 已清空');
};

window.copyCurrentUrl = () => {
  const url = document.getElementById('url')?.value?.trim();
  if (!url) {
    UI.showNotification('⚠️ 没有链接可复制');
    return;
  }
  Player.copyShareLink();
};

window.checkAllApis = () => {
  UI.showNotification('🔍 正在检测接口...');
  API.checkAll().then(result => {
    UI.showNotification(`✓ 检测完成: ${result.available}/${result.total} 接口可用`);
  });
};

window.shareLink = () => {
  const url = document.getElementById('url')?.value?.trim();
  if (!url) {
    UI.showNotification('⚠️ 请先输入视频链接');
    return;
  }
  Player.generateShareLink();
};
