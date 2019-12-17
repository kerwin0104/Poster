// 系统基础库
(function (process) {
	process.rpc = {}
	rpc.globalHandlerId = 0;
	rpc.globalMessageId = 0;
	rpc.defaultCallbackTimeout = 5000; // 默认5秒超时
	rpc.callbackHandlers = {};
	// 调用native方法
	rpc.addCallbackHandler = function rpcAddCallbackHandler (callback, timeout) {
		if (typeof timeout !== 'number') {
			timeout = this.defaultCallbackTimeout;
		}

		var handler = {};
		handler.id = this.globalHandlerId++;
		handler.callback = callback;

		handler.timeoutId = setTimeout(function rpcCallTimeout () {
			rpc.callCallbackWithId(handler.id, new Error('rpc call timeout.'))
		}, timeout);

		rpc.callbackHandlers[handler.id] = handler;

		return handler.id;
	};
	
	rpc.callCallbackWithId = function rpcCallCallbackWithId (callbackId, err, args) {
		const handler = this.callbackHandlers[callbackId];
		if (args) {
			try {
				args = JSON.parse(args);
			} catch(e){}
		}
		clearTimeout(handler.timeoutId);  // 清除超时定时器
		delete this.callbackHandlers[callbackId];  // 从全局回调句柄删除自己
		handler.callback.call(null, err, args);
	}
	rpc.call = function (method, args, callback, timeout) {
		const data = {};
		data.method = method;
		data.args = args;
		if (typeof callback === 'function') {
			data.callbackHandlerId = rpc.addCallbackHandler(callback, timeout);
		}
		if (process.webkit && process.webkit.messageHandlers && process.webkit.messageHandlers.rpc) {
			// webview
	  		process.webkit.messageHandlers.rpc.postMessage(JSON.stringify(data));
	  	} else if (process.postMessage) {
	  		// jscore
	  		process.postMessage('rpc', JSON.stringify(data));
	  	}
	}
	
	var nativeViewEvents = {};
	var nativeViewEventCenter = {};
	nativeViewEventCenter.getEventsByViewId = function (viewId) {
		if (!nativeViewEvents[viewId]) {
			nativeViewEvents[viewId] = {}
		}
		return nativeViewEvents[viewId];
	}
	nativeViewEventCenter.on = function (viewId, eventName, callback) {
		var events = this.getEventsByViewId(viewId);
		if (!events[eventName]) {
			events[eventName] = [];
		}
		events[eventName].push({
			viewId: viewId,
			callback: callback,
		});
	}
	nativeViewEventCenter.off = function (viewId, eventName) {
		if (eventName) {
			var events = this.getEventsByViewId(viewId);
			delete events[eventName];
		} else {
			delete nativeViewEvents[viewId];
		}
	}
	nativeViewEventCenter.trigger = function (viewId, eventName, event) {
		var events = this.getEventsByViewId(viewId);
 
		var handlers = events[eventName];
		if (handlers && handlers.length) {
			handlers.forEach((handler) => {
				handler.callback(event);
			});
		}
	}
	process.nativeViewEventCenter = nativeViewEventCenter;
})(this);

