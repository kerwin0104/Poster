//
//  PUIWebViewController.h
//  Poster
//
//  Created by 办公 on 2019/12/3.
//  Copyright © 2019 办公. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <JavaScriptCore/JavaScriptCore.h>
#import "PUITextField.h"

NS_ASSUME_NONNULL_BEGIN

@interface PUIWebViewController : UIViewController

@property (strong, nonatomic) PUIWebViewController *cacheVC;
@property (strong, nonatomic) WKWebView *webview;
@property (strong, nonatomic) WKWebViewConfiguration *webviewConfig;
@property (strong, nonatomic) WKUserContentController *userContentController;
@property (strong, nonatomic) JSContext *jsContext;
@property (strong, nonatomic) NSString *url;
@property (strong, nonatomic) NSString *miniProgramPath;
@property (strong, nonatomic) NSMutableDictionary *coverViewsWithKeyValue;
@property bool isMiniProgram;
@property bool isDocumentReady;

- (instancetype) initWithURLString:(NSString *)urlString;
- (void) initWebView;
- (void) addScriptMessageHandlers:(WKUserContentController *)userContentController;
- (void) injectWebViewBaseScript:(WKUserContentController *)userContentController;
- (void) injectReadyScript:(WKUserContentController *)userContentController;

- (void) initJSContext;

- (void) dispenseMessage:(NSString *)message;
- (void) sendMessageToWebview:(NSString *)message;
- (void) sendMessageToJSContext:(NSString *)message;
- (void) sendMessageToNative:(NSString *)message;

- (void) loadURLWithString:(NSString *)urlString;
- (void) loadMiniProgramWithString:(NSString *)urlString;
- (void) loadNormalWebPageWithString:(NSString *)urlString;
- (void) changeMiniProgramRoute:(NSString *)pathString;
- (void) inputValueChange:(PUITextField *)puiTextField;

@end

NS_ASSUME_NONNULL_END
