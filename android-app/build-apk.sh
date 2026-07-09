#!/bin/sh
# Rebuilds BagShopLPO.apk (WebView wrapper around the LPO web app).
# Needs the JDK in ~/.local/jdk and Android SDK in ~/.local/android-sdk
# (both already installed). Output: ~/Downloads/BagShopLPO.apk
set -e
cd "$(dirname "$0")"
export JAVA_HOME=$HOME/.local/jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
BT=$HOME/.local/android-sdk/build-tools/34.0.0
AJ=$HOME/.local/android-sdk/platforms/android-34/android.jar

rm -rf obj bin && mkdir -p obj bin
javac -classpath "$AJ" -source 1.8 -target 1.8 -d obj src/com/bagshop/lpo/MainActivity.java
"$BT/d8" --release --lib "$AJ" --output bin obj/com/bagshop/lpo/*.class
"$BT/aapt" package -f -M AndroidManifest.xml -S res -I "$AJ" -F bin/base.apk
cd bin
"$BT/aapt" add base.apk classes.dex
"$BT/zipalign" -f 4 base.apk aligned.apk
"$BT/apksigner" sign --ks ../signing.keystore --ks-pass pass:bagshop123 --out BagShopLPO.apk aligned.apk
cp BagShopLPO.apk "$HOME/Downloads/BagShopLPO.apk"
echo "Done: ~/Downloads/BagShopLPO.apk"
