// ==UserScript==
// @name         孔夫子旧书网图片下载
// @description  孔夫子旧书网图片批量去水印下载，此脚本由 ChatGPT 协助编写完成。
// @version      1.5
// @author       路人甲乙丙
// @namespace    iblogc
// @match        *://search.kongfz.com/product_result/*
// @match        *://book.kongfz.com/*
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

  function createImageGallery(images) {
    const downloadButton = document.createElement('button');
    downloadButton.innerText = `👉 下载图片（${images.length}）`;
    downloadButton.id = 'downloadButton';
    downloadButton.style.backgroundColor = '#026052';
    downloadButton.style.color = 'white';
    document.body.appendChild(downloadButton);
    return downloadButton;
  }

  function handleDownloadButtonClick() {
    const images = extractImagesFromBookPage();
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

    images.forEach((imageUrl, index) => {
      downloadButton.innerText = 'Downloading...';
      const extension = (imageUrl.split('.').pop() || '').toLowerCase();
      const bookName = (document.querySelector('meta[name="keywords"]').getAttribute('content') || '').match(/([^,]+)/)[1] || '';
      const isbn = (document.querySelector('meta[name="description"]').getAttribute('content') || '').match(/ISBN：([0-9]*)/)[1] || '';
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

  function extractImagesFromBookPage() {
    const liElements = document.querySelectorAll('ul#figure-info-box > li');
    return Array.from(liElements, liElement => removeWatermarkFromHref(liElement.querySelector('a').href));
  }

  function handleSearchPageItemClick(item) {
    const bookName = item.getAttribute('itemname');
    const isbn = item.getAttribute('isbn');
    console.log('ISBN:', isbn);
    console.log('Item Name:', bookName);

    const titleLink = item.querySelector('.item-info > .title > a');
    const href = titleLink.href;
    console.log(titleLink.href)

    const itemDownloadButton = document.createElement('button');
    itemDownloadButton.innerText = '👉 下载图片';
    itemDownloadButton.className = 'itemDownloadButton';
    itemDownloadButton.style.backgroundColor = '#026052';
    itemDownloadButton.style.color = 'white';

    const addCartBtn = item.querySelector('div.add-cart-btn');
    addCartBtn.parentNode.insertBefore(itemDownloadButton, addCartBtn);

    // item.parentNode.insertBefore(itemDownloadButton, addCartBtn);

    itemDownloadButton.addEventListener('click', () => {
      console.log(href)
      itemDownloadButton.disabled = true;
      itemDownloadButton.innerText = 'Downloading...';
      GM_xmlhttpRequest({
        method: 'GET',
        url: href,
        onload: function (response) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(response.responseText, 'text/html');
          const imageElements = doc.querySelectorAll('ul#figure-info-box > li > a');
          const images = Array.from(imageElements, image => removeWatermarkFromHref(image.getAttribute('href')));
          console.log(images)

          if (images.length === 0) {
            itemDownloadButton.innerText = '🧐 商品详情中没有图片可以下载';
            itemDownloadButton.style.backgroundColor = '#ccc';
            itemDownloadButton.style.color = '#999';
            itemDownloadButton.style.cursor = 'not-allowed';
            return;
          }

          let successCount = 0;
          let failCount = 0;

          images.forEach((imageUrl, index) => {
            const extension = (imageUrl.split('.').pop() || '').toLowerCase();
            const imageName = `${bookName.trim()}-${isbn.trim()}-${index + 1}.${extension}`;

            console.log(imageUrl)

            GM_download({
              url: imageUrl,
              name: imageName,
              onload: () => {
                successCount++;
                console.log('Image downloaded:', imageUrl);
                if (successCount === images.length) {
                  itemDownloadButton.innerText = `🎉 ${successCount} 张图片下载成功`;
                  itemDownloadButton.style.backgroundColor = '#ccc';
                  itemDownloadButton.style.color = '#999';
                  itemDownloadButton.style.cursor = 'not-allowed';
                }
              },
              onerror: error => {
                failCount++;
                console.log('Error downloading image:', error);
                itemDownloadButton.innerText = `⛔ 下载图片时发生错误${failCount}`;
              }
            });
          });
        },
        onerror: function (error) {
          console.log('Error:', error);
        }
      });
    });
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


  if (currentPath.includes('//book.kongfz.com')) {
    console.log('//book.kongfz.com');
    const downloadButton = createImageGallery(extractImagesFromBookPage());
    downloadButton.addEventListener('click', handleDownloadButtonClick);
  } else if (currentPath.includes('//search.kongfz.com/product_result')) {
    console.log('//search.kongfz.com/product_result');
    intervalId = setInterval(handleSearchPage, 1000);
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
.itemDownloadButton {
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
button.disabled {
  background-color: #ccc;
  color: #999;
  cursor: not-allowed;
  /* 其他样式 */
}
`);

})();
