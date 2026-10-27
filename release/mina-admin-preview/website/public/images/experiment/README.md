# Championship photography slots

The Championship currently uses a local inline SVG student scene in `components/ExperimentVisual.tsx`.
It makes no broken image requests and is explicitly labeled as a placeholder.

Supply one owned/licensed hero photo here:

- `hero-students.jpg`: two or three college-age friends at a study desk, using a laptop and comparing a phone. Landscape, ideally at least 1600 × 1200. Avoid visible personal information or third-party logos. Keep the people centered enough for a mobile crop.

Then pass `imageSrc="/images/experiment/hero-students.jpg"` and a descriptive `imageAlt` to `ExperimentVisual` in `app/experiment/page.tsx`. The Next.js Image slot is already implemented.

Optional later supporting photo:

- `sleep-student.jpg`: a restful dorm/bedroom scene with a college-age student sleeping. Landscape, at least 1200 × 900. No slot is requested by the current page, so omitting this file never makes a broken request.

Do not present model/stock imagery as actual Flux Championship participants.

Prize images can later be placed locally and configured through `imageSrc` and `imageAlt` on each prize in `lib/championshipConfig.ts`. Prize name, value label, sponsor and competition category are also configurable. Leave optional fields unset until actual prizes and sponsors are confirmed.
