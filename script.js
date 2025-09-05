class GitHubNetdisk {
    constructor() {
        this.currentPage = 1;
        this.perPage = 20;
        this.totalFiles = 0;
        this.allFiles = [];
        this.filteredFiles = [];
        this.announcementContent = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateNetdisk();
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            this.goToPage(this.currentPage - 1);
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.goToPage(this.currentPage + 1);
        });

        // 监听每页显示数量输入框的变化
        document.getElementById('perPage').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            
            // 验证输入值
            if (isNaN(value) || value < 1) {
                value = 20;
            } else if (value > 1000) {
                value = 1000;
            }
            
            e.target.value = value;
            this.perPage = value;
            
            if (this.allFiles.length > 0) {
                this.goToPage(1);
            }
        });

        // 实时验证输入
        document.getElementById('perPage').addEventListener('input', (e) => {
            let value = e.target.value;
            // 只允许数字输入
            if (value !== '' && !/^\d*$/.test(value)) {
                e.target.value = value.replace(/[^\d]/g, '');
            }
        });
    }

    async generateNetdisk() {
        const username = document.getElementById('username').value.trim();
        const repository = document.getElementById('repository').value.trim();
        const netdiskName = document.getElementById('netdiskName').value.trim();
        const announcementUrl = document.getElementById('announcementUrl').value.trim();
        const perPageInput = document.getElementById('perPage').value.trim();

        // 验证每页显示数量
        let perPageValue = parseInt(perPageInput);
        if (isNaN(perPageValue) || perPageValue < 1) {
            perPageValue = 20;
        } else if (perPageValue > 1000) {
            perPageValue = 1000;
        }
        this.perPage = perPageValue;
        document.getElementById('perPage').value = perPageValue;

        if (!username || !repository) {
            this.showError('请填写GitHub用户名和仓库名');
            return;
        }

        this.showLoading(true);
        this.hideError();
        this.announcementContent = '';

        try {
            // 并行获取公告和文件列表
            const announcementPromise = announcementUrl ? this.fetchAnnouncement(announcementUrl) : Promise.resolve('');
            const filesPromise = this.fetchReleasesFiles(username, repository);

            await Promise.all([announcementPromise, filesPromise]);
            
            this.displayNetdisk(netdiskName);
            this.goToPage(1);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchAnnouncement(url) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`公告加载失败: ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';
            let content = await response.text();

            // 根据文件类型处理内容
            if (contentType.includes('text/html') || url.toLowerCase().endsWith('.html')) {
                // HTML内容直接使用
                this.announcementContent = content;
            } else {
                // 文本内容转换为HTML
                content = this.escapeHtml(content);
                // 将换行符转换为<br>标签
                content = content.replace(/\n/g, '<br>');
                // 简单的URL识别和转换为链接
                content = content.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
                this.announcementContent = content;
            }
        } catch (error) {
            console.warn('公告加载失败:', error.message);
            this.announcementContent = `<p style="color: #f44336;">公告加载失败: ${error.message}</p>`;
        }
    }

    async fetchReleasesFiles(username, repository) {
        const apiUrl = `https://api.github.com/repos/${username}/${repository}/releases`;
        
        try {
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('仓库不存在或没有访问权限');
                } else if (response.status === 403) {
                    throw new Error('API请求限制，请稍后再试');
                } else {
                    throw new Error(`请求失败: ${response.status}`);
                }
            }

            const releases = await response.json();
            
            if (!Array.isArray(releases)) {
                throw new Error('获取Releases失败');
            }

            this.allFiles = [];
            
            for (const release of releases) {
                if (release.assets && Array.isArray(release.assets)) {
                    for (const asset of release.assets) {
                        this.allFiles.push({
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
            this.allFiles.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络连接');
            }
            throw error;
        }
    }

    displayNetdisk(netdiskName) {
        document.getElementById('netdiskTitle').textContent = netdiskName;
        
        // 显示公告
        const announcementSection = document.getElementById('announcementSection');
        const announcementContent = document.getElementById('announcementContent');
        
        if (this.announcementContent) {
            announcementContent.innerHTML = this.announcementContent;
            announcementSection.style.display = 'block';
        } else {
            announcementSection.style.display = 'none';
        }
        
        document.getElementById('netdiskPreview').style.display = 'block';
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderFileList();
        this.updatePaginationControls();
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        const startIndex = (this.currentPage - 1) * this.perPage;
        const endIndex = Math.min(startIndex + this.perPage, this.allFiles.length);
        const pageFiles = this.allFiles.slice(startIndex, endIndex);

        if (pageFiles.length === 0) {
            fileList.innerHTML = '<p style="text-align: center; color: #666;">没有找到文件</p>';
            return;
        }

        fileList.innerHTML = pageFiles.map(file => this.createFileItem(file)).join('');
    }

    createFileItem(file) {
        const fileExtension = this.getFileExtension(file.name);
        const fileSize = this.formatFileSize(file.size);
        const fileIcon = this.getFileIcon(fileExtension);
        const createdAt = new Date(file.createdAt).toLocaleString('zh-CN');
        const updatedAt = new Date(file.updatedAt).toLocaleString('zh-CN');

        return `
            <div class="file-item">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        <span class="file-size">${fileSize}</span>
                        <span class="file-date">更新时间: ${updatedAt}</span>
                        ${file.releaseName ? `<span class="file-release">版本: ${this.escapeHtml(file.releaseName)}</span>` : ''}
                    </div>
                </div>
                <a href="${file.downloadUrl}" class="file-download" target="_blank" rel="noopener noreferrer">
                    下载
                </a>
            </div>
        `;
    }

    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }

    getFileIcon(extension) {
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '<',
            '>': '>',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    updatePaginationControls() {
        const totalPages = Math.ceil(this.allFiles.length / this.perPage);
        const startIndex = (this.currentPage - 1) * this.perPage + 1;
        const endIndex = Math.min(startIndex + this.perPage - 1, this.allFiles.length);

        document.getElementById('prevPage').disabled = this.currentPage <= 1;
        document.getElementById('nextPage').disabled = this.currentPage >= totalPages;
        document.getElementById('pageInfo').textContent = `第 ${this.currentPage} 页`;
        document.getElementById('paginationInfo').textContent = 
            `显示 ${startIndex}-${endIndex} 条，共 ${this.allFiles.length} 条记录`;
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('error').style.display = 'block';
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GitHubNetdisk();
});