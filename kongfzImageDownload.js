// ==UserScript==
// @name         beta-孔夫子旧书网图片下载（自动去水印）-路人甲乙丙
// @description  何以生财，唯有实战。（问题反馈联系微信Byte4Me）
// @version      3.6
// @author       路人甲乙丙
// @namespace    iblogc
// @match        *://search.kongfz.com/*
// @match        *://book.kongfz.com/*
// @match        *://item.kongfz.com/*
// @match        *://book.kongfz.com/C*
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @license      Apache License, Version 2.0
// @homepage     https://greasyfork.org/zh-CN/scripts/467062-%E5%AD%94%E5%A4%AB%E5%AD%90%E6%97%A7%E4%B9%A6%E7%BD%91%E5%9B%BE%E7%89%87%E4%B8%8B%E8%BD%BD-%E8%87%AA%E5%8A%A8%E5%8E%BB%E6%B0%B4%E5%8D%B0-%E8%B7%AF%E4%BA%BA%E7%94%B2%E4%B9%99%E4%B8%99
// ==/UserScript==

;(function () {
    'use strict'
  
    const currentPath = window.location.href
  
    const STORAGE_KEY = 'downloadCount'
    const DONATION_POPUP_SHOWN_KEY = 'donationPopupShown'
    const FIRST_EXECUTION_KEY = 'firstExecutionv36'
    let downloadCount = parseInt(localStorage.getItem(STORAGE_KEY)) || 0
    let donationPopupShown = localStorage.getItem(DONATION_POPUP_SHOWN_KEY) === 'true'
    let firstExecution = localStorage.getItem(FIRST_EXECUTION_KEY) === 'true'
  
    function updateDownloadCount(count) {
      downloadCount = count
      localStorage.setItem(STORAGE_KEY, count)
    }
  
    function markDonationPopupShown() {
      donationPopupShown = true
      localStorage.setItem(DONATION_POPUP_SHOWN_KEY, 'true')
    }
  
    function markFirstExecution() {
      firstExecution = true
      localStorage.setItem(FIRST_EXECUTION_KEY, 'true')
    }
  
    function removeWatermarkFromHref(href) {
      return href.replace(/(_water|_n|_p|_b|_s)/g, '')
    }
  
    function createBookPageDownloadButton(images) {
      const downloadButton = document.createElement('button')
      downloadButton.innerText = `👉 下载图片（${images.length}）`
      downloadButton.id = 'downloadButton'
      downloadButton.style.backgroundColor = '#026052'
      downloadButton.style.color = 'white'
      document.body.appendChild(downloadButton)
      return downloadButton
    }
  
    function createSearchPageDownloadButton(doc, item) {
      const downloadButton = doc.createElement('button')
      downloadButton.innerText = '👉 下载图片'
      downloadButton.className = 'searchPageDownloadButton item-button'
      downloadButton.style.backgroundColor = '#026052'
      downloadButton.style.color = 'white'
      const addCartBtn = item.querySelector('div.add-cart-btn') || item.querySelector('div.add-cart-button')
      addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling)
      return downloadButton
    }
  
    function createCategoryPageDownloadButton(doc, item) {
      const downloadButton = doc.createElement('button')
      downloadButton.innerText = '👉 下载图片'
      downloadButton.className = 'searchPageDownloadButton item-button'
      downloadButton.style.backgroundColor = '#026052'
      downloadButton.style.color = 'white'
      const addCartBtn = item.querySelector('div.add-cart-btn') || item.querySelector('div.add-cart-button')
      addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling)
      return downloadButton
    }
  
    function createBookListPageDownloadButton(doc, item) {
      const downloadButton = doc.createElement('button')
      downloadButton.innerText = '👉 下载图片'
      downloadButton.className = 'bookListPageDownloadButton'
      downloadButton.style.backgroundColor = '#026052'
      downloadButton.style.color = 'white'
      const addCartBtn = item.querySelector('a.con-btn-cart')
      addCartBtn.parentNode.insertBefore(downloadButton, addCartBtn.nextSibling)
      return downloadButton
    }
  
    function handleDownloadButtonClick(document, downloadButton) {
      extractImagesAndDownFromWebPage(document, downloadButton)
    }
  
    function extractImagesFromBookPage(doc) {
      const liElements = doc.querySelectorAll('ul#figure-info-box > li')
      return Array.from(liElements, (liElement) => removeWatermarkFromHref(liElement.querySelector('img').getAttribute('_viewsrc')))
    }
  
    // 解析网页下载图片
    function extractImagesAndDownFromWebPage(doc, downloadButton) {
      const images = extractImagesFromBookPage(doc)
      downloadButton.style.cursor = 'not-allowed'
      var bugReportLink = document.createElement('a')
      bugReportLink.href = 'https://greasyfork.s3.us-east-2.amazonaws.com/lp9hdyffstt0wpz2ub39gw9p6srr'
      bugReportLink.target = '_blank'
      bugReportLink.textContent = '🐛问题反馈'
      bugReportLink.style.color = '#ffeb83'
  
      if (images.length === 0) {
        downloadButton.innerText = '🧐商品详情中没\n有图片可以下载\n'
        downloadButton.style.backgroundColor = '#ccc'
        downloadButton.style.color = '#999'
        bugReportLink.style.color = '#b55222'
        downloadButton.appendChild(bugReportLink)
        return
      }
  
      downloadButton.disabled = true
      downloadButton.innerText = 'Downloading...'
  
      let successCount = 0
      let failCount = 0
      let retryCount = 0
  
      const bookNameContent = (doc.querySelector('meta[name="keywords"]').getAttribute('content') || '').match(/([^,]+)/)
      const bookName = bookNameContent && bookNameContent.length > 1 ? bookNameContent[1] : ''
      const isbnContent = (doc.querySelector('meta[name="description"]').getAttribute('content') || '').match(/ISBN：([0-9]*)/)
      const isbn = isbnContent && isbnContent.length > 1 ? isbnContent[1] : ''
  
      images.forEach((imageUrl, index) => {
        const extension = (imageUrl.split('.').pop() || '').toLowerCase()
        const imageName = `去水印_${bookName.trim()}-${isbn.trim()}-${index + 1}.${extension || 'jpg'}`
  
        function downloadImage(url, isRetry = false) {
          GM_download({
            url,
            name: isRetry ? `带水印_${bookName.trim()}-${isbn.trim()}-${index + 1}.${extension || 'jpg'}` : imageName,
            onprogress: (event) => {
              downloadButton.innerText = `Downloading...(${index + 1}/${images.length})`
            },
            onload: () => {
              if (isRetry) {
                retryCount++
              } else {
                successCount++
              }
              if (successCount + retryCount + failCount === images.length) {
                updateDownloadButton()
                updateDownloadCount(downloadCount + successCount + retryCount) // 更新下载计数
                if ((downloadCount % 100 === 0 && downloadCount !== 0 && !donationPopupShown) || (downloadCount > 1000 && !donationPopupShown)) {
                  showDonationPopup()
                }
              }
            },
            onerror: (error) => {
              if (!isRetry) {
                console.log('Retrying download with modified URL:', error)
                const retryUrl = imageUrl.replace(/\.([a-z0-9]+)$/, '_b.$1')
                downloadImage(retryUrl, true)
              } else {
                failCount++
                console.log('Error downloading image after retry:', error)
                if (successCount + retryCount + failCount === images.length) {
                  updateDownloadButton()
                }
              }
            }
          })
        }
  
        downloadImage(imageUrl)
      })
  
      function updateDownloadButton() {
        downloadButton.style.lineHeight = '20px'
        downloadButton.innerText = `📢总计：${images.length}\n🥳成功：${successCount}\n🔄原图：${retryCount}\n😭失败：${failCount}\n`
        downloadButton.appendChild(bugReportLink)
        if (failCount > 0) {
          downloadButton.style.backgroundColor = '#f5675b'
          downloadButton.style.color = '#fff'
        } else {
          downloadButton.style.backgroundColor = '#06b500'
          downloadButton.style.color = '#fff'
        }
      }
    }
  
    function showDonationPopup() {
      const overlay = document.createElement('div')
      overlay.classList.add('overlay')
      document.body.appendChild(overlay)
  
      const donationPopup = document.createElement('div')
      donationPopup.classList.add('donation-popup')
      donationPopup.innerHTML = `
              <div class="donation-header">
                  <p>孔夫子旧书网图片下载（自动去水印）</p>
                  <p style="font-size: 14px; color: #666;">让您的时间更高效</p>
              </div>
              <div class="donation-body">
                  <p>🙏感谢您选择此工具！捐赠是对我最大的支持，也能帮助工具不断改进与维护。</p>
                  <div class="donation-images">
                      <img src="https://greasyfork.s3.us-east-2.amazonaws.com/hve4r1x61p2vrsx2bjqjb1um8wfh" alt="捐赠二维码1" class="donation-image-large" />
                      <img src="https://greasyfork.s3.us-east-2.amazonaws.com/2w21qpqvqb9iikjqiovagnuyut1x" alt="捐赠二维码2" class="donation-image-large" />
                  </div>
                  <br>
                  <p style="text-align: center; margin-top: 10px;">
                      <a href="#" id="feedbackWeChat" style="color: #007bff; text-decoration: none;">
                          ❓问题/建议反馈微信：Byte4Me
                      </a>
                      <br>
                      <br>
                      <a href="#" id="sideHustleGroup" style="color: #007bff; text-decoration: none;">
                          💰副业项目群/生财有术（可入群无限制免费体检3天）
                      </a>
                  </p>
              </div>
              <div class="donation-footer">
                  <button id="donateBtn" class="donation-button donate">我已捐赠💖</button>
                  <button id="notDonateBtn" class="donation-button cancel">暂不捐赠❌</button>
              </div>
          `
      document.body.appendChild(donationPopup)
  
      const donateBtn = donationPopup.querySelector('#donateBtn')
      const notDonateBtn = donationPopup.querySelector('#notDonateBtn')
      const feedbackWeChat = donationPopup.querySelector('#feedbackWeChat')
      const sideHustleGroup = donationPopup.querySelector('#sideHustleGroup')
  
      donateBtn.addEventListener('click', () => {
        alert('🙏感谢您的支持！如果有问题，欢迎联系微信：Byte4Me')
        donationPopup.remove()
        overlay.remove()
        markDonationPopupShown()
      })
  
      notDonateBtn.addEventListener('click', () => {
        donationPopup.remove()
        overlay.remove()
      })
  
      // Add image popup functionality
      feedbackWeChat.addEventListener('click', (event) => {
        event.preventDefault()
        showImagePopup('https://greasyfork.s3.us-east-2.amazonaws.com/lp9hdyffstt0wpz2ub39gw9p6srr')
      })
  
      sideHustleGroup.addEventListener('click', (event) => {
        event.preventDefault()
        showImagePopup('https://greasyfork.s3.us-east-2.amazonaws.com/7cjf1r8rohkrh8xwp0mn2srocx0u')
      })
    }
  
    function showImagePopup(imageUrl) {
      const overlay = document.createElement('div')
      overlay.classList.add('overlay')
      document.body.appendChild(overlay)
  
      const imagePopup = document.createElement('div')
      imagePopup.classList.add('image-popup')
      imagePopup.innerHTML = `
              <button class="close-button">×</button>
              <img src="${imageUrl}" alt="Image" />
          `
      document.body.appendChild(imagePopup)
  
      const closeButton = imagePopup.querySelector('.close-button')
      closeButton.addEventListener('click', () => {
        imagePopup.remove()
        overlay.remove()
      })
  
      overlay.addEventListener('click', () => {
        imagePopup.remove()
        overlay.remove()
      })
    }
  
    function extractImagesFromBookPageUrl(bookPageUrl, downloadButton) {
      downloadButton.addEventListener('click', () => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: bookPageUrl,
          onload: function (response) {
            const parser = new DOMParser()
            const doc = parser.parseFromString(response.responseText, 'text/html')
            extractImagesAndDownFromWebPage(doc, downloadButton)
          },
          onerror: function (error) {
            console.log('Error:', error)
            downloadButton.innerText = `⛔ 解析网页时出错`
          }
        })
      })
    }
  
    function handleSearchPageItemClick(item) {
      const titleLink = item.querySelector('.item-info-box > .item-name > a.item-link')
      const bookPageUrl = titleLink.href
      const downloadButton = createSearchPageDownloadButton(document, item)
      extractImagesFromBookPageUrl(bookPageUrl, downloadButton)
    }
  
    function handleCategoryPageItemClick(item) {
      const titleLink = item.querySelector('.item-info > .title > a.link')
      const bookPageUrl = titleLink.href
      const downloadButton = createCategoryPageDownloadButton(document, item)
      extractImagesFromBookPageUrl(bookPageUrl, downloadButton)
    }
  
    function handleBookListPageItemClick(item) {
      const titleLink = item.querySelector('div.list-con-title > a')
      const bookPageUrl = titleLink.href
      const downloadButton = createBookListPageDownloadButton(document, item)
      extractImagesFromBookPageUrl(bookPageUrl, downloadButton)
    }
  
    let intervalId
  
    function handleSearchPage() {
      const listBox = document.querySelector('.product-item-box')
      if (listBox) {
        clearInterval(intervalId)
        const items = document.querySelectorAll('.product-item-box > .product-item-wrap')
        items.forEach((item) => {
          handleSearchPageItemClick(item)
        })
      }
    }
  
    function handleCategoryPage() {
      const listBox = document.querySelector('#listBox')
      if (listBox) {
        clearInterval(intervalId)
        const items = document.querySelectorAll('#listBox > .item')
        items.forEach((item) => {
          handleCategoryPageItemClick(item)
        })
      }
    }
  
    function handleBookListPage() {
      const listBox = document.querySelector('ul.itemList')
      if (listBox) {
        clearInterval(intervalId)
        const items = document.querySelectorAll('ul.itemList > li')
        items.forEach((item) => {
          handleBookListPageItemClick(item)
        })
      }
    }
  
    if (!firstExecution) {
      // alert("孔夫子旧书网图片下载插件 v3.6 网站图片规则修改，去水印基本失效，在找到新方法前降级到下载原图");
      showUpdateLogPopup()
      markFirstExecution()
    }
  
    function showUpdateLogPopup() {
      const overlay = document.createElement('div')
      overlay.classList.add('overlay')
      document.body.appendChild(overlay)
  
      const updateLogPopup = document.createElement('div')
      updateLogPopup.classList.add('update-log-popup')
      updateLogPopup.innerHTML = `
              <div class="update-log-header">
                  <p><a target="_blank" href="https://greasyfork.org/zh-CN/scripts/467062-%E5%AD%94%E5%A4%AB%E5%AD%90%E6%97%A7%E4%B9%A6%E7%BD%91%E5%9B%BE%E7%89%87%E4%B8%8B%E8%BD%BD-%E8%87%AA%E5%8A%A8%E5%8E%BB%E6%B0%B4%E5%8D%B0-%E8%B7%AF%E4%BA%BA%E7%94%B2%E4%B9%99%E4%B8%99">孔夫子旧书网图片下载（自动去水印）更新日志</a></p>
                  <div style="font-size: 12px; color: #666; text-align: center;">每次更新后此窗口会显示两次</div>
              </div>
              <div class="update-log-body">
                  <ul>
                      <li>
                          <p style="font-weight: bold;">[2024-12-23] v3.6</p>
                          <ul>
                              <li style="color: red;">网站图片规则修改，去水印基本失效，在找到新方法前，去水印失败会自动降级到下载原图。</li>
                          </ul>
                      </li>
                      <li>
                          <p style="font-weight: bold;">[2024-07-31] v3.5</p>
                          <ul>
                              <li>修复 https://item.kongfz.com/index.php? 前缀网页不显示下载按钮的问题。</li>
                          </ul>
                      </li>
                      <li>
                          <p style="font-weight: bold;">[2024-06-21] v3.4</p>
                          <ul>
                              <li>修复列表页下载图片部分下载出错的问题。</li>
                              <li>分类页面增加一键下载功能。</li>
                              <li>优化下载失败交互和下载结束后的 UI。</li>
                          </ul>
                      </li>
                      <li>
                          <p style="font-weight: bold;">[2024-05-23] v3.3</p>
                          <ul>
                              <li>修复在某些场景下详情页下载的部分图片很模糊的问题。</li>
                          </ul>
                      </li>
                      <li>
                          <p style="font-weight: bold;">[2024-05-15] v3.2</p>
                          <ul>
                              <li>修复搜索结果页没有下载按钮的问题。</li>
                          </ul>
                      </li>
                      <li>
                          <p style="font-weight: bold;">[2024-05-15] v3.1</p>
                          <ul>
                              <li>修复搜索结果页没有下载按钮的问题。</li>
                          </ul>
                      </li>
                  </ul>
                  <p style="text-align: center; margin-top: 10px;">
                      <a href="#" id="donation" style="color: #007bff; text-decoration: none;">
                          好活，当赏
                      </a>
                      &nbsp;|&nbsp;
                      <a href="#" id="scyspromotion" style="color: #007bff; text-decoration: none;">
                          生财有术（副业社群）免费体检卡
                      </a>
                  </p>
              </div>
              <div class="update-log-footer">
                  <button id="closeUpdateLogBtn" class="update-log-button">我知道了</button>
              </div>
          `
      document.body.appendChild(updateLogPopup)
  
      const closeUpdateLogBtn = updateLogPopup.querySelector('#closeUpdateLogBtn')
  
      closeUpdateLogBtn.addEventListener('click', () => {
        updateLogPopup.remove()
        overlay.remove()
      })
  
      const donation = updateLogPopup.querySelector('#donation')
      const scyspromotion = updateLogPopup.querySelector('#scyspromotion')
  
      donation.addEventListener('click', (event) => {
        event.preventDefault()
        showDonationPopup()
      })
  
      scyspromotion.addEventListener('click', (event) => {
        event.preventDefault()
        showImagePopup('https://greasyfork.s3.us-east-2.amazonaws.com/7cjf1r8rohkrh8xwp0mn2srocx0u')
      })
    }
  
    if (currentPath.includes('//search.kongfz.com/')) {
      console.log('//search.kongfz.com/')
      intervalId = setInterval(handleSearchPage, 1000)
    } else if (currentPath.includes('//book.kongfz.com/C')) {
      console.log('//book.kongfz.com/C')
      intervalId = setInterval(handleCategoryPage, 1000)
    } else if (currentPath.includes('//book.kongfz.com/')) {
      console.log('//book.kongfz.com/')
      const downloadButton = createBookPageDownloadButton(extractImagesFromBookPage(document))
      downloadButton.addEventListener('click', () => handleDownloadButtonClick(document, downloadButton))
    } else if (currentPath.includes('//item.kongfz.com/')) {
      console.log('//item.kongfz.com/')
      intervalId = setInterval(handleBookListPage, 1000)
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
    #bugReportLink {
    position: fixed;
    bottom: 5px;
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
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
  }
  .donation-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      text-align: center;
      z-index: 1001;
      max-width: 800px;
      width: 90%;
  }
  .donation-header p {
      margin: 5px 0;
      font-size: 18px;
      font-weight: bold;
      color: #333;
  }
  .donation-body p {
      font-size: 14px;
      color: #555;
      line-height: 1.5;
  }
  .donation-images {
      display: flex;
      justify-content: space-around;
      margin: 15px 0;
  }
  .donation-image-large {
      max-width: 350px;
      max-height: 350px;
      border: 1px solid #ddd;
      border-radius: 5px;
  }
  .donation-footer {
      margin-top: 20px;
  }
  .donation-button {
      margin: 5px;
      padding: 10px 20px;
      font-size: 14px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
  }
  .donation-button.donate {
      background-color: #28a745;
      color: white;
  }
  .donation-button.cancel {
      background-color: #dc3545;
      color: white;
  }
  .donation-button:hover {
      opacity: 0.9;
  }
  .image-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      padding: 10px;
      z-index: 1002;
  }
  .image-popup img {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 5px;
  }
  .image-popup .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 16px;
      text-align: center;
      cursor: pointer;
  }
  .update-log-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      text-align: left;
      z-index: 1001;
      max-height: 80vh;
      overflow-y: auto;
      max-width: 800px;
      width: 90%;
  }
  .update-log-header p {
      margin: 5px 0;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      text-align: center;
  }
  .update-log-body ul {
      list-style-type: disc;
      padding-left: 20px;
  }
  .update-log-body ul ul {
      list-style-type: circle;
      padding-left: 20px;
  }
  .update-log-body li {
      margin-bottom: 10px;
  }
  .update-log-footer {
      margin-top: 20px;
      text-align: center;
  }
  .update-log-button {
      padding: 5px 10px;
      font-size: 14px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      background-color: #007bff;
      color: white;
  }
  .update-log-button:hover {
      opacity: 0.9;
  }
  
    `)
  })()
  