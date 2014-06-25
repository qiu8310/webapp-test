define(function() {
  /**
   *  一个简单的 dialog 程序
   *    // opts:  closeOnMask => 在 mask 上点击是否关闭
   *              autoDestroy => 关闭 dialog 时是否自动销毁
   *
   *    var d = new Dialog(selector or element, opts)
   *    d.close(), d.open()
   *
   *  如果使用 Dialog.confirm、Dialog.alert、Dialog.tpl：
   *    就需要使用 dialog、dialog-confirm、dialog-alert、btn、btn-sure、btn-cancel 样式
   *
   */
  'use strict';

  var MASK_CLASS_NAME = '__dialog-mask',
    LOCK_CLASS_NAME = '__dialog-lock';

  var undef,
    htmlElem = document.documentElement,
    dialogCount = 0,
    bodyElem = document.body;

  function Dialog(selector, opts) {
    opts = opts || {};
    opts.closeOnMask = opts.closeOnMask === undef ? true : !!opts.closeOnMask;

    var container, self = this;
    container = selector.nodeType ? selector : document.querySelector(selector);

    // 指定的 dialog 不存在
    if (!container) {
      throw new Error('Dialog(' + selector + ') not exist');
    }

    // 创建 mask
    var mask = container.parentNode;
    if (!mask || !mask.classList.contains(MASK_CLASS_NAME)) {
      mask = document.createElement('div');
      mask.classList.add(MASK_CLASS_NAME);

      mask.appendChild(container);
      bodyElem.appendChild(mask);
    }

    if (opts.closeOnMask) {
      mask.addEventListener('click', function(e) {
        if (e.target.classList.contains(MASK_CLASS_NAME)) {
          self.close(opts.autoDestroy);
        }
      }, false);
    }

    if (opts.timeout) {
      setTimeout(function(){ self.close(); }, opts.timeout);
    }

    this.container = container;
    this.mask = mask;
    this.isOpened = false;

    // 计算出 dialog 高度
    container.style.display = 'block';
    mask.style.display = 'block';
    this.refresh();

    // 隐藏 container 和 mask
    container.style.display = 'none';
    mask.style.display = 'none';

    //container.style.height = height;
    //['left', 'top', 'right', 'bottom'].forEach(function(key) { container.style[key] = '0'; });


  }

  Dialog.prototype = {
    getContainer: function() {
      return this.container;
    },
    refresh: function() {
      var compuStyle = window.getComputedStyle(this.container);
      var top = parseInt(compuStyle.height, 10) / 2,
        left = parseInt(compuStyle.width, 10) / 2;

      // 由之前的 position 形式改成 margin 形式，主要是方便 refresh
      this.container.style.cssText = 'top: 50%; left: 50%;' +
        'margin-left: -' + left + 'px; ' +
        'margin-top: -' + top + 'px;';
    },
    open: function() {
      if (!this.isOpened) {
        this.container.style.display = 'block';
        this.mask.style.display = 'block';
        dialogCount++;
        htmlElem.classList.add(LOCK_CLASS_NAME);

        this.refresh();
      }
      this.isOpened = true;
      return this;
    },
    close: function(destory) {
      if (this.isOpened) {
        this.container.style.display = 'none';
        this.mask.style.display = 'none';
        dialogCount--;
        if (dialogCount === 0) {
          htmlElem.classList.remove(LOCK_CLASS_NAME);
        }
        if (this.mask && (destory === undef || destory)) {
          this.mask.parentNode.removeChild(this.mask);
          this.container = null;
          this.mask = null;
        }
      }
      this.isOpened = false;
      return this;
    }
  };


  // 加几个静态方法
  // Dialog.confirm(msg, callback, opts)
  // Dialog.alert(msg, callback, opts)
  // Dialog.tpl(tpl)

  var tpl = '<div class="content"><p class="msg">{msg}</p></div><div class="btns">{btns}</div>';


  function setup(msg, cb, opts, div, btns) {
    var html = tpl.replace('{msg}', msg);

    // 调换 cb 和 opts 顺序
    if (typeof cb !== 'function') {
      var t = cb;
      cb = opts;
      opts = t;
    }
    opts = opts || {};
    opts.btns = opts.btns || btns;

    // 获取 btns 样式
    var key, btnsHtml = '';
    for (key in opts.btns) {
      btnsHtml += '<a href="" data-key="'+key+'" class="btn btn-'+key+'">'+opts.btns[key]+'</a>';
    }
    html = html.replace('{btns}', btnsHtml);
    div.innerHTML = html;
    div.style.display = 'none';

    bodyElem.appendChild(div);


    var dialog = new Dialog(div, opts);

    // 监听事件
    var handler = function(e) {
      var cbReturn;
      if (typeof cb === 'function') {
        var key = e.target.getAttribute('data-key');
        if (key === 'sure') {
          cbReturn = cb(true);
        } else if (key === 'cancel') {
          cbReturn = cb(false);
        } else {
          cbReturn = cb(key);
        }
      }

      if (cbReturn !== false) {
        dialog.close();
      }

      e.preventDefault();
    };
    for (key in opts.btns) {
      div.querySelector('.btn-' + key).addEventListener('click', handler);
    }

    dialog.open();
    return dialog;
  }

  function confirmDialog(msg, cb, opts) {
    var div = document.createElement('div');
    div.classList.add('dialog');
    div.classList.add('dialog-confirm');

    var btns = {'sure': '确定', 'cancel': '取消'};

    return setup(msg, cb, opts, div, btns);
  }

  function alertDialog(msg, cb, opts) {
    var div = document.createElement('div');
    div.classList.add('dialog');
    div.classList.add('dialog-alert');

    var btns = {'sure': '确定'};
    return setup(msg, cb, opts, div, btns);
  }

  Dialog.confirm = confirmDialog;
  Dialog.alert = alertDialog;
  Dialog.tpl = function(tpl, className) {
    var div = document.createElement('div');
    div.className = 'dialog ' + (className || '');
    div.innerHTML = tpl;
    var dialog = new Dialog(div);
    return dialog.open();
  };

  return Dialog;

});
