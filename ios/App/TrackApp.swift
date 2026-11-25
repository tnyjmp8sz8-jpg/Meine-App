import SwiftUI
import UIKit
import WebKit
import WidgetKit

// Die App ist die Web-App, gezeigt in einem Fenster ohne Browser-Leisten.
// Sie liegt unter einer eigenen, festen Adresse (trackapp://lokal/). An dieser Adresse hängt der Speicher
// der Web-App (localStorage): Sie darf sich deshalb nie mehr ändern, sonst wären die Daten des Nutzers weg.
@main
struct TrackApp: App {
    @StateObject private var lage = Lage.shared
    @Environment(\.scenePhase) private var phase

    var body: some Scene {
        WindowGroup {
            if CommandLine.arguments.contains("-widgetbild") {
                WidgetVorschau()
            } else {
                ZStack {
                    WebView()
                        .ignoresSafeArea()
                        .background(Color("Startfarbe"))   // wie das Startbild: dunkel schwarz, hell wie die Seite (bis 0.9 ein bläuliches Dunkel)
                    if let art = lage.schnell { Schnelleingabe(art: art) }
                }
                // Eigene Adresse der App: trackpunkt://schnell/notiz (oder ausgabe) zeigt nur die Schnelleingabe, z. B. aus dem Widget;
                // trackpunkt://neu/ausgabe öffnet das Blatt in der App, trackpunkt://lauf?… trägt einen Lauf ein (für Kurzbefehle).
                .onOpenURL { adresse in
                    if adresse.host == "schnell", let art = Schnell(rawValue: adresse.lastPathComponent) {
                        Schnell.freiraeumen()
                        lage.schnell = art
                    } else {
                        Halter.wartend = adresse
                        NotificationCenter.default.post(name: Halter.eingang, object: nil)
                    }
                }
                // Sobald die App im Hintergrund ist, ist die Schnelleingabe vorbei: Beim nächsten Öffnen steht wieder die App da
                .onChange(of: phase) { _, neu in if neu == .background { lage.schnell = nil } }
            }
        }
    }
}

/// Spürbare Rückmeldung (ab 0.8). Die Web-App sagt nur, was passiert ist; welcher Impuls dazu passt, steht hier.
/// Die Geber bleiben bestehen und werden nach jedem Impuls wieder bereit gemacht, sonst käme der nächste spürbar verspätet.
@MainActor
enum Haptik {
    private static let wahl = UISelectionFeedbackGenerator()
    private static let leicht = UIImpactFeedbackGenerator(style: .light)
    private static let mittel = UIImpactFeedbackGenerator(style: .medium)
    private static let meldung = UINotificationFeedbackGenerator()

    static func gib(_ was: String) {
        switch was {
        case "wahl": wahl.selectionChanged(); wahl.prepare()          // Umschalter, Bereich, Klappzeile, Punkt im Graphen
        case "leicht": leicht.impactOccurred(); leicht.prepare()      // abhaken
        case "mittel": mittel.impactOccurred(); mittel.prepare()      // löschen, Training starten
        case "erfolg": meldung.notificationOccurred(.success)         // gespeichert
        case "fehler": meldung.notificationOccurred(.error)           // Eingabe fehlt oder passt nicht
        default: break
        }
    }
}

enum Web {
    static let scheme = "trackapp"
    static let start = URL(string: "trackapp://lokal/index.html")!
    /// Hier liegt immer die neueste Web-App (GitHub Pages, Zweig main)
    static let quelle = URL(string: "https://tnyjmp8sz8-jpg.github.io/Meine-App/index.html")!
    /// Versionsnummer der Seite, die zuletzt an das Fenster ausgeliefert wurde, also der gezeigten (siehe Lokal)
    static var gezeigt = 0

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
            Web.gezeigt = Web.version(daten)
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
        if CommandLine.arguments.contains("-pruefen") { Halter.probeEingang(); Laufbuch.probe(); Gymbuch.probe() }
        view.load(URLRequest(url: Web.start))
        context.coordinator.view = view
        context.coordinator.aktualisieren()
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.aktualisieren), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.zurueck), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.adresse), name: Halter.eingang, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.eingangHolen), name: Halter.eingangDa, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.uhrMelden), name: Halter.eingangDa, object: nil)
        NotificationCenter.default.addObserver(context.coordinator, selector: #selector(Halter.verlassen), name: UIApplication.willResignActiveNotification, object: nil)
        // Sicherung von selbst: Das Ergebnis jedes Schreibversuchs geht an die Web-App zurück
        let halter = context.coordinator
        Sicherung.shared.melden = { [weak halter] in halter?.gesichert() }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

final class Halter: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    static let eingang = Notification.Name("track.adresse")
    /// Ein Kurzbefehl hat etwas vorgemerkt, während die App läuft
    static let eingangDa = Notification.Name("track.eingang")
    /// Die Web-App hat einen neuen Stand geschickt, und er liegt in der App-Gruppe (für die Schnelleingabe, die daraus die Konten liest)
    static let standNeu = Notification.Name("track.stand")
    /// Adresse, mit der die App geöffnet wurde; wartet, bis die Web-App geladen ist
    static var wartend: URL?

    weak var view: WKWebView?
    private var zuletzt = Date.distantPast
    private var bereit = false        // die Web-App hat sich gemeldet
    private var standDa = false       // sie hat einen Stand geschickt
    private var geplant = ""          // wofür die Mitteilungen zuletzt geplant wurden
    private var wartet = 0            // Version einer nachgeladenen Web-App, die wegen eines offenen Blatts noch nicht gezeigt wird
    private var aufschub = UIBackgroundTaskIdentifier.invalid   // Aufschub von iOS beim Verlassen der App, solange die Sicherung geschrieben wird
    /// Im Selbsttest und für das Bild aus dem Simulator keine Abfrage von iOS („Mitteilungen erlauben?“)
    private let still = CommandLine.arguments.contains("-pruefen") || CommandLine.arguments.contains("-ohneFragen")

    /// Ruft eine Funktion der Web-App auf (window.TrackHuelle), mit den Werten als ihren Angaben. Kennt die Web-App die Funktion nicht, passiert nichts.
    private func rufe(_ name: String, _ werte: Any...) {
        guard JSONSerialization.isValidJSONObject(werte), let daten = try? JSONSerialization.data(withJSONObject: werte), let json = String(data: daten, encoding: .utf8) else { return }
        view?.evaluateJavaScript("window.TrackHuelle && window.TrackHuelle.\(name) && window.TrackHuelle.\(name).apply(null, \(json)) && 0", completionHandler: nil)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive nachricht: WKScriptMessage) {
        guard let inhalt = nachricht.body as? [String: Any], let art = inhalt["art"] as? String else { return }
        if art == "bereit" {
            bereit = true
            auskunft(); eingangHolen(); laeufeHolen(); adresse()
            Sicherung.shared.nachholen()
        } else if art == "stand" {
            stand(inhalt)
        } else if art == "health" {
            Gesundheit.shared.verbinden { self.auskunft(); self.laeufeHolen() }
        } else if art == "sicherung" {
            Sicherung.shared.annehmen(inhalt)
        } else if art == "ordner" {
            ordnerWaehlen()
        } else if art == "ordnerWeg" {
            Sicherung.shared.ordnerVergessen()
        } else if art == "haptik" {
            Haptik.gib(inhalt["w"] as? String ?? "")
        } else if art == "pause" {
            // Pausen-Uhr im Training: Mitteilung „Pause vorbei“ planen oder streichen (sek 0). Im Selbsttest nicht: Dort darf iOS nichts fragen.
            if !still { Mitteilungen.pause(sekunden: (inhalt["sek"] as? NSNumber)?.doubleValue ?? 0, text: inhalt["text"] as? String ?? "") }
        }
    }

    /// Sagt der Web-App, welche Fassung der Hülle läuft, bis wann sie gültig ist, ob Health freigegeben ist und wie es um die Sicherung von selbst steht.
    /// An „sicherung“ erkennt die Web-App, dass sie ihre Sicherung schicken darf (ab 0.5).
    private func auskunft() {
        var info: [String: Any] = ["app": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "", "health": Gesundheit.shared.zustand,
                                   "sicherung": Sicherung.shared.auskunft, "uhr": Laufbuch.auskunft, "gym": Gymbuch.auskunft]
        if let ablauf = Profil.ablauf { info["ablauf"] = ablauf.timeIntervalSince1970 * 1000 }
        rufe("info", info)
    }

    /// Nach „Lauf merken“ oder „Lauf eintragen“ (Kurzbefehle, siehe Uhr.swift; ebenso „Gym merken“ und „Gym eintragen“ aus Gym.swift) bei offener App:
    /// der Web-App sagen, was die Uhr gemeldet hat
    @objc func uhrMelden() {
        DispatchQueue.main.async { if self.bereit { self.auskunft() } }
    }

    /// Stand der Sicherung an die Web-App: nach jedem Schreibversuch (erst „Dokumente“, dann getrennt der gewählte Ordner)
    /// und wenn ein Ordner gewählt oder abgewählt wurde
    func gesichert() {
        guard bereit else { return }
        rufe("gesichert", Sicherung.shared.auskunft)
    }

    /// Die App wird verlassen: Die Web-App schickt jetzt ihre Sicherung, falls seit der letzten etwas geändert wurde.
    /// Dazu ein Aufschub von iOS, damit die Datei noch geschrieben wird, auch wenn die App gleich im Hintergrund ist:
    /// mindestens vier Sekunden (so lange hat die Web-App Zeit zu schicken) und solange noch geschrieben wird, höchstens rund 24 Sekunden.
    @objc func verlassen() {
        guard bereit else { return }
        if aufschub == .invalid {
            aufschub = UIApplication.shared.beginBackgroundTask(withName: "sicherung") { [weak self] in self?.aufschubEnde() }
            aufschubWarten(5)
        }
        rufe("sichern")
    }

    /// Sieht nach vier Sekunden nach, ob noch geschrieben wird (etwa in einen Ordner in iCloud); rest: wie oft danach noch gewartet wird
    private func aufschubWarten(_ rest: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
            if rest > 0 && Sicherung.shared.schreibt { self.aufschubWarten(rest - 1) } else { self.aufschubEnde() }
        }
    }

    private func aufschubEnde() {
        guard aufschub != .invalid else { return }
        UIApplication.shared.endBackgroundTask(aufschub)
        aufschub = .invalid
    }

    private func laeufeHolen() {
        Gesundheit.shared.laeufe { liste in if !liste.isEmpty { self.rufe("laeufe", liste) } }
    }

    @objc func zurueck() {
        guard bereit else { return }
        if !still { Mitteilungen.pauseGesehen() }
        zeigen()
        auskunft(); eingangHolen(); laeufeHolen()
        Sicherung.shared.nachholen()
    }

    /// Zeigt eine nachgeladene Web-App, die neuer ist als die gezeigte, aber nie, solange ein Blatt offen ist:
    /// Dann bleibt sie vorgemerkt und kommt beim nächsten Zurückkommen in die App. Je nachgeladener Fassung wird höchstens einmal neu geladen.
    /// Vor dem Neuladen schickt die Web-App noch ihre Sicherung, falls etwas offen ist: Was sie sich dazu gemerkt hat, ginge mit der Seite verloren.
    private func zeigen() {
        guard wartet > Web.gezeigt else { return }
        view?.evaluateJavaScript("document.querySelector('dialog[open]') ? 0 : (window.TrackHuelle && window.TrackHuelle.sichern && window.TrackHuelle.sichern(), 1)") { ergebnis, _ in
            if (ergebnis as? Int) == 1 {
                self.wartet = 0
                self.view?.reload()
            }
        }
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
        // Konten und das vorbelegte Konto für die Schnelleingabe. Nur Einträge mit Kennung und Name: Ein unvollständiger machte sonst den ganzen Stand unlesbar.
        let konten: [[String: String]] = (inhalt["konten"] as? [[String: Any]] ?? []).compactMap { eins in
            guard let id = eins["id"] as? String, let n = eins["n"] as? String else { return nil }
            return ["id": id, "n": n]
        }
        let widget: [String: Any] = ["tage": inhalt["tage"] ?? [], "notizen": inhalt["notizen"] ?? [], "nz": inhalt["nz"] ?? [],
                                     "konten": konten, "konto": inhalt["konto"] as? String ?? ""]
        if JSONSerialization.isValidJSONObject(widget), let daten = try? JSONSerialization.data(withJSONObject: widget), Ablage.schreiben(daten) {
            WidgetCenter.shared.reloadAllTimelines()
            // Ist gerade die Schnelleingabe offen, liest sie die Konten neu: Nach einem Kaltstart aus dem Widget kommt der Stand erst jetzt
            NotificationCenter.default.post(name: Halter.standNeu, object: nil)
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

    /// Holt die neueste Web-App. Ist sie neuer als die gespeicherte, wird sie gespeichert und geladen,
    /// aber nie, solange ein Blatt offen ist (dann beim nächsten Zurückkommen in die App, siehe zeigen): dieselbe Regel wie in der Web-App.
    @objc func aktualisieren() {
        guard Date().timeIntervalSince(zuletzt) > 600 else { return }
        zuletzt = Date()
        let anfrage = URLRequest(url: Web.quelle, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 20)
        URLSession.shared.dataTask(with: anfrage) { daten, antwort, _ in
            guard let daten = daten, (antwort as? HTTPURLResponse)?.statusCode == 200, daten.count > 50_000 else { return }
            let neu = Web.version(daten)
            guard neu > Web.version(Web.seite()) else { return }
            try? daten.write(to: Web.geladen, options: .atomic)
            DispatchQueue.main.async {
                self.wartet = neu
                self.zeigen()
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
    private func pruefungSchreiben(_ ausWeb: String, lauf: String, gym: String) {
        var text = ausWeb
        if var alles = (try? JSONSerialization.jsonObject(with: Data(ausWeb.utf8))) as? [String: Any] {
            alles["bruecke"] = standDa
            alles["gruppe"] = Ablage.datei != nil
            alles["widgetTage"] = Ablage.lesen()?.tage.count ?? -1
            // Eingang: Jeder Start merkt eine Notiz vor, der dritte hakt vorher eine ab (siehe probeEingang). Nach dem dritten Start: 2 Notizen, nichts mehr vorgemerkt.
            alles["notizenZahl"] = Ablage.lesen()?.nz?.count ?? -1
            alles["eingangRest"] = Ablage.eingang().count
            // Sicherung von selbst: Spätestens beim Verlassen nach dem ersten Start schickt die Web-App ihre Sicherung (dann ist eine Notiz da).
            // Je Tag gibt es eine Datei: Nach dem dritten Start liegt genau eine in „Dokumente“, lesbar und von Track.
            alles["sicherungen"] = Sicherung.dateien(in: Sicherung.ordner).count
            alles["sicherungOk"] = Sicherung.neuesteLesbar()
            alles["health"] = Gesundheit.shared.zustand
            // Läufe von der Uhr (Uhr.swift): erst die reine Rechnung, dann der ganze Weg bis in den Speicher der Web-App (siehe Laufbuch.probe):
            // nach dem dritten Start genau ein Lauf mit 850 m, 300 s und Puls 145
            alles["uhrRechnung"] = Laufbuch.pruefung()
            alles["lauf"] = lauf
            // Krafttraining von der Uhr (Gym.swift): erst die reine Rechnung, dann der ganze Weg bis in den Speicher der Web-App (siehe Gymbuch.probe):
            // nach dem dritten Start für heute genau ein Training mit 1800 s und Puls 135
            alles["gymRechnung"] = Gymbuch.pruefung()
            alles["gym"] = gym
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
            // Kurz warten: Die Web-App schickt ihren Stand 0,3 Sekunden nach dem Laden. Die Läufe werden erst danach gezählt (Vorgemerktes kommt nach „bereit“ an):
            // Anzahl, dazu vom ersten Meter, Sekunden und Puls
            let laeufe = "(function () { try { var r = (JSON.parse(localStorage.getItem('takt.v1') || '{}').T || {}).runs || {}, k = Object.keys(r).filter(function (i) { return r[i]; }); return k.length + '|' + (k.length ? r[k[0]].m + '|' + r[k[0]].s + '|' + r[k[0]].hr : ''); } catch (e) { return 'Fehler: ' + e; } })()"
            // Trainings von der Uhr: Anzahl der Tage mit Werten, dazu vom ersten Sekunden und Puls
            let trainings = "(function () { try { var u = (JSON.parse(localStorage.getItem('takt.v1') || '{}').K || {}).uhr || {}, k = Object.keys(u).filter(function (i) { return u[i]; }); return k.length + '|' + (k.length ? u[k[0]].s + '|' + u[k[0]].hr : ''); } catch (e) { return 'Fehler: ' + e; } })()"
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                webView.evaluateJavaScript(laeufe) { lauf, _ in
                    webView.evaluateJavaScript(trainings) { gym, _ in
                        self.pruefungSchreiben((ergebnis as? String) ?? "Fehler: \(String(describing: fehler))", lauf: (lauf as? String) ?? "", gym: (gym as? String) ?? "")
                    }
                }
            }
        }
    }
}
