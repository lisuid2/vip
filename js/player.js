/**
 * 播放器模块 - 视频播放与分享逻辑
 * 负责视频解析、播放、分享等功能
 */

const Player = {
  // 当前播放信息
  current: {
    url: '',
    apiIndex: 0,
    apiUrl: '',
    title: ''
  },

  // 解析并播放视频
  async play(videoUrl, apiUrl) {
    const playBox = document.getElementById("playbox");
    const playTip = document.getElementById("play-tip");
    
    if (!playBox) {
      console.error('播放器元素不存在');
      return false;
    }

    // 验证URL
    if (!videoUrl) {
      UI.showNotification("❌ 请输入视频链接");
      return false;
    }

    // 验证URL格式
    try {
      new URL('http://' + videoUrl);
    } catch (e) {
      UI.showNotification("❌ 链接格式不正确");
      return false;
    }

    // 隐藏提示区域
    if (playTip) {
      playTip.classList.add("hidden");
    }

    // 设置播放地址
    const fullUrl = `${apiUrl}${encodeURIComponent(videoUrl)}`;
    playBox.src = fullUrl;

    // 保存当前播放信息
    this.current.url = videoUrl;
    this.current.apiUrl = apiUrl;
    this.current.apiIndex = document.getElementById("jk").selectedIndex;

    // 保存历史
    Storage.set('lastUrl', videoUrl);
    Storage.set('lastApiIndex', this.current.apiIndex);

    // 获取视频标题（如果API支持）
    await this.fetchTitle(videoUrl);

    UI.showNotification("⏳ 正在加载，请稍候...");
    return true;
  },

  // 获取视频标题
  async fetchTitle(videoUrl) {
    const titElement = document.getElementById("tittext");
    if (!titElement) return;

    try {
      const response = await fetch('data/title.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `titurl=${encodeURIComponent(videoUrl)}`
      });

      if (response.ok) {
        const title = await response.text();
        titElement.textContent = title;
        this.current.title = title;
      }
    } catch (error) {
      console.log('标题获取失败:', error);
      titElement.textContent = "标题获取失败";
    }
  },

  // 生成分享链接
  generateShareLink() {
    if (!this.current.url) {
      UI.showNotification("❌ 没有视频可分享");
      return '';
    }

    const params = new URLSearchParams({
      url: this.current.url,
      api: this.current.apiIndex,
      title: this.current.title || '视频'
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    return shareUrl;
  },

  // 复制分享链接
  copyShareLink() {
    const shareLink = this.generateShareLink();
    if (!shareLink) return;

    navigator.clipboard.writeText(shareLink).then(() => {
      UI.showNotification("✓ 分享链接已复制");
    }).catch(() => {
      // 备用方案
      const textarea = document.createElement('textarea');
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      UI.showNotification("✓ 分享链接已复制");
    });
  },

  // 分享到其他平台
  shareToOther(platform) {
    const shareLink = this.generateShareLink();
    if (!shareLink) return;

    const title = this.current.title || '看看这个视频';
    const shareUrls = {
      weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent(title)}`,
      qq: `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareLink)}&title=${encodeURIComponent(title)}`,
      wechat: null // 微信无法直接分享，只能手动复制
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  },

  // 处理来自URL的自动填充
  handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    const apiParam = params.get('api');

    if (urlParam) {
      const urlInput = document.getElementById('url');
      if (urlInput) {
        urlInput.value = urlParam;
        
        // 设置API
        if (apiParam !== null && !isNaN(apiParam)) {
          API.setCurrent(parseInt(apiParam));
        }

        // 自动播放
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            const { url: apiUrl } = API.getCurrent();
            this.play(urlParam, apiUrl);
          }, 100);
        });
      }
    }
  }
};
