// briizy-helper — supervised native capture/OCR helper for briizOS.
//
// Contract (PLAN-BRIIZY.md I5): this is a persistent CHILD PROCESS, not a
// daemon. It speaks newline-delimited JSON over stdio, is spawned and killed
// by the Electron main process, performs no network I/O of any kind, takes no
// action on the user's behalf, and exits the moment its parent goes away
// (stdin EOF or a changed parent pid).
//
// It owns exactly one durable thing (I4): the JPEG files it is told to write.
// Every piece of metadata is handed back to Electron, which owns the database.
//
// Protocol
//   in : {"id":1,"cmd":"meta"}
//        {"id":2,"cmd":"capture","out":"/abs/path.jpg","mode":"window","ocr":true}
//        {"id":3,"cmd":"ocr","path":"/abs/path.jpg"}
//        {"id":4,"cmd":"ping"}
//        {"id":5,"cmd":"encode","frames":["/a.jpg",…],"out":"/chunk.mov","fps":6}
//        {"id":6,"cmd":"extract","path":"/chunk.mov","index":12,"out":"/frame.jpg"}
//        {"id":7,"cmd":"windows"}                       — enumerate capturable windows
//        {"id":8,"cmd":"capture","out":"…","windowId":42} — capture ONE named window
//
// `capture` with an explicit `windowId` reads only that window's own pixels;
// ScreenCaptureKit composites the window independently of what is in front of
// it, so nothing else on the display is ever read. That is what makes the
// capture path testable against a window the test itself owns.
//   out: {"id":1,"ok":true,"result":{…}}
//        {"id":1,"ok":false,"error":"…","code":"…"}
//        {"event":"ready","version":"1","protocol":1}   (unsolicited, once)
//
// Coordinates in OCR blocks are normalized 0–1 with a TOP-LEFT origin (Vision's
// bottom-left origin is flipped here) so the renderer can use them directly.

import AVFoundation
import AppKit
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO
import ScreenCaptureKit
import UniformTypeIdentifiers
import Vision

// MARK: - Constants

let kProtocolVersion = 1
let kHelperVersion = "1"
let kMaxDimension: CGFloat = 3000
let kJpegQuality: CGFloat = 0.8
/// SCShareableContent enumerates every on-screen window through the
/// WindowServer. Calling it on every tick contends with other capture apps and
/// stalls the UI, so a recent snapshot is reused (omi ScreenCaptureService.swift:39–48).
let kSharedContentTTL: TimeInterval = 5.0

// MARK: - stdout plumbing

let stdoutLock = NSLock()

/// Write one JSON line to stdout. All helper output is machine-readable; human
/// diagnostics go to stderr so they land in the terminal running the app
/// without corrupting the protocol stream.
func emit(_ object: [String: Any]) {
  guard let data = try? JSONSerialization.data(withJSONObject: object, options: []) else { return }
  stdoutLock.lock()
  FileHandle.standardOutput.write(data)
  FileHandle.standardOutput.write("\n".data(using: .utf8)!)
  stdoutLock.unlock()
}

func trace(_ message: String) {
  FileHandle.standardError.write("[briizy-helper] \(message)\n".data(using: .utf8)!)
}

func respond(id: Int?, result: [String: Any]) {
  var payload: [String: Any] = ["ok": true, "result": result]
  if let id { payload["id"] = id }
  emit(payload)
}

func respond(id: Int?, error: String, code: String = "HELPER_ERROR") {
  var payload: [String: Any] = ["ok": false, "error": error, "code": code]
  if let id { payload["id"] = id }
  emit(payload)
}

// MARK: - Shareable content cache

final class ContentCache {
  static let shared = ContentCache()
  private let lock = NSLock()
  private var cached: SCShareableContent?
  private var cachedAt: Date?

  func content(forceRefresh: Bool = false) async throws -> SCShareableContent {
    if !forceRefresh {
      let hit: SCShareableContent? = lock.withLock {
        guard let at = cachedAt, Date().timeIntervalSince(at) < kSharedContentTTL else { return nil }
        return cached
      }
      if let hit { return hit }
    }
    let fresh = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
    lock.withLock {
      cached = fresh
      cachedAt = Date()
    }
    return fresh
  }
}

// MARK: - Active window resolution

struct ActiveWindow {
  var appName: String?
  var bundleId: String?
  var windowTitle: String?
  var windowId: CGWindowID?
  var bounds: CGRect?
  /// True when the title came from the Accessibility API rather than the
  /// window-list heuristic. Accessibility is optional; it only improves titles.
  var titleFromAccessibility: Bool
}

@_silgen_name("_AXUIElementGetWindow")
func _AXUIElementGetWindow(_ element: AXUIElement, _ windowID: UnsafeMutablePointer<CGWindowID>) -> AXError

/// Ask the Accessibility API for the app's focused window. Returns nil whenever
/// AX is unavailable or denied — never throws, never blocks on a prompt.
func accessibilityWindow(pid: pid_t) -> (title: String?, windowId: CGWindowID?, bounds: CGRect?)? {
  guard AXIsProcessTrusted() else { return nil }
  let appElement = AXUIElementCreateApplication(pid)

  var focused: CFTypeRef?
  guard AXUIElementCopyAttributeValue(appElement, kAXFocusedWindowAttribute as CFString, &focused) == .success,
    let focusedRef = focused,
    CFGetTypeID(focusedRef) == AXUIElementGetTypeID()
  else { return nil }
  let windowElement = focusedRef as! AXUIElement

  var titleValue: CFTypeRef?
  AXUIElementCopyAttributeValue(windowElement, kAXTitleAttribute as CFString, &titleValue)
  let title = titleValue as? String

  var windowId: CGWindowID = 0
  let idResult = _AXUIElementGetWindow(windowElement, &windowId)

  var bounds: CGRect?
  var positionValue: CFTypeRef?
  var sizeValue: CFTypeRef?
  if AXUIElementCopyAttributeValue(windowElement, kAXPositionAttribute as CFString, &positionValue) == .success,
    AXUIElementCopyAttributeValue(windowElement, kAXSizeAttribute as CFString, &sizeValue) == .success,
    let positionRef = positionValue, let sizeRef = sizeValue,
    CFGetTypeID(positionRef) == AXValueGetTypeID(), CFGetTypeID(sizeRef) == AXValueGetTypeID()
  {
    var point = CGPoint.zero
    var size = CGSize.zero
    if AXValueGetValue(positionRef as! AXValue, .cgPoint, &point),
      AXValueGetValue(sizeRef as! AXValue, .cgSize, &size)
    {
      bounds = CGRect(origin: point, size: size)
    }
  }

  return (title, idResult == .success && windowId != 0 ? windowId : nil, bounds)
}

/// Resolve the window the user is visually working in: the frontmost NORMAL
/// window (layer 0) in stacking order.
///
/// `frontmostApplication` (app activation) is deliberately NOT the primary
/// signal, because activation lies in two ways that matter here:
///   - Reading and wheel-scrolling never re-activate an app on macOS, so the
///     last-clicked app stays "active" through minutes of work elsewhere.
///   - briizy's own invisible always-on-top overlay activates briizOS when the
///     avatar is clicked, poisoning activation entirely (observed 2026-07-27:
///     capture reported "briizOS own window" all day while the user read
///     Chrome, and the Dock — briefly "active" per click — was the only thing
///     ever photographed).
/// The Dock, the menu bar, and briizy's overlay all live on layers above 0, so
/// under this resolution they structurally cannot be the answer.
func resolveActiveWindow() -> ActiveWindow {
  let frontApp = NSWorkspace.shared.frontmostApplication

  guard
    let windowList = CGWindowListCopyWindowInfo(
      [.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]]
  else {
    // No window list at all — activation identity is the only signal left.
    return ActiveWindow(appName: frontApp?.localizedName, bundleId: frontApp?.bundleIdentifier,
                        windowTitle: nil, windowId: nil, bounds: nil,
                        titleFromAccessibility: false)
  }

  // The list is front-to-back; the first layer-0 window of real size that is
  // not invisible is what the user sees on top.
  var top: (pid: Int32, windowId: CGWindowID, title: String?, bounds: CGRect)?
  for window in windowList {
    guard let layer = window[kCGWindowLayer as String] as? Int, layer == 0,
      let ownerPid = window[kCGWindowOwnerPID as String] as? Int32,
      let windowNumber = window[kCGWindowNumber as String] as? CGWindowID,
      let boundsDict = window[kCGWindowBounds as String] as? [String: CGFloat],
      let x = boundsDict["X"], let y = boundsDict["Y"],
      let width = boundsDict["Width"], let height = boundsDict["Height"],
      width > 100, height > 100
    else { continue }
    if let alpha = window[kCGWindowAlpha as String] as? CGFloat, alpha < 0.05 { continue }
    top = (ownerPid, windowNumber,
           window[kCGWindowName as String] as? String,
           CGRect(x: x, y: y, width: width, height: height))
    break
  }

  guard let topWindow = top else {
    // Bare desktop — nothing capturable. Name the active app for the log, but
    // return no window id so no capture is attempted.
    return ActiveWindow(appName: frontApp?.localizedName, bundleId: frontApp?.bundleIdentifier,
                        windowTitle: nil, windowId: nil, bounds: nil,
                        titleFromAccessibility: false)
  }

  let owner = NSRunningApplication(processIdentifier: topWindow.pid)
  let appName = owner?.localizedName
  let bundleId = owner?.bundleIdentifier

  // When the top normal window belongs to the app that is also active,
  // Accessibility gives richer titles and tracks the focused window within it.
  if let frontApp, frontApp.processIdentifier == topWindow.pid,
     let ax = accessibilityWindow(pid: topWindow.pid), ax.windowId != nil || ax.title != nil {
    return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: ax.title ?? topWindow.title,
                        windowId: ax.windowId ?? topWindow.windowId,
                        bounds: ax.bounds ?? topWindow.bounds, titleFromAccessibility: true)
  }

  return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: topWindow.title,
                      windowId: topWindow.windowId, bounds: topWindow.bounds,
                      titleFromAccessibility: false)
}

// MARK: - Perceptual hash

/// 64-bit difference hash over a 9x8 grayscale downscale. Localized change
/// (caret blink, spinner, clock tick) moves 1–4 bits; real content change moves
/// 10+ (omi RewindOCRService.swift:96–121). Electron compares Hamming distance.
func dHash(of cgImage: CGImage) -> UInt64 {
  let w = 9, h = 8
  guard
    let ctx = CGContext(
      data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue)
  else { return 0 }

  ctx.interpolationQuality = .low
  ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: w, height: h))
  guard let data = ctx.data else { return 0 }
  let pixels = data.assumingMemoryBound(to: UInt8.self)

  var hash: UInt64 = 0
  for row in 0..<h {
    for col in 0..<(w - 1) {
      let idx = row * w + col
      if pixels[idx] > pixels[idx + 1] {
        hash |= 1 << (row * (w - 1) + col)
      }
    }
  }
  return hash
}

// MARK: - Capture

enum HelperError: Error {
  case noActiveWindow
  case windowGone
  case encodeFailed
  case invalidImage
  case permissionDenied
  case unsupported(String)
}

func scaledConfiguration(for size: CGSize) -> SCStreamConfiguration {
  let config = SCStreamConfiguration()
  config.scalesToFit = true
  config.showsCursor = false
  let aspect = size.height > 0 ? size.width / size.height : 1
  var width = min(size.width, kMaxDimension)
  var height = aspect > 0 ? width / aspect : width
  if height > kMaxDimension {
    height = kMaxDimension
    width = height * aspect
  }
  config.width = max(1, Int(width))
  config.height = max(1, Int(height))
  return config
}

/// Is this window safe to build an SCContentFilter from?
///
/// `SCContentFilter(desktopIndependentWindow:)` calls SkyLight's
/// `SLSGetDisplaysWithRect`, which does not fail gracefully on a degenerate or
/// off-display rect — it trips an assertion and `abort()`s the whole process.
/// SIGABRT cannot be caught, so the only defence is to never hand it such a
/// window. Anything rejected here is reported as WINDOW_GONE and skipped.
func isFilterSafe(_ window: SCWindow) -> Bool {
  let frame = window.frame
  guard frame.origin.x.isFinite, frame.origin.y.isFinite,
    frame.size.width.isFinite, frame.size.height.isFinite
  else { return false }
  // Zero and sub-pixel rects are what actually trip the assertion.
  guard frame.size.width >= 2, frame.size.height >= 2 else { return false }
  // A window on no display — minimized, or on another Space — has no rect for
  // SLSGetDisplaysWithRect to resolve.
  guard window.isOnScreen else { return false }
  // Sanity bound: a rect far outside any plausible display geometry is bogus.
  guard abs(frame.origin.x) < 200_000, abs(frame.origin.y) < 200_000,
    frame.size.width < 200_000, frame.size.height < 200_000
  else { return false }
  return true
}

func captureWindowImage(windowId: CGWindowID, bundleId: String?) async throws -> CGImage {
  var content = try await ContentCache.shared.content()
  if !content.windows.contains(where: { $0.windowID == windowId }) {
    content = try await ContentCache.shared.content(forceRefresh: true)
  }
  // ScreenCaptureKit object graphs accumulate in the cooperative thread pool,
  // which does not drain autorelease pools between tasks.
  let prepared: (SCContentFilter, SCStreamConfiguration)? = autoreleasepool {
    var target = content.windows.first(where: { $0.windowID == windowId })

    if let candidate = target, !isFilterSafe(candidate) {
      trace("window \(windowId) is unsafe to filter: frame=\(candidate.frame) onScreen=\(candidate.isOnScreen)")
      target = nil
    }

    // The Accessibility API can name a focused window that is minimized, on
    // another Space, or zero-sized. Rather than skip the tick entirely, fall
    // back to the same app's largest on-screen window — the same heuristic the
    // metadata path uses when AX is unavailable.
    if target == nil, let bundleId, !bundleId.isEmpty {
      target = content.windows
        .filter { $0.owningApplication?.bundleIdentifier == bundleId && isFilterSafe($0) }
        .max(by: { $0.frame.width * $0.frame.height < $1.frame.width * $1.frame.height })
      if let fallback = target {
        trace("falling back to window \(fallback.windowID) for \(bundleId)")
      }
    }

    guard let window = target else { return nil }
    return (SCContentFilter(desktopIndependentWindow: window), scaledConfiguration(for: window.frame.size))
  }
  guard let (filter, config) = prepared else { throw HelperError.windowGone }
  return try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
}

func captureDisplayImage() async throws -> CGImage {
  let content = try await ContentCache.shared.content(forceRefresh: true)
  guard let display = content.displays.first else { throw HelperError.windowGone }
  let filter = SCContentFilter(display: display, excludingWindows: [])
  let config = scaledConfiguration(
    for: CGSize(width: CGFloat(display.width), height: CGFloat(display.height)))
  return try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
}

func writeJPEG(_ image: CGImage, to path: String) throws -> Int {
  let url = URL(fileURLWithPath: path)
  try FileManager.default.createDirectory(
    at: url.deletingLastPathComponent(), withIntermediateDirectories: true)

  let data = NSMutableData()
  guard
    let destination = CGImageDestinationCreateWithData(
      data as CFMutableData, UTType.jpeg.identifier as CFString, 1, nil)
  else { throw HelperError.encodeFailed }
  CGImageDestinationAddImage(
    destination, image, [kCGImageDestinationLossyCompressionQuality: kJpegQuality] as CFDictionary)
  guard CGImageDestinationFinalize(destination) else { throw HelperError.encodeFailed }

  try (data as Data).write(to: url, options: .atomic)
  return data.length
}

// MARK: - OCR

func recognizeText(in image: CGImage, fast: Bool, languages: [String]) throws -> [String: Any] {
  var blocks: [[String: Any]] = []
  var lines: [String] = []
  var thrown: Error?

  let request = VNRecognizeTextRequest { request, error in
    if let error {
      thrown = error
      return
    }
    guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
    // Defensive copy — bridged NSArray results can be mutated underneath an
    // in-flight enumeration (omi RewindOCRService.swift:177–180).
    for observation in Array(observations) {
      guard let candidate = observation.topCandidates(1).first else { continue }
      let box = observation.boundingBox
      guard box.origin.x.isFinite, box.origin.y.isFinite, box.width.isFinite, box.height.isFinite
      else { continue }
      let round3: (Double) -> Double = { (($0 * 1000).rounded()) / 1000 }
      blocks.append([
        "text": candidate.string,
        "x": round3(Double(box.origin.x)),
        // Vision uses a bottom-left origin; flip to top-left for the renderer.
        "y": round3(1.0 - Double(box.origin.y) - Double(box.height)),
        "w": round3(Double(box.width)),
        "h": round3(Double(box.height)),
        "confidence": round3(Double(candidate.confidence)),
      ])
      lines.append(candidate.string)
    }
  }

  request.recognitionLevel = fast ? .fast : .accurate
  request.usesLanguageCorrection = false
  request.recognitionLanguages = languages.isEmpty ? ["en-US"] : languages

  try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
  if let thrown { throw thrown }

  return ["fullText": lines.joined(separator: "\n"), "blocks": blocks]
}

func loadImage(at path: String) throws -> CGImage {
  guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else { throw HelperError.invalidImage }
  return image
}

// MARK: - Command handlers

func handleMeta(id: Int?) {
  let window = resolveActiveWindow()
  var result: [String: Any] = [
    "permission": CGPreflightScreenCaptureAccess(),
    "accessibility": AXIsProcessTrusted(),
    "at": Date().timeIntervalSince1970 * 1000,
    "titleFromAccessibility": window.titleFromAccessibility,
  ]
  if let appName = window.appName { result["appName"] = appName }
  if let bundleId = window.bundleId { result["bundleId"] = bundleId }
  if let title = window.windowTitle { result["windowTitle"] = title }
  if let windowId = window.windowId { result["windowId"] = Int(windowId) }
  if let bounds = window.bounds {
    result["bounds"] = [
      "x": bounds.origin.x, "y": bounds.origin.y,
      "w": bounds.size.width, "h": bounds.size.height,
    ]
  }
  respond(id: id, result: result)
}

func handleCapture(id: Int?, request: [String: Any]) async {
  guard let out = request["out"] as? String, !out.isEmpty else {
    respond(id: id, error: "capture requires an 'out' path", code: "BAD_REQUEST")
    return
  }
  guard CGPreflightScreenCaptureAccess() else {
    respond(id: id, error: "Screen Recording permission not granted", code: "PERMISSION_REQUIRED")
    return
  }

  let mode = (request["mode"] as? String) ?? "window"
  let wantsOCR = (request["ocr"] as? Bool) ?? false
  let fastOCR = (request["ocrFast"] as? Bool) ?? true
  let languages = (request["ocrLanguages"] as? [String]) ?? ["en-US"]
  // An explicit windowId targets one specific window instead of whatever is
  // frontmost. Used by tests to capture a window they created themselves, so no
  // other window on the display is ever read.
  let explicitWindowId = (request["windowId"] as? Int).map { CGWindowID($0) }
  let window = explicitWindowId == nil
    ? resolveActiveWindow()
    : ActiveWindow(appName: nil, bundleId: nil, windowTitle: nil,
                   windowId: explicitWindowId, bounds: nil, titleFromAccessibility: false)

  do {
    let image: CGImage
    if mode == "display" {
      image = try await captureDisplayImage()
    } else {
      guard let windowId = window.windowId else { throw HelperError.noActiveWindow }
      image = try await captureWindowImage(windowId: windowId, bundleId: window.bundleId)
    }

    let bytes = try writeJPEG(image, to: out)
    var result: [String: Any] = [
      "path": out,
      "bytes": bytes,
      "width": image.width,
      "height": image.height,
      "phash": String(dHash(of: image), radix: 16),
      "mode": mode,
      "capturedAt": Date().timeIntervalSince1970 * 1000,
    ]
    if let appName = window.appName { result["appName"] = appName }
    if let bundleId = window.bundleId { result["bundleId"] = bundleId }
    if let title = window.windowTitle { result["windowTitle"] = title }

    if wantsOCR {
      // OCR the in-memory image rather than re-decoding the JPEG we just wrote.
      result["ocr"] = try recognizeText(in: image, fast: fastOCR, languages: languages)
    }
    respond(id: id, result: result)
  } catch HelperError.noActiveWindow {
    respond(id: id, error: "No active window to capture", code: "NO_ACTIVE_WINDOW")
  } catch HelperError.windowGone {
    respond(id: id, error: "Target window disappeared before capture", code: "WINDOW_GONE")
  } catch {
    respond(id: id, error: error.localizedDescription, code: "CAPTURE_FAILED")
  }
}

/// Enumerate capturable windows — metadata only, no pixels are read.
///
/// Two uses: a test can find the window it just created without guessing at a
/// window id, and a support session can see exactly what the helper considers
/// capturable (including which windows `isFilterSafe` would refuse).
func handleWindows(id: Int?) {
  guard CGPreflightScreenCaptureAccess() else {
    respond(id: id, error: "Screen Recording permission not granted", code: "PERMISSION_REQUIRED")
    return
  }
  let semaphore = DispatchSemaphore(value: 0)
  Task {
    do {
      let content = try await ContentCache.shared.content(forceRefresh: true)
      let windows: [[String: Any]] = content.windows.map { window in
        var entry: [String: Any] = [
          "windowId": Int(window.windowID),
          "onScreen": window.isOnScreen,
          "filterSafe": isFilterSafe(window),
          "frame": [
            "x": window.frame.origin.x, "y": window.frame.origin.y,
            "w": window.frame.size.width, "h": window.frame.size.height,
          ],
        ]
        if let title = window.title { entry["title"] = title }
        if let app = window.owningApplication {
          entry["appName"] = app.applicationName
          entry["bundleId"] = app.bundleIdentifier
        }
        return entry
      }
      respond(id: id, result: ["windows": windows, "count": windows.count])
    } catch {
      respond(id: id, error: error.localizedDescription, code: "WINDOWS_FAILED")
    }
    semaphore.signal()
  }
  semaphore.wait()
}

func handleOCR(id: Int?, request: [String: Any]) {
  guard let path = request["path"] as? String, !path.isEmpty else {
    respond(id: id, error: "ocr requires a 'path'", code: "BAD_REQUEST")
    return
  }
  let fast = (request["fast"] as? Bool) ?? true
  let languages = (request["languages"] as? [String]) ?? ["en-US"]
  do {
    let image = try loadImage(at: path)
    var result = try recognizeText(in: image, fast: fast, languages: languages)
    result["phash"] = String(dHash(of: image), radix: 16)
    respond(id: id, result: result)
  } catch {
    respond(id: id, error: error.localizedDescription, code: "OCR_FAILED")
  }
}

// MARK: - Compaction (Phase 7)

/// Fold a run of JPEGs into one H.265 chunk.
///
/// Replaces omi's VideoChunkEncoder, which shelled out to ffmpeg; AVAssetWriter
/// with VideoToolbox is hardware-accelerated, ships with the OS, and needs no
/// third-party binary in the app bundle. Frame N in the chunk corresponds to
/// `media_offset = N` in rewind_frames, so a compacted frame stays addressable.
func encodeChunk(framePaths: [String], out: String, fps: Int32) throws -> [String: Any] {
  guard !framePaths.isEmpty else { throw HelperError.unsupported("no frames to encode") }

  // The first frame fixes the chunk's dimensions; the caller groups frames so a
  // dimension change starts a new chunk.
  let firstImage = try loadImage(at: framePaths[0])
  let width = firstImage.width - (firstImage.width % 2)
  let height = firstImage.height - (firstImage.height % 2)
  guard width > 1, height > 1 else { throw HelperError.unsupported("frame too small to encode") }

  let outURL = URL(fileURLWithPath: out)
  try FileManager.default.createDirectory(
    at: outURL.deletingLastPathComponent(), withIntermediateDirectories: true)
  if FileManager.default.fileExists(atPath: out) {
    try FileManager.default.removeItem(at: outURL)
  }

  let writer = try AVAssetWriter(outputURL: outURL, fileType: .mov)
  let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.hevc,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
      // Screen content is mostly static, so quality-per-bit is very high here.
      AVVideoAverageBitRateKey: max(400_000, width * height / 4),
      AVVideoMaxKeyFrameIntervalKey: 60,
    ],
  ]
  let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
  input.expectsMediaDataInRealTime = false

  let attributes: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
  ]
  let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input, sourcePixelBufferAttributes: attributes)

  guard writer.canAdd(input) else { throw HelperError.unsupported("writer rejected the video input") }
  writer.add(input)
  guard writer.startWriting() else {
    throw HelperError.unsupported("writer failed to start: \(writer.error?.localizedDescription ?? "unknown")")
  }
  writer.startSession(atSourceTime: .zero)

  var encoded = 0
  var skipped: [String] = []

  for (index, framePath) in framePaths.enumerated() {
    guard let image = try? loadImage(at: framePath) else {
      skipped.append(framePath)
      continue
    }
    // Wait for the encoder rather than dropping frames: the offsets in the
    // database have to match the chunk exactly.
    while !input.isReadyForMoreMediaData {
      Thread.sleep(forTimeInterval: 0.01)
    }
    guard let pool = adaptor.pixelBufferPool else {
      throw HelperError.unsupported("no pixel buffer pool")
    }
    var pixelBuffer: CVPixelBuffer?
    guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer) == kCVReturnSuccess,
      let buffer = pixelBuffer
    else { throw HelperError.unsupported("could not allocate a pixel buffer") }

    CVPixelBufferLockBaseAddress(buffer, [])
    if let base = CVPixelBufferGetBaseAddress(buffer),
      let context = CGContext(
        data: base, width: width, height: height, bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
          | CGBitmapInfo.byteOrder32Little.rawValue)
    {
      context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
    }
    CVPixelBufferUnlockBaseAddress(buffer, [])

    let time = CMTime(value: CMTimeValue(index), timescale: fps)
    if !adaptor.append(buffer, withPresentationTime: time) {
      throw HelperError.unsupported("append failed at frame \(index): \(writer.error?.localizedDescription ?? "unknown")")
    }
    encoded += 1
  }

  input.markAsFinished()
  let semaphore = DispatchSemaphore(value: 0)
  writer.finishWriting { semaphore.signal() }
  semaphore.wait()

  if writer.status != .completed {
    throw HelperError.unsupported("encode failed: \(writer.error?.localizedDescription ?? "unknown")")
  }

  let bytes = ((try? FileManager.default.attributesOfItem(atPath: out))?[.size] as? Int) ?? 0
  return [
    "path": out,
    "frames": encoded,
    "skipped": skipped,
    "bytes": bytes,
    "width": width,
    "height": height,
    "fps": Int(fps),
  ]
}

/// Pull one frame back out of a chunk by its offset, so a compacted frame can
/// still be shown in the timeline.
func extractFrame(path: String, index: Int, out: String, fps: Int32) throws -> [String: Any] {
  let asset = AVURLAsset(url: URL(fileURLWithPath: path))
  let generator = AVAssetImageGenerator(asset: asset)
  generator.appliesPreferredTrackTransform = true
  // Exact frame, not the nearest keyframe: an off-by-a-few-seconds thumbnail
  // would silently mislabel which moment the user is looking at.
  generator.requestedTimeToleranceBefore = .zero
  generator.requestedTimeToleranceAfter = .zero

  let time = CMTime(value: CMTimeValue(index), timescale: fps)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  let bytes = try writeJPEG(image, to: out)
  return ["path": out, "bytes": bytes, "width": image.width, "height": image.height, "index": index]
}

func handleEncode(id: Int?, request: [String: Any]) {
  guard let frames = request["frames"] as? [String], !frames.isEmpty,
    let out = request["out"] as? String, !out.isEmpty
  else {
    respond(id: id, error: "encode requires 'frames' and 'out'", code: "BAD_REQUEST")
    return
  }
  let fps = Int32((request["fps"] as? Int) ?? 6)
  do {
    respond(id: id, result: try encodeChunk(framePaths: frames, out: out, fps: max(1, fps)))
  } catch {
    respond(id: id, error: "\(error)", code: "ENCODE_FAILED")
  }
}

func handleExtract(id: Int?, request: [String: Any]) {
  guard let path = request["path"] as? String, !path.isEmpty,
    let out = request["out"] as? String, !out.isEmpty,
    let index = request["index"] as? Int
  else {
    respond(id: id, error: "extract requires 'path', 'index' and 'out'", code: "BAD_REQUEST")
    return
  }
  let fps = Int32((request["fps"] as? Int) ?? 6)
  do {
    respond(id: id, result: try extractFrame(path: path, index: index, out: out, fps: max(1, fps)))
  } catch {
    respond(id: id, error: "\(error)", code: "EXTRACT_FAILED")
  }
}

// MARK: - Lifecycle

/// I5: the helper must not outlive its supervisor. stdin EOF is the primary
/// signal; the parent-pid watchdog covers a parent that dies without closing
/// the pipe cleanly.
let originalParentPid = getppid()

func startParentWatchdog() {
  let timer = DispatchSource.makeTimerSource(queue: DispatchQueue.global(qos: .utility))
  timer.schedule(deadline: .now() + 2, repeating: 2)
  timer.setEventHandler {
    if getppid() != originalParentPid {
      trace("parent process changed (\(originalParentPid) -> \(getppid())); exiting")
      exit(0)
    }
  }
  timer.resume()
  // Keep a strong reference for the lifetime of the process.
  watchdogTimer = timer
}
var watchdogTimer: DispatchSourceTimer?

func handle(line: String) {
  guard let data = line.data(using: .utf8),
    let request = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
  else {
    respond(id: nil, error: "Malformed request line", code: "BAD_JSON")
    return
  }

  let id = request["id"] as? Int
  let cmd = (request["cmd"] as? String) ?? ""

  switch cmd {
  case "ping":
    respond(id: id, result: ["pong": true, "pid": Int(getpid()), "version": kHelperVersion])
  case "meta":
    handleMeta(id: id)
  case "ocr":
    handleOCR(id: id, request: request)
  case "windows":
    handleWindows(id: id)
  case "encode":
    handleEncode(id: id, request: request)
  case "extract":
    handleExtract(id: id, request: request)
  case "capture":
    // Bridge the async capture back to the sequential command loop. The
    // indexer never issues overlapping captures, so serializing here keeps
    // ordering guarantees without a request queue.
    let semaphore = DispatchSemaphore(value: 0)
    Task {
      await handleCapture(id: id, request: request)
      semaphore.signal()
    }
    semaphore.wait()
  case "shutdown":
    respond(id: id, result: ["bye": true])
    exit(0)
  default:
    respond(id: id, error: "Unknown command: \(cmd)", code: "UNKNOWN_COMMAND")
  }
}

if #unavailable(macOS 14.0) {
  emit(["event": "unavailable", "reason": "briizy-helper requires macOS 14 or newer"])
  exit(1)
}

/// Initialize AppKit explicitly, with a policy that keeps the helper invisible.
///
/// Belt and braces rather than the fix for anything: measurement showed
/// `NSScreen` establishes the WindowServer connection lazily on its own, so the
/// SIGABRT in `SLSGetDisplaysWithRect` was a bad window rect (see
/// `isFilterSafe`), not a missing connection. This stays because it makes the
/// AppKit state deterministic instead of dependent on which call happens to
/// touch it first, and `.prohibited` guarantees no Dock icon or menu bar
/// whatever else initializes later. No run loop is started: requests are still
/// served synchronously from stdin.
func connectToWindowServer() {
  let application = NSApplication.shared
  application.setActivationPolicy(.prohibited)
}

connectToWindowServer()
startParentWatchdog()
emit([
  "event": "ready",
  "version": kHelperVersion,
  "protocol": kProtocolVersion,
  "pid": Int(getpid()),
  "permission": CGPreflightScreenCaptureAccess(),
  "accessibility": AXIsProcessTrusted(),
  // Proof that connectToWindowServer() worked. Reading NSScreen requires the
  // same CGS connection ScreenCaptureKit's filters need, so a non-zero count
  // means window capture will not abort in SkyLight. Zero means it would.
  "displays": NSScreen.screens.count,
])

while let line = readLine(strippingNewline: true) {
  if line.isEmpty { continue }
  handle(line: line)
}

// stdin closed — the supervisor is gone.
trace("stdin closed; exiting")
exit(0)
