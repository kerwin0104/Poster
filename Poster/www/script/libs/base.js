// 系统基础库
(function (process) {
    const m = {};
    m.env = process.__env__;
    m.id = process.__notificationId__;
    process.m = m;

    /* 全局消息 */
    let  peepingTom = [];
    function onReceiveNotification (notification) {
        if (notification.to === process.__notificationId__) {
            peepingTom.forEach(callback => callback(notification));
        }
    }
    process.__$onReceiveNotification__ = onReceiveNotification;

    function watchNotification (callback) {
        if (typeof callback === 'function') {
            peepingTom.push(callback);
        }  
    }
    m.watchNotification = watchNotification;

    function unWatchNotification (callback) {
        peepingTom = peepingTom.filter(item => item !== callback);
    }
    m.unWatchNotification = unWatchNotification;

    function postNotification (targetId, data) {
        const notification = {};
        notification.from = process.__notificationId__;
        notification.to = targetId;
        notification.data = data;
        if (process.__env__ === 'webview') {
	  		process.webkit.messageHandlers.notification.postMessage(JSON.stringify(notification));
        }
        if (process.__env__ === 'jscore') {
            process.__postNotification__(JSON.stringify(notification));
        }
    }
    m.postNotification = postNotification; 
    /* /全局消息 */

    /* 打印日志 */
    m.log = function (content) {
        m.postNotification('log', JSON.stringify(content));
    }
    /* /打印日志 */

    /* 事件系统 */
    let eventId = 0;
    let globalEventHandlers = {};
    const event = {};
	event.getEventIdFromTarget = function (targetObject) {
        if (!targetObject.__eventId__) {
            targetObject.__eventId__ = `event-id-${eventId++}`;
        }
        return targetObject.__eventId__;
    }
	event.getAllEventHandlersFromTarget = function (targetObject) {
        const eventId = this.getEventIdFromTarget(targetObject);
		if (!globalEventHandlers[eventId]) {
            globalEventHandlers[eventId] = {};
		}
		return globalEventHandlers[eventId];
	}
	event.getEventHandlersByEventTypeFromTarget = function (targetObject, eventType) {
        const allEventHandlers = this.getAllEventHandlersFromTarget(targetObject);
        if (!allEventHandlers[eventType]) {
            allEventHandlers[eventType] = [];
        }
        return allEventHandlers[eventType];
	}
	event.on = function (targetObject, eventType, callback) {
        const eventHandlers = this.getEventHandlersByEventTypeFromTarget(targetObject);
        eventHandlers.push({
            target: targetObject,
            type: eventType,
            callback: callback,
        });
	}
	event.off = function (targetObject, eventType, callback) {
        const allEventHandlers = this.getAllEventHandlersFromTarget(targetObject);
		if (callback) {
            const eventHandlers = this.getEventHandlersByEventTypeFromTarget(targetObject);
            allEventHandlers[eventType] = eventHandlers.filter(handler => handler.callback != callback);
		} else if (eventName) {
            delete allEventHandlers[eventName];
		} else {
            const eventId = this.getEventIdFromTarget(targetObject);
			delete globalEventHandlers[eventType];
		}
	}
	event.trigger = function (targetObject, eventType, data) {
		const eventHandlers = this.getEventHandlersByEventTypeFromTarget(targetObject, eventType);
        const eventObject = {};
        eventObject.target = targetObject;
        eventObject.type = eventType;
        eventObject.data = data;
		eventHandlers.forEach((handler) => {
            handler.callback.call(targetObject, eventObject);
		});
	}
    m.event = event;
    /* /事件系统 */







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
})(this);


