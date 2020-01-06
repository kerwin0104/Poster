function __webviewBaseScript__ (process) {
    const m = process.m;

    /*
        所有方法全部转交jsCore的实例处理
     */
    function callDelegateMethod(componentId, componentName, methodType, methodName, args) {
        const notification = {
            type: 'call-method',
            componentId,
            componentName,
            methodType,
            methodName,
            args,
        };
        m.postNotification('jscore-0', notification);
    };

    /*
        调用ui层的方法
     */
    /*
        {
            data =     {
                args =         {
                    style =             {
                        height = 200;
                        width = 359;
                        x = 8;
                        y = 123;
                    };
                };
                componentId = 0;
                componentName = "native-textarea";
                methodName = create;
                methodType = normal;
                type = layout;
            };
            from = "webview-0";
            to = ui;
        }
     */
    function callUIMethod(componentId, componentName, methodType, methodName, args) {
        const notification = {
            type: 'layout',
            componentId,
            componentName,
            methodType,
            methodName,
            args,
        };
        m.postNotification('ui', notification);
    }

    /*
        粗略转换参数
        因为arguments对象无法直接转成json，所以需要转成数组。
        Event对象也无法直接转成json，所以需要额外转换
    */
    function argumentsToArray(args) {
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

    let puiComponentId = 0;
    const componentInstances = {};
    // 通过componentDescription创建组件
    function createComponent (componentDescription) {
        if (componentDescription.style) {
            const style = document.createElement('style');
            const cssText = document.createTextNode(componentDescription.style);
            style.setAttribute('type', 'text/css');
            style.appendChild(cssText);
            document.head.appendChild(style);
        }
        const componentId = puiComponentId++;
        const componentName = componentDescription.path;
        const component = {};
		const methods = {};
		componentDescription.methods.forEach(methodName => {
			methods[methodName] = function() {
                const args = argumentsToArray(arguments);
                callDelegateMethod(componentId, componentName, 'normal', methodName, args);
			}
		});
        component.methods = methods;
        component.data = function () {
            return JSON.parse(JSON.stringify(componentDescription.data));
        }
	    component.template = componentDescription.template;
        component.created = function () {
            componentInstances[componentName] = this;
            const args = argumentsToArray(arguments);
            callDelegateMethod(componentId, componentName, 'lifetime', 'created', args);
        }
		return component;
	};


    // 创建原生组件
    const nativeComponents = {};
    let nativeGid = 0;
    function createNativeComponent () {
        Vue.component('native-textarea', {
            props: {
                value: String,
            },
            data() {
                const data = {};
                data.id = 0;
                data.cacheStyle = null;
                return data;
            },
            created() {
                this.id = nativeGid++;
                nativeComponents[this.id] = this;
            },
            methods: {
                getStyle() {
                    const el = this.$refs.el;
                    const style = {};
                    style.x = el.offsetLeft;
                    style.y = el.offsetTop;
                    style.width = el.offsetWidth;
                    style.height = el.offsetHeight;
                    return style;
                },
                rerender() {
                    const style = this.getStyle();
                    if(JSON.stringify(this.cacheStyle) === JSON.stringify(style)) {
                        return;
                    }
                    const componentId = this.id;
                    const componentName = 'native-textarea';
                    const methodName = 'rerender';
                    const args = {
                        style: this.getStyle(),
                    };
                    callUIMethod(componentId, componentName, 'normal', methodName, args);
                },
            },
            mounted() {
                const componentId = this.id;
                const componentName = 'native-textarea';
                const methodName = 'create';
                const style = this.getStyle();
                const args = {
                    value: this.value,
                    style,
                };
                this.cacheStyle = style;
                callUIMethod(componentId, componentName, 'normal', methodName, args);
            },
            template: '<div ref="el" :native-id="id"></div>',
        });
    }

    function initPages (components) {
        // 原生组件
        createNativeComponent(); 

		const routes = [];
        components.forEach(component => {
	        const route = { path: component.path, component: createComponent(component)};
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
        const { data } = notification;
        if (data && data.type === 'render') {
            initPages(data.data);
        }

        if (data && data.type === 'set-data') {
            const component = componentInstances[data.componentName];
            const newData = data.data;
            for (let key in newData) {
                component[key] = newData[key];
            }
        }
        if (data && data.type === 'event') {
            const component = nativeComponents[data.componentId];
            component.$emit(data.eventName, data.data);
        }
    });

    window.onload = function () {
        m.postNotification('jscore-0', 'webview-ready');
    }
}
try {
    __webviewBaseScript__(this);
    m.log(m.id);
} catch (e) {
    m.log(e);
}
