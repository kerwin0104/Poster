// 系统基础库
(function () {
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
	// // 注册native消息
	// var nativeEventCenter = rpc.nativeEventCenter = {};
	// nativeEventCenter.eventHandlers = {};
	// messageCenter.on = function (viewId, event, callback) {
	// 	var eventHandlers = nativeEventCenter.eventHandlers
	// 	if (eventHandlers) {

	// 	}
	// }
	// messageCenter.off = function (viewId, event, callback) {
		
	// }
})();





// 用户业务代码
Vue.component('native-input', {
  props: {
  	value: String
  },
  methods: {
  	foucs() {

  	}
  },
  mounted: function () {
  	const el = this.$refs.el;
  	const style = {};
  	style.x = el.offsetLeft;
  	style.y = el.offsetTop;
  	style.width = el.offsetWidth;
  	style.height = el.offsetHeight;
  	rpc.call('log', '342432');
  	rpc.call('layout-input', style, function (err, args) {
  		if (err) {
  			rpc.call('log', 'error');
  		} else {
  			rpc.call('log', 'success');
  		}	
	});
  },
  template: '<div ref="el" style="border:1px solid #333; width: 200px; height: 30px; cursor: pointer;" @foucs="foucs">这里是个input</div>'
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
	template: '<div><h3>input-demo page</h3><native-input /><a @click="toOther" href="javascript:;">去另一个页面</a></div>', 
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
