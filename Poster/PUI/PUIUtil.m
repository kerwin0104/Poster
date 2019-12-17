//
//  PUIUtil.m
//  Poster
//
//  Created by 办公 on 2019/12/17.
//  Copyright © 2019 办公. All rights reserved.
//

#import "PUIUtil.h"

@implementation PUIUtil

+ (NSString *) readScriptWithPath:(NSString *)path {
    NSString *filePath = [[NSBundle mainBundle] pathForResource:path ofType:@"js"];
    NSString *content = [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
    return content;
}

@end
