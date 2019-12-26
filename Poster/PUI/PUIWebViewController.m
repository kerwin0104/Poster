//
//  PUIWebViewController.m
//  Poster
//
//  Created by 办公 on 2019/12/3.
//  Copyright © 2019 办公. All rights reserved.
//

#import "PUIWebViewController.h"
#import "PUIUtil.h"

uint coverViewId = 0;
uint notificationId = 0;

@interface PUIWebViewController () <WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler>

@end

@implementation PUIWebViewController

- (instancetype)initWithURLString:(NSString *)urlString {
    self = [super init];
    if (self) {
        self.notificationId = [NSString stringWithFormat:@"webview-%u", notificationId++];
        _coverViewsWithKeyValue = [NSMutableDictionary dictionary];
        [self initWebView];
        [self loadURLWithString:urlString];
        
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onReceiveNotification:) name:@"pui-notification" object:nil];
    }
    return self;
}

/* 消息系统 */
- (void)onReceiveNotification:(NSNotification *)notification {
    [self disposeUserInfo:notification.userInfo];
}

- (void)disposeUserInfo:(NSDictionary *)userInfo {
    if ([userInfo[@"to"] isEqualToString:_notificationId]) {
        NSString *userInfoString = [PUIUtil parseNSDictionary2NSString:userInfo];
        NSString *evalScriptString = [NSString stringWithFormat:@"__$onReceiveNotification__(%@)", userInfoString];
        [_webview evaluateJavaScript:evalScriptString completionHandler:nil];
    }
}

- (void)postNotification:(NSDictionary *)userInfo {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"pui-notification" object:nil userInfo:userInfo];
}
/* /消息系统 */

/* 初始化webview */
- (void)initWebView {
    if (_webview == nil) {
        _webviewConfig = [[WKWebViewConfiguration alloc] init];
        _userContentController = [[WKUserContentController alloc] init];
        _webviewConfig.userContentController = _userContentController;
        
        [self addScriptMessageHandlers:_userContentController];
        [self injectWebViewBaseScript:_userContentController];
        [self injectReadyScript:_userContentController];
        
        _webview = [[WKWebView alloc] initWithFrame:self.view.bounds configuration:_webviewConfig];
        _webview.navigationDelegate = self;
        _webview.UIDelegate = self;
        [_webview addObserver:self forKeyPath:@"scrollView.contentSize" options:NSKeyValueObservingOptionNew context:@"WebKitContext"];
    }
}

- (void)addScriptMessageHandlers:(WKUserContentController *)userContentController {
    [userContentController addScriptMessageHandler:self name:@"notification"];
    
    [userContentController addScriptMessageHandler:self name:@"rpc"];
    [userContentController addScriptMessageHandler:self name:@"DocumentReady"];
}

- (void)injectWebViewBaseScript:(WKUserContentController *)userContentController {
    NSString *envSetterStr = [NSString stringWithFormat:@"this.__env__ = 'webview';this.__notificationId__='%@'", self.notificationId];
    WKUserScript *envSetterScript = [[WKUserScript alloc] initWithSource:envSetterStr injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
    [userContentController addUserScript:envSetterScript];
    
    NSString *baseStr = [PUIUtil readScriptWithPath:@"www/script/libs/base"];
    WKUserScript *baseScript = [[WKUserScript alloc] initWithSource:baseStr injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
    [userContentController addUserScript:baseScript];
    
    NSString *baseWebviewStr = [PUIUtil readScriptWithPath:@"www/script/libs/webview"];
    WKUserScript *baseWebviewScript = [[WKUserScript alloc] initWithSource:baseWebviewStr injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
    [userContentController addUserScript:baseWebviewScript];
}

- (void)injectReadyScript:(WKUserContentController *)userContentController {
    NSString *scriptString = @"window.webkit.messageHandlers.DocumentReady.postMessage('');";
    WKUserScript *readyScript = [[WKUserScript alloc] initWithSource:scriptString injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES];
    [userContentController addUserScript:readyScript];
}
// https://github.com/marcuswestin/WebViewJavascriptBridge
/* /初始化webview */


- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    NSArray *viewControllers = self.navigationController.viewControllers;
    if (viewControllers.count > 1 && [viewControllers objectAtIndex:viewControllers.count-2] == self) {
        NSLog(@"New view controller was pushed");
    } else if ([viewControllers indexOfObject:self] == NSNotFound) {
        NSLog(@"View controller was popped");
        [_userContentController removeScriptMessageHandlerForName:@"notification"];
        [_userContentController removeScriptMessageHandlerForName:@"rpc"];
        [_userContentController removeScriptMessageHandlerForName:@"DocumentReady"];
    }
}

//JS调用的OC回调方法
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message{
    if ([message.name isEqualToString:@"rpc"]) {
        NSString *body = message.body;
        NSData *data = [body dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
//        NSLog(@"rpc： %@", body);
        
        if ([[dict objectForKey:@"method"] isEqualToString:@"log"]) {
//            NSLog(@"js log: %@", [dict objectForKey:@"args"]);
        }
        
        if ([[dict objectForKey:@"method"] isEqualToString:@"navigateTo"]) {
            _cacheVC = [[PUIWebViewController alloc] initWithURLString:_url];
            [_cacheVC changeMiniProgramRoute:[dict objectForKey:@"args"]];
            [self.navigationController pushViewController:_cacheVC animated:YES];
        }
        
        if ([[dict objectForKey:@"method"] isEqualToString:@"layout-input"]) {
            PUITextField *input = [[PUITextField alloc] init];
            NSDictionary *style = [dict objectForKey:@"args"];
            float x = [[style objectForKey:@"x"] floatValue];
            float y = [[style objectForKey:@"y"] floatValue];
            float width = [[style objectForKey:@"width"] floatValue];
            float height = [[style objectForKey:@"height"] floatValue];
            [input setFrame:CGRectMake(x, y, width, height)];
            [input setBackgroundColor: [UIColor colorWithRed:1 green:0 blue:0 alpha:0.5]];
            input.autocorrectionType = UITextAutocapitalizationTypeNone;
//            [input becomeFirstResponder];
//            input.hidden = YES;
            [input addTarget:self action:@selector(inputValueChange:) forControlEvents:UIControlEventEditingChanged];
            [_webview.scrollView addSubview:input];
            
            NSString *viewId = [NSString stringWithFormat:@"view-id-%u", coverViewId++];
            input.viewId = viewId;
            [_coverViewsWithKeyValue setObject:input forKey:viewId];
            
            // 创建组件成功之后，给webview回调通知
            if ([dict objectForKey:@"callbackHandlerId"]) {
                NSString *handlerString = [NSString stringWithFormat:@"rpc.callCallbackWithId('%@', null, '%@')", [dict objectForKey:@"callbackHandlerId"], viewId];
                [_webview evaluateJavaScript:handlerString completionHandler:nil];
            }
        }
        if ([[dict objectForKey:@"method"] isEqualToString:@"update-view"]) {
            NSDictionary *args = [dict objectForKey:@"args"];
            if ([args isKindOfClass:[NSDictionary class]]) {
                NSString *viewId = [args objectForKey:@"viewId"];
                NSDictionary *style = [args objectForKey:@"style"];
                UIView *view = [_coverViewsWithKeyValue objectForKey:viewId];
                if ([view isKindOfClass:[UIView class]]  && [style isKindOfClass:[NSDictionary class]]) {
                    float x = [[style objectForKey:@"x"] floatValue];
                    float y = [[style objectForKey:@"y"] floatValue];
                    float width = [[style objectForKey:@"width"] floatValue];
                    float height = [[style objectForKey:@"height"] floatValue];
                    [view setFrame:CGRectMake(x, y, width, height)];
                    NSLog(@"update ............. view ...........");
                }
            }
        }
        
    } else if ([message.name isEqualToString:@"DocumentReady"]) {
        _isDocumentReady = YES;
//        [self sendMessageToWebview:@"{fsjd:dfds}"];
        [_webview evaluateJavaScript:[NSString stringWithFormat:@"location.href='#%@';", _miniProgramPath] completionHandler:nil];
    } else if ([message.name isEqualToString:@"notification"]) {
        [self postNotification:[PUIUtil parseNSStringToNSDictionary:message.body]];
    }
}

- (void)loadURLWithString:(NSString *)urlString {
    [self loadMiniProgramWithString:urlString];
    [_cacheVC loadURLWithString:urlString];
}

- (void) loadMiniProgramWithString:(NSString *)urlString {
    _isDocumentReady = NO;
    _url = urlString;
    NSString *filePath = [[NSBundle mainBundle] pathForResource:@"www/view" ofType:@"html"];
    NSURL *url = [NSURL fileURLWithPath:filePath];
    
    [_webview loadFileURL:url allowingReadAccessToURL:[NSURL fileURLWithPath:[NSBundle mainBundle].bundlePath]];
    [self.view addSubview:_webview];
}

- (void)changeMiniProgramRoute:(NSString *)pathString {
    _miniProgramPath = pathString;
    if (_isDocumentReady) {
        [_webview evaluateJavaScript:[NSString stringWithFormat:@"location.href='#%@';" ,pathString] completionHandler:nil];
    }
}






- (void)inputValueChange:(PUITextField *)puiTextField {
    NSLog(@"inputValueChange viewIdf: %@  value: %@", puiTextField.viewId, puiTextField.text);
    [_webview evaluateJavaScript:[NSString stringWithFormat:@"nativeViewEventCenter.trigger('%@', 'input', '%@');" , puiTextField.viewId, puiTextField.text] completionHandler:nil];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
    if (context == @"WebKitContext") {
        // NSLog(@"WebKitContext object %@ change %@", object, change);
//        [_webview evaluateJavaScript:[NSString stringWithFormat:@"nativeViewEventCenter.trigger('-9999', 'rerender');"] completionHandler:nil];
    } else {
        [super observeValueForKeyPath:keyPath ofObject:object change:change context:context];
    }
}

@end
