# Islands webview behavior contract

Decided in conversation on 2026-10-16. This contract covers the Webview card's resting image, local project launching, process ownership, recovery, and resource limits.

## The promise

A Webview card looks like the project and becomes the project when pressed. A person does not operate a server manager, read lifecycle labels, or keep another briizOS project running first.

briizOS owns this feature. qnav is useful prior art, but it is not imported, started, queried, or required. Deleting qnav must not change Islands.

## What appears in the card

The implementation has lifecycle states; the interface does not announce them.

- **At rest:** the card shows its last successful image. Before the first image exists, it shows the existing quiet Webview surface. The whole image is the open control.
- **While opening:** the resting image stays in place with restrained motion. There is no spinner, server badge, port, queue, or state sentence.
- **While open:** the real webview replaces the image. Its existing address, reload, external-open, and return-to-preview controls remain available.
- **When opening fails:** the card shows the SF Symbols ladybug and `Retry?` as one large clickable treatment. No error prose appears on the card. The quiet gear in the address bar remains available to choose a different launch.
- **Technical detail:** launch evidence, process output, timing, release, capture, and errors go to the Log Panel.

The Retry treatment is not a modal and does not cover the rest of Islands. Pressing it repeats the same explicit open action.

## Two kinds of Webview card

### Project-backed

When an island has a project folder and the card has not been deliberately changed to ordinary URL mode, pressing the card asks briizOS to open that folder as a web project.

The project folder remains the identity. Temporary ports, process IDs, and live URLs are never saved into the Island.

Media is evidence, not identity. Adding a file to an existing Island never changes its project folder. Dropping an actual folder to create an Island may establish that folder; choosing a folder explicitly may change it.

### Ordinary URL

A card containing an ordinary web address keeps working without the project runtime. Entering an address deliberately changes that card to URL mode. It still rests as an image and opens only when pressed.

## When automatic opening is wrong

The Webview gear opens `Choose what this opens` inside the card. It lets the person choose the project folder, direct start command, working folder, and local address. `{PORT}` may appear in the command and address so briizOS can provide a free port.

`Try & remember` launches the choice first. The Island saves it only after the page answers. The choice belongs to the Island rather than one card, so every Webview sees the same project memory and Island agents receive it in their project context. `Use automatic` likewise replaces a remembered choice only after automatic opening succeeds.

## Execution boundary

Pressing the resting project image or Retry is the explicit instruction to run that project's recognized local preview command. Merely seeing, selecting, moving, zooming past, or opening an Island never executes a command.

briizOS may automatically run a recognized local Vite, Next.js, Create React App, Flask, or static-web launch. It must not install dependencies, rewrite project files, run build commands, or guess at destructive/custom shell commands. A manually remembered launch is parsed as one direct command rather than evaluated as shell syntax. Unsupported projects fail closed and explain why in Logs.

## Runtime ownership

The runtime lives in Electron's Main process, beside the existing Island terminal ownership. The renderer receives only a temporary loopback URL and safe lifecycle results through the preload bridge.

For a project-backed card, the runtime:

1. Validates the linked folder.
2. Uses an existing static build/page when that is the safe runnable choice, or recognizes a supported development command.
3. Chooses a free loopback port.
4. Starts one owned process group or one owned static server.
5. Waits for the page to answer before giving its URL to the card.
6. Reuses the same ready project when another card asks for it.
7. Releases and eventually stops it when no card is using it.
8. Terminates every owned child when briizOS quits.

Processes that briizOS did not start are never stopped.

## Resource rules

- At most **two** local project previews are kept ready at once.
- A project currently displayed by a card is protected.
- A released project stays warm for **two minutes** so briefly returning feels immediate.
- When another project needs room, the oldest released project stops immediately instead of exposing a capacity queue.
- If both slots are actively displayed, the new card remains on its image until room exists; leaving either live card lets it continue.
- Leaving the visible desk, returning to the image, removing the card, or closing briizOS releases that card's use.

These values are product parameters, not card settings.

## Resting image

After a local or ordinary webview successfully loads, briizOS captures the card's own webview. It does not launch Chromium or Playwright and does not depend on qnav's capture catalog.

The image belongs to briizOS and is stored under its Island application-data folder. The card saves only the returned image path and capture time. A failed capture leaves the previous useful image untouched.

## Saved card data

Allowed durable fields:

- `url`: the person's ordinary address, when used.
- `previewMode`: `project` or `url` after the person has made that choice.
- `previewPath`: the latest successful image owned by briizOS.
- `previewCapturedAt`: when that image was made.

Never save a runtime port, child-process ID, temporary live URL, readiness state, or failure state.

The Island itself may save one shared `webLaunch` object containing `commandLine`, `cwd`, `urlTemplate`, and `updatedAt`. It is separate from card data and is used only after an explicit press opens a project-backed Webview.

## Implementation sequence

1. Add the owned Main-process preview runtime and its preload bridge.
2. Make the Webview card rest on an image and wake only from an explicit press.
3. Capture the loaded webview and return to that image when asked or when it leaves view.
4. Add the ladybug Retry treatment and Log Panel evidence.
5. Connect card removal and app shutdown to release/termination.
6. Refine the complete visual interaction in the existing Islands theme system.

## Acceptance

- Looking at an Island never starts its project.
- Pressing a project-backed card starts a supported project without a Terminal card or qnav.
- Adding media never silently changes the Island's project folder.
- Flask projects such as Chromap receive an owned dynamic-port launch without changing their source.
- A person can teach an uncertain project how to open, prove the choice, and remember it for the Island.
- The resting image remains visible while the project opens.
- A successful project becomes interactive in the same card.
- Returning to preview removes the live webview and preserves its useful image.
- A failure shows only the ladybug Retry treatment in the card; Logs contain the actual reason and next step.
- Ordinary web addresses continue to work.
- Several cards for one project share one runtime.
- Opening additional projects never exceeds the limit and never stops an actively displayed project.
- Removing a card, leaving the desk, and quitting briizOS do not leave owned processes behind.

