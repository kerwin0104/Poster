// 系统基础库
(function (window) {
	window.rpc = {}
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
		if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.rpc) {
			const data = {};
			data.method = method;
			data.args = args;
			if (typeof callback === 'function') {
				data.callbackHandlerId = rpc.addCallbackHandler(callback, timeout);
			}
	  		window.webkit.messageHandlers.rpc.postMessage(JSON.stringify(data));
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
	window.nativeViewEventCenter = nativeViewEventCenter;
})(window);






// 用户业务代码
Vue.component('native-input', {
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
  	value: String
  },
  data() {
	  const data = {};
	  data.updateTimestamp = 0;
	  data.updateTimer = null;
	  return data;
  },
  methods: {
  	foucs() {
  	},
    getStyle() {
        const el = this.$refs.el;
        const style = {};
        style.x = el.offsetLeft;
        style.y = el.offsetTop;
        style.width = el.offsetWidth;
        style.height = el.offsetHeight;
        return style;
    },
    updateNativeView() {
        rpc.call('update-view', {
            viewId: this.viewId,
            style: this.getStyle(),
        });
        this.updateTimestamp = +new Date;
    }
  },
  mounted: function () {
  	rpc.call('layout-input', this.getStyle(), (err, viewId) => {
  		if (err) {
  			rpc.call('log', 'error');
  		} else {
  			rpc.call('log', 'success: ' + viewId);
  			this.viewId = viewId;
  			nativeViewEventCenter.on(viewId, 'input', (value) => {
  				rpc.call('log', 'input: ' + value);
  				this.$emit('input', value);
  			});
  			setInterval(() => {
  				this.$refs.el.style.marginTop = (Math.random() * 200) + 'px';
  			}, 1000);
  		}	
	});
    nativeViewEventCenter.on(-9999, 'rerender', () => {
        var now = +new Date;
        var diffTime = now - this.updateTimestamp;
        if (diffTime < 100) {
            clearTimeout(this.updateTimer);
            this.updateTimer = setTimeout(() => {
                this.updateNativeView();                                       
            }, diffTime);
        } else {
        	this.updateNativeView();
        }
    })
  },
  template: '<div ref="el" style="border:1px solid #333; width: 200px; height: 30px; cursor: pointer; margin-top: 100px;" @foucs="foucs">{{value}}</div>'
})

const Home = { 
	template: '<div style="background: gray;"><h3>home</h3><a @click="toOther" href="javascript:;">去另一个页面</a></div>',
	methods: {
		toOther () {
			rpc.call('navigateTo', '/input-demo');
		}
	}
}
const InputDemo = { 
	data() {
		var data = {};
		data.inputValue = 'test';
		return data;
	},
	template: '<div><h3>input-demo page</h3><native-input v-model="inputValue" /><a @click="toOther" href="javascript:;">去另一个页面</a></div>', 
	methods: {
		toOther () {
			rpc.call('navigateTo', '/home');
		}
	}
}

const routes = [
  { path: '/home', component: Home },
  { path: '/input-demo', component: InputDemo }
]

const router = new VueRouter({
  routes // (缩写) 相当于 routes: routes
})

const app = new Vue({
  router
}).$mount('#app');
