package com.myapp.channel;

import android.content.Context;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.tencent.vasdolly.helper.ChannelReaderUtil;

public class ChannelModule extends ReactContextBaseJavaModule {

    public ChannelModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "Channel";
    }

    @ReactMethod
    public void getChannel(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            String channel = ChannelReaderUtil.getChannel(context);

            if (channel == null || channel.isEmpty()) {
                channel = "default-channel";
            }

            promise.resolve(channel);
        } catch (Throwable e) {
            promise.resolve("error");
        }
    }
}
