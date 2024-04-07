// ==UserScript==
// @name         生财有术航海实战证书获取-路人甲乙丙
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  问题反馈联系微信Byte4Me
// @author       路人甲乙丙
// @namespace    iblogc
// @match        https://scys.com/*
// @match        https://scys.com/mobile/activity/landing?activity_id=*
// @license      Apache License, Version 2.0
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 解码JWT Token
    function decodeJwt(token) {
        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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
    if(userToken !== null) {
        var userId = parseUserToken(userToken);
        if(userId !== null) {
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
            button.onclick = function() {
                // 获取当前页面中的id
                var urlParams = new URLSearchParams(window.location.search);
                var activityId = urlParams.get('id');
                // 如果activityId为null，则结束脚本运行，并弹出提示
                if(activityId === null) {
                    alert('请进入航海实战页面后再点击获取');
                    return;
                }
                console.log('当前页面中的activity_id为:', activityId);

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
                    onload: function(response) {
                        console.log('请求成功:', response.responseText);
                        // 解析响应数据
                        var responseData = JSON.parse(response.responseText);
                        var stageId = responseData.data.items[0].stage_id;
                        console.log('从响应数据中获取的stage_id为:', stageId);

                        // 构建获取图片的请求
                        var getImageURL = `https://scys.com/search/activity/project/submit/poster?id=${activityId}&number=${userId}&stage=${stageId}`;

                        // 发送获取图片的请求
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: getImageURL,
                            headers: {
                                'X-Token': userToken
                            },
                            onload: function(imageResponse) {
                                console.log('获取图片成功:', imageResponse.responseText);
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
                                overlay.onclick = function(event) {
                                    if (event.target === overlay) {
                                        document.body.removeChild(overlay);
                                    }
                                };

                                overlay.appendChild(img);
                                document.body.appendChild(overlay);
                            },
                            onerror: function(error) {
                                console.error('获取图片失败:', error);
                            }
                        });
                    },
                    onerror: function(error) {
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
