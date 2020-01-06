function __jscoreScript__ (process) {
    const util = {};
    process.util = util;
	
	const pageDescriptions = [];
	const componentControllers = {};

	function createPage (path) {
		return function (componentController) {
			componentControllers[path] = componentController;
            const componentDescription = createComponentDescription(path, componentController);
            pageDescriptions.push(componentDescription);
		};
	};
    util.createPage = createPage;

	function createComponentDescription (path, componentController) {
		const componentDescription = {};
		const methods = [];
		for (let key in componentController) {
			if (typeof componentController[key] === 'function') {
				methods.push(key);
			}
		};
		componentDescription.path = path;
		componentDescription.style = componentController.style;
		componentDescription.template = componentController.template;
		componentDescription.methods = methods;
		componentDescription.data = componentController.data;
		return componentDescription;
	}

	const componentInstances = {};
	function createComponentInstance (notification) {
        const webviewId = notification.from;
        const { componentId, componentName, type, methodName, args } = notification.data;
		const componentController = componentControllers[componentName];
		const componentInstance = Object.assign({}, componentController);
        componentInstance.__webviewId__ = webviewId;
        componentInstance.__componentId__ = componentId;
		componentInstance.data = JSON.parse(JSON.stringify(componentInstance.data || {}));
		componentInstance.setData = function (data, callback) {
			const newData = Object.assign({}, this.data, data);
            m.postNotification(this.__webviewId__, {
                type: 'set-data',
                componentId,
                componentName,
                data,
            });
		}
        componentInstances[`${webviewId}-${componentId}`] = componentInstance;
	}	

    function callInstanceMethod (notification) {
        const webviewId = notification.from;
        const { componentId, methodType, methodName, args } = notification.data;
        if (methodType === 'lifetime') {
            if (methodName === 'created') {
                createComponentInstance(notification);
            }
        } else {
            m.log('else .........');
            const componentInstance = componentInstances[`${webviewId}-${componentId}`];
            componentInstance[methodName].apply(componentInstance, args);
        }
    }

    m.watchNotification(notification => {
        const { data } = notification;
        if (notification.data === 'webview-ready') {
            const webviewId = notification.from;
            m.postNotification(webviewId, {
                type: 'render',
                data: pageDescriptions,
            });
        } else if (data && data.type === 'call-method') {
            try {
                callInstanceMethod(notification);
            } catch (e) {
                m.log(e);
            }
        }
    });

}
try {
    __jscoreScript__(this);
} catch (e) {
    m.log(e);
}
