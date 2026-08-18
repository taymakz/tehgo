# Release signing keystore — READ BEFORE DOING ANYTHING ELSE

`tehgo-release.keystore` is the signing key for TehGo's release builds. The credentials for it
live in `../keystore.properties` (repo root, next to `settings.gradle.kts`).

## This is irreplaceable

If you ever publish this app to the Play Store (or hand out a release APK signed with this key)
and then **lose this keystore or its password**, you can never again publish an update under the
same app identity — Google requires every update to be signed with the same key as the original
upload. There is no recovery process for a self-managed key. Treat it like you'd treat the only
copy of an important legal document.

## Do this now

1. **Back up both `tehgo-release.keystore` and `keystore.properties`** somewhere outside this
   folder — a password manager, encrypted cloud storage, or an external drive. Losing your whole
   laptop should not mean losing the ability to update TehGo.
2. **Do not** post either file anywhere public (GitHub, Discord, etc.) or send them over
   unencrypted channels.
3. If you ever set this project up under git, make sure both `keystore/` and
   `keystore.properties` are in `.gitignore` before your first commit.

## What's in here

- `tehgo-release.keystore` — PKCS12 keystore, alias `tehgo`, self-signed cert valid for
  ~27 years (10000 days) from generation.
- Store password and key password are the same value (PKCS12 requires this) — see
  `../keystore.properties`.

## Building a release APK later

```
./gradlew.bat :app:assembleRelease
```

Gradle picks up `keystore.properties` automatically (see `app/build.gradle.kts`) and signs the
output at `app/build/outputs/apk/release/app-release.apk`. If you'd rather submit an Android App
Bundle to the Play Store instead of a raw APK, run `:app:bundleRelease` instead — it uses the
same signing config.
