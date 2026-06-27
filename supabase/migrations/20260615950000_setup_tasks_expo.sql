-- Adds the "Mobile app (Expo / EAS)" steps to the admin Setup checklist:
-- how to turn a talent's downloaded Expo project (the WebView wrapper around
-- the live app at /a/<id>) into published iOS + Android apps via EAS.
-- Idempotent via seed_key.
insert into public.setup_tasks (seed_key, title, detail, category, env_var, link, sort_order) values
  ('expo-accounts', 'Create the store developer accounts',
   'Enroll in the Apple Developer Program ($99/yr) and register a Google Play Developer account ($25 one-time) under the Edge Zone business identity. Both are required before you can publish.',
   'mobile', null, 'https://developer.apple.com/programs/', 72),

  ('expo-eas-cli', 'Install EAS CLI and sign in',
   'Install Node 18+, then `npm i -g eas-cli` and `eas login` with the Edge Zone Expo account. (For CI/automated builds instead of a laptop, create an EXPO_TOKEN in expo.dev and set it in the build environment.)',
   'mobile', null, 'https://docs.expo.dev/build/setup/', 73),

  ('expo-download', 'Download + unpack a talent''s Expo project',
   'In Apps → the talent''s app, click "Download Expo ZIP". Unzip it and run `npm install`. The project is a WebView wrapper around the live app at /a/<id>, so no native code changes are needed.',
   'mobile', null, '/dashboard/apps', 74),

  ('expo-configure', 'Verify app identity in app.json',
   'Confirm name, slug, version, iOS bundleIdentifier, Android package, and the icon in app.json match the store listing. EDGEZONE_API_URL + EDGEZONE_APP_ID are pre-baked into the ZIP — just confirm they point at production.',
   'mobile', null, null, 75),

  ('expo-build', 'Build with EAS',
   'Run `eas build:configure`, then `eas build --platform ios` and `eas build --platform android`. EAS builds in the cloud and can generate/manage the signing credentials for both stores.',
   'mobile', null, 'https://docs.expo.dev/build/introduction/', 76),

  ('expo-submit', 'Submit the builds to the stores',
   'Run `eas submit -p ios` (needs an App Store Connect API key) and `eas submit -p android` (needs a Google Play service-account JSON). EAS uploads each build to App Store Connect / Play Console.',
   'mobile', null, 'https://docs.expo.dev/submit/introduction/', 77),

  ('expo-listing', 'Complete the store listings',
   'In App Store Connect + Play Console fill screenshots, description, category, age rating, and the privacy-policy URL. The app''s Publish tab generates listing copy + a privacy policy you can paste in.',
   'mobile', null, null, 78),

  ('expo-review', 'Submit for review, then release',
   'Submit each build for review (Apple ~1–3 days, Google hours–days). On approval, release to production. To ship an update later, re-run `eas build` + `eas submit` — app content updates live without a rebuild since it''s a WebView.',
   'mobile', null, null, 79)
on conflict (seed_key) do nothing;
