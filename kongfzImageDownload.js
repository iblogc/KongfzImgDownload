// ==UserScript==
// @name         孔夫子旧书网图片下载
// @description  孔夫子旧书网图片批量去水印下载，此脚本由 ChatGPT 协助编写完成。
// @version      2.2
// @author       路人甲乙丙
// @namespace    iblogc
// @match        *://search.kongfz.com/product_result/*
// @match        *://book.kongfz.com/*
// @match        *://item.kongfz.com/book/*
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @license      Apache License, Version 2.0
// @homepage     https://github.com/iblogc
// ==/UserScript==

(function () {
  'use strict';

  const currentPath = window.location.href;

  function removeWatermarkFromHref(href) {
    return href.replace(/(_water|_n|_p|_b)/g, '');
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
    downloadButton.className = 'searchPageDownloadButton';
    downloadButton.style.backgroundColor = '#026052';
    downloadButton.style.color = 'white';
    const addCartBtn = item.querySelector('div.add-cart-btn');
    addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn);
    return downloadButton
  }

  function createBookListPageDownloadButton(doc, item) {
    const downloadButton = doc.createElement('button');
    downloadButton.innerText = '👉 下载图片';
    downloadButton.className = 'bookListPageDownloadButton';
    downloadButton.style.backgroundColor = '#026052';
    downloadButton.style.color = 'white';
    const addCartBtn = item.querySelector('a.con-btn-cart');
    // addCartBtn.parentNode.insertAdjacentElement(downloadButton, addCartBtn);
    addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling);
    return downloadButton
  }

  function handleDownloadButtonClick(document, downloadButton) {
    extractImagesAndDownFromWebPage(document, downloadButton);
  }

  function extractImagesFromBookPage(doc) {
    const liElements = doc.querySelectorAll('ul#figure-info-box > li');
    return Array.from(liElements, liElement => removeWatermarkFromHref(liElement.querySelector('a').href));
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

    const bookNameContent = (doc.querySelector('meta[name="keywords"]').getAttribute('content') || '').match(/([^,]+)/)[1];
    const bookName = bookNameContent && bookNameContent.length > 1 ? bookNameContent[1] : '';
    const isbnContent = (doc.querySelector('meta[name="description"]').getAttribute('content') || '').match(/ISBN：([0-9]*)/)[1];
    const isbn = isbnContent && isbnContent.length > 1 ? isbnContent[1] : '';
    images.forEach((imageUrl, index) => {
      const extension = (imageUrl.split('.').pop() || '').toLowerCase();
      const imageName = `${bookName.trim()}-${isbn.trim()}-${index + 1}.${extension || 'jpg'}`;

      GM_download({
        url: imageUrl,
        name: imageName,
        onload: () => {
          successCount++;
          console.log('Image downloaded:', imageUrl);
          if (successCount === images.length) {
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
        }
      });
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
    const titleLink = item.querySelector('.item-info > .title > a');
    const bookPageUrl = titleLink.href;
    const downloadButton = createSearchPageDownloadButton(document, item)
    extractImagesFromBookPageUrl(bookPageUrl, downloadButton)
  }

  function handleBookListPageItemClick(item) {
    const titleLink = item.querySelector('div.list-con-title > a');
    const bookPageUrl = titleLink.href;
    const downloadButton = createBookListPageDownloadButton(document, item)
    extractImagesFromBookPageUrl(bookPageUrl, downloadButton)
  }


  let intervalId;
  function handleSearchPage() {
    const listBox = document.querySelector('#listBox');
    if (listBox) {
      clearInterval(intervalId);
      const items = document.querySelectorAll('#listBox .item');
      items.forEach(item => {
        handleSearchPageItemClick(item);
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


  if (currentPath.includes('//book.kongfz.com/')) {
    console.log('//book.kongfz.com/');
    const downloadButton = createBookPageDownloadButton(extractImagesFromBookPage(document));
    downloadButton.addEventListener('click', () => handleDownloadButtonClick(document, downloadButton));
  } else if (currentPath.includes('//search.kongfz.com/product_result/')) {
    console.log('//search.kongfz.com/product_result/');
    intervalId = setInterval(handleSearchPage, 1000);
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
`);

})();
