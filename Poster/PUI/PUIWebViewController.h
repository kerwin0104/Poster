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

@property (strong, nonatomic) PUIWebViewController *cacheVC;
@property (strong, nonatomic) WKWebView *webview;
@property (strong, nonatomic) WKWebViewConfiguration *webviewConfig;
@property (strong, nonatomic) WKUserContentController *userContentController;
@property (strong, nonatomic) WKUserScript *script;
@property (strong, nonatomic) NSString *url;
@property (strong, nonatomic) NSString *miniProgramPath;
@property (strong, nonatomic) NSMutableDictionary *coverViewsWithKeyValue;
@property bool isMiniProgram;
@property bool isDocumentReady;

- (instancetype) initWithURLString:(NSString *)urlString;
- (void) initWebView;
- (void) loadURLWithString:(NSString *)urlString;
- (void) loadMiniProgramWithString:(NSString *)urlString;
- (void) loadNormalWebPageWithString:(NSString *)urlString;
- (void) changeMiniProgramRoute:(NSString *)pathString;
- (void) inputValueChange:(PUITextField *)puiTextField;

@end

NS_ASSUME_NONNULL_END
