(function (process) {
    const m = process.m;

    /*
        粗略转换参数
        因为arguments对象无法直接转成json，所以需要转成数组。
        Event对象也无法直接转成json，所以需要额外转换
    */
    function convertArguments(args) {
        return [].slice(args).map(arg => {
            if (arg instanceof Event) {
                const newEvent = {};
                for (let key in arg) {
                    if (typeof arg[key] !== 'object') {
                        newEvent[key] = arg[key];
                    }
                }
                return newEvent;
            }
            return arg;
        });
    }

    /*
        所有方法全部转交jsCore的实例处理
     */
    function callDelegateMethod(pageId, type, methodName, args) {
        m.postNotification('jscore-0', {
            type: 'call-method',
            data: {
                pageId,
                type,
                methodName,
                args,
            },
        });
    };

    let puiPageId = 0;
	const pageUtil = {};
	pageUtil.createPage = function (pageDescription) {
        const page = {};
		const methods = {};
		pageDescription.methods.forEach(methodName => {
			methods[methodName] = function() {
                const args = convertArguments(arguments);
                callDelegateMethod(this.__puiPageId__, 'normal', methodName, args);
			}
		});
        page.methods = methods;
        page.data = function () {
            return Object.assign({__puiPageId__:0}, pageDescription.data);
        }
	    page.template = pageDescription.template;
        page.created = function () {
            this.__puiPageId__ = puiPageId++;
            const args = convertArguments(arguments);
            callDelegateMethod(this.__puiPageId__, 'lifetime', 'created', args);
        }
		return page;
	};

    function initPages (pages) {
		const routes = [];
        pages.forEach(page => {
	        const route = { path: page.path, component: pageUtil.createPage(page)};
            routes.push(route);
        });

		const router = new VueRouter({
		    routes,
		}); 

		const app2 = new Vue({
		  router
		}).$mount('#app2');	
    }

    m.watchNotification(notification => {
        const {data} = notification;
        if (data && data.type === 'init-pages') {
            try {
                initPages(data.data);
            } catch (e) {
                m.log(e);
            }
        }
    });

    window.onload = function () {
        m.postNotification('jscore-0', 'webview-ready');
    }
})(this);

