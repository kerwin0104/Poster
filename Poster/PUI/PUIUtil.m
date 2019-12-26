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

+ (NSDictionary *)parseNSStringToNSDictionary:(NSString *)jsonString {
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
}

+ (NSString *)parseNSDictionary2NSString:(NSDictionary *)dictionary {
    NSString *string;
    NSError *error;
    NSData *data = [NSJSONSerialization dataWithJSONObject:dictionary options:0 error:&error];
    if (!data) {
        NSLog(@"NSDictionary2NSString Error: %@", error);
    } else {
        string = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    }
    return string;
}

@end
