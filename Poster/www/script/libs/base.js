// 系统基础库
function __baseScript__ (process) {
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

    /* 事件 */
    const event = {};
    const eventHandlers = {};
    let globalEventId = 0;
    event.getEventId = function eventGetEventId(target) {
        if (!target.__eventId__) {
            target.__eventId__ = globalEventId++;
        }
        return target.__eventId__;
    }
    event.on = function eventOn(target, eventName, callback) {
        const eventId = this.getEventId(target);
        const handler = {
            target,
            callback,
        };
        if (!eventHandlers[eventId]) {
            eventHandlers[eventId] = {};
        }
        if(!eventHandlers[eventId][eventName]) {
            eventHandlers[eventId][eventName] = [ handler ];
        } else {
            eventHandlers[eventId][eventName].push(handler);
        }
    }
    event.off = function eventOff (target, eventName, callback) {
        if (!target) return;
        const eventId = this.getEventId(target);
        if (!eventName) {
            delete eventHandlers[eventId];
            return;
        }
        if (!callback) {
            delete eventHandlers[eventId][eventName];
            return;
        }
        // 有callback参数
        if (!eventHandlers[eventId]) {
            return;
        }
        if (!eventHandlers[eventId][eventName]) {
            return;
        }
        eventHandlers[eventId][eventName] = eventHandlers[eventId][eventName].filter(handler => handler.callback != callback);
    }
    event.trigger = function eventTrigger (target, eventName, eventObject, data) {
        if (!target) return;
        const eventId = this.getEventId(target);
        if (!eventName) {
            return;
        }
        if (!eventHandlers[eventId]) {
            return;
        }
        if (!eventHandlers[eventId][eventName]) {
            return;
        }
        eventHandlers[eventId][eventName].forEach(handler => {
            handler.callback.call(this, eventObject, data);
        });
    }
    m.event = event;
    m.on = function (eventName, callback) {
        this.event.on(this, eventName, callback);
    }
    m.off = function (eventName, callback) {
        this.event.off(this, eventName, callback);
    }
    m.trigger = function (eventName, eventObject, data) {
        this.event.trigger(this, eventName, eventObject, data);
    }
    /* /事件 */

    /* 打印日志 */
    m.log = function (content) {
        m.postNotification('log', JSON.stringify(content));
    }
    /* /打印日志 */

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
}
try {
    __baseScript__(this);
} catch (e) {
    m.log(e);
}

