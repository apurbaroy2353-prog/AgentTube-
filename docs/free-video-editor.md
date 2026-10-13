# Free browser video editor

Open /#free-editor. No login or paid AI is required for local rendering.

Select 1–20 owned/licensed images or video clips (150 MB total maximum), optionally select one audio track, and enter one short caption per line. Choose 3–120 seconds and vertical 720x1280 or landscape 1280x720 output. The displayed file order determines scene order. Scenes have equal durations; video clips loop or are cut to fit. Source clip sound is muted; only the selected separate audio track is mixed. Captions display sequentially; keep each line short.

Keep the tab visible while recording. Cancel or hiding the tab stops the operation without exporting a partial file. Rendering takes approximately the output duration. The result is a downloadable WebM video with corrected duration metadata, not MP4. Browser codec support varies; unsupported inputs fail with an error. Desktop Chrome or Edge is recommended. Media stays in the browser and is not sent to the server. Reloading clears the local editor files and export. Logged-in users can save a manual script with their Supabase draft and copy it into this editor.

YouTube publishing is manual through YouTube Studio. Cloud AI generation remains disabled. No fabricated analytics are shown.

Vendor: fix-webm-duration 1.0.6 by Yury Sitnikov, MIT, included under cloud/vendor with license. Bengali font uses Google Fonts with system fallback.

Verification: headless Chromium exported a 3-second image slideshow with audio, a landscape WebM clip, and handled cancellation. FFprobe verified 720x1280 video plus audio and duration 3.018 seconds. FFmpeg decoded the final export without errors. The test Chromium distribution did not decode H.264 MP4; users must use a browser supporting their input codec.
