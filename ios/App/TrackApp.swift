import SwiftUI
import UIKit
import WebKit
import WidgetKit

// Die App ist die Web-App, gezeigt in einem Fenster ohne Browser-Leisten.
// Sie liegt unter einer eigenen, festen Adresse (trackapp://lokal/). An dieser Adresse hängt der Speicher
// der Web-App (localStorage): Sie darf sich deshalb nie mehr ändern, sonst wären die Daten des Nutzers weg.
@main
struct TrackApp: App {
    var body: some Scene {
        WindowGroup {
            if CommandLine.arguments.contains("-widgetbild") {
                WidgetVorschau()
            } else {
                WebView()
                    .ignoresSafeArea()
                    .background(Color(red: 14 / 255, green: 15 / 255, blue: 19 / 255))
                    // Eigene Adresse der App, z. B. für Kurzbefehle: trackpunkt://neu/ausgabe
                    .onOpenURL { adresse in
                        Halter.wartend = adresse
                        NotificationCenter.default.post(name: Halter.eingang, object: nil)
                    }
            }
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
        // Verbindung zur Web-App: Sie schickt über window.webkit.messageHandlers.track, die Hülle antwortet über window.TrackHuelle
        einstellung.userContentController.add(context.coordinator, name: "track")
        let view = WKWebView(frame: .zero, configuration: einstellung)
        view.isOpaque = false
        view.backgroundColor = .clear
        // Die Web-App rechnet die Ränder um Kamera und Home-Balken selbst ein (safe-area-inset)
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.scrollView.bounces = false
        view.allowsBackForwardNavigationGestures = false
        view.navigationDelegate = context.coordinator
        if CommandLine.arguments.contains("-pruefen") { Halter.probeEingang() }
        view.load(URLRequest(url: Web.start))
        context.coordinator.view = view
        context.coordinator.aktualisieren()
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.aktualisieren), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.zurueck), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.adresse), name: Halter.eingang, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.eingangHolen), name: Halter.eingangDa, object: nil)
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

final class Halter: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    static let eingang = Notification.Name("track.adresse")
    /// Ein Kurzbefehl hat etwas vorgemerkt, während die App läuft
    static let eingangDa = Notification.Name("track.eingang")
    /// Adresse, mit der die App geöffnet wurde; wartet, bis die Web-App geladen ist
    static var wartend: URL?

    weak var view: WKWebView?
    private var zuletzt = Date.distantPast
    private var bereit = false        // die Web-App hat sich gemeldet
    private var standDa = false       // sie hat einen Stand geschickt
    private var geplant = ""          // wofür die Mitteilungen zuletzt geplant wurden
    /// Im Selbsttest und für das Bild aus dem Simulator keine Abfrage von iOS („Mitteilungen erlauben?“)
    private let still = CommandLine.arguments.contains("-pruefen") || CommandLine.arguments.contains("-ohneFragen")

    /// Ruft eine Funktion der Web-App auf (window.TrackHuelle)
    private func rufe(_ name: String, _ wert: Any) {
        guard JSONSerialization.isValidJSONObject([wert]), let daten = try? JSONSerialization.data(withJSONObject: [wert]), let json = String(data: daten, encoding: .utf8) else { return }
        view?.evaluateJavaScript("window.TrackHuelle && window.TrackHuelle.\(name).apply(null, \(json)) && 0", completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive nachricht: WKScriptMessage) {
        guard let inhalt = nachricht.body as? [String: Any], let art = inhalt["art"] as? String else { return }
        if art == "bereit" {
            bereit = true
            auskunft(); eingangHolen(); laeufeHolen(); adresse()
        } else if art == "stand" {
            stand(inhalt)
        } else if art == "health" {
            Gesundheit.shared.verbinden { self.auskunft(); self.laeufeHolen() }
        }
    }

    /// Sagt der Web-App, welche Fassung der Hülle läuft, bis wann sie gültig ist und ob Health freigegeben ist
    private func auskunft() {
        var info: [String: Any] = ["app": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "", "health": Gesundheit.shared.zustand]
        if let ablauf = Profil.ablauf { info["ablauf"] = ablauf.timeIntervalSince1970 * 1000 }
        rufe("info", info)
    }

    private func laeufeHolen() {
        Gesundheit.shared.laeufe { liste in if !liste.isEmpty { self.rufe("laeufe", liste) } }
    }

    @objc func zurueck() {
        guard bereit else { return }
        auskunft(); eingangHolen(); laeufeHolen()
    }

    /// Übergibt der Web-App, was im Widget oder per Kurzbefehl vorgemerkt wurde. Gestrichen wird nur, was sie als übernommen zurückmeldet.
    @objc func eingangHolen() {
        DispatchQueue.main.async {
            let liste = Ablage.eingang()
            guard self.bereit, !liste.isEmpty, JSONSerialization.isValidJSONObject(liste), let daten = try? JSONSerialization.data(withJSONObject: liste),
                  let json = String(data: daten, encoding: .utf8) else { return }
            self.view?.evaluateJavaScript("JSON.stringify(window.TrackHuelle.eingang(\(json)))") { ergebnis, _ in
                guard let text = ergebnis as? String, let ids = (try? JSONSerialization.jsonObject(with: Data(text.utf8))) as? [String] else { return }
                Ablage.erledigt(ids)
            }
        }
    }

    /// Neuer Stand der Web-App: Mitteilungen planen (nur wenn sich etwas daran geändert hat) und für das Widget ablegen
    private func stand(_ inhalt: [String: Any]) {
        standDa = true
        let sicherung = inhalt["sicherung"] as? String ?? ""
        let schluessel = sicherung + "|" + String(Profil.ablauf?.timeIntervalSince1970 ?? 0)
        if schluessel != geplant && !still {
            geplant = schluessel
            Mitteilungen.planen(sicherung: sicherung, ablauf: Profil.ablauf)
        }
        let widget: [String: Any] = ["tage": inhalt["tage"] ?? [], "notizen": inhalt["notizen"] ?? [], "nz": inhalt["nz"] ?? []]
        if JSONSerialization.isValidJSONObject(widget), let daten = try? JSONSerialization.data(withJSONObject: widget), Ablage.schreiben(daten) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    /// trackpunkt://neu/ausgabe (oder notiz, gewicht) öffnet das Blatt. trackpunkt://lauf?km=5,2&min=31&puls=150 trägt einen Lauf ein
    /// (dazu wahlweise t = Beginn in Sekunden seit 1970 und laufband=1); gedacht für Kurzbefehle.
    @objc func adresse() {
        guard bereit, let url = Halter.wartend else { return }
        Halter.wartend = nil
        let angaben = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        let wert = { (name: String) -> String? in angaben.first(where: { $0.name == name })?.value }
        let zahl = { (name: String) -> Double? in Double((wert(name) ?? "").replacingOccurrences(of: ",", with: ".")) }
        if url.host == "neu" {
            rufe("neu", wert("was") ?? url.lastPathComponent)
        } else if url.host == "lauf", let km = zahl("km"), let minuten = zahl("min") {
            let beginn = (zahl("t") ?? Date().timeIntervalSince1970) * 1000
            var lauf: [String: Any] = ["id": "k\(Int(beginn / 60000))", "t": beginn, "m": km * 1000, "s": minuten * 60, "k": wert("laufband") == "1" ? "in" : "out"]
            if let puls = zahl("puls") { lauf["hr"] = puls }
            rufe("laeufe", [lauf])
        }
    }

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

    /// Ergänzt das Ergebnis aus der Web-App um das, was die Hülle selbst weiß: Verbindung, Ablage für das Widget, Plan der Mitteilungen
    private func pruefungSchreiben(_ ausWeb: String) {
        var text = ausWeb
        if var alles = (try? JSONSerialization.jsonObject(with: Data(ausWeb.utf8))) as? [String: Any] {
            alles["bruecke"] = standDa
            alles["gruppe"] = Ablage.datei != nil
            alles["widgetTage"] = Ablage.lesen()?.tage.count ?? -1
            // Eingang: Jeder Start merkt eine Notiz vor, der dritte hakt vorher eine ab (siehe probeEingang). Nach dem dritten Start: 2 Notizen, nichts mehr vorgemerkt.
            alles["notizenZahl"] = Ablage.lesen()?.nz?.count ?? -1
            alles["eingangRest"] = Ablage.eingang().count
            alles["health"] = Gesundheit.shared.zustand
            // Rechnung: Sicherung fällig am 20.11.2026, jetzt 17.11. mittags → 5 Termine, der erste am 20.11. um 18 Uhr, der zweite am 23.11.
            let jetzt = Calendar.current.date(from: DateComponents(year: 2026, month: 11, day: 17, hour: 12)) ?? Date()
            let plan = Mitteilungen.plan(sicherung: "2026-11-20", ablauf: jetzt.addingTimeInterval(4 * 86400), jetzt: jetzt)
            let form = DateFormatter(); form.dateFormat = "dd.MM. HH:mm"
            alles["plan"] = plan.map { $0.id + " " + form.string(from: $0.wann) }.joined(separator: ", ")
            if let daten = try? JSONSerialization.data(withJSONObject: alles), let neu = String(data: daten, encoding: .utf8) { text = neu }
        }
        let datei = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("pruefung.json")
        try? text.write(to: datei, atomically: true, encoding: .utf8)
    }

    /// Selbsttest: stellt nach, was Widget und Kurzbefehle tun. Jeder Start merkt eine Notiz vor; gibt es schon zwei, wird vorher die älteste abgehakt.
    /// Läuft vor dem Laden der Seite, damit die Web-App alles beim Start übernimmt.
    static func probeEingang() {
        if let notizen = Ablage.lesen()?.nz, notizen.count >= 2, let letzte = notizen.last { Ablage.notizWeg(letzte.id) }
        Ablage.notizDazu("Notiz aus dem Selbsttest")
    }

    /// Selbsttest für den Bau (Start mit „-pruefen“): schreibt nach Documents/pruefung.json, ob die Seite geladen ist,
    /// der wievielte Start es laut Speicher der Web-App ist (zählt er nicht hoch, überlebt der Speicher den Neustart nicht),
    /// ob Teilen (für die Sicherung) verfügbar ist und wie die Seite im Fenster liegt.
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard CommandLine.arguments.contains("-pruefen") else { return }
        let js = """
        (function () {
          try {
            var starts = Number(localStorage.getItem('takt.probe') || 0) + 1;
            localStorage.setItem('takt.probe', String(starts));
            var datei = new File(['{}'], 'a.json', { type: 'application/json' });
            var mass = document.createElement('div');
            mass.style.cssText = 'position:fixed;top:0;left:0;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0';
            document.body.appendChild(mass);
            var rand = getComputedStyle(mass), leiste = document.querySelector('.tabs').getBoundingClientRect();
            var ergebnis = { adresse: location.href, herkunft: location.origin, version: document.querySelector('.ver').textContent, starts: starts,
              teilen: typeof navigator.share, dateienTeilen: !!(navigator.canShare && navigator.canShare({ files: [datei] })),
              serviceWorker: 'serviceWorker' in navigator, huelle: typeof window.TrackHuelle, bereiche: document.querySelectorAll('.tab').length,
              fenster: innerWidth + 'x' + innerHeight, randOben: rand.paddingTop, randUnten: rand.paddingBottom, leisteUnten: Math.round(leiste.bottom),
              text: document.querySelector('#v-heute').innerText.replace(/\\s+/g, ' ').slice(0, 160) };
            mass.remove();
            return JSON.stringify(ergebnis);
          } catch (e) { return 'Fehler: ' + e; }
        })()
        """
        webView.evaluateJavaScript(js) { ergebnis, fehler in
            // Kurz warten: Die Web-App schickt ihren Stand 0,3 Sekunden nach dem Laden
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.pruefungSchreiben((ergebnis as? String) ?? "Fehler: \(String(describing: fehler))") }
        }
    }
}
