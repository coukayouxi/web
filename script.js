document.addEventListener('DOMContentLoaded', function() {
    // 绑定事件
    document.getElementById('generateBtn').addEventListener('click', generateNetdisk);
    document.getElementById('downloadBtn').addEventListener('click', downloadNetdisk);
    document.getElementById('copyUrlBtn').addEventListener('click', copyConfigParams);

    // 输入验证
    document.getElementById('perPage').addEventListener('input', function(e) {
        let value = e.target.value;
        if (value !== '' && !/^\d*$/.test(value)) {
            e.target.value = value.replace(/[^\d]/g, '');
        }
    });
    
    // 仓库输入验证
    document.getElementById('repository').addEventListener('blur', function(e) {
        const repo = e.target.value.trim();
        if (repo && !isValidRepositoryFormat(repo)) {
            showError('请输入有效的仓库格式 (用户名/仓库名)');
        } else {
            hideError();
        }
    });
});

function isValidRepositoryFormat(repo) {
    if (!repo) return false;
    // 检查是否包含斜杠且不以斜杠开头或结尾
    return repo.includes('/') && !repo.startsWith('/') && !repo.endsWith('/') && repo.split('/').length === 2;
}

function parseRepository(repo) {
    try {
        const parts = repo.split('/');
        if (parts.length !== 2) {
            throw new Error('无效的仓库格式');
        }
        
        const username = parts[0].trim();
        const repository = parts[1].trim();
        
        if (!username || !repository) {
            throw new Error('用户名和仓库名不能为空');
        }
        
        return {
            username: username,
            repository: repository
        };
    } catch (error) {
        throw new Error('无法解析仓库信息: ' + error.message);
    }
}

function generateNetdisk() {
    const repository = document.getElementById('repository').value.trim();
    const netdiskName = document.getElementById('netdiskName').value.trim() || 'GitHub网盘';
    const announcementUrl = document.getElementById('announcementUrl').value.trim();
    const perPage = parseInt(document.getElementById('perPage').value) || 20;

    if (!repository) {
        showError('请填写GitHub仓库信息');
        return;
    }

    if (!isValidRepositoryFormat(repository)) {
        showError('请输入有效的仓库格式 (用户名/仓库名)');
        return;
    }

    showLoading(true);
    hideError();
    hideSuccess();

    try {
        // 解析仓库信息
        const { username, repository: repoName } = parseRepository(repository);
        
        // 生成配置参数
        const configParams = generateConfigParams({
            repo: repository,
            name: netdiskName,
            announcement: announcementUrl,
            perPage: perPage
        });
        
        // 保存配置用于下载
        window.netdiskConfig = {
            username: username,
            repository: repoName,
            netdiskName: netdiskName,
            announcementUrl: announcementUrl,
            perPage: perPage,
            configParams: configParams
        };
        
        // 显示配置参数
        document.getElementById('configParams').value = configParams;
        document.getElementById('resultSection').style.display = 'block';
        
        showSuccess('网盘生成成功！');
    } catch (error) {
        showError('生成网盘时发生错误: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function generateConfigParams(config) {
    const params = [];
    
    if (config.repo) {
        params.push(`repo=${encodeURIComponent(config.repo)}`);
    }
    
    if (config.name && config.name !== 'GitHub网盘') {
        params.push(`name=${encodeURIComponent(config.name)}`);
    }
    
    if (config.announcement) {
        params.push(`announcement=${encodeURIComponent(config.announcement)}`);
    }
    
    if (config.perPage && config.perPage !== 20) {
        params.push(`perPage=${config.perPage}`);
    }
    
    return params.join('&');
}

function downloadNetdisk() {
    if (!window.netdiskConfig) {
        showError('请先生成网盘');
        return;
    }

    try {
        const htmlContent = generateNetdiskHTML(window.netdiskConfig);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'github-netdisk.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('网盘HTML文件下载成功！');
    } catch (error) {
        showError('下载失败: ' + error.message);
    }
}

function copyConfigParams() {
    if (!window.netdiskConfig) {
        showError('请先生成网盘');
        return;
    }
    
    const configParams = document.getElementById('configParams');
    configParams.select();
    try {
        document.execCommand('copy');
        showSuccess('配置参数已复制到剪贴板！');
    } catch (error) {
        showError('复制失败: ' + error.message);
    }
}

function generateNetdiskHTML(config) {
    const jsUrl = "https://cdn.jsdelivr.net/gh/coukayouxi/web/netdisk.js";
    const fullJsUrl = config.configParams ? `${jsUrl}?${config.configParams}` : jsUrl;
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.netdiskName}</title>
</head>
<body>
    <script src="${fullJsUrl}"></script>
</body>
</html>`;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').style.display = 'block';
}

function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('success').style.display = 'block';
    
    setTimeout(() => {
        hideSuccess();
    }, 3000);
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function hideSuccess() {
    document.getElementById('success').style.display = 'none';
}