// ==UserScript==
// @name         生财有术航海实战证书获取-路人甲乙丙
// @namespace    iblogc
// @version      1.2
// @description  支持获取自己或其它人参与过的所有历史航海的每天证书（问题反馈联系微信Byte4Me）
// @author       路人甲乙丙
// @match        *://scys.com/*
// @license      Apache License, Version 2.0
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    // 解码JWT Token
    function decodeJwt(token) {
        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('JWT 解码失败:', e);
            return null;
        }
    }

    // 解析__user_token.v3值为JSON对象，并从中获取userid
    function parseUserToken(userToken) {
        try {
            // 使用jsonwebtoken库解码JWT
            var decodedToken = decodeJwt(userToken);
            // 从解码后的对象中获取userid
            var userId = decodedToken.number;
            return userId;
        } catch (error) {
            console.error('解析__user_token.v3时出错:', error);
            return null;
        }
    }

    // 获取__user_token.v3的值
    var userToken = localStorage.getItem('__user_token.v3');

    // 如果找到了值，则解析它并获取userid
    if (userToken !== null) {
        var userId = parseUserToken(userToken);
        if (userId !== null) {
            console.log('从__user_token.v3中获取的userid为:', userId);

            // 创建按钮触发请求
            var button = document.createElement('button');
            button.innerHTML = '👉 获取航海实战证书';
            button.style.position = 'fixed';
            button.style.bottom = '20px';
            button.style.right = '20px';
            button.style.padding = '10px 10px';
            button.style.backgroundColor = '#006659'; // 添加背景颜色
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            button.onclick = function () {
                // 获取当前页面中的id
                var urlParams = new URLSearchParams(window.location.search);
                var activityId = urlParams.get('id');
                if (activityId == null) {
                    activityId = urlParams.get('activity_id');
                }
                // 如果activityId为null，则结束脚本运行，并弹出提示
                if (activityId === null || !(window.location.href.startsWith('https://scys.com/mobile/activity/landing') || window.location.href.startsWith('https://scys.com/activity/landing'))) {
                    alert('请进入航海实战页面后再点击获取');
                    return;
                }
                console.log('当前页面中的activity_id为:', activityId);

                // 用户输入 userid
                var inputUserId = prompt('请输入生财编号（默认为当前登录用户生财编号）:', userId);
                if (inputUserId === null) {
                    return; // 用户取消输入
                }
                var userIdToUse = inputUserId.trim() || userId; // 使用用户输入的 userId，如果为空则使用解析出的 userId

                // 构造请求体
                var requestBody = {
                    form: {
                        activity_id: activityId
                    },
                    page: 1,
                    perPage: 10
                };

                // 构造请求
                var requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Token': userToken
                    },
                    data: JSON.stringify(requestBody)
                };

                // 定义请求的URL
                var requestURL = 'https://scys.com/search/activity/stage/ajax/search';

                // 发送请求
                GM_xmlhttpRequest({
                    method: requestOptions.method,
                    url: requestURL,
                    headers: requestOptions.headers,
                    data: requestOptions.data,
                    onload: function (response) {
                        console.log('请求成功:', response.responseText);
                        // 解析响应数据
                        var responseData = JSON.parse(response.responseText);
                        var stageId = responseData.data.items[0].stage_id;
                        console.log('从响应数据中获取的stage_id为:', stageId);

                        // 构建获取图片的请求
                        var getImageURL = `https://scys.com/search/activity/project/submit/poster?id=${activityId}&number=${userIdToUse}&stage=${stageId}`;

                        // 发送获取图片的请求
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: getImageURL,
                            headers: {
                                'X-Token': userToken
                            },
                            onload: function (imageResponse) {
                                console.log('获取图片结果:', imageResponse.responseText);
                                var imageData = JSON.parse(imageResponse.responseText).data;
                                if (imageData == null) {
                                    alert('获取数据异常，请检查输入的生财编号是否正确，或确认此编号是否有参加此航海。');
                                    return;
                                }
                                // 解析获取到的图片 URL
                                var imageURL = JSON.parse(imageResponse.responseText).data.poster;

                                // 创建图片展示蒙版
                                var overlay = document.createElement('div');
                                overlay.style.position = 'fixed';
                                overlay.style.top = '0';
                                overlay.style.left = '0';
                                overlay.style.width = '100%';
                                overlay.style.height = '100%';
                                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                overlay.style.zIndex = '9999';

                                // 创建图片
                                var img = document.createElement('img');
                                img.src = imageURL;
                                img.style.position = 'absolute';
                                img.style.top = '50%';
                                img.style.left = '50%';
                                img.style.transform = 'translate(-50%, -50%)';
                                img.style.maxWidth = '30%'; // 设置图片显示小一些

                                // 点击图片以外区域关闭图片展示
                                overlay.onclick = function (event) {
                                    if (event.target === overlay) {
                                        document.body.removeChild(overlay);
                                        document.body.removeChild(getCertButton);
                                        dayButtons.forEach(btn => document.body.removeChild(btn));
                                    }
                                };

                                overlay.appendChild(img);
                                document.body.appendChild(overlay);

                                // 创建获取逐天证书按钮
                                var getCertButton = document.createElement('button');
                                getCertButton.innerHTML = '🚀 获取逐天证书';
                                getCertButton.style.position = 'fixed';
                                getCertButton.style.bottom = '60px';
                                getCertButton.style.right = '20px';
                                getCertButton.style.padding = '10px 10px';
                                getCertButton.style.backgroundColor = '#006659'; // 添加背景颜色
                                getCertButton.style.color = '#fff';
                                getCertButton.style.border = 'none';
                                getCertButton.style.borderRadius = '5px';
                                getCertButton.style.cursor = 'pointer';
                                getCertButton.onclick = function () {
                                    // 发送获取逐天证书请求
                                    GM_xmlhttpRequest({
                                        method: 'GET',
                                        url: `https://scys.com/search/activity/stage?activity_id=${activityId}`,
                                        headers: {
                                            'X-Token': userToken
                                        },
                                        onload: function (certResponse) {
                                            console.log('获取逐天证书结果:', certResponse.responseText);
                                            var days = []
                                            var stageIds = []
                                            // 当前用户没有参与此航海，所以要取前面获取到的stageId，当前此航海最后的stageId值
                                            if (JSON.parse(certResponse.responseText).data == null) {
                                                for (let i = 1; i <= 21; i++) {
                                                    days.push(stageId + i - 21);
                                                }
                                            } else {
                                                // 取出数据并将数组倒序排列
                                                stageIds = JSON.parse(certResponse.responseText).data.project;
                                                for (let i = 0; i < 21; i++) {
                                                    days.push(stageIds[0] + i);
                                                }
                                            }
                                            // 创建第x天按钮
                                            var dayButtons = [];
                                            // 倒序循环
                                            var daKaIndex = 0
                                            days.slice().reverse().forEach((stageId, index) => {
                                                var dayButton = document.createElement('button');
                                                dayButton.innerHTML = `第${days.length - index}天`;
                                                dayButton.style.position = 'fixed';
                                                dayButton.style.bottom = `${70 + 30 * (index + 1)}px`;
                                                dayButton.style.right = '20px';
                                                dayButton.style.padding = '5px 10px';
                                                dayButton.style.backgroundColor = '#006659'; // 添加背景颜色
                                                dayButton.style.color = '#fff';
                                                dayButton.style.border = 'none';
                                                dayButton.style.borderRadius = '5px';
                                                dayButton.style.cursor = 'pointer';
                                                if (stageIds.includes(stageId)) {
                                                    var score = ' (' + (stageIds.length - daKaIndex++) + '/21)'
                                                    dayButton.textContent += score
                                                }
                                                dayButton.onclick = function () {
                                                    // 发送获取图片的请求
                                                    GM_xmlhttpRequest({
                                                        method: 'GET',
                                                        url: `https://scys.com/search/activity/project/submit/poster?id=${activityId}&number=${userIdToUse}&stage=${stageId}`,
                                                        headers: {
                                                            'X-Token': userToken
                                                        },
                                                        onload: function (dayImageResponse) {
                                                            console.log('获取第', days.length - index, '天图片成功:', dayImageResponse.responseText);
                                                            var dayImageURL = JSON.parse(dayImageResponse.responseText).data.poster;

                                                            // 创建图片展示蒙版
                                                            var dayOverlay = document.createElement('div');
                                                            dayOverlay.style.position = 'fixed';
                                                            dayOverlay.style.top = '0';
                                                            dayOverlay.style.left = '0';
                                                            dayOverlay.style.width = '100%';
                                                            dayOverlay.style.height = '100%';
                                                            dayOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                                                            dayOverlay.style.zIndex = '9999';

                                                            // 创建图片
                                                            var dayImg = document.createElement('img');
                                                            dayImg.src = dayImageURL;
                                                            dayImg.style.position = 'absolute';
                                                            dayImg.style.top = '50%';
                                                            dayImg.style.left = '50%';
                                                            dayImg.style.transform = 'translate(-50%, -50%)';
                                                            dayImg.style.maxWidth = '30%'; // 设置图片显示小一些

                                                            // 点击图片以外区域关闭图片展示
                                                            dayOverlay.onclick = function (event) {
                                                                if (event.target === dayOverlay) {
                                                                    overlay.removeChild(dayOverlay);
                                                                }
                                                            };

                                                            dayOverlay.appendChild(dayImg);
                                                            // document.body.appendChild(dayOverlay);
                                                            overlay.appendChild(dayOverlay);
                                                            document.body.appendChild(overlay);
                                                        },
                                                        onerror: function (error) {
                                                            console.error('获取第', index + 1, '天图片失败:', error);
                                                        }
                                                    });
                                                };
                                                dayButtons.push(dayButton);
                                                // document.body.appendChild(dayButton);
                                                overlay.appendChild(dayButton);
                                                document.body.appendChild(overlay);
                                            });
                                        },
                                        onerror: function (error) {
                                            console.error('获取逐天证书失败:', error);
                                        }
                                    });
                                };

                                overlay.appendChild(img);
                                overlay.appendChild(getCertButton);
                                document.body.appendChild(overlay);
                                // document.body.appendChild(getCertButton);
                            },
                            onerror: function (error) {
                                console.error('获取图片失败:', error);
                            }
                        });
                    },
                    onerror: function (error) {
                        console.error('请求失败:', error);
                    }
                });
            };

            // 将按钮添加到页面中
            document.body.appendChild(button);

        } else {
            console.log('无法解析userid，__user_token.v3的值可能不是有效的JWT');
        }
    } else {
        console.log('__user_token.v3 的值不存在');
    }

})();
