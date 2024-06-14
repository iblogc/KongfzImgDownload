// ==UserScript==
// @name         beta-孔夫子旧书网图片下载（自动去水印）-路人甲乙丙
// @description  何以生财，唯有实战。（问题反馈联系微信Byte4Me）
// @version      3.4
// @author       路人甲乙丙
// @namespace    iblogc
// @match        *://search.kongfz.com/*
// @match        *://book.kongfz.com/*
// @match        *://item.kongfz.com/book/*
// @match        *://book.kongfz.com/C*
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @license      Apache License, Version 2.0
// @homepage     https://github.com/iblogc/TampermonkeyScript/blob/main/kongfzImageDownload.js
// ==/UserScript==

(function () {
    'use strict';

    const currentPath = window.location.href;

    const STORAGE_KEY = 'downloadCount';
    const DONATION_POPUP_SHOWN_KEY = 'donationPopupShown';
    const FIRST_EXECUTION_KEY = 'firstExecutionv34';
    let downloadCount = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;
    let donationPopupShown = localStorage.getItem(DONATION_POPUP_SHOWN_KEY) === 'true';
    let firstExecution = localStorage.getItem(FIRST_EXECUTION_KEY) === 'true';

    function updateDownloadCount(count) {
        downloadCount = count;
        localStorage.setItem(STORAGE_KEY, count);
    }

    function markDonationPopupShown() {
        donationPopupShown = true;
        localStorage.setItem(DONATION_POPUP_SHOWN_KEY, 'true');
    }

    function markFirstExecution() {
        firstExecution = true;
        localStorage.setItem(FIRST_EXECUTION_KEY, 'true');
    }

    function removeWatermarkFromHref(href) {
        return href.replace(/(_water|_n|_p|_b|_s)/g, '');
    }

    function createBookPageDownloadButton(images) {
        const downloadButton = document.createElement('button');
        downloadButton.innerText = `👉 下载图片（${images.length}）`;
        downloadButton.id = 'downloadButton';
        downloadButton.style.backgroundColor = '#026052';
        downloadButton.style.color = 'white';
        document.body.appendChild(downloadButton);
        return downloadButton;
    }

    function createSearchPageDownloadButton(doc, item) {
        const downloadButton = doc.createElement('button');
        downloadButton.innerText = '👉 下载图片';
        downloadButton.className = 'searchPageDownloadButton item-button';
        downloadButton.style.backgroundColor = '#026052';
        downloadButton.style.color = 'white';
        const addCartBtn = item.querySelector('div.add-cart-btn') || item.querySelector('div.add-cart-button');
        addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling);
        return downloadButton;
    }

    function createCategoryPageDownloadButton(doc, item) {
        const downloadButton = doc.createElement('button');
        downloadButton.innerText = '👉 下载图片';
        downloadButton.className = 'searchPageDownloadButton item-button';
        downloadButton.style.backgroundColor = '#026052';
        downloadButton.style.color = 'white';
        const addCartBtn = item.querySelector('div.add-cart-btn') || item.querySelector('div.add-cart-button');
        addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling);
        return downloadButton;
    }

    function createBookListPageDownloadButton(doc, item) {
        const downloadButton = doc.createElement('button');
        downloadButton.innerText = '👉 下载图片';
        downloadButton.className = 'bookListPageDownloadButton';
        downloadButton.style.backgroundColor = '#026052';
        downloadButton.style.color = 'white';
        const addCartBtn = item.querySelector('a.con-btn-cart');
        addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling);
        return downloadButton;
    }

    function handleDownloadButtonClick(document, downloadButton) {
        extractImagesAndDownFromWebPage(document, downloadButton);
    }

    function extractImagesFromBookPage(doc) {
        const liElements = doc.querySelectorAll('ul#figure-info-box > li');
        return Array.from(liElements, liElement => removeWatermarkFromHref(liElement.querySelector('img').getAttribute('_viewsrc')));
    }

    // 解析网页下载图片
    function extractImagesAndDownFromWebPage(doc, downloadButton) {
        const images = extractImagesFromBookPage(doc);
        if (images.length === 0) {
            downloadButton.innerText = '🧐 商品详情中没有图片可以下载';
            downloadButton.style.backgroundColor = '#ccc';
            downloadButton.style.color = '#999';
            downloadButton.style.cursor = 'not-allowed';
            return;
        }

        downloadButton.disabled = true;
        downloadButton.innerText = 'Downloading...';

        let successCount = 0;
        let failCount = 0;

        const bookNameContent = (doc.querySelector('meta[name="keywords"]').getAttribute('content') || '').match(/([^,]+)/);
        const bookName = bookNameContent && bookNameContent.length > 1 ? bookNameContent[1] : '';
        const isbnContent = (doc.querySelector('meta[name="description"]').getAttribute('content') || '').match(/ISBN：([0-9]*)/);
        const isbn = isbnContent && isbnContent.length > 1 ? isbnContent[1] : '';
        images.forEach((imageUrl, index) => {
            const extension = (imageUrl.split('.').pop() || '').toLowerCase();
            const imageName = `${bookName.trim()}-${isbn.trim()}-${index + 1}.${extension || 'jpg'}`;
            console.log('Image download ' + imageName + ': ' + imageUrl)

            GM_download({
                url: imageUrl,
                name: imageName,
                onload: () => {
                    successCount++;
                    console.log('Downloading:', imageUrl);
                    downloadButton.innerText = `Downloading...(${successCount}/${images.length})`;
                    if (successCount === images.length) {
                        updateDownloadCount(downloadCount + images.length); // 更新下载计数
                        if ((downloadCount % 100 === 0 && downloadCount !== 0 && !donationPopupShown) || (downloadCount > 1000 && !donationPopupShown)) {
                            showDonationPopup();
                        }
                        downloadButton.innerText = `🎉 ${successCount} 张图片下载成功`;
                        downloadButton.style.backgroundColor = '#ccc';
                        downloadButton.style.color = '#999';
                        downloadButton.style.cursor = 'not-allowed';
                    }
                },
                onerror: error => {
                    failCount++;
                    console.log('Error downloading image:', error);
                    downloadButton.innerText = `⛔ 下载图片时发生错误${failCount}`;
                    alert("下载图片发生错误，请联系微信：Byte4Me");
                }
            });
        });
    }

    function showDonationPopup() {
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        document.body.appendChild(overlay);

        const donationPopup = document.createElement('div');
        donationPopup.classList.add('donation-popup');
        donationPopup.innerHTML = `
      <div class="donation-popup">
        <p class="donation-text">孔夫子旧书网图片下载（自动去水印）------“时间就是金钱”</p>
        <div class="donation-text">非常开心您选择此工具，考虑捐赠以帮助我们继续改进此工具🙏</div>
        <div class="donation-images">
          <img src="https://greasyfork.s3.us-east-2.amazonaws.com/1ohv6vh4i7r7bdx3pe9zkmtfqdcz" alt="捐赠二维码1" />
          <img src="https://greasyfork.s3.us-east-2.amazonaws.com/5f4nlsf3mhtrps0x3dm2tpnj0k54" alt="捐赠二维码2" />
        </div>
        <div style="text-align:center"><a href="https://img2.imgtp.com/2024/04/22/4VBKbl7W.png" target="_blank">微信:Byte4Me</a></div>
        <br />
        <div class="donation-buttons">
          <button id="donateBtn">我已捐赠💖</button>
          <button id="notDonateBtn">暂不捐赠❌</button>
        </div>
      </div>
    `;
        document.body.appendChild(donationPopup);

        const donateBtn = donationPopup.querySelector('#donateBtn');
        const notDonateBtn = donationPopup.querySelector('#notDonateBtn');

        donateBtn.addEventListener('click', () => {
            // 点击我已捐赠按钮
            alert('🙏感谢您的支持，有问题请联系微信：Byte4Me！');
            donationPopup.remove();
            overlay.remove();
            markDonationPopupShown();
        });

        notDonateBtn.addEventListener('click', () => {
            // 点击不捐赠按钮
            donationPopup.remove();
            overlay.remove();
            // markDonationPopupShown();
        });
    }

    function extractImagesFromBookPageUrl(bookPageUrl, downloadButton) {
        downloadButton.addEventListener('click', () => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: bookPageUrl,
                onload: function (response) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    extractImagesAndDownFromWebPage(doc, downloadButton);
                },
                onerror: function (error) {
                    console.log('Error:', error);
                    downloadButton.innerText = `⛔ 解析网页时出错`;
                }
            });
        });
    }

    function handleSearchPageItemClick(item) {
        const titleLink = item.querySelector('.item-info-box > .item-name > a.item-link');
        const bookPageUrl = titleLink.href;
        const downloadButton = createSearchPageDownloadButton(document, item);
        extractImagesFromBookPageUrl(bookPageUrl, downloadButton);
    }

    function handleCategoryPageItemClick(item) {
        const titleLink = item.querySelector('.item-info > .title > a.link');
        const bookPageUrl = titleLink.href;
        const downloadButton = createCategoryPageDownloadButton(document, item);
        extractImagesFromBookPageUrl(bookPageUrl, downloadButton);
    }

    function handleBookListPageItemClick(item) {
        const titleLink = item.querySelector('div.list-con-title > a');
        const bookPageUrl = titleLink.href;
        const downloadButton = createBookListPageDownloadButton(document, item);
        extractImagesFromBookPageUrl(bookPageUrl, downloadButton);
    }

    let intervalId;

    function handleSearchPage() {
        const listBox = document.querySelector('.product-item-box');
        if (listBox) {
            clearInterval(intervalId);
            const items = document.querySelectorAll('.product-item-box > .product-item-wrap');
            items.forEach(item => {
                handleSearchPageItemClick(item);
            });
        }
    }

    function handleCategoryPage() {
        const listBox = document.querySelector('#listBox');
        if (listBox) {
            clearInterval(intervalId);
            const items = document.querySelectorAll('#listBox > .item');
            items.forEach(item => {
                handleCategoryPageItemClick(item);
            });
        }
    }

    function handleBookListPage() {
        const listBox = document.querySelector('ul.itemList');
        if (listBox) {
            clearInterval(intervalId);
            const items = document.querySelectorAll('ul.itemList > li');
            items.forEach(item => {
                handleBookListPageItemClick(item);
            });
        }
    }

    if (!firstExecution) {
        alert("孔夫子旧书网图片下载（自动去水印）v3.4：修复列表页下载图片部分图片下载出错的问题");
        markFirstExecution();
    }
    if (currentPath.includes('//search.kongfz.com/')) {
        console.log('//search.kongfz.com/');
        intervalId = setInterval(handleSearchPage, 1000);
    } else if (currentPath.includes('//book.kongfz.com/C')) {
        console.log('//book.kongfz.com/C');
        intervalId = setInterval(handleCategoryPage, 1000);
    } else if (currentPath.includes('//book.kongfz.com/')) {
        console.log('//book.kongfz.com/');
        const downloadButton = createBookPageDownloadButton(extractImagesFromBookPage(document));
        downloadButton.addEventListener('click', () => handleDownloadButtonClick(document, downloadButton));
    } else if (currentPath.includes('//item.kongfz.com/book/')) {
        console.log('//item.kongfz.com/book/');
        intervalId = setInterval(handleBookListPage, 1000);
    }

    GM_addStyle(`
  #downloadButton {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 9999;
  }
  .searchPageDownloadButton {
  padding: 1px 5px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  z-index: 9999;
  font-size: 12px;
  margin: 0px 10px;
  }
  .bookListPageDownloadButton {
  padding: 1px 5px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  z-index: 9999;
  font-size: 12px;
  margin: 8px auto 0;
  display: block;
  }
  button.disabled {
  background-color: #ccc;
  color: #999;
  cursor: not-allowed;
  /* 其他样式 */
  }
  .overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
  z-index: 9998; /* 比弹窗层级低，但比页面其他元素高 */
  }
  .donation-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  }

  .donation-popup .donation-text {
  margin-bottom: 20px;
  text-align: center;
  font-size: 16px;
  }

  .donation-images {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  }

  .donation-images img {
  height: 300px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  .donation-buttons {
  display: flex;
  justify-content: center;
  }

  .donation-buttons button {
  padding: 5px 10px;
  margin: 0 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  background-color: #026052;
  color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
  }

  .donation-buttons button:hover {
  background-color: #014033;
  }

  `);
})();
