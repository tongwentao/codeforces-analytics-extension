(function () {
    'use strict';

    // --- 国际化 (i18n) 配置 ---
    let currentLang = 'en';
    const i18n = {
        en: {
            loading: 'Loading Analytics (Pro Max)...',
            loadingFetch: 'Fetching submissions from Codeforces API...',
            loadingProcess: 'Analyzing and processing submissions...',
            loadingDraw: 'Drawing: {chart}',
            loadingComplete: 'Loading Complete!',
            fetchError: 'Failed to load data, possibly rate-limited by CF. Please try again later.',
            titleText: 'Codeforces Analytics',
            btnSwitch: '中文',
            btnShare: 'Share (Export Image)',
            generating: 'Generating...',
            ratings: 'Problem Ratings',
            tags: 'Tags Solved',
            lang: 'Programming Language',
            verdict: 'Verdict Distribution',
            attempts: 'Average Attempts to AC',
            participant: 'Participant Type',
            performance: 'Execution Performance',
            memoryPerf: 'Memory Usage (KB vs Rating)',
            timeline: 'Activity Timeline (Monthly)',
            heatmap: 'Submission Heatmap',
            unsolved: 'Unsolved Problems (Total: {n})',
            submissions: 'Submissions',
            time: 'Time (ms)',
            memory: 'Memory (KB)',
            rating: 'Rating',
            points: 'Points Earned',
            streak: 'Max Streak',
            days: 'days',
            speed: 'Contest Speed Analysis',
            try1: '1 Try (One Shot)',
            try2: '2 Tries',
            try3_5: '3-5 Tries',
            tryMore: '> 5 Tries (Struggle)',
            genErrorConsole: 'Failed to generate image:',
            genErrorAlert: 'Sorry, failed to generate the image. Please check the console for errors.',
            maRating: 'Moving Average Rating (Recent 20 ACs)',
            weakness: 'Weakness Analysis (Average Tries per Tag)',
            timeOfDay: 'Time of Day (Active Hours)',
            errorDiag: 'Error Diagnosis (Failed at Test N)',
            langDiff: 'Language vs Difficulty',
            test1_2: 'Test 1-2 (Logic)',
            test3_10: 'Test 3-10 (Basic Cases)',
            test11_50: 'Test 11-50 (Edge Cases)',
            test50plus: '>50 (Deep Edge)',
            btnSettings: 'Settings',
            settingsTitle: 'Chart Display Settings',
            settingsSave: 'Save',
            settingsCancel: 'Cancel',
            liteMode: 'Lite Mode (Disable heavy graphics/filters)'
        },
        zh: {
            loading: '正在加载分析数据 (Pro Max)...',
            loadingFetch: '正在从 Codeforces 获取提交数据...',
            loadingProcess: '正在分析与处理提交数据...',
            loadingDraw: '正在绘制：{chart}',
            loadingComplete: '加载完成！',
            fetchError: '加载数据失败，可能是 CF 接口限流，请稍后再试。',
            titleText: 'CF 解题数据可视化',
            btnSwitch: 'English',
            btnShare: '分享 (生成长图)',
            generating: '正在生成...',
            ratings: '题目难度分布',
            tags: '题目标签分布',
            lang: '编程语言偏好',
            verdict: '提交结果分布',
            attempts: '平均 AC 尝试次数',
            participant: '参赛类型分布',
            performance: '执行性能分布 (时间 vs 难度)',
            memoryPerf: '内存使用分布 (KB vs 难度)',
            timeline: '刷题活跃度 (月度)',
            heatmap: '提交热力图',
            unsolved: '未解决题目 (总计: {n} 题)',
            submissions: '提交数',
            time: '运行时间 (ms)',
            memory: '内存 (KB)',
            rating: '难度',
            points: '获得分数',
            streak: '最长连续',
            days: '天',
            speed: '比赛速度分析',
            try1: '1 Try (一发入魂)',
            try2: '2 Tries',
            try3_5: '3-5 Tries',
            tryMore: '> 5 Tries (折磨)',
            genErrorConsole: '生成图片失败:',
            genErrorAlert: '抱歉，生成图片失败，请检查控制台报错。',
            maRating: '真实能力曲线 (最近20题均分)',
            weakness: '弱点分析 (各标签平均尝试次数)',
            timeOfDay: '刷题作息 (24小时分布)',
            errorDiag: '错误诊断 (挂在第几个测试点)',
            langDiff: '编程语言与解决难度',
            test1_2: '测试点 1-2 (根本逻辑)',
            test3_10: '测试点 3-10 (基础边界)',
            test11_50: '测试点 11-50 (特殊用例)',
            test50plus: '>50 (深层隐蔽 bug)',
            btnSettings: '设置',
            settingsTitle: '图表显示设置',
            settingsSave: '保存',
            settingsCancel: '取消',
            liteMode: '低配模式 (禁用重度图效/滤镜)'
        }
    };

    const t = (key, params = {}) => {
        let text = i18n[currentLang][key] || key;
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    };

    const chartInstances = [];
    let userSettings = {};
    try {
        const saved = localStorage.getItem('cf_analytics_settings');
        if (saved) {
            userSettings = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
    const isChartEnabled = (chartId) => {
        return userSettings[chartId] !== false;
    };

    window.addEventListener('resize', () => {
        chartInstances.forEach(chart => chart && chart.resize());
    });

    const getRatingColor = (rating) => {
        if (rating >= 3000) return '#aa0100';
        if (rating >= 2600) return '#ff3333';
        if (rating >= 2400) return '#ff7777';
        if (rating >= 2300) return '#ffbb55';
        if (rating >= 2100) return '#ffcc87';
        if (rating >= 1900) return '#ff88ff';
        if (rating >= 1600) return '#aaaaff';
        if (rating >= 1400) return '#76ddbb';
        if (rating >= 1200) return '#76ff77';
        return '#cccccc';
    };

    // --- DOM 渲染与容器管理 ---
    const initDashboardContainer = (res) => {
        let container = document.getElementById('cf-analytics-wrapper');
        if (!container) {
            container = document.createElement('div');
            container.id = 'cf-analytics-wrapper';
            container.style.cssText = 'margin-top: 2em; padding: 20px; background: #ffffff; border-radius: 8px; box-sizing: border-box;';
            document.getElementById('pageContent').appendChild(container);
        }

        container.innerHTML = `
            <div id="cf-header-bar" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #3b5998; font-weight: bold;">${t('titleText')}</h2>
                <div style="display: flex; gap: 10px;">
                    <button id="cf-settings-btn" style="padding: 5px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #17a2b8; background: #17a2b8; color: white; font-weight: bold; transition: background 0.2s;">
                        ${t('btnSettings')}
                    </button>
                    <button id="cf-share-btn" style="padding: 5px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #28a745; background: #28a745; color: white; font-weight: bold; transition: background 0.2s;">
                        ${t('btnShare')}
                    </button>
                    <button id="cf-lang-toggle" style="padding: 5px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #0073e6; background: #0073e6; color: white; font-weight: bold; transition: background 0.2s;">
                        ${t('btnSwitch')}
                    </button>
                </div>
            </div>
            <div id="cf-analytics-dashboard" style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1em 0;"></div>
        `;

        document.getElementById('cf-lang-toggle').addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'zh' : 'en';
            chartInstances.forEach(chart => chart && chart.dispose());
            chartInstances.length = 0;
            drawCharts(res);
        });

        document.getElementById('cf-settings-btn').addEventListener('click', () => {
            let modal = document.getElementById('cf-settings-modal');
            const populateList = (list) => {
                list.innerHTML = '';
                const chartKeys = [
                    { id: 'timelineChart', label: t('timeline') },
                    { id: 'ratingChart', label: t('ratings') },
                    { id: 'tagsChart', label: t('tags') },
                    { id: 'langChart', label: t('lang') },
                    { id: 'verdictChart', label: t('verdict') },
                    { id: 'attemptsChart', label: t('attempts') },
                    { id: 'participantChart', label: t('participant') },
                    { id: 'performanceChart', label: t('performance') },
                    { id: 'memoryChart', label: t('memoryPerf') },
                    { id: 'speedChart', label: t('speed') },
                    { id: 'maChart', label: t('maRating') },
                    { id: 'timeOfDayChart', label: t('timeOfDay') },
                    { id: 'weaknessChart', label: t('weakness') },
                    { id: 'langDiffChart', label: t('langDiff') },
                    { id: 'errorDiagChart', label: t('errorDiag') },
                    { id: 'unsolvedChart', label: t('unsolved', {n: '?'}) }
                ];
                chartKeys.forEach(item => {
                    const label = document.createElement('label');
                    label.style.cssText = 'display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px;';
                    const checked = userSettings[item.id] !== false ? 'checked' : '';
                    label.innerHTML = `<input type="checkbox" data-id="${item.id}" ${checked}> <span>${item.label}</span>`;
                    list.appendChild(label);
                });

                // Add divider and Lite Mode performance setting toggle
                const hr = document.createElement('hr');
                hr.style.cssText = 'border: 0; border-top: 1px solid #eee; margin: 10px 0;';
                list.appendChild(hr);

                const liteLabel = document.createElement('label');
                liteLabel.style.cssText = 'display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: bold; color: #d9534f;';
                const liteChecked = userSettings.liteMode === true ? 'checked' : '';
                liteLabel.innerHTML = `<input type="checkbox" data-id="liteMode" ${liteChecked}> <span>⚡ ${t('liteMode')}</span>`;
                list.appendChild(liteLabel);
            };

            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'cf-settings-modal';
                modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;';
                
                const content = document.createElement('div');
                content.style.cssText = 'background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90vw; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
                
                content.innerHTML = `
                    <h3 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 10px; color: #333;">${t('settingsTitle')}</h3>
                    <div id="cf-settings-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; color: #333;">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="cf-settings-cancel" style="padding: 5px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc; background: #fff; color: #333; font-weight: bold;">${t('settingsCancel')}</button>
                        <button id="cf-settings-save" style="padding: 5px 15px; cursor: pointer; border-radius: 4px; border: 1px solid #007bff; background: #007bff; color: white; font-weight: bold;">${t('settingsSave')}</button>
                    </div>
                `;
                modal.appendChild(content);
                document.body.appendChild(modal);

                const list = document.getElementById('cf-settings-list');
                populateList(list);

                document.getElementById('cf-settings-cancel').addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                document.getElementById('cf-settings-save').addEventListener('click', () => {
                    const checkboxes = list.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        userSettings[cb.dataset.id] = cb.checked;
                    });
                    localStorage.setItem('cf_analytics_settings', JSON.stringify(userSettings));
                    modal.style.display = 'none';
                    // Re-draw charts
                    chartInstances.forEach(chart => chart && chart.dispose());
                    chartInstances.length = 0;
                    drawCharts(res);
                });
            } else {
                modal.style.display = 'flex';
                modal.querySelector('h3').innerText = t('settingsTitle');
                modal.querySelector('#cf-settings-cancel').innerText = t('settingsCancel');
                modal.querySelector('#cf-settings-save').innerText = t('settingsSave');
                populateList(document.getElementById('cf-settings-list'));
            }
        });

        // 分享截图逻辑 (带用户名注入与图例数据展示)
        document.getElementById('cf-share-btn').addEventListener('click', async () => {
            const btn = document.getElementById('cf-share-btn');
            const originalText = btn.innerText;
            btn.innerText = t('generating');
            btn.disabled = true;
            btn.style.opacity = '0.7';

            try {
                const wrapper = document.getElementById('cf-analytics-wrapper');
                const handle = window.location.pathname.split('/').pop();

                // 隐藏按钮
                const headerBtns = wrapper.querySelector('div[style*="gap: 10px"]');
                if (headerBtns) headerBtns.style.display = 'none';

                // 修改标题加入用户名
                const titleEl = wrapper.querySelector('h2');
                const originalTitle = titleEl.innerText;
                titleEl.innerText = `${originalTitle} @${handle}`;

                // 强制宽度
                const originalWidth = wrapper.style.width;
                const originalMaxWidth = wrapper.style.maxWidth;
                wrapper.style.width = '1200px';
                wrapper.style.maxWidth = '1200px';

                // 为截图修改图表样式：将数值放入图例
                chartInstances.forEach(chart => {
                    if (chart) {
                        const option = chart.getOption();
                        if (option.series && option.series[0] && option.series[0].type === 'pie') {
                            const data = option.series[0].data;
                            chart.setOption({
                                legend: {
                                    // 自定义图例文字，格式：名字: 数量
                                    formatter: function (name) {
                                        const item = data.find(d => d.name === name);
                                        return item ? `${name}: ${item.value}` : name;
                                    },
                                    textStyle: {
                                        width: 150, // 稍微拉宽防止数字被省略号截断
                                        overflow: 'truncate'
                                    }
                                },
                                series: [{ label: { show: false } }] // 确保外面的蜘蛛网线关闭
                            });
                        }
                        chart.resize();
                    }
                });

                await new Promise(r => setTimeout(r, 800));

                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 1200
                });

                // 恢复原状
                wrapper.style.width = originalWidth;
                wrapper.style.maxWidth = originalMaxWidth;
                titleEl.innerText = originalTitle;
                if (headerBtns) headerBtns.style.display = 'flex';

                chartInstances.forEach(chart => {
                    if (chart) {
                        const option = chart.getOption();
                        if (option.series && option.series[0] && option.series[0].type === 'pie') {
                            chart.setOption({
                                legend: {
                                    formatter: '{name}', // 恢复默认图例只显示名字
                                    textStyle: { width: 100, overflow: 'truncate' }
                                }
                            });
                        }
                        chart.resize();
                    }
                });

                // 触发下载
                const imgData = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = imgData;
                a.download = `CF_Stats_${handle}.png`;
                a.click();

            } catch (err) {
                console.error(t('genErrorConsole'), err);
                alert(t('genErrorAlert'));
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        });
    };

    const createChartContainer = (id, widthStr = '48%') => {
        const isMobile = window.innerWidth < 800;
        const finalWidth = isMobile ? '100%' : widthStr;
        const div = `<div class="roundbox userActivityRoundBox borderTopRound borderBottomRound" id="${id}" style="width: ${finalWidth}; height:400px; padding:2em 1em 0 1em; box-sizing: border-box;"></div>`;
        document.getElementById('cf-analytics-dashboard').insertAdjacentHTML('beforeend', div);
        return document.getElementById(id);
    };

    // --- 图表渲染主逻辑 ---
    async function drawCharts(res) {
        initDashboardContainer(res);

        const yieldToMain = () => new Promise(r => setTimeout(r, 0));

        if (isChartEnabled('timelineChart')) {
            updateProgress(t('loadingDraw', { chart: t('timeline') }), 1);
            await yieldToMain();
            drawTimelineChart('timelineChart', t('timeline'), res.timeline, '100%');
        }
        
        if (isChartEnabled('ratingChart')) {
            updateProgress(t('loadingDraw', { chart: t('ratings') }), 1);
            await yieldToMain();
            drawBarChart('ratingChart', t('ratings'), res.rating, '100%');
        }

        const localizedAttempts = {};
        for (const [key, value] of Object.entries(res.attempts)) {
            localizedAttempts[t(key)] = value;
        }

        if (isChartEnabled('tagsChart')) {
            updateProgress(t('loadingDraw', { chart: t('tags') }), 1);
            await yieldToMain();
            drawPieChart('tagsChart', t('tags'), res.tags);
        }
        
        if (isChartEnabled('langChart')) {
            updateProgress(t('loadingDraw', { chart: t('lang') }), 1);
            await yieldToMain();
            drawPieChart('langChart', t('lang'), res.lang);
        }
        
        if (isChartEnabled('verdictChart')) {
            updateProgress(t('loadingDraw', { chart: t('verdict') }), 1);
            await yieldToMain();
            drawPieChart('verdictChart', t('verdict'), res.verdicts);
        }
        
        if (isChartEnabled('attemptsChart')) {
            updateProgress(t('loadingDraw', { chart: t('attempts') }), 1);
            await yieldToMain();
            drawPieChart('attemptsChart', t('attempts'), localizedAttempts);
        }
        
        if (isChartEnabled('participantChart')) {
            updateProgress(t('loadingDraw', { chart: t('participant') }), 1);
            await yieldToMain();
            drawPieChart('participantChart', t('participant'), res.participantType);
        }
        
        if (isChartEnabled('performanceChart')) {
            updateProgress(t('loadingDraw', { chart: t('performance') }), 1);
            await yieldToMain();
            drawScatterChart('performanceChart', t('performance'), res.performance, 'time');
        }
        
        if (isChartEnabled('memoryChart')) {
            updateProgress(t('loadingDraw', { chart: t('memoryPerf') }), 1);
            await yieldToMain();
            drawScatterChart('memoryChart', t('memoryPerf'), res.memoryPerformance, 'memory');
        }
        
        if (isChartEnabled('speedChart')) {
            updateProgress(t('loadingDraw', { chart: t('speed') }), 1);
            await yieldToMain();
            drawSpeedChart('speedChart', t('speed'), res.speedAnalysis, '49%');
        }
        
        if (isChartEnabled('maChart')) {
            updateProgress(t('loadingDraw', { chart: t('maRating') }), 1);
            await yieldToMain();
            drawMACurveChart('maChart', t('maRating'), res.movingAverage, '100%');
        }
        
        if (isChartEnabled('timeOfDayChart')) {
            updateProgress(t('loadingDraw', { chart: t('timeOfDay') }), 1);
            await yieldToMain();
            drawTimeOfDayChart('timeOfDayChart', t('timeOfDay'), res.timeOfDay, '100%');
        }
        
        if (isChartEnabled('weaknessChart')) {
            updateProgress(t('loadingDraw', { chart: t('weakness') }), 1);
            await yieldToMain();
            drawTagWeaknessChart('weaknessChart', t('weakness'), res.tagAttemptsAvg, '100%');
        }
        
        if (isChartEnabled('langDiffChart')) {
            updateProgress(t('loadingDraw', { chart: t('langDiff') }), 1);
            await yieldToMain();
            drawBarChart('langDiffChart', t('langDiff'), res.langDifficulty, '49%');
        }
        
        const localizedErrorDiag = {};
        for (const [key, value] of Object.entries(res.errorDiagnosis)) {
            localizedErrorDiag[t(key)] = value;
        }
        
        if (isChartEnabled('errorDiagChart')) {
            updateProgress(t('loadingDraw', { chart: t('errorDiag') }), 1);
            await yieldToMain();
            drawPieChart('errorDiagChart', t('errorDiag'), localizedErrorDiag);
        }

        updateProgress(t('loadingDraw', { chart: currentLang === 'zh' ? '统计摘要' : 'Statistics Summary' }), 1);
        await yieldToMain();
        drawStatsSummary(res.stats);
        
        if (isChartEnabled('unsolvedChart')) {
            updateProgress(t('loadingDraw', { chart: t('unsolved', { n: res.unsolved.length }) }), 1);
            await yieldToMain();
            drawUnsolvedChart(res.unsolved);
        }
    }

    // --- 全局高级配置 (Premium Configurations) ---
    const premiumColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
    const getPremiumTooltip = () => {
        if (userSettings.liteMode) {
            return {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#ccc',
                borderWidth: 1,
                padding: [10, 15],
                textStyle: { color: '#333' },
                extraCssText: 'border-radius: 8px;'
            };
        }
        return {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: [10, 15],
            textStyle: { color: '#333' },
            extraCssText: 'box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 12px;'
        };
    };
    const premiumGrid = { left: '3%', right: '4%', bottom: '3%', containLabel: true };

    // --- 具体图表绘制函数 ---
    function drawBarChart(id, titleText, dataObj, width) {
        if (Object.keys(dataObj).length === 0) return;
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const xData = Object.keys(dataObj).sort((a, b) => a - b);
        const yData = xData.map(key => dataObj[key]);

        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.05)' } } },
            grid: premiumGrid,
            xAxis: [{ type: 'category', data: xData, axisTick: { alignWithLabel: true }, splitLine: { show: false } }],
            yAxis: [{ type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } }],
            series: [{
                name: 'Solved', type: 'bar', barWidth: '60%',
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: function(params) {
                        const baseColor = getRatingColor(Number(xData[params.dataIndex]));
                        if (userSettings.liteMode) return baseColor;
                        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: baseColor },
                            { offset: 1, color: '#ffffff' }
                        ]);
                    }
                },
                data: yData
            }]
        });
    }

    function drawPieChart(id, titleText, dataObj) {
        if (Object.keys(dataObj).length === 0) return;
        const chartDom = createChartContainer(id, '49%');
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const dataArr = Object.entries(dataObj)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
            
        const totalValue = dataArr.reduce((sum, item) => sum + item.value, 0);

        // Explicitly hide labels and lines for small slices to prevent spiderweb effect
        dataArr.forEach(item => {
            const percent = (item.value / totalValue) * 100;
            if (percent < 4) {
                item.label = { show: false };
                item.labelLine = { show: false };
            } else {
                let shortName = item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name;
                item.label = {
                    formatter: `${shortName}\n${item.value} (${percent.toFixed(1)}%)`
                };
            }
        });

        myChart.setOption({
            animation: false,
            color: premiumColors,
            title: [
                { 
                    text: titleText, left: 'center', top: 10, 
                    textStyle: { fontSize: 14, fontWeight: '600', color: '#333' } 
                },
                {
                    text: totalValue.toString(),
                    subtext: currentLang === 'zh' ? '总计' : 'Total',
                    left: 'center',
                    top: '47%',
                    textAlign: 'center',
                    textStyle: { fontSize: 24, fontWeight: 'bold', color: '#0073e6', lineHeight: 28 },
                    subtextStyle: { fontSize: 12, color: '#999', lineHeight: 14 }
                }
            ],
            tooltip: { ...getPremiumTooltip(), trigger: 'item', formatter: '{b} : {c} ({d}%)' },
            legend: {
                type: 'scroll', orient: 'horizontal', bottom: 10, left: 'center', width: '90%',
                icon: 'circle', itemWidth: 10, itemHeight: 10, itemGap: 15,
                textStyle: { fontSize: 11, color: '#666' },
                tooltip: { show: true }
            },
            series: [{
                type: 'pie', 
                radius: ['35%', '50%'], 
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: { 
                    borderRadius: 8, 
                    borderColor: '#fff', 
                    borderWidth: 2,
                    shadowBlur: userSettings.liteMode ? 0 : 8,
                    shadowColor: 'rgba(0, 0, 0, 0.15)',
                    shadowOffsetY: userSettings.liteMode ? 0 : 3
                },
                label: { 
                    show: true, 
                    color: '#555',
                    fontSize: 11,
                    fontWeight: '500',
                    lineHeight: 14
                },
                labelLine: { 
                    show: true,
                    smooth: 0.2,
                    length: 10,
                    length2: 12,
                    lineStyle: {
                        width: 1.2,
                        opacity: 0.8
                    }
                },
                data: dataArr,
                emphasis: {
                    label: { 
                        show: true, 
                        fontSize: 12, 
                        fontWeight: 'bold' 
                    },
                    itemStyle: { 
                        shadowBlur: 20, 
                        shadowOffsetX: 0, 
                        shadowOffsetY: 8, 
                        shadowColor: 'rgba(0, 0, 0, 0.3)' 
                    }
                }
            }]
        });
    }

    function drawTimelineChart(id, titleText, dataObj, width) {
        if (Object.keys(dataObj).length === 0) return;
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const xData = Object.keys(dataObj).sort();
        const yData = xData.map(key => dataObj[key]);

        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis' },
            grid: premiumGrid,
            xAxis: { type: 'category', boundaryGap: false, data: xData, splitLine: { show: false } },
            yAxis: { type: 'value', name: t('submissions'), splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
            series: [{
                name: t('submissions'), type: 'line', smooth: 0.4,
                areaStyle: {
                    color: userSettings.liteMode ? 'rgba(0, 115, 230, 0.1)' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(0, 115, 230, 0.4)' },
                        { offset: 1, color: 'rgba(0, 115, 230, 0.0)' }
                    ])
                },
                lineStyle: { 
                    color: '#0073e6', 
                    width: 3, 
                    shadowColor: 'rgba(0,115,230,0.3)', 
                    shadowBlur: userSettings.liteMode ? 0 : 10 
                },
                itemStyle: { color: '#0073e6' },
                data: yData
            }]
        });
    }

    function drawScatterChart(id, titleText, dataArr, metric) {
        if (dataArr.length === 0) return;
        const chartDom = createChartContainer(id, '49%');
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const isMemory = metric === 'memory';
        const axisName = isMemory ? t('memory') : t('time');
        const colorBase = isMemory ? '40, 167, 69' : '0, 115, 230';
        
        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontSize: 14, fontWeight: '600' } },
            grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
            tooltip: {
                ...getPremiumTooltip(),
                formatter: function (param) {
                    const data = param.data;
                    return `<div style="font-weight:bold;">${data[2]}</div>${axisName}: ${data[0]}<br/>${t('rating')}: ${data[1]}`;
                }
            },
            xAxis: { type: 'value', name: axisName, splitLine: { show: false } },
            yAxis: { type: 'value', name: t('rating'), splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            series: [{ 
                symbolSize: 8, 
                data: dataArr, 
                type: 'scatter', 
                itemStyle: { 
                    color: `rgba(${colorBase}, 0.7)`,
                    shadowBlur: userSettings.liteMode ? 0 : 5,
                    shadowColor: `rgba(${colorBase}, 0.5)`
                } 
            }]
        });
    }

    function drawSpeedChart(id, titleText, speedData, width) {
        if (!speedData || speedData.length === 0) return;
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const categories = ['0-10min', '10-30min', '30-60min', '1-2h', '2-4h', '>4h'];
        const values = categories.map(cat => speedData[cat] || 0);

        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontSize: 14, fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: premiumGrid,
            xAxis: { type: 'category', data: categories, axisTick: { alignWithLabel: true }, splitLine: { show: false } },
            yAxis: { type: 'value', name: t('submissions'), splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            series: [{
                name: t('submissions'),
                type: 'bar',
                data: values,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: userSettings.liteMode ? '#188df0' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#83bff6' },
                        { offset: 0.5, color: '#188df0' },
                        { offset: 1, color: '#188df0' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: userSettings.liteMode ? '#2378f7' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#2378f7' },
                            { offset: 0.7, color: '#2378f7' },
                            { offset: 1, color: '#83bff6' }
                        ])
                    }
                }
            }]
        });
    }

    function drawMACurveChart(id, titleText, dataArr, width) {
        if (dataArr.length === 0) return;
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontSize: 14, fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis' },
            grid: premiumGrid,
            xAxis: { type: 'category', boundaryGap: false, data: dataArr.map(d => d[0]), splitLine: { show: false } },
            yAxis: { type: 'value', min: 'dataMin', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { start: 0, end: 100 }],
            series: [{
                name: 'Avg Rating',
                type: 'line',
                smooth: 0.4,
                symbol: 'none',
                areaStyle: {
                    color: userSettings.liteMode ? 'rgba(219, 112, 147, 0.15)' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(219, 112, 147, 0.6)' },
                        { offset: 1, color: 'rgba(219, 112, 147, 0.05)' }
                    ])
                },
                lineStyle: { 
                    color: '#db7093', 
                    width: 3, 
                    shadowBlur: userSettings.liteMode ? 0 : 10, 
                    shadowColor: 'rgba(219, 112, 147, 0.4)' 
                },
                data: dataArr.map(d => d[1])
            }]
        });
    }

    function drawTimeOfDayChart(id, titleText, timeArr, width) {
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const xData = Array.from({length: 24}, (_, i) => i + ':00');
        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontSize: 14, fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: premiumGrid,
            xAxis: { type: 'category', data: xData, axisTick: { alignWithLabel: true }, splitLine: { show: false } },
            yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            series: [{
                name: 'Submissions',
                type: 'bar',
                data: timeArr,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: userSettings.liteMode ? '#4facfe' : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#4facfe' },
                        { offset: 1, color: '#00f2fe' }
                    ])
                }
            }]
        });
    }

    function drawTagWeaknessChart(id, titleText, tagData, width) {
        if (Object.keys(tagData).length === 0) return;
        const chartDom = createChartContainer(id, width);
        const myChart = echarts.init(chartDom);
        chartInstances.push(myChart);

        const dataArr = Object.entries(tagData)
            .sort((a, b) => a[1] - b[1]);

        const yData = dataArr.map(d => d[0]);
        const xData = dataArr.map(d => d[1].toFixed(1));

        myChart.setOption({
            animation: false,
            title: { text: titleText, left: 'center', textStyle: { fontSize: 14, fontWeight: '600' } },
            tooltip: { ...getPremiumTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', name: 'Avg Tries', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
            yAxis: { type: 'category', data: yData, axisLabel: { width: 100, overflow: 'truncate' }, splitLine: { show: false } },
            dataZoom: [{ type: 'slider', yAxisIndex: 0, start: Math.max(0, 100 - (15 / yData.length * 100)), end: 100 }],
            series: [{
                name: 'Avg Tries',
                type: 'bar',
                data: xData,
                itemStyle: {
                    borderRadius: [0, 6, 6, 0],
                    color: userSettings.liteMode ? '#ff758c' : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                        { offset: 0, color: '#ff758c' },
                        { offset: 1, color: '#ff7eb3' }
                    ])
                },
                label: { show: true, position: 'right', fontWeight: 'bold' }
            }]
        });
    }

    function drawStatsSummary(stats) {
        if (!stats) return;
        
        const div = `
            <div class="roundbox userActivityRoundBox borderTopRound borderBottomRound" style="width: 100%; padding: 1.5em; margin-top: 1em; box-sizing: border-box;">
                <h4 style="font-size: 1.2em; color: #333; font-weight: bold; margin-bottom: 1em;">📊 ${currentLang === 'zh' ? '统计摘要' : 'Statistics Summary'}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #0073e6; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${currentLang === 'zh' ? '总提交数' : 'Total Submissions'}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #0073e6;">${stats.totalSubmissions || 0}</div>
                    </div>
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #28a745; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${currentLang === 'zh' ? '已解决题目' : 'Solved Problems'}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #28a745;">${stats.solvedProblems || 0}</div>
                    </div>
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #ffc107; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${t('streak')}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #ffc107;">${stats.maxStreak || 0} <span style="font-size:0.6em">${t('days')}</span></div>
                    </div>
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #dc3545; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${t('points')}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #dc3545;">${stats.totalPoints || 0}</div>
                    </div>
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #6f42c1; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${currentLang === 'zh' ? 'AC率' : 'AC Rate'}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #6f42c1;">${stats.acRate ? stats.acRate.toFixed(1) + '%' : '0%'}</div>
                    </div>
                    <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid #fd7e14; transition: all 0.3s; cursor: default;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                        <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${currentLang === 'zh' ? '最高难度' : 'Highest Rating'}</div>
                        <div style="font-size: 1.8em; font-weight: bold; color: #fd7e14;">${stats.highestRating || '-'}</div>
                    </div>
                </div>
            </div>`;
        document.getElementById('cf-analytics-dashboard').insertAdjacentHTML('beforeend', div);
    }

    function drawUnsolvedChart(unsolvedData) {
        const unsolvedKeys = Object.keys(unsolvedData);
        if (unsolvedKeys.length === 0) return;

        const div = `
            <div class="roundbox userActivityRoundBox borderTopRound borderBottomRound" style="width: 100%; padding: 1.5em; margin-top: 1em; box-sizing: border-box;">
                <h4 style="font-size: 1.2em; color: #333; font-weight: bold; margin-bottom: 0.8em;">🔥 ${t('unsolved', { n: unsolvedKeys.length })}</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${Object.entries(unsolvedData).map(([id, info]) => {
                        const baseUrl = info.contestId < 10000
                            ? `https://codeforces.com/problemset/problem/${info.contestId}/${info.problemIndex}`
                            : `https://codeforces.com/problemset/gymProblem/${info.contestId}/${info.problemIndex}`;
                        return `<a href="${baseUrl}" target="_blank" style="text-decoration: none; color: #d9534f; background: #fff0f0; padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(217,83,79,0.3); font-size: 0.85em; transition: all 0.2s; box-shadow: 0 2px 5px rgba(217,83,79,0.05);" onmouseover="this.style.background='#d9534f'; this.style.color='#fff';" onmouseout="this.style.background='#fff0f0'; this.style.color='#d9534f';">${id}</a>`;
                    }).join('')}
                </div>
            </div>`;
        document.getElementById('cf-analytics-dashboard').insertAdjacentHTML('beforeend', div);
    }

    // --- 数据处理逻辑 ---
    function processSubmissions(submissions) {
        submissions.sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);

        const res = { 
            rating: {}, 
            tags: {}, 
            lang: {}, 
            unsolved: {}, 
            verdicts: {}, 
            participantType: {}, 
            attempts: {}, 
            timeline: {}, 
            performance: [],
            memoryPerformance: [],
            speedAnalysis: {},
            movingAverage: [],
            tagAttemptsAvg: {},
            timeOfDay: new Array(24).fill(0),
            errorDiagnosis: {},
            langDifficulty: {},
            stats: {
                totalSubmissions: 0,
                solvedProblems: 0,
                maxStreak: 0,
                totalPoints: 0,
                acRate: 0,
                highestRating: 0
            }
        };
        const acRatingsTimeline = [];
        const tagTriesAgg = {};
        const langRatingAgg = {};
        const problemState = new Map();
        const solvedProblems = new Map();
        const dailySubmissions = new Map();
        let totalAC = 0;
        let totalSubmissions = submissions.length;

        submissions.forEach(sub => {
            const problem = sub.problem;
            if (!problem || !problem.contestId) return;
            const problemId = `${problem.contestId}${problem.index}`;

            // Count total submissions
            res.stats.totalSubmissions++;

            let v = sub.verdict;
            if (v) {
                if (v === 'WRONG_ANSWER') v = 'WA';
                else if (v === 'TIME_LIMIT_EXCEEDED') v = 'TLE';
                else if (v === 'MEMORY_LIMIT_EXCEEDED') v = 'MLE';
                else if (v === 'COMPILATION_ERROR') v = 'CE';
                else if (v === 'RUNTIME_ERROR') v = 'RE';
                else if (v === 'OK') {
                    v = 'AC';
                    totalAC++;
                }
                else if (v === 'PASSED_PRETESTS') v = 'Pretest OK';
                res.verdicts[v] = (res.verdicts[v] || 0) + 1;
            }

            if (sub.author && sub.author.participantType) {
                res.participantType[sub.author.participantType] = (res.participantType[sub.author.participantType] || 0) + 1;
            }

            // Timeline data (monthly)
            const date = new Date(sub.creationTimeSeconds * 1000);
            const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            res.timeline[monthStr] = (res.timeline[monthStr] || 0) + 1;
            
            // Time of day
            res.timeOfDay[date.getHours()]++;
            
            // Error diagnosis
            if (sub.verdict === 'WRONG_ANSWER' || sub.verdict === 'TIME_LIMIT_EXCEEDED') {
                const passed = sub.passedTestCount || 0;
                let bucket = 'test1_2';
                if (passed >= 2 && passed < 10) bucket = 'test3_10';
                else if (passed >= 10 && passed < 50) bucket = 'test11_50';
                else if (passed >= 50) bucket = 'test50plus';
                res.errorDiagnosis[bucket] = (res.errorDiagnosis[bucket] || 0) + 1;
            }

            // Contest speed analysis
            if (sub.relativeTimeSeconds && sub.relativeTimeSeconds < 2147483647) {
                const minutes = sub.relativeTimeSeconds / 60;
                let speedCategory;
                if (minutes <= 10) speedCategory = '0-10min';
                else if (minutes <= 30) speedCategory = '10-30min';
                else if (minutes <= 60) speedCategory = '30-60min';
                else if (minutes <= 120) speedCategory = '1-2h';
                else if (minutes <= 240) speedCategory = '2-4h';
                else speedCategory = '>4h';
                res.speedAnalysis[speedCategory] = (res.speedAnalysis[speedCategory] || 0) + 1;
            }

            if (!problemState.has(problemId)) problemState.set(problemId, { ac: false, tries: 0 });
            const pState = problemState.get(problemId);

            if (!pState.ac) {
                pState.tries++;
                if (sub.verdict === 'OK') {
                    pState.ac = true;
                    let tryKey = pState.tries === 1 ? 'try1' : pState.tries === 2 ? 'try2' : pState.tries <= 5 ? 'try3_5' : 'tryMore';
                    res.attempts[tryKey] = (res.attempts[tryKey] || 0) + 1;

                    // Performance data
                    if (problem.rating && sub.timeConsumedMillis !== undefined) {
                        res.performance.push([sub.timeConsumedMillis, problem.rating, problem.name]);
                    }
                    
                    // Memory performance data
                    if (problem.rating && sub.memoryConsumedBytes !== undefined) {
                        const memoryKB = Math.round(sub.memoryConsumedBytes / 1024);
                        res.memoryPerformance.push([memoryKB, problem.rating, problem.name]);
                    }

                    // Points tracking
                    if (problem.points) {
                        res.stats.totalPoints += problem.points;
                    }

                    // Track highest rating
                    if (problem.rating && problem.rating > res.stats.highestRating) {
                        res.stats.highestRating = problem.rating;
                    }
                    
                    // Moving Average
                    if (problem.rating) {
                        acRatingsTimeline.push({ date: date, rating: problem.rating });
                    }
                    
                    // Tag weakness analysis
                    if (problem.tags) {
                        problem.tags.forEach(tag => {
                            if (!tagTriesAgg[tag]) tagTriesAgg[tag] = { tries: 0, ac: 0 };
                            tagTriesAgg[tag].tries += pState.tries;
                            tagTriesAgg[tag].ac += 1;
                        });
                    }
                    
                    // Language difficulty
                    if (problem.rating && sub.programmingLanguage) {
                        if (!langRatingAgg[sub.programmingLanguage]) langRatingAgg[sub.programmingLanguage] = { sum: 0, count: 0 };
                        langRatingAgg[sub.programmingLanguage].sum += problem.rating;
                        langRatingAgg[sub.programmingLanguage].count += 1;
                    }

                    solvedProblems.set(problemId, sub);
                    if (res.unsolved[problemId]) delete res.unsolved[problemId];
                } else {
                    res.unsolved[problemId] = { contestId: problem.contestId, problemIndex: problem.index };
                }
            }
        });

        // Process solved problems
        solvedProblems.forEach(sub => {
            const { rating, tags } = sub.problem;
            const lang = sub.programmingLanguage;
            if (rating) res.rating[rating] = (res.rating[rating] || 0) + 1;
            if (lang) res.lang[lang] = (res.lang[lang] || 0) + 1;
            if (tags && tags.length > 0) tags.forEach(tag => { res.tags[tag] = (res.tags[tag] || 0) + 1; });
        });

        // Post-process new analytics
        const windowSize = 20;
        let sum = 0;
        for (let i = 0; i < acRatingsTimeline.length; i++) {
            sum += acRatingsTimeline[i].rating;
            if (i >= windowSize) {
                sum -= acRatingsTimeline[i - windowSize].rating;
            }
            const count = Math.min(i + 1, windowSize);
            const dateStr = acRatingsTimeline[i].date.toISOString().split('T')[0];
            res.movingAverage.push([dateStr, Math.round(sum / count)]);
        }
        
        for (const [tag, agg] of Object.entries(tagTriesAgg)) {
            if (agg.ac > 0) res.tagAttemptsAvg[tag] = agg.tries / agg.ac;
        }
        
        for (const [lang, agg] of Object.entries(langRatingAgg)) {
            if (agg.count > 0) {
                res.langDifficulty[lang] = Math.round(agg.sum / agg.count);
            }
        }

        // Calculate stats
        res.stats.solvedProblems = solvedProblems.size;
        res.stats.acRate = totalSubmissions > 0 ? (totalAC / totalSubmissions * 100) : 0;

        // Calculate max streak using monthly timeline data
        res.stats.maxStreak = calculateMaxStreakFromTimeline(res.timeline);

        return res;
    }

    function calculateMaxStreakFromTimeline(timelineData) {
        if (Object.keys(timelineData).length === 0) return 0;
        
        const months = Object.keys(timelineData).sort();
        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < months.length; i++) {
            const prevMonth = new Date(months[i - 1] + '-01');
            const currMonth = new Date(months[i] + '-01');
            
            // Check if months are consecutive
            const diffMonths = (currMonth.getFullYear() - prevMonth.getFullYear()) * 12 + 
                              (currMonth.getMonth() - prevMonth.getMonth());

            if (diffMonths === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    // --- 加载状态管理 ---
    let currentStep = 0;
    let totalSteps = 3;

    const showLoading = () => {
        hideLoading();
        
        const maskStyle = userSettings.liteMode 
            ? "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); z-index: 99999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"
            : "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 99999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;";
            
        const barTransition = userSettings.liteMode ? "none" : "width 0.2s ease";

        const html = `
            <div id="cf-loading-mask" style="${maskStyle}">
                <div style="background: rgba(255, 255, 255, 0.95); padding: 30px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); width: 360px; text-align: center; position: relative; border: 1px solid rgba(255, 255, 255, 0.3); display: flex; flex-direction: column; align-items: center;">
                    <div id="cf-loading-close" style="position: absolute; top: 15px; right: 20px; font-size: 24px; cursor: pointer; color: #aaa; font-weight: normal; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='#666'" onmouseout="this.style.color='#aaa'" title="Close">&times;</div>
                    
                    <div style="margin-bottom: 20px; position: relative; width: 60px; height: 60px;">
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 4px solid rgba(59, 130, 246, 0.1); border-top: 4px solid #3b82f6; border-radius: 50%; animation: cf-spin 1s linear infinite;"></div>
                        <div style="position: absolute; top: 12px; left: 12px; width: 36px; height: 36px; background: linear-gradient(135deg, #3b82f6, #6366f1); border-radius: 50%; display: flex; justify-content: center; align-items: center;">
                            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: white;">
                                <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M9,17H7v-7h2V17z M13,17h-2V7h2V17z M17,17h-2v-4h2V17z"/>
                            </svg>
                        </div>
                    </div>

                    <h3 id="cf-loading-title" style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Codeforces Analytics</h3>
                    
                    <div style="width: 100%; background: #f3f4f6; height: 8px; border-radius: 4px; overflow: hidden; margin: 15px 0; position: relative;">
                        <div id="cf-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1); transition: ${barTransition}; border-radius: 4px;"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 12px; color: #6b7280; font-weight: 500;">
                        <span id="cf-loading-text" style="max-width: 80%; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t('loading')}</span>
                        <span id="cf-progress-percent">0%</span>
                    </div>
                </div>
                <style>@keyframes cf-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('cf-loading-close').addEventListener('click', hideLoading);
        document.getElementById('cf-loading-mask').addEventListener('click', (e) => {
            if (e.target.id === 'cf-loading-mask') hideLoading();
        });
    };

    const updateProgress = (text, stepIncrement = 1) => {
        if (!document.getElementById('cf-loading-mask')) return;

        currentStep += stepIncrement;
        if (currentStep > totalSteps) currentStep = totalSteps;
        
        const percent = Math.round((currentStep / totalSteps) * 100);
        
        const barEl = document.getElementById('cf-progress-bar');
        const percentEl = document.getElementById('cf-progress-percent');
        const textEl = document.getElementById('cf-loading-text');
        
        if (barEl) barEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;
        if (textEl) textEl.textContent = text;
    };

    const hideLoading = () => {
        const el = document.getElementById('cf-loading-mask');
        if (el) el.remove();
    };

    // --- 主入口 ---
    async function init() {
        const pathname = window.location.pathname;
        const handle = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (!handle) return;

        // Calculate total steps dynamically
        const charts = [
            'timelineChart', 'ratingChart', 'tagsChart', 'langChart', 'verdictChart',
            'attemptsChart', 'participantChart', 'performanceChart', 'memoryChart',
            'speedChart', 'maChart', 'timeOfDayChart', 'weaknessChart', 'langDiffChart',
            'errorDiagChart', 'unsolvedChart'
        ];
        let enabledCount = 0;
        for (const chart of charts) {
            if (isChartEnabled(chart)) enabledCount++;
        }
        // totalSteps = 1 (fetch) + 1 (process) + enabledCount + 1 (statsSummary)
        totalSteps = 2 + enabledCount + 1;
        currentStep = 0;

        showLoading();
        updateProgress(t('loadingFetch'), 1);

        try {
            const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
            if (!response.ok) throw new Error('API Error');
            const json = await response.json();

            if (json.status === "OK") {
                updateProgress(t('loadingProcess'), 1);
                const processedData = processSubmissions(json.result);
                await drawCharts(processedData);
                updateProgress(t('loadingComplete'), 0);
            }
        } catch (err) {
            console.error("Failed to load CF Data:", err);
            alert(t('fetchError'));
        } finally {
            hideLoading();
        }
    }

    init();
})();