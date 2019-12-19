// 系统基础库
(function (process) {
	// 全局对象，类似于小程序里的wx对象
	const tunnel = {};
	process.tunnel = tunnel;

	/* 定义环境类型 */
	const envType = {};
	envType.UNKNOWN = 'UNKNOWN';
	envType.WEBVIEW = 'WEBVIEW';
	envType.JSCORE = 'JSCORE';
	envType.NATIVE = 'NATIVE';
	tunnel.envType = envType;
	/* /定义环境类型 */

	/* 全局配置 */
	const config = {};
	config.env = envType.UNKNOWN;
	if (process.webkit) {
  		config.env = envType.WEBVIEW;
  	} else if (process.postMessage) { 
  		config.env = envType.JSCORE;
  	}
	tunnel.config = config
	// 注册配置
	tunnel.setConfig = function tunnelSetConfig (mergeConfig) {
		Object.assign(config, mergeConfig);
	};
	/* /全局配置 */


	/* 全局消息传递：从native发过来的消息汇总在这里 */
	/*
		消息结构
		{
			from: String,  // 消息来源，config里的env
			to: String,    // 消息去向
			body: Object {     // body也可以随便格式传，但是错误格式不会触发事件中心(event)的全局事件监听
				type: String,  // 全局事件类型
				data: Any,     // 全局事件
			},
		}
	*/
	const message = {};
	message.peepingTom = [];  // 全局消息的处理回调
	// 监听全局所有消息
	message.watch = function messageWatch (callback) {
		this.peepingTom.push(callback);
	}
	// 卸载全局消息监听
	message.unwatch = function messageUnwatch (callback) {
		this.peepingTom = message.peepingTom.filter(item => item !== callback);
	}
	// 触发全局消息
	message.trigger = function messageTrigger (message) {
		this.peepingTom.forEach(callback => callback(message));
	}
	// 向native发送消息，native会根据target字段派发到不同的地方
	message.send = function messageSend (target, body) {
		const messageData = {};
		messageData.from = config.env;
		messageData.to = target;
		messageData.body = body;
		if (config.env === envType.WEBVIEW) {
			process.webkit.messageHandlers.message.postMessage(JSON.stringify(messageData));
		}
		if (config.env === envType.JSCORE) {
			process.postMessage('message', JSON.stringify(messageData));
		}
	}
	tunnel.message = message;
	/* 全局消息传递 */


	/* 事件中心 */
	const event = {};
	event.handlers = {};
	/*
	    event.handlers {
	    	// 某个对象的消息句柄
	    	// messageId通过message.getMessageIdFromObject方法获得，
	    	// 如果这个对象没有messageId，会被该方法自动添加一个
			[messageId: String]: Object {
				[messageType: String]: Array [
					Object {
						target: Object,      // 当前句柄所属对象
						messageType: String, // 当前句柄所属消息类型
						callback: Function,  // 当前句柄的回调函数
					}
				],
			}, 
	    }
	*/
	// 获取对象的事件id (todo: 做一下参数检查)
	event.getEventIdFromObject = function eventGetEventIdFromObject (object) {
		if (!object.__eventId) {
			object.__eventId = `event_id_${this.gid++}`;
		}
		return object.__eventId;
	}
	// 获取对象的所有类型的消息句柄
	event.getAllHandlersOfObject = function eventGetAllHandlersOfObject (object) {
		const eventId = this.getEventIdFromObject(object);
		if (!this.handlers[eventId]) {
			this.handlers[eventId] = {};
		}
		return this.handlers[eventId];
	}
	// 获取对象指定类型的消息句柄
	event.getHandlersOfObjectByEventType = function eventGetHandlersOfObjectByEventType (object, evenType) {
		const allHandlers = this.getAllHandlersOfObject(object);
		if (!allHandlers[evenType]) {
			allHandlers[evenType] = [];
		}
		return allHandlers[evenType];
	}
	// 给对象添加事件回调
	event.on = function eventOn (object, evenType, callback, isOnce) {
		const oneTypeHandlers = this.getHandlersOfObjectByEventType(object, evenType);
		const handler = {};
		handler.target = object;
		handler.evenType = evenType;
		handler.callback = callback;
		handler.isOnce = isOnce;
		oneTypeHandlers.push(handler);
	}
	event.once = function eventOnce (object, evenType, callback) {
		this.on(object, evenType, callback, true);
	}
	// 给对象卸载回调
	event.off = function eventOff (object, evenType, callback) {
		let messageId, allHandlers, oneTypeHandlers;
		if (callback) {
			// event.off(object, evenType, callback)
			// 如果指定回调，则删除指定回调函数的消息监听 
			allHandlers = this.getAllHandlersOfObject(object);
			oneTypeHandlers = this.getHandlersOfObjectByEventType(object, evenType);
			allHandlers[evenType] = oneTypeHandlers.filter(handler => handler.callback !== callback);
		} else if (evenType) {
			// event.off(object, evenType)
			// 未指定回调，删除该消息类型的所有回调
			allHandlers = this.getAllHandlersOfObject(object);
			delete allHandlers[evenType];
		} else if (object) {
			// event.off(object)
			// 未指定回调，也未指定消息类型，则删除对象的所有事件监听
			const eventId = this.eventGetEventIdFromObject(object);
			delete this.handlers[eventId];
		}
	}
	// 触发一个事件
	event.trigger = function eventTrigger (object, evenType, data) { 
		const allHandlers = this.getAllHandlersOfObject(object);
		const oneTypeHandlers = this.getHandlersOfObjectByEventType(object, evenType);
		// 执行所有回调
		oneTypeHandlers.forEach((handler) => {
			const eventObject = {};
			eventObject.target = handler.target;
			eventObject.type = evenType;
			eventObject.data = data;
			handler.callback.call(eventObject.target, eventObject);
		});
		// 把只触发一次的回调删除
		allHandlers[evenType] = oneTypeHandlers.filter(handler => !handler.isOnce);
	}

	// 向native发送一个事件，native会根据target字段派发到不同的地方
	event.send = function eventSend (target, type, data) {
		const messageBody = {};
		messageBody.type = type;
		messageBody.data = data;
		message.send(target, messageBody);
	}
	tunnel.event = event;
	/* /事件中心 */




	/* rpc方法 */
	const rpc = {}
	rpc.globalHandlerId = 0;
	rpc.globalMessageId = 0;
	rpc.defaultCallbackTimeout = 5000; // rpc调用默认5秒超时
	rpc.callbackHandlers = {};
	rpc.methods = {};

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
	rpc.call = function rpcCall (method, args, callback, timeout) {
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

	rpc.addMethod = function rpcAddMethod (name, func) {
		const methods = this.methods;
		methods[name] = func;
	}
	process.rpc = rpc;
	/* /rpc方法 */





	
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


