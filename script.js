// ==UserScript==
// @name         孔夫子旧书网图片下载
// @description  孔夫子旧书网图片去水印批量下载功能
// @author       路人甲乙丙
// @namespace    iblogc
// @version      1.0
// @match        https://book.kongfz.com/*
// @grant        GM_addStyle
// @license      Apache License, Version 2.0
// @homepage     https://github.com/iblogc
// ==/UserScript==

// Function to remove specific strings from href
function removeStringsFromHref(href) {
  return href.replace(/(_water|_n|_p|_b)/g, '');
}

// Function to create image gallery and download button
function createImageGallery(images) {
  // Create a modal container for the image gallery
  const modalContainer = document.createElement('div');
  modalContainer.id = 'imageModal';
  modalContainer.style.display = 'none';
  document.body.appendChild(modalContainer);

  // Create an image container for each image
  images.forEach((image, index) => {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'imageContainer';

    // Create an image element
    const img = document.createElement('img');
    img.src = image;
    img.className = 'image';
    imageContainer.appendChild(img);

    // Append the image container to the modal container
    modalContainer.appendChild(imageContainer);
  });

  // Create a button to download the images
  const downloadButton = document.createElement('button');
  downloadButton.innerText = 'Download Images';
  downloadButton.id = 'downloadButton'; 
  downloadButton.style.backgroundColor = '#43c2ae'; // 设置按钮的背景颜色
  downloadButton.style.color = 'white'; // 设置按钮的文本颜色
  document.body.appendChild(downloadButton);
}

// Get all the li elements within the specified selector
const liElements = document.querySelectorAll('ul#figure-info-box > li');

// Array to store the modified hrefs
const images = [];

// Iterate over each li element
liElements.forEach((liElement) => {
  // Get the anchor element within the li element
  const anchorElement = liElement.querySelector('a');

  // Get the href attribute value
  const href = anchorElement.href;

  // Remove specific strings from the href
  const modifiedHref = removeStringsFromHref(href);

  // Add the modified href to the images array
  images.push(modifiedHref);
});

// Create the image gallery and download button
createImageGallery(images);

// Function to handle the click event on the download button
function handleDownloadButtonClick() {
  // Create a link element for each image and trigger the download
  images.forEach((image) => {
    const link = document.createElement('a');
    link.href = image;
    link.download = image.split('/').pop();

    fetch(link)
      .then(response => response.blob())
      .then(blob => {
        // 创建一个临时的URL对象
        const url = URL.createObjectURL(blob);

        // 创建一个链接元素并设置下载属性
        const link = document.createElement('a');
        link.href = url;
        link.download = image.split('/').pop();
        link.click();

        // 释放临时URL对象
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('下载图片时发生错误:', error);
      });
  });
}

// Add event listener to the download button
document.getElementById('downloadButton').addEventListener('click', handleDownloadButtonClick);

// Add custom styles for the image gallery
GM_addStyle(`
  #imageModal {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    padding: 20px;
  }

  .imageContainer {
    margin: 10px;
  }

  .image {
    width: 200px;
    height: auto;
  }

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
`);

// I'm done writing.
