//
//  PUIWebViewController.h
//  Poster
//
//  Created by 办公 on 2019/12/3.
//  Copyright © 2019 办公. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import "PUITextField.h"

NS_ASSUME_NONNULL_BEGIN

@interface PUIWebViewController : UIViewController

@property (strong, nonatomic) NSString *notificationId;

@property (strong, nonatomic) PUIWebViewController *cacheVC;
@property (strong, nonatomic) WKWebView *webview;
@property (strong, nonatomic) WKWebViewConfiguration *webviewConfig;
@property (strong, nonatomic) WKUserContentController *userContentController;
@property (strong, nonatomic) NSMutableDictionary *reinforcedUIs;

@property (strong, nonatomic) NSString *url;
@property (strong, nonatomic) NSString *miniProgramPath;
@property (strong, nonatomic) NSMutableDictionary *coverViewsWithKeyValue;
@property bool isDocumentReady;

- (void)postNotification:(NSDictionary *)userInfo;
- (void)onReceiveNotification:(NSNotification *)notification;
- (void)disposeUserInfo:(NSDictionary *)userInfo;

- (void)disposeReinforcedUI:(NSDictionary *)userInfo;
- (void)createReinforcedUI:(NSDictionary *)userInfo;
- (void)renderReinforcedUI:(NSDictionary *)userInfo; 


- (instancetype) initWithURLString:(NSString *)urlString;
- (void) initWebView;
- (void) addScriptMessageHandlers:(WKUserContentController *)userContentController;
- (void) injectWebViewBaseScript:(WKUserContentController *)userContentController;
- (void) injectReadyScript:(WKUserContentController *)userContentController;

- (void) loadURLWithString:(NSString *)urlString;
- (void) loadMiniProgramWithString:(NSString *)urlString;
- (void) changeMiniProgramRoute:(NSString *)pathString;
- (void) inputValueChange:(PUITextField *)puiTextField;

@end

NS_ASSUME_NONNULL_END
