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
//   out: {"id":1,"ok":true,"result":{…}}
//        {"id":1,"ok":false,"error":"…","code":"…"}
//        {"event":"ready","version":"1","protocol":1}   (unsolicited, once)
//
// Coordinates in OCR blocks are normalized 0–1 with a TOP-LEFT origin (Vision's
// bottom-left origin is flipped here) so the renderer can use them directly.

import AppKit
import CoreGraphics
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

/// Resolve the frontmost app plus its focused window. Accessibility first (most
/// accurate), then the frontmost-largest-window heuristic from the window list
/// (omi ScreenCaptureService.swift:483–550).
func resolveActiveWindow() -> ActiveWindow {
  guard let frontApp = NSWorkspace.shared.frontmostApplication else {
    return ActiveWindow(appName: nil, bundleId: nil, windowTitle: nil, windowId: nil, bounds: nil,
                        titleFromAccessibility: false)
  }

  let appName = frontApp.localizedName
  let bundleId = frontApp.bundleIdentifier
  let pid = frontApp.processIdentifier

  if let ax = accessibilityWindow(pid: pid), ax.windowId != nil || ax.title != nil {
    return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: ax.title,
                        windowId: ax.windowId, bounds: ax.bounds, titleFromAccessibility: true)
  }

  guard
    let windowList = CGWindowListCopyWindowInfo(
      [.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]]
  else {
    return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: nil, windowId: nil,
                        bounds: nil, titleFromAccessibility: false)
  }

  var candidates: [(title: String?, windowId: CGWindowID, area: CGFloat, bounds: CGRect)] = []
  for window in windowList {
    guard let ownerPid = window[kCGWindowOwnerPID as String] as? Int32, ownerPid == pid,
      let boundsDict = window[kCGWindowBounds as String] as? [String: CGFloat],
      let x = boundsDict["X"], let y = boundsDict["Y"],
      let width = boundsDict["Width"], let height = boundsDict["Height"],
      width > 100, height > 100,
      let windowNumber = window[kCGWindowNumber as String] as? CGWindowID
    else { continue }
    candidates.append((
      title: window[kCGWindowName as String] as? String,
      windowId: windowNumber,
      area: width * height,
      bounds: CGRect(x: x, y: y, width: width, height: height)
    ))
  }

  guard let maxArea = candidates.map(\.area).max(),
    let frontmost = candidates.first(where: { $0.area == maxArea })
  else {
    return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: nil, windowId: nil,
                        bounds: nil, titleFromAccessibility: false)
  }

  return ActiveWindow(appName: appName, bundleId: bundleId, windowTitle: frontmost.title,
                      windowId: frontmost.windowId, bounds: frontmost.bounds,
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

func captureWindowImage(windowId: CGWindowID) async throws -> CGImage {
  var content = try await ContentCache.shared.content()
  if !content.windows.contains(where: { $0.windowID == windowId }) {
    content = try await ContentCache.shared.content(forceRefresh: true)
  }
  // ScreenCaptureKit object graphs accumulate in the cooperative thread pool,
  // which does not drain autorelease pools between tasks.
  let prepared: (SCContentFilter, SCStreamConfiguration)? = autoreleasepool {
    guard let window = content.windows.first(where: { $0.windowID == windowId }) else { return nil }
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
  let window = resolveActiveWindow()

  do {
    let image: CGImage
    if mode == "display" {
      image = try await captureDisplayImage()
    } else {
      guard let windowId = window.windowId else { throw HelperError.noActiveWindow }
      image = try await captureWindowImage(windowId: windowId)
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

startParentWatchdog()
emit([
  "event": "ready",
  "version": kHelperVersion,
  "protocol": kProtocolVersion,
  "pid": Int(getpid()),
  "permission": CGPreflightScreenCaptureAccess(),
  "accessibility": AXIsProcessTrusted(),
])

while let line = readLine(strippingNewline: true) {
  if line.isEmpty { continue }
  handle(line: line)
}

// stdin closed — the supervisor is gone.
trace("stdin closed; exiting")
exit(0)
