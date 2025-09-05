// GitHub网盘核心功能
(function() {
    // 默认配置
    const defaultConfig = {
        repo: '',
        name: 'GitHub网盘',
        announcement: '',
        perPage: 20
    };

    // 从URL参数获取配置
    function getConfigFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const config = {...defaultConfig};
            
            // 解析URL参数
            const repoParam = urlParams.get('repo');
            if (repoParam) {
                config.repo = repoParam;
            }
            
            const nameParam = urlParams.get('name');
            if (nameParam) {
                config.name = decodeURIComponent(nameParam);
            }
            
            const announcementParam = urlParams.get('announcement');
            if (announcementParam) {
                config.announcement = decodeURIComponent(announcementParam);
            }
            
            const perPageParam = urlParams.get('perPage');
            if (perPageParam) {
                config.perPage = parseInt(perPageParam) || 20;
            }
            
            return config;
        } catch (error) {
            console.error('解析URL参数失败:', error);
            return defaultConfig;
        }
    }

    // 解析仓库信息
    function parseRepository(repo) {
        if (!repo) return {username: '', repository: ''};
        
        const parts = repo.split('/');
        if (parts.length !== 2) {
            return {username: '', repository: ''};
        }
        
        return {
            username: parts[0].trim(),
            repository: parts[1].trim()
        };
    }

    // 网盘配置
    const urlConfig = getConfigFromUrl();
    const {username, repository} = parseRepository(urlConfig.repo);
    
    const config = {
        username: username,
        repository: repository,
        netdiskName: urlConfig.name,
        announcementUrl: urlConfig.announcement,
        perPage: urlConfig.perPage
    };

    // 检查必要配置
    if (!config.username || !config.repository) {
        document.body.innerHTML = `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8f9fa;">
                <h1 style="color: #dc3545;">配置错误</h1>
                <p>请在URL中指定仓库信息，例如: ?repo=username/repository</p>
                <p>当前配置: repo=${config.username}/${config.repository}</p>
            </div>
        `;
        return;
    }

    // 替换整个页面内容
    document.body.innerHTML = `
        <div class="container">
            <h1 id="netdiskTitle">${escapeHtml(config.netdiskName)}</h1>
            
            <div id="announcementSection" class="announcement-section" style="display: none;">
                <h3>📢 公告</h3>
                <div id="announcementContent" class="announcement-content"></div>
            </div>

            <div class="controls">
                <button id="prevPage" disabled>上一页</button>
                <span id="pageInfo">第 1 页</span>
                <button id="nextPage">下一页</button>
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
    `;

    // 初始化
    initNetdisk();

    // 初始化网盘
    async function initNetdisk() {
        try {
            await loadFiles();
            if (config.announcementUrl) {
                await loadAnnouncement();
            }
            displayFiles();
        } catch (error) {
            console.error('初始化失败:', error);
            const fileList = document.getElementById('fileList');
            if (fileList) {
                fileList.innerHTML = 
                    '<p style="text-align: center; color: #f44336;">加载失败: ' + escapeHtml(error.message) + '</p>';
            }
        }
    }

    // 加载文件列表
    async function loadFiles() {
        const apiUrl = `https://api.github.com/repos/${config.username}/${config.repository}/releases`;
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

            const announcementContent = document.getElementById('announcementContent');
            const announcementSection = document.getElementById('announcementSection');
            
            if (announcementContent && announcementSection) {
                if (contentType.includes('text/html') || config.announcementUrl.toLowerCase().endsWith('.html')) {
                    announcementContent.innerHTML = content;
                } else {
                    content = escapeHtml(content);
                    content = content.replace(/\n/g, '<br>');
                    content = content.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                    announcementContent.innerHTML = content;
                }
                announcementSection.style.display = 'block';
            }
        } catch (error) {
            console.warn('公告加载失败:', error.message);
            const announcementContent = document.getElementById('announcementContent');
            const announcementSection = document.getElementById('announcementSection');
            
            if (announcementContent && announcementSection) {
                announcementContent.innerHTML = 
                    '<p style="color: #f44336;">公告加载失败: ' + escapeHtml(error.message) + '</p>';
                announcementSection.style.display = 'block';
            }
        }
    }

    // 显示文件列表
    function displayFiles() {
        const fileList = document.getElementById('fileList');
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
        
        // 绑定分页按钮事件
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        
        if (prevPageBtn) {
            prevPageBtn.onclick = () => goToPage(currentPage - 1);
        }
        if (nextPageBtn) {
            nextPageBtn.onclick = () => goToPage(currentPage + 1);
        }
    }

    // 创建文件项
    function createFileItem(file) {
        const fileExtension = getFileExtension(file.name);
        const fileSize = formatFileSize(file.size);
        const fileIcon = getFileIcon(fileExtension);
        const createdAt = new Date(file.createdAt).toLocaleString('zh-CN');
        const updatedAt = new Date(file.updatedAt).toLocaleString('zh-CN');

        return `
            <div class="file-item">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        <span class="file-size">${fileSize}</span>
                        <span class="file-date">更新时间: ${updatedAt}</span>
                        ${file.releaseName ? `<span class="file-release">版本: ${escapeHtml(file.releaseName)}</span>` : ''}
                    </div>
                </div>
                <a href="${file.downloadUrl}" class="file-download" target="_blank" rel="noopener noreferrer">
                    下载
                </a>
            </div>
        `;
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

        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        const paginationInfo = document.getElementById('paginationInfo');

        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
        if (pageInfo) {
            pageInfo.textContent = `第 ${currentPage} 页`;
        }
        if (paginationInfo) {
            paginationInfo.textContent = 
                `显示 ${startIndex}-${endIndex} 条，共 ${allFiles.length} 条记录`;
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

    // 全局变量
    let currentPage = 1;
    let allFiles = [];
})();