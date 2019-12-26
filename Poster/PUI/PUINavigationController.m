//
//  PUINavigationController.m
//  Poster
//
//  Created by 办公 on 2019/12/23.
//  Copyright © 2019 办公. All rights reserved.
//

#import "PUINavigationController.h"
#import "PUIWebViewController.h"
#import "PUIUtil.h"

@interface PUINavigationController ()

@end

@implementation PUINavigationController 

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.notificationId = [NSString stringWithFormat:@"jscore-%u", 0];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onReceiveNotification:) name:@"pui-notification" object:nil];
    [self initJSContext];
}


- (void)onReceiveNotification:(NSNotification *)notification {
    [self disposeUserInfo:notification.userInfo];
}

- (void)disposeUserInfo:(NSDictionary *)userInfo {
    if ([userInfo[@"to"] isEqualToString:@"log"]) {
        NSLog(@"%@", userInfo);
    }
    if ([userInfo[@"to"] isEqualToString:_notificationId]) {
        NSString *userInfoString = [PUIUtil parseNSDictionary2NSString:userInfo];
        NSString *evalScriptString = [NSString stringWithFormat:@"__$onReceiveNotification__(%@);", userInfoString];
        [_jsContext evaluateScript:evalScriptString];
    }
}

- (void)postNotification:(NSDictionary *)userInfo {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"pui-notification" object:nil userInfo:userInfo];
}


- (void)loadMiniProgram {
    PUIWebViewController *rvc = [[PUIWebViewController alloc] initWithURLString:@"miniprogram://example"];
    [rvc changeMiniProgramRoute:@"/home"];
    [self pushViewController:rvc animated:NO];
}

/* 初始化jscore */
- (void)initJSContext {
    __weak typeof(self) weakSelf = self;
    _jsContext = [[JSContext alloc] init];
    _jsContext.exceptionHandler = ^(JSContext *context, JSValue *exceptionValue) {
        NSLog(@"JSCore异常：%@", exceptionValue);
    };
    _jsContext[@"__postNotification__"] = ^(NSString *userInfoString){
        if (weakSelf != nil) {
            NSDictionary *userInfo = [PUIUtil parseNSStringToNSDictionary:userInfoString];
            [weakSelf postNotification:userInfo];
        }
    };
    NSString *envSetterStr = [NSString stringWithFormat:@"this.__env__ = 'jscore';this.__notificationId__='%@'", _notificationId];
    [_jsContext evaluateScript:envSetterStr];
    NSString *baseStr = [PUIUtil readScriptWithPath:@"www/script/libs/base"];
    [_jsContext evaluateScript:baseStr];
    NSString *baseJSCoreStr = [PUIUtil readScriptWithPath:@"www/script/libs/jscore"];
    [_jsContext evaluateScript:baseJSCoreStr];
    NSString *miniprogramStr = [PUIUtil readScriptWithPath:@"miniprogram/test/main"];
    [_jsContext evaluateScript:miniprogramStr];
    
}
/* /初始化jscore */

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"pui-notification" object:nil];
}

@end
