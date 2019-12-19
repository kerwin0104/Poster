(function (process) {
	let tunnel = process.tunnel;
	// 配置环境
	tunnel.setConfig({
		env: tunnel.envType.WEBVIEW,
	});
	// 发过来的消息都转化为全局事件
	tunnel.message.watch(function eventGlobalWatcher (message) {
		let messageObject;
		try {
			messageObject = JSON.parse(message);
		} catch (e) {};
		if (messageObject 
			&& messageObject.to === tunnel.envType.WEBVIEW 
			&& messageObject.body) {
			const messageBody = messageObject.body;
			if (messageBody.type) {
				tunnel.event.trigger(process, messageBody.type, messageBody.data);
			}
		}
	});
})(this);

