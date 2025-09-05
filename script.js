// 使用立即执行函数包装，避免全局污染
(function() {
    'use strict';

    // 确保DOM加载完成
    function domReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // 安全的DOM操作类
    class SafeDOM {
        static getElement(id) {
            try {
                return document.getElementById(id);
            } catch (error) {
                console.warn(`Element with id '${id}' not found`);
                return null;
            }
        }

        static setText(id, text) {
            const element = this.getElement(id);
            if (element) {
                element.textContent = text || '';
            }
        }

        static setHTML(id, html) {
            const element = this.getElement(id);
            if (element) {
                element.innerHTML = html || '';
            }
        }

        static setStyle(id, property, value) {
            const element = this.getElement(id);
            if (element) {
                element.style[property] = value;
            }
        }

        static setValue(id, value) {
            const element = this.getElement(id);
            if (element) {
                element.value = value || '';
            }
        }
    }

    // 主类
    class GitHubNetdiskGenerator {
        constructor() {
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;
            
            try {
                this.bindEvents();
                this.isInitialized = true;
                console.log('GitHubNetdiskGenerator initialized successfully');
            } catch (error) {
                console.error('Failed to initialize GitHubNetdiskGenerator:', error);
            }
        }

        bindEvents() {
            // 使用事件委托，确保元素存在
            const eventMap = [
                { id: 'generateBtn', event: 'click', handler: () => this.generateNetdiskCode() },
                { id: 'copyBtn', event: 'click', handler: () => this.copyCode() },
                { id: 'downloadBtn', event: 'click', handler: () => this.downloadHTML() },
                { id: 'previewBtn', event: 'click', handler: () => this.previewCode() }
            ];

            eventMap.forEach(item => {
                const element = SafeDOM.getElement(item.id);
                if (element) {
                    element.addEventListener(item.event, item.handler);
                }
            });

            // 输入验证
            const perPageInput = SafeDOM.getElement('perPage');
            if (perPageInput) {
                perPageInput.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (value !== '' && !/^\d*$/.test(value)) {
                        e.target.value = value.replace(/[^\d]/g, '');
                    }
                });
            }
        }

        async generateNetdiskCode() {
            try {
                const username = SafeDOM.getElement('username')?.value?.trim();
                const repository = SafeDOM.getElement('repository')?.value?.trim();
                const netdiskName = SafeDOM.getElement('netdiskName')?.value?.trim() || 'GitHub网盘';
                const announcementUrl = SafeDOM.getElement('announcementUrl')?.value?.trim();
                const perPage = parseInt(SafeDOM.getElement('perPage')?.value) || 20;

                if (!username || !repository) {
                    this.showError('请填写GitHub用户名和仓库名');
                    return;
                }

                this.showLoading(true);
                this.hideError();
                this.hideSuccess();

                const netdiskCode = this.createNetdiskHTML(username, repository, netdiskName, announcementUrl, perPage);
                
                SafeDOM.setValue('generatedCode', netdiskCode);
                SafeDOM.setStyle('resultSection', 'display', 'block');
                
                this.showSuccess('网盘代码生成成功！');
            } catch (error) {
                console.error('Generate error:', error);
                this.showError('生成代码时发生错误: ' + (error.message || '未知错误'));
            } finally {
                this.showLoading(false);
            }
        }

        createNetdiskHTML(username, repository, netdiskName, announcementUrl, perPage) {
            // 转义特殊字符
            const escapedNetdiskName = (netdiskName || 'GitHub网盘')
                .replace(/&/g, '&amp;')
                .replace(/</g, '<')
                .replace(/>/g, '>')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
                
            const escapedAnnouncementUrl = (announcementUrl || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '<')
                .replace(/>/g, '>')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

            return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedNetdiskName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }

        h1 {
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
        }

        .announcement-section {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 30px;
        }

        .announcement-section h3 {
            color: #1976d2;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .announcement-content {
            line-height: 1.6;
            color: #333;
        }

        .announcement-content a {
            color: #1976d2;
            text-decoration: none;
        }

        .announcement-content a:hover {
            text-decoration: underline;
        }

        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 20px 0;
            padding: 0 30px;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
        }

        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        #pageInfo {
            font-weight: bold;
            color: #333;
        }

        .file-list {
            padding: 0 30px 20px;
        }

        .file-item {
            display: flex;
            align-items: center;
            padding: 15px;
            border: 1px solid #eee;
            border-radius: 5px;
            margin-bottom: 10px;
            background: white;
            transition: box-shadow 0.3s;
        }

        .file-item:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
            width: 40px;
            height: 40px;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #667eea;
            color: white;
            border-radius: 5px;
            font-weight: bold;
        }

        .file-info {
            flex: 1;
        }

        .file-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .file-meta {
            font-size: 12px;
            color: #666;
        }

        .file-size {
            margin-right: 15px;
        }

        .file-download {
            padding: 8px 15px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 3px;
            transition: background 0.3s;
        }

        .file-download:hover {
            background: #218838;
            text-decoration: none;
        }

        .pagination-info {
            text-align: center;
            color: #666;
            font-size: 14px;
            padding: 0 30px 20px;
        }

        .loading {
            text-align: center;
            padding: 50px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 5px;
            }
            
            .file-item {
                flex-direction: column;
                text-align: center;
            }
            
            .file-icon {
                margin-right: 0;
                margin-bottom: 10px;
            }
            
            .controls {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${escapedNetdiskName}</h1>
        
        <div id="announcementSection" class="announcement-section" style="display: none;">
            <h3>📢 公告</h3>
            <div id="announcementContent" class="announcement-content"></div>
        </div>

        <div class="controls">
            <button id="prevPage" disabled onclick="goToPage(currentPage - 1)">上一页</button>
            <span id="pageInfo">第 1 页</span>
            <button id="nextPage" onclick="goToPage(currentPage + 1)">下一页</button>
        </div>

        <div class="file-list" id="fileList">
            <div class="loading">
                <div class="spinner"></div>
                <p>正在加载文件列表...</p>
            </div>
        </div>

        <div class="pagination-info">
            <span id="paginationInfo">显示 0-0 条，共 0 条记录</span>
        </div>
    </div>

    <script>
        // 网盘配置
        const config = {
            username: '${username}',
            repository: '${repository}',
            perPage: ${perPage},
            announcementUrl: '${escapedAnnouncementUrl}'
        };

        // 全局变量
        let currentPage = 1;
        let allFiles = [];
        let totalFiles = 0;

        // 安全的DOM操作函数
        function safeGetElement(id) {
            try {
                return document.getElementById(id);
            } catch (error) {
                return null;
            }
        }

        function safeSetContent(id, content) {
            const element = safeGetElement(id);
            if (element) {
                element.textContent = content || '';
            }
        }

        function safeSetHTML(id, html) {
            const element = safeGetElement(id);
            if (element) {
                element.innerHTML = html || '';
            }
        }

        function safeSetStyle(id, property, value) {
            const element = safeGetElement(id);
            if (element) {
                element.style[property] = value;
            }
        }

        // 初始化函数
        function init() {
            loadFiles()
                .then(() => {
                    if (config.announcementUrl) {
                        loadAnnouncement();
                    }
                    displayFiles();
                })
                .catch(error => {
                    const fileList = safeGetElement('fileList');
                    if (fileList) {
                        fileList.innerHTML = '<p style="text-align: center; color: #f44336;">加载失败: ' + (error.message || '未知错误') + '</p>';
                    }
                });
        }

        // 加载文件列表
        async function loadFiles() {
            const apiUrl = 'https://api.github.com/repos/' + config.username + '/' + config.repository + '/releases';
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('获取文件列表失败: ' + response.status);
            }

            const releases = await response.json();
            allFiles = [];

            for (const release of releases) {
                if (release.assets && Array.isArray(release.assets)) {
                    for (const asset of release.assets) {
                        allFiles.push({
                            id: asset.id,
                            name: asset.name,
                            size: asset.size,
                            downloadUrl: asset.browser_download_url,
                            createdAt: asset.created_at,
                            updatedAt: asset.updated_at,
                            releaseName: release.name || release.tag_name,
                            releaseTag: release.tag_name
                        });
                    }
                }
            }

            // 按更新时间排序（最新的在前）
            allFiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        // 加载公告
        async function loadAnnouncement() {
            try {
                const response = await fetch(config.announcementUrl);
                if (!response.ok) {
                    throw new Error('公告加载失败');
                }

                const contentType = response.headers.get('content-type') || '';
                let content = await response.text();

                const announcementContent = safeGetElement('announcementContent');
                const announcementSection = safeGetElement('announcementSection');
                
                if (announcementContent && announcementSection) {
                    if (contentType.includes('text/html') || config.announcementUrl.toLowerCase().endsWith('.html')) {
                        safeSetHTML('announcementContent', content);
                    } else {
                        content = escapeHtml(content);
                        content = content.replace(/\\\\n/g, '<br>');
                        content = content.replace(/(https?:\\\\/\\\\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                        safeSetHTML('announcementContent', content);
                    }
                    safeSetStyle('announcementSection', 'display', 'block');
                }
            } catch (error) {
                console.warn('公告加载失败:', error.message);
                const announcementContent = safeGetElement('announcementContent');
                const announcementSection = safeGetElement('announcementSection');
                
                if (announcementContent && announcementSection) {
                    safeSetHTML('announcementContent', '<p style="color: #f44336;">公告加载失败: ' + (error.message || '未知错误') + '</p>');
                    safeSetStyle('announcementSection', 'display', 'block');
                }
            }
        }

        // 显示文件列表
        function displayFiles() {
            const fileList = safeGetElement('fileList');
            if (!fileList) return;

            const startIndex = (currentPage - 1) * config.perPage;
            const endIndex = Math.min(startIndex + config.perPage, allFiles.length);
            const pageFiles = allFiles.slice(startIndex, endIndex);

            if (pageFiles.length === 0) {
                fileList.innerHTML = '<p style="text-align: center; color: #666;">没有找到文件</p>';
                updatePagination();
                return;
            }

            fileList.innerHTML = pageFiles.map(file => createFileItem(file)).join('');
            updatePagination();
        }

        // 创建文件项
        function createFileItem(file) {
            const fileExtension = getFileExtension(file.name);
            const fileSize = formatFileSize(file.size);
            const fileIcon = getFileIcon(fileExtension);
            const createdAt = new Date(file.createdAt).toLocaleString('zh-CN');
            const updatedAt = new Date(file.updatedAt).toLocaleString('zh-CN');

            return \`
                <div class="file-item">
                    <div class="file-icon">\${fileIcon}</div>
                    <div class="file-info">
                        <div class="file-name">\${escapeHtml(file.name)}</div>
                        <div class="file-meta">
                            <span class="file-size">\${fileSize}</span>
                            <span class="file-date">更新时间: \${updatedAt}</span>
                            \${file.releaseName ? \`<span class="file-release">版本: \${escapeHtml(file.releaseName)}</span>\` : ''}
                        </div>
                    </div>
                    <a href="\${file.downloadUrl}" class="file-download" target="_blank" rel="noopener noreferrer">
                        下载
                    </a>
                </div>
            \`;
        }

        // 跳转到指定页面
        function goToPage(page) {
            const totalPages = Math.ceil(allFiles.length / config.perPage);
            if (page < 1 || page > totalPages) return;
            
            currentPage = page;
            displayFiles();
        }

        // 更新分页控件
        function updatePagination() {
            const totalPages = Math.ceil(allFiles.length / config.perPage);
            const startIndex = (currentPage - 1) * config.perPage + 1;
            const endIndex = Math.min(startIndex + config.perPage - 1, allFiles.length);

            const prevPageBtn = safeGetElement('prevPage');
            const nextPageBtn = safeGetElement('nextPage');
            const pageInfo = safeGetElement('pageInfo');
            const paginationInfo = safeGetElement('paginationInfo');

            if (prevPageBtn) {
                prevPageBtn.disabled = currentPage <= 1;
            }
            if (nextPageBtn) {
                nextPageBtn.disabled = currentPage >= totalPages;
            }
            if (pageInfo) {
                safeSetContent('pageInfo', \`第 \${currentPage} 页\`);
            }
            if (paginationInfo) {
                safeSetContent('paginationInfo', \`显示 \${startIndex}-\${endIndex} 条，共 \${allFiles.length} 条记录\`);
            }
        }

        // 获取文件扩展名
        function getFileExtension(filename) {
            const parts = filename.split('.');
            return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
        }

        // 获取文件图标
        function getFileIcon(extension) {
            const iconMap = {
                'zip': '📦',
                'rar': '📦',
                '7z': '📦',
                'pdf': '📄',
                'doc': '📝',
                'docx': '📝',
                'xls': '📊',
                'xlsx': '📊',
                'ppt': '📽️',
                'pptx': '📽️',
                'jpg': '🖼️',
                'jpeg': '🖼️',
                'png': '🖼️',
                'gif': '🖼️',
                'mp3': '🎵',
                'wav': '🎵',
                'mp4': '🎬',
                'avi': '🎬',
                'exe': '⚙️',
                'app': '⚙️'
            };
            
            return iconMap[extension] || '📁';
        }

        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // 转义HTML
        function escapeHtml(text) {
            if (!text) return '';
            const map = {
                '&': '&amp;',
                '<': '<',
                '>': '>',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        // 页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    <${''}/script>
</body>
</html>`;
        }

        copyCode() {
            const codeTextarea = SafeDOM.getElement('generatedCode');
            if (codeTextarea) {
                codeTextarea.select();
                try {
                    document.execCommand('copy');
                    this.showSuccess('代码已复制到剪贴板！');
                } catch (error) {
                    this.showError('复制失败: ' + (error.message || '未知错误'));
                }
            }
        }

        downloadHTML() {
            const codeTextarea = SafeDOM.getElement('generatedCode');
            if (codeTextarea) {
                const code = codeTextarea.value;
                const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'github-netdisk.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showSuccess('HTML文件下载成功！');
            }
        }

        previewCode() {
            const codeTextarea = SafeDOM.getElement('generatedCode');
            if (codeTextarea) {
                const code = codeTextarea.value;
                const newWindow = window.open('', '_blank');
                newWindow.document.write(code);
                newWindow.document.close();
            }
        }

        showLoading(show) {
            SafeDOM.setStyle('loading', 'display', show ? 'block' : 'none');
        }

        showError(message) {
            SafeDOM.setText('errorMessage', message || '发生未知错误');
            SafeDOM.setStyle('error', 'display', 'block');
        }

        showSuccess(message) {
            SafeDOM.setText('successMessage', message || '操作成功');
            SafeDOM.setStyle('success', 'display', 'block');
            
            // 3秒后自动隐藏成功消息
            setTimeout(() => {
                this.hideSuccess();
            }, 3000);
        }

        hideError() {
            SafeDOM.setStyle('error', 'display', 'none');
        }

        hideSuccess() {
            SafeDOM.setStyle('success', 'display', 'none');
        }
    }

    // 初始化应用
    domReady(function() {
        try {
            window.githubNetdiskGenerator = new GitHubNetdiskGenerator();
            window.githubNetdiskGenerator.init();
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    });

})();