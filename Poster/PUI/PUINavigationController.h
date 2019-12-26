//
//  PUINavigationController.h
//  Poster
//
//  Created by 办公 on 2019/12/23.
//  Copyright © 2019 办公. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <JavaScriptCore/JavaScriptCore.h>

NS_ASSUME_NONNULL_BEGIN

@interface PUINavigationController : UINavigationController

@property (strong, nonatomic) NSString *notificationId;

@property (strong, nonatomic) JSContext *jsContext;

- (void)onReceiveNotification:(NSNotification *)notification;
- (void)postNotification:(NSDictionary *)userInfo;
- (void)disposeUserInfo:(NSDictionary *)userInfo;

- (void)loadMiniProgram;
- (void)initJSContext;

@end

NS_ASSUME_NONNULL_END
