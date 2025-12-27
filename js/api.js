/**
 * API 模块 - 接口检测与切换
 * 负责接口管理、检测、切换等功能
 */

const API = {
  // 所有可用的解析接口列表
  list: [
    { name: "虾米解析", url: "https://jx.xmflv.com/?url=" },
    { name: "国内线路", url: "https://jx.nnxv.cn/tv.php?url=" },
    { name: "线路", url: "https://jx.m3u8.tv/jiexi/?url=" },
    { name: "备用线路", url: "https://jx.xmflv.cc/?url=" },
    { name: "线路五", url: "https://jx.playerjy.com/?url=" },
    { name: "OK解析", url: "https://okjx.cc/?url=" },
  ],

  // 初始化API列表UI
  init() {
    const select = document.getElementById("jk");
    const apiList = document.getElementById("apiList");
    
    if (!select || !apiList) return;
    
    select.innerHTML = '';
    apiList.innerHTML = '';
    
    this.list.forEach((api, index) => {
      // 创建下拉菜单选项
      const option = document.createElement('option');
      option.value = api.url;
      option.textContent = api.name;
      select.appendChild(option);
      
      // 创建状态显示项
      const item = document.createElement('div');
      item.className = 'api-item';
      item.id = `api-${index}`;
      item.innerHTML = `
        <span><span class="status-dot"></span><span class="api-name">${api.name}</span></span>
        <span class="status-text">等待检测</span>
      `;
      apiList.appendChild(item);
    });
    
    // 恢复上次选择的接口
    const lastIndex = Storage.get('lastApiIndex', 0);
    select.selectedIndex = lastIndex;
  },

  // 获取当前选中的API
  getCurrent() {
    const select = document.getElementById("jk");
    return {
      url: select.value,
      name: select.options[select.selectedIndex].text
    };
  },

  // 设置当前选中的API
  setCurrent(index) {
    const select = document.getElementById("jk");
    select.selectedIndex = index;
    Storage.set('lastApiIndex', index);
  },

  // 检测单个接口
  async checkOne(index) {
    const api = this.list[index];
    const element = document.getElementById(`api-${index}`);
    if (!element) return false;

    const dot = element.querySelector('.status-dot');
    const statusText = element.querySelector('.status-text');
    
    // 设置加载状态
    element.className = 'api-item loading';
    dot.className = 'status-dot loading';
    statusText.textContent = '检测中...';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(api.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 接口可用
      element.className = 'api-item success';
      dot.className = 'status-dot success';
      statusText.textContent = '✓ 可用';
      return true;
    } catch (error) {
      // 接口不可用
      element.className = 'api-item failed';
      dot.className = 'status-dot failed';
      statusText.textContent = '✗ 不可用';
      return false;
    }
  },

  // 检测所有接口
  async checkAll() {
    console.log('开始检测所有接口...');
    const results = [];
    
    for (let i = 0; i < this.list.length; i++) {
      const result = await this.checkOne(i);
      results.push(result);
      // 错开请求
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 更新总体状态
    const availableCount = results.filter(r => r).length;
    const statusBar = document.querySelector('.api-status-bar h3 .status-dot');
    
    if (statusBar) {
      statusBar.className = availableCount > 0 ? 'status-dot success' : 'status-dot failed';
    }
    
    console.log(`检测完成: ${availableCount}/${this.list.length} 个接口可用`);
    return { total: this.list.length, available: availableCount };
  }
};
