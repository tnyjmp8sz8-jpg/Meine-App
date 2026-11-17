import SwiftUI
import UIKit
import WebKit

// Die App ist die Web-App, gezeigt in einem Fenster ohne Browser-Leisten.
// Sie liegt unter einer eigenen, festen Adresse (trackapp://lokal/). An dieser Adresse hängt der Speicher
// der Web-App (localStorage): Sie darf sich deshalb nie mehr ändern, sonst wären die Daten des Nutzers weg.
@main
struct TrackApp: App {
    var body: some Scene {
        WindowGroup {
            WebView()
                .ignoresSafeArea()
                .background(Color(red: 14 / 255, green: 15 / 255, blue: 19 / 255))
        }
    }
}

enum Web {
    static let scheme = "trackapp"
    static let start = URL(string: "trackapp://lokal/index.html")!
    /// Hier liegt immer die neueste Web-App (GitHub Pages, Zweig main)
    static let quelle = URL(string: "https://tnyjmp8sz8-jpg.github.io/Meine-App/index.html")!

    /// Mit der App ausgelieferte Fassung
    static var mitgeliefert: URL? { Bundle.main.resourceURL?.appendingPathComponent("web", isDirectory: true) }

    /// Zuletzt aus dem Netz geholte Fassung
    static var geladen: URL {
        let ordner = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("web", isDirectory: true)
        try? FileManager.default.createDirectory(at: ordner, withIntermediateDirectories: true)
        return ordner.appendingPathComponent("index.html")
    }

    /// Versionsnummer aus der Fußzeile der Web-App: class="ver">v59<
    static func version(_ daten: Data?) -> Int {
        guard let daten = daten, let text = String(data: daten, encoding: .utf8),
              let treffer = text.range(of: #"class="ver">v[0-9]+<"#, options: .regularExpression) else { return 0 }
        return Int(text[treffer].filter { $0.isNumber }) ?? 0
    }

    /// Die neuere von beiden Fassungen. So gewinnt nach einem App-Update nie eine ältere, früher nachgeladene Seite.
    static func seite() -> Data? {
        let mit = mitgeliefert.flatMap { try? Data(contentsOf: $0.appendingPathComponent("index.html")) }
        let neu = try? Data(contentsOf: geladen)
        return version(neu) > version(mit) ? neu : mit
    }
}

/// Liefert die Dateien der Web-App unter trackapp://lokal/ aus
final class Lokal: NSObject, WKURLSchemeHandler {
    private let typen = ["html": "text/html; charset=utf-8", "png": "image/png", "webmanifest": "application/manifest+json"]

    func webView(_ webView: WKWebView, start aufgabe: WKURLSchemeTask) {
        guard let url = aufgabe.request.url else { return aufgabe.didFailWithError(URLError(.badURL)) }
        var name = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        if name.isEmpty { name = "index.html" }
        var daten: Data?
        if name == "index.html" {
            daten = Web.seite()
        } else if !name.contains(".."), let ordner = Web.mitgeliefert {
            daten = try? Data(contentsOf: ordner.appendingPathComponent(name))
        }
        let kopf = ["Content-Type": typen[url.pathExtension] ?? "application/octet-stream", "Cache-Control": "no-store"]
        let antwort = HTTPURLResponse(url: url, statusCode: daten == nil ? 404 : 200, httpVersion: "HTTP/1.1", headerFields: kopf)!
        aufgabe.didReceive(antwort)
        aufgabe.didReceive(daten ?? Data())
        aufgabe.didFinish()
    }

    func webView(_ webView: WKWebView, stop aufgabe: WKURLSchemeTask) {}
}

struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Halter { Halter() }

    func makeUIView(context: Context) -> WKWebView {
        let einstellung = WKWebViewConfiguration()
        einstellung.setURLSchemeHandler(Lokal(), forURLScheme: Web.scheme)
        let view = WKWebView(frame: .zero, configuration: einstellung)
        view.isOpaque = false
        view.backgroundColor = .clear
        // Die Web-App rechnet die Ränder um Kamera und Home-Balken selbst ein (safe-area-inset)
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.bounces = false
        view.allowsBackForwardNavigationGestures = false
        view.navigationDelegate = context.coordinator
        view.load(URLRequest(url: Web.start))
        context.coordinator.view = view
        context.coordinator.aktualisieren()
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.aktualisieren), name: UIApplication.willEnterForegroundNotification, object: nil)
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

final class Halter: NSObject, WKNavigationDelegate {
    weak var view: WKWebView?
    private var zuletzt = Date.distantPast

    /// Holt die neueste Web-App. Ist sie neuer als die gezeigte, wird sie gespeichert und geladen,
    /// aber nie, solange ein Blatt offen ist (dann beim nächsten Öffnen): dieselbe Regel wie in der Web-App.
    @objc func aktualisieren() {
        guard Date().timeIntervalSince(zuletzt) > 600 else { return }
        zuletzt = Date()
        let anfrage = URLRequest(url: Web.quelle, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        URLSession.shared.dataTask(with: anfrage) { daten, antwort, _ in
            guard let daten = daten, (antwort as? HTTPURLResponse)?.statusCode == 200, daten.count > 50_000,
                  Web.version(daten) > Web.version(Web.seite()) else { return }
            try? daten.write(to: Web.geladen, options: .atomic)
            DispatchQueue.main.async {
                self.view?.evaluateJavaScript("document.querySelector('dialog[open]') ? 0 : 1") { ergebnis, _ in
                    if (ergebnis as? Int) == 1 { self.view?.reload() }
                }
            }
        }.resume()
    }

    /// Adressen außerhalb der App öffnet Safari. Andere Sprünge der Hauptseite (z. B. auf eine Datei) werden
    /// abgelehnt: Sonst stünde statt der App eine fremde Seite ohne Zurück-Knopf im Fenster.
    func webView(_ webView: WKWebView, decidePolicyFor aktion: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = aktion.request.url, aktion.targetFrame?.isMainFrame != false else { return decisionHandler(.allow) }
        if url.scheme == Web.scheme { return decisionHandler(.allow) }
        if url.scheme == "https" || url.scheme == "http" || url.scheme == "mailto" { UIApplication.shared.open(url) }
        decisionHandler(.cancel)
    }

    /// Selbsttest für den Bau (Start mit „-pruefen“): schreibt nach Documents/pruefung.json, ob die Seite geladen ist,
    /// ob der Speicher den letzten Start überlebt hat und ob Teilen (für die Sicherung) verfügbar ist.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard CommandLine.arguments.contains("-pruefen") else { return }
        let js = """
        (function () {
          try {
            var alt = localStorage.getItem('takt.probe');
            localStorage.setItem('takt.probe', String(Date.now()));
            var datei = new File(['{}'], 'a.json', { type: 'application/json' });
            return JSON.stringify({ adresse: location.href, version: document.querySelector('.ver').textContent, vorherGespeichert: alt !== null,
              teilen: typeof navigator.share, dateienTeilen: !!(navigator.canShare && navigator.canShare({ files: [datei] })),
              serviceWorker: 'serviceWorker' in navigator, bereiche: document.querySelectorAll('.tab').length });
          } catch (e) { return 'Fehler: ' + e; }
        })()
        """
        webView.evaluateJavaScript(js) { ergebnis, fehler in
            let text = (ergebnis as? String) ?? "Fehler: \(String(describing: fehler))"
            let datei = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("pruefung.json")
            try? text.write(to: datei, atomically: true, encoding: .utf8)
        }
    }
}
