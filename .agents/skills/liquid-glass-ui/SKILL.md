---
name: liquid-glass-ui
description: Create, modify, redesign, or polish CareerMatch frontend pages, React components, styles, and interaction states in the Job Match Agent project. Apply its Liquid Glass-inspired visual system using the existing Next.js, TypeScript, and Tailwind CSS setup. Frontend work only.
---

# CareerMatch Liquid Glass UI

## Activation and scope

Apply this skill to each CareerMatch frontend change, including small component and state updates. Inspect the affected routes, theme, primitives, and data bindings first. Reuse the project's Next.js, React, TypeScript, and Tailwind setup and follow its existing client/server boundaries.

Preserve Gemini orchestration, Supabase business logic, eligibility, API contracts, database schema, authentication, and the SRM Hackathon stack. Keep any strictly necessary integration adjustment small and preserve existing behavior and contracts. Source job data, match scores, shortlist state, and agent activity from their existing application bindings.

## Material and interaction

- Put glass on floating navigation, the chat composer, floating controls, and select overlays. Give job cards, transcript content, and forms stable, mostly opaque reading surfaces. Use layered depth to communicate which surfaces float and which hold content.
- Centralize recurring values in theme-aware CSS tokens for canvas, solid surface, glass tint, opaque fallback, luminous edge, text, focus, elevation, blur, and motion. Reuse existing Tailwind utilities and component primitives. Extract new utilities or primitives when multiple surfaces need the same behavior.
- Start with an opaque surface. Inside an `@supports` query for backdrop filtering, combine a sufficiently tinted fill with modest blur and saturation. Use a subtle static gradient or inset highlight for diffusion and reflection. Keep the edge highlight and shadow soft enough that text and actions lead.
- Tune light and dark themes independently. Check text, chips, and icons against the actual background at rest and while scrolling. Use opaque surfaces for reduced transparency and system colors or visible outlines in forced-colors mode. Support `prefers-reduced-transparency` where available and keep `prefers-contrast: more` usable.
- Use restrained, spring-like easing on short transform and opacity transitions. Give hover, focus-visible, pressed, selected, disabled, loading, and error states distinct feedback. Respect `prefers-reduced-motion` by removing decorative movement while keeping state changes clear. Keep blur static and confined to a few bounded layers. Avoid nested blur, continuous effects, pointer tracking, and new rendering or UI frameworks.
- Use original styling and existing project assets. Favor rounded surfaces and pills for compact controls without flattening the hierarchy. Keep decorative layers out of focus order and hit testing.

## CareerMatch surfaces

| Surface | Design decisions |
| --- | --- |
| Navigation | Use a floating sidebar or top bar with a clear active pill and `aria-current="page"`. Keep destination labels and keyboard focus visible when the layout collapses. |
| AI Chat | Use a legible transcript and a floating composer with visible send and disabled states. Keep the latest message reachable above the composer and mobile keyboard. Show real typing, pending, and failure states with concise accessible status text. |
| Job Discovery | Keep role and employer easy to scan. Present the existing match score as readable text, with color or a meter as secondary cues. Wrap skill chips and keep job actions accessible by keyboard and touch. |
| Student Profile | Group fields and skills into stable reading surfaces. Preserve field labels, validation, and save feedback as read and edit states change. |
| My Shortlist | Keep saved-job actions clear. Distinguish loading, failure, and an empty shortlist. Give the empty state a direct path to Job Discovery where the route exists. |
| AI Agent Activity | Use an expandable panel driven by genuine Gemini tool events already exposed to the frontend. Show only statuses and timing supported by those events. If no events are available, show an honest empty or unavailable state. Keep prompts, internal reasoning, secrets, and sensitive tool payloads out of the panel. |
| Dialogs and Popovers | Reuse accessible primitives. Preserve labels, Escape dismissal, and trigger focus restoration. Trap focus only in modal dialogs. Ensure overlay content stays legible, scrollable, and within the mobile viewport. |

## Verify in the app

- Inspect touched routes at 360 CSS pixels and a desktop width. Check long job titles, wrapped skill chips, overflow, touch targets, and overlap from floating controls or the on-screen keyboard.
- Exercise keyboard navigation and applicable loading, empty, error, and success states. Inspect contrast, light and dark themes, visible focus, reduced motion, and opaque fallbacks. Aim for at least 4.5:1 for normal text and 3:1 for large text and essential control boundaries.
- Check scrolling and interactions for excessive paint work, especially with long chats and job lists. Run the repository's available build, type, and lint checks and report any unverified states.
